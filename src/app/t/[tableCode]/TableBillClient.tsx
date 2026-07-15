"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { CreditCard, UtensilsCrossed, Wallet } from "lucide-react";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/money";
import { getStripe } from "@/lib/stripe";
import { PaymentSection } from "@/app/v/[venueSlug]/checkout/PaymentSection";
import type { getOpenOrdersByTableCode } from "@/server/orders";

type Orders = Awaited<ReturnType<typeof getOpenOrdersByTableCode>>;

interface Props {
  tableCode: string;
  tableNumber: number;
  venueSlug: string;
  venueName: string;
  orders: Orders;
  stripeEnabled: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Прийнято",
  PREPARING: "Готується",
  READY: "Готово",
};

export default function TableBillClient({
  tableCode,
  tableNumber,
  venueSlug,
  venueName,
  orders,
  stripeEnabled,
}: Props) {
  const router = useRouter();
  const setTable = useCart((s) => s.setTable);
  const accentColor = orders[0]?.venue.accentColor ?? "#A8B89A";

  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAll = orders.reduce((s, o) => s + o.totalCents, 0);

  async function handlePay(orderId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Помилка оплати");
      setClientSecret(data.clientSecret);
      setPayingOrderId(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Щось пішло не так");
    } finally {
      setLoading(false);
    }
  }

  function goToMenu() {
    setTable(tableCode);
    router.push(`/v/${venueSlug}?table=${tableCode}`);
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="glass border-b border-line px-4 py-4 text-center">
        <p className="text-[10px] tracking-widest uppercase text-muted">{venueName}</p>
        <h1 className="font-serif text-2xl font-light text-cream mt-0.5">
          Стіл №{tableNumber}
        </h1>
      </header>

      <div className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-5">
        <AnimatePresence mode="wait">
          {!clientSecret ? (
            <motion.div
              key="bill"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <p className="text-center text-sm text-muted">Ваш рахунок</p>

              {/* Заказы стола */}
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-surface border border-line overflow-hidden"
                >
                  <div
                    className="px-5 py-3 flex items-center justify-between border-b border-line"
                    style={{ background: accentColor + "0D" }}
                  >
                    <span className="text-[10px] tracking-widest uppercase text-muted/60">
                      {new Date(order.createdAt).toLocaleTimeString("uk-UA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-xs font-medium" style={{ color: accentColor }}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="px-5 py-4 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted">
                          {item.nameSnapshot}
                          <span className="ml-1 text-muted/50">× {item.quantity}</span>
                        </span>
                        <span className="text-cream">
                          {formatPrice(item.priceCents * item.quantity, order.currency)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-line flex justify-between items-center">
                      <span className="text-xs text-muted">Разом</span>
                      <span
                        className="font-serif text-lg font-light"
                        style={{ color: accentColor }}
                      >
                        {formatPrice(order.totalCents, order.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Оплата конкретного заказа */}
                  {stripeEnabled && (
                    <div className="px-5 pb-4">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        onClick={() => handlePay(order.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium text-base transition-opacity disabled:opacity-50"
                        style={{ background: accentColor }}
                      >
                        <CreditCard className="h-4 w-4" />
                        {loading ? "Зачекайте..." : "Сплатити онлайн"}
                      </motion.button>
                    </div>
                  )}
                </div>
              ))}

              {/* Общий итог, если заказов несколько */}
              {orders.length > 1 && (
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm text-muted">Усього за столом</span>
                  <span className="font-serif text-2xl font-light" style={{ color: accentColor }}>
                    {formatPrice(totalAll, orders[0].currency)}
                  </span>
                </div>
              )}

              {/* Оплата на месте */}
              {!stripeEnabled && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-elevated border border-line px-4 py-3.5 text-sm text-muted">
                  <Wallet className="h-4 w-4" />
                  Розрахуйтесь з офіціантом — готівкою або карткою
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger text-center">
                  {error}
                </p>
              )}

              {/* Дозаказ */}
              <button
                onClick={goToMenu}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-line py-3.5 text-sm text-muted hover:text-cream transition-colors"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Замовити ще
              </button>
            </motion.div>
          ) : (
            /* ─── Экран оплаты Stripe ─── */
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={() => {
                  setClientSecret(null);
                  setPayingOrderId(null);
                }}
                className="mb-4 text-xs text-muted hover:text-cream transition-colors"
              >
                ← Назад до рахунку
              </button>
              <Elements
                stripe={getStripe()}
                options={{ clientSecret, locale: "uk" }}
              >
                <PaymentSection
                  orderId={payingOrderId!}
                  venueSlug={venueSlug}
                  accentColor={accentColor}
                  onSuccess={() => {}}
                />
              </Elements>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
