import { getVenueLight } from "@/server/menu";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

interface Props {
  params: { venueSlug: string };
}

export const metadata: Metadata = { title: "Оформлення замовлення" };

export default async function CheckoutPage({ params }: Props) {
  const venue = await getVenueLight(params.venueSlug);
  if (!venue) notFound();

  return (
    <CheckoutClient
      venueId={venue.id}
      venueSlug={venue.slug}
      venueName={venue.name}
      accentColor={venue.accentColor}
    />
  );
}
