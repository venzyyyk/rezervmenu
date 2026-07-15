import { prisma } from "@/lib/prisma";
import { cache } from "react";

export type VenueWithCategories = NonNullable<
  Awaited<ReturnType<typeof getVenueWithMenu>>
>;
export type CategoryWithDishes = VenueWithCategories["categories"][number];
export type DishFull = CategoryWithDishes["dishes"][number];

/** Список всех заведений (для hero) */
export const getVenues = cache(async () => {
  return prisma.venue.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true, name: true, address: true, tagline: true, accentColor: true, heroImageUrl: true },
  });
});

/** Заведение с полным меню (для страницы меню) */
export const getVenueWithMenu = cache(async (slug: string) => {
  const venue = await prisma.venue.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          dishes: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
  return venue;
});

/** Стол по QR-коду */
export const getTableByCode = cache(async (code: string) => {
  return prisma.table.findUnique({
    where: { code },
    include: { venue: { select: { slug: true, name: true } } },
  });
});

/** Заведение по slug (без категорий — для лёгкого header) */
export const getVenueLight = cache(async (slug: string) => {
  return prisma.venue.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, address: true, accentColor: true, heroImageUrl: true },
  });
});
