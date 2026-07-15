import { NextRequest, NextResponse } from "next/server";
import { getServerStripe, isStripeConfigured } from "@/lib/stripe";
import { createOrder } from "@/server/orders";
import { CreateOrderSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { PayMethod } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Невалідні дані", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 1. Создаём заказ в БД
    const order = await createOrder(parsed.data);

    // ─── Режим без Stripe: оплата на месте ───────────────────
    if (!isStripeConfigured()) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: PayMethod.CASH,
          amountCents: order.totalCents,
          currency: order.currency,
        },
      });
      return NextResponse.json({ clientSecret: null, orderId: order.id });
    }

    // 2. Создаём PaymentIntent в Stripe
    const stripe = getServerStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalCents,
      currency: order.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        venueId: order.venueId,
        customerName: order.customerName ?? "",
      },
    });

    // 3. Записываем Payment (status=PENDING)
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: PayMethod.CARD, // реальный метод обновит webhook
        amountCents: order.totalCents,
        currency: order.currency,
        stripeIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    });
  } catch (error) {
    console.error("[checkout] error:", error);
    const message =
      error instanceof Error ? error.message : "Внутрішня помилка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
