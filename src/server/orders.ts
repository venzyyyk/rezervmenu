"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { CreateOrderSchema, type CreateOrderInput } from "@/lib/validators";

// ─── Создать заказ ──────────────────────────────────────────
export async function createOrder(input: CreateOrderInput) {
  const data = CreateOrderSchema.parse(input);

  // Разрешить tableCode → tableId
  let tableId: string | undefined;
  if (data.type === "DINE_IN" && data.tableCode) {
    const table = await prisma.table.findUnique({
      where: { code: data.tableCode },
    });
    tableId = table?.id;
  }

  // Загрузить актуальные цены и имена блюд из БД
  const dishIds = data.items.map((i) => i.dishId);
  const dishes = await prisma.dish.findMany({
    where: { id: { in: dishIds }, venueId: data.venueId, isAvailable: true },
    select: { id: true, name: true, priceCents: true, currency: true },
  });

  if (dishes.length !== dishIds.length) {
    throw new Error("Деякі страви недоступні або не належать до цього закладу");
  }

  const dishMap = Object.fromEntries(dishes.map((d) => [d.id, d]));
  const currency = dishes[0].currency;

  const totalCents = data.items.reduce((sum, item) => {
    return sum + dishMap[item.dishId].priceCents * item.quantity;
  }, 0);

  // Записать заказ
  const order = await prisma.order.create({
    data: {
      venueId: data.venueId,
      type: data.type,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      address: data.address,
      comment: data.comment,
      tableId,
      totalCents,
      currency,
      items: {
        create: data.items.map((item) => ({
          dishId: item.dishId,
          nameSnapshot: dishMap[item.dishId].name,
          priceCents: dishMap[item.dishId].priceCents,
          quantity: item.quantity,
          comment: item.comment,
        })),
      },
    },
    include: { items: true },
  });

  return order;
}

// ─── Получить заказ с деталями ──────────────────────────────
export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      venue: { select: { name: true, slug: true, accentColor: true } },
      table: { select: { number: true } },
      items: { include: { dish: { select: { imageUrl: true } } } },
      payment: true,
    },
  });
}

// ─── Открытый счёт стола (по QR-коду) ───────────────────────
// Заказы стола, которые ещё не закрыты и не оплачены онлайн.
export async function getOpenOrdersByTableCode(tableCode: string) {
  const table = await prisma.table.findUnique({
    where: { code: tableCode },
    select: { id: true },
  });
  if (!table) return [];

  return prisma.order.findMany({
    where: {
      tableId: table.id,
      status: { in: ["NEW", "PREPARING", "READY"] },
      OR: [{ payment: null }, { payment: { status: { not: "PAID" } } }],
    },
    include: {
      venue: { select: { name: true, slug: true, accentColor: true } },
      table: { select: { number: true } },
      items: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Обновить статус заказа (для админки) ──────────────────
export async function updateOrderStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    select: { venueId: true },
  });
  revalidatePath("/admin/orders");
  return order;
}

// ─── Список заказов для дашборда ───────────────────────────
export async function getOrdersForAdmin(venueId?: string) {
  return prisma.order.findMany({
    where: venueId ? { venueId } : undefined,
    include: {
      venue: { select: { name: true, accentColor: true } },
      items: { select: { quantity: true, nameSnapshot: true, priceCents: true } },
      payment: { select: { status: true, method: true } },
      table: { select: { number: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}