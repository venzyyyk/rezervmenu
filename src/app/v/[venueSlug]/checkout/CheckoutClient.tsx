"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { ChevronLeft, Truck, Store, UtensilsCrossed } from "lucide-react";
import { useCart, cartTotal } from "@/stores/cart";
import { formatPrice } from "@/lib/money";
import { getStripe } from "@/lib/stripe";
import { PaymentSection } from "./PaymentSection";
import { cn } from "@/lib/utils";

interface Props {
  venueId: string;
  venueSlug: string;
  venueName: string;
  accentColor: string;
}

type OrderType = "DELIVERY" | "PICKUP" | "DINE_IN";

const ORDER_TYPES: { value: OrderType; label: string; icon: React.ElementType; hint: string }[] = [
  { value: "DELIVERY", label: "Доставка", icon: Truck, hint: "Вкажіть адресу доставки" },
  { value: "PICKUP", label: "Самовивіз", icon: Store, hint: "Заберете самостійно" },
  { value: "DINE_IN", label: "За столиком", icon: UtensilsCrossed, hint: "Замовлення до столика" },
];

// Есть ли онлайн-оплата (ключ подставляется на этапе сборки)
const STRIPE_ENABLED = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const STRIPE_APPEARANCE = (accent: string) => ({
  theme: "night" as const,
  variables: {
    colorPrimary: accent,
    colorBackground: "#1E211A",
    colorText: "#F2F1EA",
    colorTextSecondary: "#9A9B90",
    colorDanger: "#C5705D",
    colorSuccess: "#8DA888",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSizeBase: "14px",
    borderRadius: "10px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1px solid #2A2E24", boxShadow: "none" },
    ".Input:focus": { border: `1px solid ${accent}55`, boxShadow: "none" },
    ".Label": { fontWeight: "400", letterSpacing: "0.04em" },
  },
});

export function CheckoutClient({ venueId, venueSlug, venueName, accentColor }: Props) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const tableCode = useCart((s) => s.tableCode);
  const clearCart = useCart((s) => s.clearCart);

  const [orderType, setOrderType] = useState<OrderType>(
    tableCode ? "DINE_IN" : "PICKUP"
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cartTotal(items);

  // Если корзина пуста — назад
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <span className="text-4xl opacity-20">🛒</span>
        <p className="text-muted text-sm">Кошик порожній</p>
        <button
          onClick={() => router.push(`/v/${venueSlug}`)}
          className="text-xs tracking-widest uppercase mt-2"
          style={{ color: accentColor }}
        >
          Повернутись до меню
        </button>
      </div>
    );
  }

  async function handleProceedToPayment() {
    setError(null);
    if (!name.trim()) return setError("Введіть ваше ім'я");
    if (!phone.trim()) return setError("Введіть номер телефону");
    if (orderType === "DELIVERY" && !address.trim())
      return setError("Введіть адресу доставки");

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          type: orderType,
          customerName: name,
          customerPhone: phone,
          address: orderType === "DELIVERY" ? address : undefined,
          tableCode: orderType === "DINE_IN" ? tableCode : undefined,
          comment: comment || undefined,
          items: items.map((i) => ({
            dishId: i.dishId,
            quantity: i.quantity,
            comment: i.comment || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Помилка оформлення");

      // Без онлайн-оплаты: заказ создан, оплата на месте → сразу на подтверждение
      if (!data.clientSecret) {
        clearCart();
        router.push(`/v/${venueSlug}/order/${data.orderId}`);
        return;
      }

      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Щось пішло не так");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-line px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => (clientSecret ? setClientSecret(null) : router.back())}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-muted hover:text-cream transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="font-serif text-base font-light text-cream">
            {clientSecret ? "Оплата" : "Оформлення"}
          </p>
          <p className="text-[10px] text-muted">{venueName}</p>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!clientSecret ? (
          /* ─── ФОРМА ЗАКАЗА ─── */
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6"
          >
            {/* Тип заказа */}
            <Section label="Спосіб отримання">
              <div className="grid grid-cols-3 gap-2">
                {ORDER_TYPES.map(({ value, label, icon: Icon }) => {
                  const active = orderType === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setOrderType(value)}
                      disabled={value === "DINE_IN" && !tableCode}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 disabled:opacity-30",
                        active ? "border-current text-base" : "border-line text-muted hover:text-cream hover:border-line/60"
                      )}
                      style={active ? { background: accentColor + "18", borderColor: accentColor + "60", color: accentColor } : {}}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
              {orderType === "DINE_IN" && tableCode && (
                <p className="mt-2 text-xs text-center" style={{ color: accentColor }}>
                  🪑 Стіл #{tableCode.slice(0, 4).toUpperCase()}
                </p>
              )}
            </Section>

            {/* Данные */}
            <Section label="Ваші дані">
              <div className="space-y-3">
                <Field
                  label="Ім'я"
                  value={name}
                  onChange={setName}
                  placeholder="Олег"
                  accentColor={accentColor}
                />
                <Field
                  label="Телефон"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+380 50 000 00 00"
                  type="tel"
                  accentColor={accentColor}
                />
              </div>
            </Section>

            {/* Адрес (только для доставки) */}
            <AnimatePresence>
              {orderType === "DELIVERY" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <Section label="Адреса доставки">
                    <Field
                      label="Вулиця, будинок, квартира"
                      value={address}
                      onChange={setAddress}
                      placeholder="вул. Сумська 12, кв. 5"
                      accentColor={accentColor}
                    />
                  </Section>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Комментарий */}
            <Section label="Коментар (необов'язково)">
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Побажання до замовлення..."
                className="w-full resize-none rounded-xl bg-elevated border border-line px-4 py-3 text-sm text-cream placeholder:text-muted/40 outline-none focus:border-sage/40 transition-colors"
              />
            </Section>

            {/* Итог */}
            <Section label="Ваше замовлення">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.dishId} className="flex justify-between text-sm">
                    <span className="text-muted">
                      {item.name}
                      <span className="ml-1 text-muted/50">× {item.quantity}</span>
                    </span>
                    <span className="text-cream">
                      {formatPrice(item.priceCents * item.quantity, "UAH")}
                    </span>
                  </div>
                ))}
                <div className="pt-3 border-t border-line flex justify-between">
                  <span className="text-sm text-muted">Разом</span>
                  <span className="font-serif text-xl font-light" style={{ color: accentColor }}>
                    {formatPrice(total, "UAH")}
                  </span>
                </div>
              </div>
            </Section>

            {/* Ошибка */}
            {error && (
              <p className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger text-center">
                {error}
              </p>
            )}

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleProceedToPayment}
              disabled={loading}
              className="w-full rounded-xl py-4 font-medium text-sm text-base transition-opacity disabled:opacity-60"
              style={{ background: accentColor }}
            >
              {loading
                ? "Зачекайте..."
                : STRIPE_ENABLED
                ? `Перейти до оплати · ${formatPrice(total, "UAH")}`
                : `Підтвердити замовлення · ${formatPrice(total, "UAH")}`}
            </motion.button>
          </motion.div>
        ) : (
          /* ─── STRIPE PAYMENT ─── */
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 py-6 pb-32 max-w-lg mx-auto"
          >
            <div className="mb-6 rounded-xl bg-surface border border-line p-4 flex justify-between items-center">
              <span className="text-sm text-muted">До сплати</span>
              <span className="font-serif text-2xl font-light" style={{ color: accentColor }}>
                {formatPrice(total, "UAH")}
              </span>
            </div>

            <Elements
              stripe={getStripe()}
              options={{
                clientSecret,
                appearance: STRIPE_APPEARANCE(accentColor),
                locale: "uk" as import("@stripe/stripe-js").StripeElementLocale,
              }}
            >
              <PaymentSection
                orderId={orderId!}
                venueSlug={venueSlug}
                accentColor={accentColor}
                onSuccess={() => clearCart()}
              />
            </Elements>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Вспомогательные компоненты ───────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[10px] tracking-widest uppercase text-muted/55">{label}</p>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", accentColor,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; accentColor: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] tracking-widest uppercase text-muted/50">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-elevated border border-line px-4 py-3 text-sm text-cream placeholder:text-muted/40 outline-none transition-colors"
        style={{ borderColor: value ? accentColor + "40" : undefined }}
        onFocus={(e) => (e.target.style.borderColor = accentColor + "50")}
        onBlur={(e) => (e.target.style.borderColor = value ? accentColor + "40" : "")}
      />
    </div>
  );
}
