// Одноразовый скрипт: заводит столы Dry Leaf по схеме зала.
// Запуск: npx tsx prisma/setup-dryleaf-tables.ts
// Безопасен для повторного запуска (upsert), ничего не удаляет.
import { PrismaClient, TableKind } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const code = () => randomUUID().slice(0, 8);

// Схема зала:
// 7 русский бильярд, 2 американки, DINING №1-2 на 4 места, №3-10 на 2 места
const TABLES: { kind: TableKind; number: number; seats: number }[] = [
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
    kind: TableKind.BILLIARD_LARGE, number: n, seats: 4,
  })),
  ...[1, 2].map((n) => ({
    kind: TableKind.BILLIARD_SMALL, number: n, seats: 4,
  })),
  ...[1, 2].map((n) => ({ kind: TableKind.DINING, number: n, seats: 4 })),
  ...[3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    kind: TableKind.DINING, number: n, seats: 2,
  })),
];

async function main() {
  const venue = await prisma.venue.findUnique({ where: { slug: "dry-leaf" } });
  if (!venue) throw new Error("Заведение dry-leaf не найдено в базе");

  for (const t of TABLES) {
    await prisma.table.upsert({
      where: {
        venueId_kind_number: {
          venueId: venue.id,
          kind: t.kind,
          number: t.number,
        },
      },
      update: { seats: t.seats },
      create: {
        venueId: venue.id,
        kind: t.kind,
        number: t.number,
        seats: t.seats,
        code: code(),
      },
    });
  }

  const count = await prisma.table.count({ where: { venueId: venue.id } });
  console.log(`✅ Готово. Столов у Dry Leaf в базе: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
