"use client";
import { useState, useEffect, useTransition } from "react";
import { getReservationsForAdmin, updateReservationStatus, deleteReservation } from "@/server/reservations";
import { ResStatusBadge } from "@/components/admin/StatusBadge";
import { Check, X, RefreshCw, Users, Clock, Trash2 } from "lucide-react";
import type { ResStatus } from "@prisma/client";
import { TABLE_KIND_SHORT } from "@/lib/reserve";

type Reservation = Awaited<ReturnType<typeof getReservationsForAdmin>>[number];

export default function AdminReservationsPage() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<ResStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    const data = await getReservationsForAdmin();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, []);

  function handleStatus(id: string, status: ResStatus) {
    startTransition(async () => {
      await updateReservationStatus(id, status);
      await load();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Видалити бронювання? Цю дію не можна скасувати.")) return;
    startTransition(async () => {
      await deleteReservation(id);
      await load();
    });
  }

  const filtered = filter === "ALL" ? items : items.filter((r) => r.status === filter);

  const FILTERS: { value: ResStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: "Усі" },
    { value: "NEW", label: "Нові" },
    { value: "CONFIRMED", label: "Підтверджені" },
    { value: "CANCELLED", label: "Скасовані" },
  ];

  return (
    <div className="px-5 py-6 md:px-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-1">Управління</p>
          <h1 className="font-serif text-3xl font-light text-cream">Бронювання</h1>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-muted hover:text-cream transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Оновити
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {FILTERS.map(({ value, label }) => (
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
        {loading && !items.length && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted text-center py-12">Бронювань не знайдено</p>
        )}

        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl bg-surface border border-line px-4 py-4">
            <div className="flex items-start gap-3">
              {/* Цвет заведения */}
              <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ background: r.venue.accentColor }} />

              <div className="flex-1 min-w-0">
                {/* Верхняя строка */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-cream">{r.name}</span>
                  <ResStatusBadge status={r.status} />
                  <span className="text-xs text-muted">{r.venue.name}</span>
                </div>

                {/* Детали */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3 w-3" />
                    {new Date(r.date).toLocaleDateString("uk-UA", {
                      day: "numeric", month: "short",
                    })} · {r.time}
                    {r.table && r.table.kind !== "DINING" && r.hours > 1 && ` (${r.hours} год)`}
                  </span>
                  {r.table && (
                    <span className="text-xs" style={{ color: r.venue.accentColor }}>
                      🎱 {TABLE_KIND_SHORT[r.table.kind]} №{r.table.number}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Users className="h-3 w-3" />
                    {r.guests} ос.
                  </span>
                  <span className="text-xs text-muted">📞 {r.phone}</span>
                </div>

                {r.comment && (
                  <p className="mt-1.5 text-xs text-muted/70 italic">"{r.comment}"</p>
                )}

                {/* Кнопки (только для NEW) */}
                {r.status === "NEW" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={isPending}
                      onClick={() => handleStatus(r.id, "CONFIRMED")}
                      className="flex items-center gap-1.5 rounded-xl bg-sage/15 border border-sage/30 px-3 py-1.5 text-xs text-sage hover:bg-sage/25 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Підтвердити
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => handleStatus(r.id, "CANCELLED")}
                      className="flex items-center gap-1.5 rounded-xl bg-danger/10 border border-danger/25 px-3 py-1.5 text-xs text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Відхилити
                    </button>
                  </div>
                )}
              </div>

              {/* Время создания + удаление */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[10px] text-muted/40">
                  {new Date(r.createdAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <button
                  disabled={isPending}
                  onClick={() => handleDelete(r.id)}
                  title="Видалити бронювання"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted/60 hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
