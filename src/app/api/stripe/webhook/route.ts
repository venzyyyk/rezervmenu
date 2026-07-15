import { NextRequest, NextResponse } from "next/server";
import { getServerStripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PayMethod } from "@prisma/client";

// Stripe шлёт сырое тело — отключаем Next.js bodyParser
export const runtime = "nodejs";

const METHOD_MAP: Record<string, PayMethod> = {
  card: PayMethod.CARD,
  google_pay: PayMethod.GOOGLE_PAY,
  apple_pay: PayMethod.APPLE_PAY,
  link: PayMethod.CARD,
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!isStripeConfigured() || !sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const stripe = getServerStripe();
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[webhook] signature verify failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        if (!orderId) break;

        // Определяем метод оплаты из последнего PaymentMethod
        const paymentMethodType =
          pi.payment_method_types?.[0] ?? "card";
        const method = METHOD_MAP[paymentMethodType] ?? PayMethod.CARD;

        await prisma.$transaction([
          prisma.payment.update({
            where: { stripeIntentId: pi.id },
            data: { status: "PAID", method },
          }),
          // Активируем стол если DINE_IN
          prisma.order.update({
            where: { id: orderId },
            data: {},  // статус меняет официант вручную через админку
          }),
        ]);

        console.log(`[webhook] Order ${orderId} — paid ✓`);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        if (!pi.metadata?.orderId) break;
        await prisma.payment.update({
          where: { stripeIntentId: pi.id },
          data: { status: "FAILED" },
        });
        await prisma.order.update({
          where: { id: pi.metadata.orderId },
          data: { status: "CANCELLED" },
        });
        console.log(`[webhook] Order ${pi.metadata.orderId} — payment failed`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as { payment_intent?: string };
        if (!charge.payment_intent) break;
        await prisma.payment.update({
          where: { stripeIntentId: charge.payment_intent as string },
          data: { status: "REFUNDED" },
        });
        break;
      }
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
