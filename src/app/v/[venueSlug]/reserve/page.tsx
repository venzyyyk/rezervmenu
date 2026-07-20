import { getVenueLight } from "@/server/menu";
import { getTablesForReserve } from "@/server/reservations";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReserveClient } from "./ReserveClient";

interface Props { params: { venueSlug: string } }
export const metadata: Metadata = { title: "Бронювання столика" };
export const dynamic = "force-dynamic";

export default async function ReservePage({ params }: Props) {
  const venue = await getVenueLight(params.venueSlug);
  if (!venue) notFound();
  const tables = await getTablesForReserve(venue.id);
  return (
    <ReserveClient
      venueId={venue.id}
      venueSlug={venue.slug}
      venueName={venue.name}
      accentColor={venue.accentColor}
      tables={tables}
    />
  );
}
