"use client";
import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/money";
import { getOrdersAdmin, adminUpdateOrderStatus, adminDeleteOrder } from "@/server/admin";
import {
  OrderStatusBadge, PayStatusBadge,
  OrderTypeBadge, PayMethodBadge,
} from "@/components/admin/StatusBadge";
import { ChevronDown, RefreshCw, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";

type Order = Awaited<ReturnType<typeof getOrdersAdmin>>[number];

const STATUSES: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Усі" },
  { value: "NEW", label: "Нові" },
  { value: "PREPARING", label: "Готується" },
  { value: "READY", label: "Готові" },
  { value: "CLOSED", label: "Закриті" },
  { value: "CANCELLED", label: "Скасовані" },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  NEW: "PREPARING",
  PREPARING: "READY",
  READY: "CLOSED",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    const data = await getOrdersAdmin(
      undefined,
      filter === "ALL" ? undefined : filter
    );
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  // Авто-обновление каждые 20 секунд
  useEffect(() => {
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [filter]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    startTransition(async () => {
      await adminUpdateOrderStatus(orderId, status);
      await load();
    });
  }

  function handleDelete(orderId: string) {
    if (!confirm("Видалити замовлення? Цю дію не можна скасувати.")) return;
    startTransition(async () => {
      await adminDeleteOrder(orderId);
      await load();
    });
  }

  return (
    <div className="px-5 py-6 md:px-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-1">Управління</p>
          <h1 className="font-serif text-3xl font-light text-cream">Замовлення</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm text-muted hover:text-cream transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Оновити
          </button>
          <Link
            href="/admin/orders/new"
            className="flex items-center gap-2 rounded-xl bg-sage/15 border border-sage/30 px-4 py-2 text-sm text-sage hover:bg-sage/25 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Нове замовлення
          </Link>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm border transition-all ${
              filter === value
                ? "bg-sage/15 text-sage border-sage/30"
                : "text-muted border-line hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Список */}
      <div className="space-y-2">
        {loading && !orders.length && (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))
        )}
        {!loading && orders.length === 0 && (
          <p className="text-sm text-muted text-center py-12">Замовлень не знайдено</p>
        )}

        {orders.map((order) => {
          const isOpen = expanded === order.id;
          const nextStatus = NEXT_STATUS[order.status as OrderStatus];

          return (
            <div key={order.id} className="rounded-xl bg-surface border border-line overflow-hidden">
              {/* Строка */}
              <button
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-elevated/50 transition-colors"
              >
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: order.venue.accentColor }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-cream">{order.customerName ?? "—"}</span>
                    <OrderTypeBadge type={order.type} />
                    {order.table && <span className="text-xs text-muted">Стіл №{order.table.number}</span>}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {new Date(order.createdAt).toLocaleString("uk-UA", {
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                    {" · "}{order.venue.name}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <OrderStatusBadge status={order.status} />
                  <span className="font-serif text-base font-light" style={{ color: order.venue.accentColor }}>
                    {formatPrice(order.totalCents, "UAH")}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Раскрытые детали */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-line"
                  >
                    <div className="px-4 py-4 space-y-4">
                      {/* Позиции */}
                      <div>
                        <p className="text-[9px] tracking-widest uppercase text-muted/50 mb-2">Позиції</p>
                        <div className="space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted">
                                {item.nameSnapshot} <span className="text-muted/50">×{item.quantity}</span>
                              </span>
                              <span className="text-cream">
                                {formatPrice(item.priceCents * item.quantity, "UAH")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Оплата */}
                      {order.payment && (
                        <div className="flex items-center gap-3">
                          <PayMethodBadge method={order.payment.method} />
                          <PayStatusBadge status={order.payment.status} />
                        </div>
                      )}

                      {/* Адрес/комментарий */}
                      {order.address && (
                        <p className="text-xs text-muted">📍 {order.address}</p>
                      )}
                      {order.comment && (
                        <p className="text-xs text-muted italic">💬 {order.comment}</p>
                      )}

                      {/* Кнопки смены статуса */}
                      <div className="flex gap-2 flex-wrap pt-1">
                        {nextStatus && (
                          <button
                            disabled={isPending}
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                            className="rounded-xl bg-sage/15 border border-sage/30 px-4 py-2 text-xs text-sage hover:bg-sage/25 transition-colors disabled:opacity-50"
                          >
                            → {STATUSES.find(s => s.value === nextStatus)?.label}
                          </button>
                        )}
                        {order.status !== "CANCELLED" && order.status !== "CLOSED" && (
                          <button
                            disabled={isPending}
                            onClick={() => handleStatusChange(order.id, "CANCELLED")}
                            className="rounded-xl bg-danger/10 border border-danger/25 px-4 py-2 text-xs text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
                          >
                            Скасувати
                          </button>
                        )}
                        <button
                          disabled={isPending}
                          onClick={() => handleDelete(order.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-xs text-muted hover:text-danger hover:border-danger/30 transition-colors disabled:opacity-50 ml-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                          Видалити
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
