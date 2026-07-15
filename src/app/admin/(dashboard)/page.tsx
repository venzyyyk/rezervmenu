import { getDashboardStats } from "@/server/admin";
import { MetricCard } from "@/components/admin/MetricCard";
import { OrderStatusBadge, PayStatusBadge, OrderTypeBadge } from "@/components/admin/StatusBadge";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { formatPrice } from "@/lib/money";
import { ShoppingBag, TrendingUp, Bell, CalendarDays } from "lucide-react";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const {
    ordersToday, revenueToday, newOrdersCount,
    newReservationsCount, recentOrders,
  } = stats;

  return (
    <div className="px-5 py-6 md:px-8 max-w-5xl">
      {/* Заголовок */}
      <div className="mb-8">
        <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-1">
          {new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="font-serif text-3xl font-light text-cream">Дашборд</h1>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <MetricCard
          label="Замовлень сьогодні"
          value={ordersToday}
          icon={<ShoppingBag className="h-5 w-5" />}
          accent="#A8B89A"
        />
        <MetricCard
          label="Виручка сьогодні"
          value={formatPrice(revenueToday, "UAH")}
          sub="оплачених"
          icon={<TrendingUp className="h-5 w-5" />}
          accent="#C9A86A"
        />
        <MetricCard
          label="Нові замовлення"
          value={newOrdersCount}
          sub="очікують обробки"
          icon={<Bell className="h-5 w-5" />}
          accent={newOrdersCount > 0 ? "#C9A86A" : "#7E8794"}
        />
        <MetricCard
          label="Нові бронювання"
          value={newReservationsCount}
          sub="очікують підтвердження"
          icon={<CalendarDays className="h-5 w-5" />}
          accent={newReservationsCount > 0 ? "#A8B89A" : "#7E8794"}
        />
      </div>

      {/* Последние заказы */}
      <div>
        <h2 className="font-serif text-xl font-light text-cream mb-4">Останні замовлення</h2>
        <div className="space-y-2">
          {recentOrders.length === 0 && (
            <p className="text-sm text-muted py-8 text-center">Замовлень ще немає</p>
          )}
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl bg-surface border border-line px-4 py-3.5 flex items-center gap-3 flex-wrap"
            >
              {/* Акцент-точка заведения */}
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: order.venue.accentColor }}
              />

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-cream">
                    {order.customerName ?? "—"}
                  </span>
                  <OrderTypeBadge type={order.type} />
                  <span className="text-xs text-muted">
                    {order.venue.name}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {order.items.map((i) => `${i.nameSnapshot} ×${i.quantity}`).join(", ")}
                </div>
              </div>

              {/* Статусы */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <OrderStatusBadge status={order.status} />
                {order.payment && <PayStatusBadge status={order.payment.status} />}
                <span className="font-serif text-base font-light" style={{ color: order.venue.accentColor }}>
                  {formatPrice(order.totalCents, "UAH")}
                </span>
                <DeleteOrderButton orderId={order.id} />
              </div>

              {/* Время */}
              <span className="text-[10px] text-muted/50 shrink-0 w-full text-right">
                {new Date(order.createdAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
