"use client";
import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface Props {
  orderId: string;
  venueSlug: string;
  accentColor: string;
  onSuccess: () => void;
}

export function PaymentSection({ orderId, venueSlug, accentColor, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  async function handleSubmit() {
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const returnUrl = `${
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    }/v/${venueSlug}/order/${orderId}`;

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    // confirmPayment редиректит при успехе, сюда попадаем только при ошибке
    if (stripeError) {
      setError(
        stripeError.type === "card_error" || stripeError.type === "validation_error"
          ? (stripeError.message ?? "Помилка картки")
          : "Сталася помилка при оплаті. Спробуйте ще раз."
      );
      onSuccess(); // очищаем корзину только если реально прошло (webhook), здесь не чистим
    }
    setProcessing(false);
  }

  return (
    <div className="space-y-5">
      {/* PaymentElement рендерит карту / Google Pay / Apple Pay автоматически */}
      <div className={`transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{
            layout: "tabs",
            wallets: { applePay: "auto", googlePay: "auto" },
          }}
        />
      </div>

      {/* Skeleton пока не загрузился Stripe */}
      {!ready && (
        <div className="space-y-3">
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <p className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Кнопка оплаты */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!stripe || !elements || processing || !ready}
        className="w-full rounded-xl py-4 font-medium text-sm text-base transition-opacity disabled:opacity-50"
        style={{ background: accentColor }}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Обробляємо...
          </span>
        ) : (
          "Сплатити"
        )}
      </motion.button>

      {/* Безопасность */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted/50">
        <ShieldCheck className="h-3 w-3" />
        <span>Захищено Stripe · PCI DSS Level 1</span>
      </div>
    </div>
  );
}
