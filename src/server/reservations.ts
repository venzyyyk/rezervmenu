"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ResStatus } from "@prisma/client";
import { ReserveSchema, type ReserveInput } from "@/lib/validators";

export async function createReservation(
  raw: ReserveInput
) {
  const data = ReserveSchema.parse(raw);
  return prisma.reservation.create({
    data: {
      venueId: data.venueId,
      name: data.name,
      phone: data.phone,
      guests: data.guests,
      date: new Date(data.date),
      time: data.time,
      comment: data.comment,
    },
  });
}

export async function getReservationsForAdmin(venueId?: string) {
  return prisma.reservation.findMany({
    where: venueId ? { venueId } : undefined,
    include: { venue: { select: { name: true, accentColor: true } } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 300,
  });
}

export async function updateReservationStatus(id: string, status: ResStatus) {
  await getServerSession(authOptions); // auth guard
  await prisma.reservation.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reservations");
}

/** Слоты занятого времени на дату для venue */
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