"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatPrice } from "@/lib/money";
import type { getOrderById } from "@/server/orders";

type Order = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

interface Props {
  order: Order;
  redirectStatus?: string;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Нове замовлення",
  PREPARING: "Готується",
  READY: "Готово",
  CLOSED: "Закрито",
  CANCELLED: "Скасовано",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  DELIVERY: "Доставка",
  PICKUP: "Самовивіз",
  DINE_IN: "За столиком",
};

const PAY_LABELS: Record<string, string> = {
  CARD: "Банківська карта",
  GOOGLE_PAY: "Google Pay",
  APPLE_PAY: "Apple Pay",
  CASH: "Оплата на місці",
};

export function OrderConfirmation({ order, redirectStatus }: Props) {
  const isCash = order.payment?.method === "CASH";
  const isPaid =
    isCash ||
    order.payment?.status === "PAID" ||
    redirectStatus === "succeeded";
  const isFailed =
    order.payment?.status === "FAILED" || redirectStatus === "failed";
  const accentColor = order.venue.accentColor;

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Header */}
      <header className="glass border-b border-line px-4 py-3 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full" style={{ background: accentColor }} />
        <p className="font-serif text-base font-light text-cream">{order.venue.name}</p>
      </header>

      <div className="flex-1 px-4 py-10 max-w-lg mx-auto w-full">
        {/* Статус иконка */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          {isPaid ? (
            <CheckCircle2
              className="h-20 w-20"
              style={{ color: accentColor }}
            />
          ) : isFailed ? (
            <XCircle className="h-20 w-20 text-danger" />
          ) : (
            <Clock className="h-20 w-20 text-muted" />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="font-serif text-3xl font-light text-cream">
            {isPaid
              ? "Замовлення прийнято!"
              : isFailed
              ? "Помилка оплати"
              : "Замовлення очікує оплати"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isCash
              ? "Ми вже отримали ваше замовлення. Оплата — при отриманні"
              : isPaid
              ? "Ми вже отримали ваше замовлення та готуємо його"
              : isFailed
              ? "Спробуйте ще раз або оберіть інший спосіб оплати"
              : "Очікуємо підтвердження оплати від банку"}
          </p>
        </motion.div>

        {/* Детали заказа */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-surface border border-line overflow-hidden"
        >
          {/* Статус строка */}
          <div
            className="px-5 py-4 flex items-center justify-between border-b border-line"
            style={{ background: accentColor + "0D" }}
          >
            <span className="text-[10px] tracking-widest uppercase text-muted/60">
              Статус
            </span>
            <span
              className="text-xs font-medium tracking-wide"
              style={{ color: accentColor }}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {/* Тип заказа */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-line">
            <span className="text-xs text-muted">Спосіб отримання</span>
            <span className="text-xs text-cream">
              {ORDER_TYPE_LABELS[order.type] ?? order.type}
              {order.table && ` · Стіл №${order.table.number}`}
            </span>
          </div>

          {/* Клиент */}
          {order.customerName && (
            <div className="px-5 py-4 flex items-center justify-between border-b border-line">
              <span className="text-xs text-muted">Ім'я</span>
              <span className="text-xs text-cream">{order.customerName}</span>
            </div>
          )}

          {/* Адрес */}
          {order.address && (
            <div className="px-5 py-4 flex items-center justify-between border-b border-line">
              <span className="text-xs text-muted">Адреса</span>
              <span className="text-xs text-cream text-right max-w-[60%]">
                {order.address}
              </span>
            </div>
          )}

          {/* Позиции */}
          <div className="px-5 py-4 space-y-3 border-b border-line">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  {item.nameSnapshot}
                  <span className="ml-1 text-muted/50">× {item.quantity}</span>
                </span>
                <span className="text-sm text-cream">
                  {formatPrice(item.priceCents * item.quantity, order.currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Итог + оплата */}
          <div className="px-5 py-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-muted">Разом</span>
              <span className="font-serif text-xl font-light" style={{ color: accentColor }}>
                {formatPrice(order.totalCents, order.currency)}
              </span>
            </div>
            {order.payment && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted/50">Оплата</span>
                <span className="text-[10px] text-muted">
                  {PAY_LABELS[order.payment.method] ?? order.payment.method}
                  {" · "}
                  <span
                    className={
                      order.payment.status === "PAID"
                        ? "text-success"
                        : order.payment.status === "FAILED"
                        ? "text-danger"
                        : "text-muted"
                    }
                  >
                    {order.payment.method === "CASH"
                      ? "При отриманні"
                      : order.payment.status === "PAID"
                      ? "Оплачено"
                      : order.payment.status === "FAILED"
                      ? "Помилка"
                      : "Очікує"}
                  </span>
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Кнопки */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 space-y-3"
        >
          <Link
            href={`/v/${order.venue.slug}`}
            className="block w-full rounded-xl py-4 text-center text-sm font-medium text-base transition-opacity"
            style={{ background: accentColor }}
          >
            Повернутись до меню
          </Link>
          <Link
            href="/"
            className="block w-full rounded-xl py-3 text-center text-sm text-muted border border-line hover:text-cream transition-colors"
          >
            На головну
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
