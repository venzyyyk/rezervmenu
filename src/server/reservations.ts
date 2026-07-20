"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ResStatus } from "@prisma/client";
import { ReserveSchema, type ReserveInput } from "@/lib/validators";

function hourToInt(t: string) {
  return parseInt(t.slice(0, 2), 10);
}

/** Занятые часы стола на дату: [{from, to}] в целых часах */
async function busyRanges(tableId: string, date: string) {
  const rows = await prisma.reservation.findMany({
    where: {
      tableId,
      date: new Date(date),
      status: { not: "CANCELLED" },
    },
    select: { time: true, hours: true },
  });
  return rows.map((r) => {
    const from = hourToInt(r.time);
    return { from, to: from + r.hours };
  });
}

export async function createReservation(raw: ReserveInput) {
  const data = ReserveSchema.parse(raw);

  // Стол указан — проверяем пересечение по часам
  if (data.tableId) {
    const from = hourToInt(data.time);
    const to = from + data.hours;
    const ranges = await busyRanges(data.tableId, data.date);
    const clash = ranges.some((r) => from < r.to && r.from < to);
    if (clash) {
      throw new Error("Цей час уже зайнято, оберіть інший");
    }
  }

  return prisma.reservation.create({
    data: {
      venueId: data.venueId,
      tableId: data.tableId,
      name: data.name,
      phone: data.phone,
      guests: data.guests,
      date: new Date(data.date),
      time: data.time,
      hours: data.hours,
      comment: data.comment,
    },
  });
}

/** Столы заведения для схемы брони */
export async function getTablesForReserve(venueId: string) {
  return prisma.table.findMany({
    where: { venueId },
    select: { id: true, number: true, seats: true, kind: true },
    orderBy: [{ kind: "asc" }, { number: "asc" }],
  });
}

/** Занятые часы стола на дату (для сетки слотов) */
export async function getTableBusyHours(tableId: string, date: string) {
  const ranges = await busyRanges(tableId, date);
  const busy = new Set<number>();
  ranges.forEach((r) => {
    for (let h = r.from; h < r.to; h++) busy.add(h);
  });
  return Array.from(busy).sort((a, b) => a - b);
}

export async function getReservationsForAdmin(venueId?: string) {
  return prisma.reservation.findMany({
    where: venueId ? { venueId } : undefined,
    include: {
      venue: { select: { name: true, accentColor: true } },
      table: { select: { number: true, kind: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 300,
  });
}

export async function updateReservationStatus(id: string, status: ResStatus) {
  await getServerSession(authOptions); // auth guard
  await prisma.reservation.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reservations");
}

/** Слоты занятого времени на дату для venue (старый режим без стола) */
export async function getBookedSlots(venueId: string, date: string) {
  const rows = await prisma.reservation.findMany({
    where: {
      venueId,
      date: new Date(date),
      status: { not: "CANCELLED" },
    },
    select: { time: true },
  });
  return rows.map((r) => r.time);
}

export async function deleteReservation(id: string) {
  await prisma.reservation.delete({ where: { id } });
  revalidatePath("/admin/reservations");
}
