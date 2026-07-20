import type { TableKind } from "@prisma/client";

// Часы, доступные для брони (начало слота, слот = 1 час)
export const RESERVE_HOURS = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

export const TABLE_KIND_LABELS: Record<TableKind, string> = {
  DINING: "Звичайний стіл",
  BILLIARD_SMALL: "Американка",
  BILLIARD_LARGE: "Російський більярд",
};

export const TABLE_KIND_SHORT: Record<TableKind, string> = {
  DINING: "Стіл",
  BILLIARD_SMALL: "Американка",
  BILLIARD_LARGE: "Більярд",
};
