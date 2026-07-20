"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { z } from "zod";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  return session;
}

// ─── Dashboard ─────────────────────────────────────────────
export async function getDashboardStats(venueId?: string) {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  const where = venueId ? { venueId } : {};

  const [
    ordersToday,
    revenueToday,
    newOrdersCount,
    newReservationsCount,
    recentOrders,
    weeklyRevenue,
  ] = await Promise.all([
    prisma.order.count({
      where: { ...where, createdAt: { gte: dayStart }, status: { not: "CANCELLED" } },
    }),
    prisma.order.aggregate({
      where: { ...where, createdAt: { gte: dayStart }, payment: { status: "PAID" } },
      _sum: { totalCents: true },
    }),
    prisma.order.count({ where: { ...where, status: "NEW" } }),
    prisma.reservation.count({ where: { ...where, status: "NEW" } }),
    prisma.order.findMany({
      where,
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        venue: { select: { name: true, accentColor: true } },
        payment: { select: { status: true, method: true } },
        items: { select: { quantity: true, nameSnapshot: true } },
      },
    }),
    // Revenue за 7 дней
    prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        ...where,
        createdAt: { gte: weekStart },
        payment: { status: "PAID" },
      },
      _sum: { totalCents: true },
    }),
  ]);

  return {
    ordersToday,
    revenueToday: revenueToday._sum.totalCents ?? 0,
    newOrdersCount,
    newReservationsCount,
    recentOrders,
    weeklyRevenue,
  };
}

// ─── Orders ────────────────────────────────────────────────
export async function getOrdersAdmin(
  venueId?: string,
  status?: OrderStatus
) {
  return prisma.order.findMany({
    where: {
      ...(venueId ? { venueId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      venue: { select: { name: true, accentColor: true } },
      table: { select: { number: true } },
      items: { select: { quantity: true, nameSnapshot: true, priceCents: true } },
      payment: { select: { status: true, method: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });
}

export async function adminUpdateOrderStatus(id: string, status: OrderStatus) {
  await requireAdmin();
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
}

// ─── Создание заказа официантом (привязка к столу) ─────────
const AdminOrderSchema = z.object({
  venueId: z.string().cuid(),
  tableId: z.string().cuid(),
  customerName: z.string().max(80).optional(),
  comment: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        dishId: z.string().cuid(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1),
});

export async function adminCreateOrder(raw: z.infer<typeof AdminOrderSchema>) {
  await requireAdmin();
  const data = AdminOrderSchema.parse(raw);

  // Актуальные цены из базы
  const dishIds = data.items.map((i) => i.dishId);
  const dishes = await prisma.dish.findMany({
    where: { id: { in: dishIds }, venueId: data.venueId },
    select: { id: true, name: true, priceCents: true, currency: true },
  });
  if (dishes.length !== dishIds.length) {
    throw new Error("Деякі страви не знайдено");
  }
  const dishMap = Object.fromEntries(dishes.map((d) => [d.id, d]));

  const totalCents = data.items.reduce(
    (sum, i) => sum + dishMap[i.dishId].priceCents * i.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      venueId: data.venueId,
      tableId: data.tableId,
      type: "DINE_IN",
      customerName: data.customerName || null,
      comment: data.comment || null,
      totalCents,
      currency: dishes[0].currency,
      items: {
        create: data.items.map((i) => ({
          dishId: i.dishId,
          nameSnapshot: dishMap[i.dishId].name,
          priceCents: dishMap[i.dishId].priceCents,
          quantity: i.quantity,
        })),
      },
      payment: {
        create: {
          method: "CASH", // счёт открыт, оплатят на месте или онлайн по QR
          amountCents: totalCents,
          currency: dishes[0].currency,
        },
      },
    },
  });

  revalidatePath("/admin/orders");
  return { orderId: order.id };
}

// ─── Данные для формы нового заказа ────────────────────────
export async function getOrderFormData() {
  await requireAdmin();
  return prisma.venue.findMany({
    select: {
      id: true,
      name: true,
      accentColor: true,
      tables: {
        orderBy: [{ kind: "asc" }, { number: "asc" }],
        select: { id: true, number: true, kind: true },
      },
      categories: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          dishes: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
            select: { id: true, name: true, priceCents: true, size: true },
          },
        },
      },
    },
  });
}

export async function adminDeleteOrder(id: string) {
  await requireAdmin();
  // OrderItem та Payment видаляться автоматично (onDelete: Cascade)
  await prisma.order.delete({ where: { id } });
  revalidatePath("/admin/orders");
}

// ─── Menu CRUD ─────────────────────────────────────────────
const DishSchema = z.object({
  venueId: z.string().cuid(),
  categoryId: z.string().cuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  composition: z.string().max(500).optional(),
  size: z.string().max(40).optional(),
  allergens: z.array(z.string()).default([]),
  priceCents: z.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function createDish(raw: z.infer<typeof DishSchema>) {
  await requireAdmin();
  const data = DishSchema.parse(raw);
  await prisma.dish.create({
    data: { ...data, imageUrl: data.imageUrl || null },
  });
  revalidatePath("/admin/menu");
}

export async function updateDish(
  id: string,
  raw: Partial<z.infer<typeof DishSchema>>
) {
  await requireAdmin();
  const { imageUrl, ...rest } = raw;
  await prisma.dish.update({
    where: { id },
    data: { ...rest, ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}) },
  });
  revalidatePath("/admin/menu");
}

export async function deleteDish(id: string) {
  await requireAdmin();
  await prisma.dish.delete({ where: { id } });
  revalidatePath("/admin/menu");
}

export async function toggleDishAvailability(id: string, isAvailable: boolean) {
  await requireAdmin();
  await prisma.dish.update({ where: { id }, data: { isAvailable } });
  revalidatePath("/admin/menu");
}

// ─── Menu fetch для Admin ──────────────────────────────────
export async function getMenuForAdmin() {
  return prisma.venue.findMany({
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          dishes: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
}

// ─── Venues ────────────────────────────────────────────────
export async function getVenuesAdmin() {
  return prisma.venue.findMany({
    include: {
      tables: { orderBy: { number: "asc" } },
      _count: { select: { orders: true, reservations: true } },
    },
  });
}

export async function addTable(
  venueId: string,
  number: number,
  seats: number,
  kind: "DINING" | "BILLIARD_SMALL" | "BILLIARD_LARGE" = "DINING"
) {
  await requireAdmin();
  const { randomUUID } = await import("crypto");
  const code = randomUUID().slice(0, 8);
  await prisma.table.create({ data: { venueId, number, seats, code, kind } });
  revalidatePath("/admin/venues");
}

export async function deleteTable(id: string) {
  await requireAdmin();
  await prisma.table.delete({ where: { id } });
  revalidatePath("/admin/venues");
}

// ─── Polling — новые заказы/брони с момента ts ─────────────
export async function getNewSince(ts: string) {
  const since = new Date(ts);
  const [orders, reservations] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gt: since } } }),
    prisma.reservation.count({ where: { createdAt: { gt: since } } }),
  ]);
  return { orders, reservations };
}