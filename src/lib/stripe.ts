import Stripe from "stripe";
import { loadStripe } from "@stripe/stripe-js";

// ─── Настроен ли Stripe (сервер) ───────────────────────────
// Если ключей нет — сайт работает в режиме "оплата на месте".
export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// ─── Серверный экземпляр (ленивый) ─────────────────────────
let _stripe: Stripe | null = null;
export function getServerStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe не налаштовано (STRIPE_SECRET_KEY відсутній)");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
    });
  }
  return _stripe;
}

// ─── Клиентский Promise (singleton) ───────────────────────
let stripePromise: ReturnType<typeof loadStripe> | null = null;
export function getStripe() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
