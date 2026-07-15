import {
  PrismaClient,
  OrderType,
  OrderStatus,
  PayMethod,
  PayStatus,
  ResStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import menuData from "./menu-data.json";

const prisma = new PrismaClient();
const code = () => randomUUID().slice(0, 8);

type SeedDish = {
  name: string;
  description: string | null;
  size: string | null;
  priceCents: number;
  imageUrl: string | null;
};
type SeedCategory = { title: string; group: string; dishes: SeedDish[] };
type SeedVenue = {
  slug: string;
  name: string;
  address: string;
  tagline: string | null;
  accentColor: string;
  heroImageUrl: string | null;
  categories: SeedCategory[];
};

const data = menuData as { venues: SeedVenue[] };

async function main() {
  console.log("🌱  Очистка бази...");
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.reservation.deleteMany(),
    prisma.dish.deleteMany(),
    prisma.category.deleteMany(),
    prisma.table.deleteMany(),
    prisma.venue.deleteMany(),
    prisma.adminUser.deleteMany(),
  ]);

  // ─── Адміністратор ───
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? "dryleaf123",
    10
  );
  await prisma.adminUser.create({
    data: {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@dryleaf.local",
      passwordHash,
      name: "Адміністратор",
      role: "ADMIN",
    },
  });

  let totalDishes = 0;
  const firstVenueDishNames: { venueId: string; ids: string[] } = {
    venueId: "",
    ids: [],
  };
  const firstVenueTables: string[] = [];

  // ─── Заклади / категорії / страви ───
  for (const [vIdx, v] of data.venues.entries()) {
    const venue = await prisma.venue.create({
      data: {
        slug: v.slug,
        name: v.name,
        address: v.address,
        tagline: v.tagline,
        accentColor: v.accentColor,
        heroImageUrl: v.heroImageUrl,
        schedule: { mon_sun: v.slug === "citadel" ? "12:00–02:00" : "10:00–23:00" },
      },
    });

    let catOrder = 0;
    for (const c of v.categories) {
      const category = await prisma.category.create({
        data: {
          venueId: venue.id,
          name: c.title,
          group: c.group,
          sortOrder: catOrder++,
        },
      });

      // createMany — швидко вставляємо всі страви категорії
      await prisma.dish.createMany({
        data: c.dishes.map((d, i) => ({
          venueId: venue.id,
          categoryId: category.id,
          name: d.name,
          description: d.description,
          size: d.size,
          allergens: [],
          priceCents: d.priceCents,
          currency: "UAH",
          imageUrl: d.imageUrl,
          isAvailable: true,
          sortOrder: i,
        })),
      });
      totalDishes += c.dishes.length;
    }

    // Столики
    const tableCount = vIdx === 0 ? 8 : 5;
    for (let n = 1; n <= tableCount; n++) {
      const t = await prisma.table.create({
        data: {
          venueId: venue.id,
          number: n,
          code: code(),
          seats: n % 2 === 0 ? 4 : 2,
        },
      });
      if (vIdx === 0) firstVenueTables.push(t.id);
    }

    if (vIdx === 0) {
      firstVenueDishNames.venueId = venue.id;
      const some = await prisma.dish.findMany({
        where: { venueId: venue.id },
        take: 3,
        orderBy: { sortOrder: "asc" },
      });
      firstVenueDishNames.ids = some.map((d) => d.id);
    }
  }

  // ─── Демо-замовлення (для дашборда адмінки) ───
  const demoDishes = await prisma.dish.findMany({
    where: { id: { in: firstVenueDishNames.ids } },
  });
  if (demoDishes.length >= 3 && firstVenueTables.length > 2) {
    const order1 = await prisma.order.create({
      data: {
        venueId: firstVenueDishNames.venueId,
        type: OrderType.DINE_IN,
        status: OrderStatus.PREPARING,
        tableId: firstVenueTables[2],
        customerName: "Олег",
        comment: "Без цибулі",
        totalCents: demoDishes[0].priceCents + demoDishes[1].priceCents * 2,
        items: {
          create: [
            {
              dishId: demoDishes[0].id,
              nameSnapshot: demoDishes[0].name,
              priceCents: demoDishes[0].priceCents,
              quantity: 1,
            },
            {
              dishId: demoDishes[1].id,
              nameSnapshot: demoDishes[1].name,
              priceCents: demoDishes[1].priceCents,
              quantity: 2,
            },
          ],
        },
      },
    });
    await prisma.payment.create({
      data: {
        orderId: order1.id,
        method: PayMethod.CARD,
        status: PayStatus.PAID,
        amountCents: order1.totalCents,
      },
    });

    await prisma.order.create({
      data: {
        venueId: firstVenueDishNames.venueId,
        type: OrderType.DELIVERY,
        status: OrderStatus.NEW,
        customerName: "Ірина",
        customerPhone: "+380501112233",
        address: "вул. Сумська 12, кв. 5",
        totalCents: demoDishes[2].priceCents,
        items: {
          create: [
            {
              dishId: demoDishes[2].id,
              nameSnapshot: demoDishes[2].name,
              priceCents: demoDishes[2].priceCents,
              quantity: 1,
            },
          ],
        },
        payment: {
          create: {
            method: PayMethod.GOOGLE_PAY,
            status: PayStatus.PENDING,
            amountCents: demoDishes[2].priceCents,
          },
        },
      },
    });

    // Демо-бронювання
    await prisma.reservation.create({
      data: {
        venueId: firstVenueDishNames.venueId,
        name: "Андрій",
        phone: "+380671234567",
        guests: 4,
        date: new Date(Date.now() + 86400000),
        time: "19:30",
        comment: "Столик біля вікна",
        status: ResStatus.NEW,
      },
    });
  }

  console.log(
    "✅  Готово: %d заклади, %d категорій, %d страв.",
    data.venues.length,
    data.venues.reduce((a, v) => a + v.categories.length, 0),
    totalDishes
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
