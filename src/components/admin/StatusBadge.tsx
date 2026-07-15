import { cn } from "@/lib/utils";

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  NEW:       { label: "Нове",      color: "bg-sage/15 text-sage border-sage/25" },
  PREPARING: { label: "Готується", color: "bg-gold/15 text-gold border-gold/25" },
  READY:     { label: "Готово",    color: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  CLOSED:    { label: "Закрито",   color: "bg-elevated text-muted border-line" },
  CANCELLED: { label: "Скасовано", color: "bg-danger/15 text-danger border-danger/25" },
};

const PAY_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:  { label: "Очікує",    color: "bg-gold/10 text-gold border-gold/20" },
  PAID:     { label: "Оплачено",  color: "bg-sage/10 text-sage border-sage/20" },
  FAILED:   { label: "Помилка",   color: "bg-danger/10 text-danger border-danger/20" },
  REFUNDED: { label: "Повернуто", color: "bg-muted/10 text-muted border-line" },
};

const RES_STATUS: Record<string, { label: string; color: string }> = {
  NEW:       { label: "Нове",         color: "bg-sage/15 text-sage border-sage/25" },
  CONFIRMED: { label: "Підтверджено", color: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  CANCELLED: { label: "Скасовано",    color: "bg-danger/15 text-danger border-danger/25" },
};

const ORDER_TYPE: Record<string, string> = {
  DELIVERY: "🛵 Доставка",
  PICKUP:   "🏃 Самовивіз",
  DINE_IN:  "🪑 Столик",
};

const PAY_METHOD: Record<string, string> = {
  CARD:       "💳 Карта",
  GOOGLE_PAY: " Google Pay",
  APPLE_PAY:  " Apple Pay",
  CASH:       "💵 На місці",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const cfg = ORDER_STATUS[status] ?? { label: status, color: "bg-elevated text-muted border-line" };
  return (
    <span className={cn("inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-medium tracking-wide", cfg.color)}>
      {cfg.label}
    </span>
  );
}

export function PayStatusBadge({ status }: { status: string }) {
  const cfg = PAY_STATUS[status] ?? { label: status, color: "bg-elevated text-muted border-line" };
  return (
    <span className={cn("inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-medium tracking-wide", cfg.color)}>
      {cfg.label}
    </span>
  );
}

export function ResStatusBadge({ status }: { status: string }) {
  const cfg = RES_STATUS[status] ?? { label: status, color: "bg-elevated text-muted border-line" };
  return (
    <span className={cn("inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-medium tracking-wide", cfg.color)}>
      {cfg.label}
    </span>
  );
}

export function OrderTypeBadge({ type }: { type: string }) {
  return (
    <span className="text-[11px] text-muted">{ORDER_TYPE[type] ?? type}</span>
  );
}

export function PayMethodBadge({ method }: { method: string }) {
  return (
    <span className="text-[11px] text-muted">{PAY_METHOD[method] ?? method}</span>
  );
}
