"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ChevronLeft } from "lucide-react";
import { adminCreateOrder, getOrderFormData } from "@/server/admin";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

type Venues = Awaited<ReturnType<typeof getOrderFormData>>;

interface Props {
  venues: Venues;
}

export default function NewOrderClient({ venues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [comment, setComment] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const venue = venues.find((v) => v.id === venueId);
  const accent = venue?.accentColor ?? "#A8B89A";

  const items = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([dishId, quantity]) => ({ dishId, quantity })),
    [quantities]
  );

  const dishPrice = useMemo(() => {
    const map: Record<string, number> = {};
    venue?.categories.forEach((c) =>
      c.dishes.forEach((d) => (map[d.id] = d.priceCents))
    );
    return map;
  }, [venue]);

  const total = items.reduce(
    (s, i) => s + (dishPrice[i.dishId] ?? 0) * i.quantity,
    0
  );

  function setQty(dishId: string, delta: number) {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[dishId] ?? 0) + delta);
      return { ...prev, [dishId]: next };
    });
  }

  function handleVenueChange(id: string) {
    setVenueId(id);
    setTableId("");
    setQuantities({});
  }

  function handleSubmit() {
    setError(null);
    if (!tableId) return setError("Оберіть стіл");
    if (items.length === 0) return setError("Додайте хоча б одну страву");

    startTransition(async () => {
      try {
        await adminCreateOrder({
          venueId,
          tableId,
          customerName: customerName || undefined,
          comment: comment || undefined,
          items,
        });
        router.push("/admin/orders");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Помилка створення");
      }
    });
  }

  return (
    <div className="px-5 py-6 md:px-8 max-w-3xl pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/admin/orders")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-muted hover:text-cream transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-1">
            Управління
          </p>
          <h1 className="font-serif text-3xl font-light text-cream">
            Нове замовлення
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* Заведение */}
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-2">
            Заклад
          </p>
          <div className="flex gap-2 flex-wrap">
            {venues.map((v) => (
              <button
                key={v.id}
                onClick={() => handleVenueChange(v.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm border transition-all",
                  venueId === v.id
                    ? "bg-sage/15 text-sage border-sage/30"
                    : "text-muted border-line hover:text-cream"
                )}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Стол */}
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-2">
            Стіл
          </p>
          {venue?.tables.length === 0 && (
            <p className="text-sm text-muted">
              У цього закладу немає столів — додай їх у розділі Venues
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            {venue?.tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setTableId(t.id)}
                className={cn(
                  "h-11 min-w-11 rounded-xl border px-3 text-sm transition-all",
                  tableId === t.id
                    ? "text-base"
                    : "text-muted border-line hover:text-cream"
                )}
                style={
                  tableId === t.id
                    ? { background: accent, borderColor: accent }
                    : {}
                }
              >
                №{t.number}
              </button>
            ))}
          </div>
        </div>

        {/* Имя гостя / комментарий */}
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ім'я гостя (необов'язково)"
            className="rounded-xl bg-elevated border border-line px-4 py-3 text-sm text-cream placeholder:text-muted/40 outline-none focus:border-sage/40 transition-colors"
          />
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Коментар (необов'язково)"
            className="rounded-xl bg-elevated border border-line px-4 py-3 text-sm text-cream placeholder:text-muted/40 outline-none focus:border-sage/40 transition-colors"
          />
        </div>

        {/* Меню */}
        <div className="space-y-5">
          {venue?.categories
            .filter((c) => c.dishes.length > 0)
            .map((cat) => (
              <div key={cat.id}>
                <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-2">
                  {cat.name}
                </p>
                <div className="rounded-xl bg-surface border border-line divide-y divide-line">
                  {cat.dishes.map((dish) => {
                    const qty = quantities[dish.id] ?? 0;
                    return (
                      <div
                        key={dish.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm truncate",
                              qty > 0 ? "text-cream" : "text-muted"
                            )}
                          >
                            {dish.name}
                            {dish.size && (
                              <span className="ml-1 text-muted/50 text-xs">
                                {dish.size}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted/60">
                            {formatPrice(dish.priceCents, "UAH")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setQty(dish.id, -1)}
                            disabled={qty === 0}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:text-cream transition-colors disabled:opacity-30"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span
                            className={cn(
                              "w-6 text-center text-sm",
                              qty > 0 ? "text-cream font-medium" : "text-muted/40"
                            )}
                          >
                            {qty}
                          </span>
                          <button
                            onClick={() => setQty(dish.id, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:text-cream transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {error && (
          <p className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger text-center">
            {error}
          </p>
        )}
      </div>

      {/* Итог — фиксированная панель */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-line px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-muted/55">
              Разом
            </p>
            <p className="font-serif text-xl font-light" style={{ color: accent }}>
              {formatPrice(total, "UAH")}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPending || items.length === 0 || !tableId}
            className="rounded-xl px-8 py-3.5 text-sm font-medium text-base transition-opacity disabled:opacity-40"
            style={{ background: accent }}
          >
            {isPending ? "Створюємо..." : "Створити замовлення"}
          </button>
        </div>
      </div>
    </div>
  );
}
