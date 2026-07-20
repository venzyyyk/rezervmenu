"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, Clock, Users, CheckCircle2, LayoutGrid } from "lucide-react";
import { createReservation, getTableBusyHours } from "@/server/reservations";
import { RESERVE_HOURS, hourLabel, TABLE_KIND_LABELS, TABLE_KIND_SHORT } from "@/lib/reserve";
import { FloorPlan, type ReserveTable } from "./FloorPlan";
import { cn } from "@/lib/utils";

interface Props {
  venueId: string;
  venueSlug: string;
  venueName: string;
  accentColor: string;
  tables: ReserveTable[];
}

const CLOSE_HOUR = 23; // до скольки работаем

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uk-UA", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export function ReserveClient({ venueId, venueSlug, venueName, accentColor, tables }: Props) {
  const router = useRouter();

  const today = new Date();

  const [table, setTable] = useState<ReserveTable | null>(null);
  const [date, setDate] = useState(toDateString(today));
  const [duration, setDuration] = useState(1);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [busy, setBusy] = useState<number[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Подтягиваем занятость выбранного стола на дату
  useEffect(() => {
    if (!table) return;
    setBusyLoading(true);
    setStartHour(null);
    getTableBusyHours(table.id, date)
      .then(setBusy)
      .catch(() => setBusy([]))
      .finally(() => setBusyLoading(false));
  }, [table, date]);

  const isBilliard = table?.kind === "BILLIARD_SMALL" || table?.kind === "BILLIARD_LARGE";
  // Обычный стол: бронь без длительности, просто время прихода.
  // В базе резервируем стандартные 2 часа, чтобы стол не забронировали дважды впритык.
  const effectiveDuration = isBilliard ? duration : 2;

  // Час недоступен, если хоть один час брони занят или выходит за закрытие
  function slotDisabled(h: number) {
    if (isBilliard && h + effectiveDuration > CLOSE_HOUR) return true;
    const span = isBilliard ? effectiveDuration : 1; // за обычным столом смотрим только сам час прихода
    for (let i = h; i < h + span; i++) {
      if (busy.includes(i)) return true;
    }
    // Сегодняшние прошедшие часы
    if (date === toDateString(today) && h <= today.getHours()) return true;
    return false;
  }

  async function handleSubmit() {
    setError(null);
    if (!table) return setError("Оберіть стіл на схемі");
    if (startHour === null) return setError("Оберіть час");
    if (!name.trim()) return setError("Введіть ваше ім'я");
    if (!phone.trim()) return setError("Введіть номер телефону");

    setLoading(true);
    try {
      await createReservation({
        venueId,
        tableId: table.id,
        name,
        phone,
        guests,
        date,
        time: hourLabel(startHour),
        hours: Math.min(effectiveDuration, CLOSE_HOUR - startHour),
        comment: comment || undefined,
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка бронювання");
      // Обновляем занятость — вдруг слот увели
      if (table) getTableBusyHours(table.id, date).then(setBusy).catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  if (success && table && startHour !== null) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
          className="text-center max-w-sm w-full"
        >
          <CheckCircle2 className="mx-auto h-20 w-20 mb-6" style={{ color: accentColor }} />
          <h1 className="font-serif text-3xl font-light text-cream mb-3">
            {isBilliard ? "Стіл заброньовано!" : "Столик заброньовано!"}
          </h1>
          <p className="text-sm text-muted mb-8">
            {venueName} · {formatDateLabel(date)}
          </p>
          <div
            className="rounded-2xl p-5 mb-8 text-left space-y-2"
            style={{ background: accentColor + "0F", border: `1px solid ${accentColor}25` }}
          >
            <p className="text-xs text-muted/60 tracking-widest uppercase mb-3">Деталі</p>
            <Row label="Стіл" value={`${TABLE_KIND_LABELS[table.kind]} №${table.number}`} />
            <Row label="Дата" value={formatDateLabel(date)} />
            <Row
              label="Час"
              value={
                isBilliard
                  ? `${hourLabel(startHour)} – ${hourLabel(startHour + duration)}`
                  : hourLabel(startHour)
              }
            />
            <Row label="Гостей" value={String(guests)} />
            <Row label="Ім'я" value={name} />
            <Row label="Телефон" value={phone} />
            {comment && <Row label="Коментар" value={comment} />}
          </div>
          <p className="text-xs text-muted mb-6">
            Адміністратор підтвердить бронювання найближчим часом
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/v/${venueSlug}`)}
            className="w-full rounded-xl py-4 text-sm font-medium text-base"
            style={{ background: accentColor }}
          >
            Повернутись до меню
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-line px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-muted hover:text-cream transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="font-serif text-base font-light text-cream">Бронювання</p>
          <p className="text-[10px] text-muted">{venueName}</p>
        </div>
      </header>

      <div className="px-4 py-6 pb-32 max-w-2xl mx-auto space-y-7">

        {/* Схема зала */}
        <Section label="Оберіть стіл" icon={<LayoutGrid className="h-3.5 w-3.5" />}>
          <FloorPlan
            tables={tables}
            selectedId={table?.id ?? null}
            accentColor={accentColor}
            onSelect={setTable}
          />
          {table && (
            <p className="mt-3 text-xs" style={{ color: accentColor }}>
              Обрано: {TABLE_KIND_LABELS[table.kind]} №{table.number} · {table.seats} місць
            </p>
          )}
        </Section>

        {/* Дата */}
        <Section label="Дата" icon={<Calendar className="h-3.5 w-3.5" />}>
          <input
            type="date"
            value={date}
            min={toDateString(today)}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl bg-elevated border border-line px-4 py-3 text-sm text-cream outline-none focus:border-sage/40 transition-colors"
            style={{ colorScheme: "dark" }}
          />
          {date && (
            <p className="mt-2 text-xs text-muted capitalize">{formatDateLabel(date)}</p>
          )}
        </Section>

        {/* Длительность (только бильярд) + время */}
        {table && (
          <>
            {isBilliard && (
              <Section label="Тривалість гри">
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((h) => (
                    <button
                      key={h}
                      onClick={() => { setDuration(h); setStartHour(null); }}
                      className={cn(
                        "rounded-xl px-4 py-2.5 text-sm border transition-all",
                        duration === h ? "font-medium" : "text-muted border-line hover:text-cream"
                      )}
                      style={
                        duration === h
                          ? { background: accentColor + "20", borderColor: accentColor + "60", color: accentColor }
                          : {}
                      }
                    >
                      {h} год
                    </button>
                  ))}
                </div>
              </Section>
            )}

            <Section label={isBilliard ? "Час початку" : "Час приходу"} icon={<Clock className="h-3.5 w-3.5" />}>
              {busyLoading ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {RESERVE_HOURS.map((h) => (
                    <div key={h} className="skeleton h-10 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {RESERVE_HOURS.map((h) => {
                    const disabled = slotDisabled(h);
                    const active = startHour === h;
                    return (
                      <button
                        key={h}
                        disabled={disabled}
                        onClick={() => setStartHour(h)}
                        className={cn(
                          "rounded-xl py-2.5 text-sm border transition-all duration-200",
                          disabled
                            ? "text-muted/30 border-line/50 line-through cursor-not-allowed"
                            : active
                            ? "font-medium"
                            : "text-muted border-line hover:text-cream hover:border-line/60"
                        )}
                        style={
                          active
                            ? { background: accentColor + "20", borderColor: accentColor + "60", color: accentColor }
                            : {}
                        }
                      >
                        {hourLabel(h)}
                      </button>
                    );
                  })}
                </div>
              )}
              {startHour !== null && (
                <p className="mt-2 text-xs text-muted">
                  {isBilliard
                    ? `${hourLabel(startHour)} – ${hourLabel(startHour + duration)}`
                    : `Чекаємо вас о ${hourLabel(startHour)}`}
                </p>
              )}
            </Section>
          </>
        )}

        {/* Гости */}
        <Section label="Кількість гостей" icon={<Users className="h-3.5 w-3.5" />}>
          <div className="flex items-center gap-3 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => setGuests(n)}
                className={cn(
                  "w-10 h-10 rounded-full text-sm font-medium border transition-all duration-200",
                  guests === n
                    ? "text-base border-transparent scale-110"
                    : "text-muted border-line hover:text-cream"
                )}
                style={guests === n ? { background: accentColor, borderColor: accentColor } : {}}
              >
                {n}
              </button>
            ))}
          </div>
        </Section>

        {/* Контакты */}
        <Section label="Контактні дані">
          <div className="space-y-3">
            <InputField label="Ім'я" value={name} onChange={setName} placeholder="Ваше ім'я" accent={accentColor} />
            <InputField label="Телефон" value={phone} onChange={setPhone} placeholder="+380 50 000 00 00" type="tel" accent={accentColor} />
          </div>
        </Section>

        {/* Комментарий */}
        <Section label="Побажання (необов'язково)">
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="День народження, кий свій..."
            className="w-full resize-none rounded-xl bg-elevated border border-line px-4 py-3 text-sm text-cream placeholder:text-muted/40 outline-none focus:border-sage/40 transition-colors"
          />
        </Section>

        {/* Превью */}
        {table && startHour !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{ background: accentColor + "0D", border: `1px solid ${accentColor}22` }}
          >
            <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: accentColor }}>
              Підсумок бронювання
            </p>
            <div className="space-y-1.5">
              <Row label="Заклад" value={venueName} />
              <Row label="Стіл" value={`${TABLE_KIND_SHORT[table.kind]} №${table.number}`} />
              <Row label="Дата" value={formatDateLabel(date)} />
              <Row
                label="Час"
                value={
                  isBilliard
                    ? `${hourLabel(startHour)} – ${hourLabel(startHour + duration)}`
                    : hourLabel(startHour)
                }
              />
              <Row label="Гостей" value={`${guests} ос.`} />
            </div>
          </motion.div>
        )}

        {error && (
          <p className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger text-center">
            {error}
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl py-4 font-medium text-sm text-base transition-opacity disabled:opacity-60"
          style={{ background: accentColor }}
        >
          {loading ? "Бронюємо..." : "Забронювати"}
        </motion.button>
      </div>
    </div>
  );
}

function Section({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        {icon && <span className="text-muted">{icon}</span>}
        <p className="text-[10px] tracking-widest uppercase text-muted/55">{label}</p>
      </div>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", accent }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; accent: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] tracking-widest uppercase text-muted/50">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl bg-elevated border border-line px-4 py-3 text-sm text-cream placeholder:text-muted/40 outline-none transition-colors"
        onFocus={(e) => (e.target.style.borderColor = accent + "50")}
        onBlur={(e) => (e.target.style.borderColor = "")}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs text-cream text-right max-w-[60%]">{value}</span>
    </div>
  );
}
