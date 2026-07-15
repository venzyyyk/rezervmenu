import { getOrderById } from "@/server/orders";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OrderConfirmation } from "./OrderConfirmation";

interface Props {
  params: { venueSlug: string; orderId: string };
  searchParams: {
    payment_intent?: string;
    payment_intent_client_secret?: string;
    redirect_status?: string;
  };
}

export const metadata: Metadata = { title: "Статус замовлення" };

export default async function OrderPage({ params, searchParams }: Props) {
  const order = await getOrderById(params.orderId);
  if (!order || order.venue.slug !== params.venueSlug) notFound();

  return (
    <OrderConfirmation
      order={order}
      redirectStatus={searchParams.redirect_status}
    />
  );
}
