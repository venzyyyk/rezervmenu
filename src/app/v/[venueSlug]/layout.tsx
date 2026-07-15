import { getVenueLight } from "@/server/menu";
import { notFound } from "next/navigation";
import VenueShell from "./VenueShell";

export default async function VenueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { venueSlug: string };
}) {
  const venue = await getVenueLight(params.venueSlug);
  if (!venue) notFound();

  return <VenueShell venue={venue}>{children}</VenueShell>;
}
