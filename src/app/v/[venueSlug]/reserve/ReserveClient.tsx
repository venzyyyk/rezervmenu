"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, Clock, Users, CheckCircle2 } from "lucide-react";
import { createReservation } from "@/server/reservations";
import { cn } from "@/lib/utils";

interface Props {
  venueId: string;
  venueSlug: string;
  venueName: string;
  accentColor: string;
}

const TIME_SLOTS = [
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00","20:30",
  "21:00","21:30","22:00",
];

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uk-UA", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export function ReserveClient({ venueId, venueSlug, venueName, accentColor }: Props) {
  const router = useRouter();

  // Завтра — минимальная дата
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(toDateString(tomorrow));
  const [time, setTime] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) return setError("Введіть ваше ім'я");
    if (!phone.trim()) return setError("Введіть номер телефону");
    if (!time) return setError("Оберіть час");

    setLoading(true);
    try {
      await createReservation({ venueId, name, phone, guests, date, time, comment: comment || undefined });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка бронювання");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
          className="text-center max-w-sm w-full"
        >
          <CheckCircle2 className="mx-auto h-20 w-20 mb-6" style={{ color: accentColor }} />
          <h1 className="font-serif text-3xl font-light text-cream mb-3">Столик заброньовано!</h1>
          <p className="text-sm text-muted mb-2">
            {venueName} · {formatDateLabel(date)} · {time}
          </p>
          <p className="text-sm text-muted mb-8">Гостей: {guests}</p>
          <div
            className="rounded-2xl p-5 mb-8 text-left space-y-2"
            style={{ background: accentColor + "0F", border: `1px solid ${accentColor}25` }}
          >
            <p className="text-xs text-muted/60 tracking-widest uppercase mb-3">Деталі</p>
            <Row label="Ім'я" value={name} />
            <Row label="Телефон" value={phone} />
            <Row label="Дата" value={formatDateLabel(date)} />
            <Row label="Час" value={time} />
            <Row label="Гостей" value={String(guests)} />
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

      <div className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-7">

        {/* Гости */}
        <Section label="Кількість гостей" icon={<Users className="h-3.5 w-3.5" />}>
          <div className="flex items-center gap-4">
            {[1,2,3,4,5,6,7,8].map((n) => (
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
            <span className="text-muted text-sm">+</span>
          </div>
        </Section>

        {/* Дата */}
        <Section label="Дата" icon={<Calendar className="h-3.5 w-3.5" />}>
          <input
            type="date"
            value={date}
            min={toDateString(tomorrow)}
            onChange={(e) => { setDate(e.target.value); setTime(""); }}
            className="w-full rounded-xl bg-elevated border border-line px-4 py-3 text-sm text-cream outline-none focus:border-sage/40 transition-colors"
            style={{ colorScheme: "dark" }}
          />
          {date && (
            <p className="mt-2 text-xs text-muted capitalize">{formatDateLabel(date)}</p>
          )}
        </Section>

        {/* Время */}
        <Section label="Час" icon={<Clock className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => setTime(slot)}
                className={cn(
                  "rounded-xl py-2.5 text-sm border transition-all duration-200",
                  time === slot
                    ? "text-base border-transparent font-medium"
                    : "text-muted border-line hover:text-cream hover:border-line/60"
                )}
                style={time === slot ? { background: accentColor + "20", borderColor: accentColor + "60", color: accentColor } : {}}
              >
                {slot}
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
            placeholder="Столик біля вікна, день народження..."
            className="w-full resize-none rounded-xl bg-elevated border border-line px-4 py-3 text-sm text-cream placeholder:text-muted/40 outline-none focus:border-sage/40 transition-colors"
          />
        </Section>

        {/* Превью */}
        {time && (
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
              <Row label="Заклад" value={venueName} accent={accentColor} />
              <Row label="Дата" value={formatDateLabel(date)} />
              <Row label="Час" value={time} />
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
          {loading ? "Бронюємо..." : "Забронювати столик"}
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

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs text-cream">{value}</span>
    </div>
  );
}
