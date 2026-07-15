import { NextRequest, NextResponse } from "next/server";
import { getServerStripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Оплата существующего заказа (счёт стола по QR)
export async function POST(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Онлайн-оплата тимчасово недоступна" },
        { status: 503 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: { payment: true },
    });

    if (!order || order.status === "CANCELLED" || order.status === "CLOSED") {
      return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });
    }
    if (order.payment?.status === "PAID") {
      return NextResponse.json({ error: "Замовлення вже оплачено" }, { status: 400 });
    }

    const stripe = getServerStripe();

    // Переиспользуем существующий PaymentIntent, если он ещё живой
    if (order.payment?.stripeIntentId) {
      const existing = await stripe.paymentIntents.retrieve(
        order.payment.stripeIntentId
      );
      if (
        existing.status !== "canceled" &&
        existing.status !== "succeeded" &&
        existing.amount === order.totalCents
      ) {
        return NextResponse.json({
          clientSecret: existing.client_secret,
          orderId: order.id,
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalCents,
      currency: order.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id, venueId: order.venueId },
    });

    // Payment мог быть создан как CASH — привязываем intent
    if (order.payment) {
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { stripeIntentId: paymentIntent.id, method: "CARD" },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: "CARD",
          amountCents: order.totalCents,
          currency: order.currency,
          stripeIntentId: paymentIntent.id,
        },
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    });
  } catch (error) {
    console.error("[pay] error:", error);
    const message = error instanceof Error ? error.message : "Внутрішня помилка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
