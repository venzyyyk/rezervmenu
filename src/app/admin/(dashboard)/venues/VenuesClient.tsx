"use client";
import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, QrCode, Copy, Download } from "lucide-react";
import QRCode from "qrcode";
import { addTable, deleteTable, getVenuesAdmin } from "@/server/admin";
import { TABLE_KIND_SHORT } from "@/lib/reserve";
import type { TableKind } from "@prisma/client";
import { toast } from "sonner";

type VenueAdmin = Awaited<ReturnType<typeof getVenuesAdmin>>[number];

interface Props { venues: VenueAdmin[] }

export function VenuesClient({ venues: initial }: Props) {
  const [venues, setVenues] = useState(initial);
  const [activeIdx, setActiveIdx] = useState(0);
  const [newSeats, setNewSeats] = useState(4);
  const [newKind, setNewKind] = useState<TableKind>("DINING");
  const [isPending, startTransition] = useTransition();

  const venue = venues[activeIdx];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  async function refresh() {
    const fresh = await getVenuesAdmin();
    setVenues(fresh);
  }

  function handleAddTable() {
    // Нумерация своя внутри каждого типа столов
    const sameKind = venue.tables.filter((t) => t.kind === newKind);
    const nextNum = Math.max(0, ...sameKind.map((t) => t.number)) + 1;
    startTransition(async () => {
      await addTable(venue.id, nextNum, newSeats, newKind);
      await refresh();
      toast.success(`${TABLE_KIND_SHORT[newKind]} №${nextNum} додано`);
    });
  }

  function handleDeleteTable(id: string, number: number) {
    if (!confirm(`Видалити стіл №${number}?`)) return;
    startTransition(async () => {
      await deleteTable(id);
      await refresh();
      toast.success("Стіл видалено");
    });
  }

  function copyQR(code: string) {
    const url = `${appUrl}/t/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("QR URL скопійовано");
  }

  return (
    <div className="px-5 py-6 md:px-8 max-w-3xl">
      <div className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-1">Управління</p>
        <h1 className="font-serif text-3xl font-light text-cream mb-4">Заклади</h1>

        {/* Venue tabs */}
        <div className="flex gap-2">
          {venues.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setActiveIdx(i)}
              className={`rounded-full px-4 py-1.5 text-sm border transition-all ${
                activeIdx === i ? "text-base border-transparent" : "text-muted border-line hover:text-cream"
              }`}
              style={activeIdx === i ? { background: v.accentColor, borderColor: v.accentColor } : {}}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Venue info */}
      <div className="rounded-2xl bg-surface border border-line p-5 mb-6">
        <p className="text-[9px] tracking-widest uppercase text-muted/50 mb-3">Загальне</p>
        <div className="space-y-2">
          <Row label="Назва" value={venue.name} />
          <Row label="Адреса" value={venue.address} />
          <Row label="Замовлень" value={String(venue._count.orders)} />
          <Row label="Бронювань" value={String(venue._count.reservations)} />
        </div>
      </div>

      {/* Столики */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-light text-cream">
            Столики <span className="text-muted text-sm font-sans">({venue.tables.length})</span>
          </h2>

          {/* Добавить стол */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as TableKind)}
              className="bg-elevated border border-line rounded-xl px-3 py-1.5 text-xs text-cream outline-none"
            >
              <option value="DINING">Звичайний стіл</option>
              <option value="BILLIARD_LARGE">Російський більярд</option>
              <option value="BILLIARD_SMALL">Американка</option>
            </select>
            <div className="flex items-center gap-1.5 bg-elevated border border-line rounded-xl px-3 py-1.5">
              <span className="text-xs text-muted">місць:</span>
              <input
                type="number" min={1} max={20} value={newSeats}
                onChange={(e) => setNewSeats(Number(e.target.value))}
                className="w-8 bg-transparent text-sm text-cream outline-none text-center"
              />
            </div>
            <button
              onClick={handleAddTable}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl bg-sage/15 border border-sage/30 px-3 py-1.5 text-xs text-sage hover:bg-sage/25 transition-all disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
              Додати
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {venue.tables.map((table) => {
            const qrUrl = `${appUrl}/t/${table.code}`;
            return (
              <motion.div
                key={table.id}
                layout
                className="rounded-xl bg-surface border border-line p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-serif text-2xl font-light text-cream">
                      {TABLE_KIND_SHORT[table.kind]} №{table.number}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{table.seats} місць</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTable(table.id, table.number)}
                    disabled={isPending}
                    className="text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* QR info */}
                <div className="rounded-xl bg-elevated px-3 py-2.5 space-y-2">
                  <TableQR url={qrUrl} tableNumber={table.number} venueName={venue.name} />
                  <div className="flex items-center gap-2">
                    <QrCode className="h-3.5 w-3.5 text-muted shrink-0" />
                    <p className="text-[10px] text-muted font-mono break-all">/t/{table.code}</p>
                  </div>
                  <button
                    onClick={() => copyQR(table.code)}
                    className="flex items-center gap-1.5 text-[10px] text-sage hover:text-sage/70 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    Скопіювати QR URL
                  </button>
                </div>
              </motion.div>
            );
          })}

          {venue.tables.length === 0 && (
            <p className="col-span-2 text-sm text-muted text-center py-8">
              Столиків ще немає. Додайте перший!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── QR-код стола: превью + скачивание PNG для печати ──────
function TableQR({ url, tableNumber, venueName }: { url: string; tableNumber: number; venueName: string }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 256,
      margin: 1,
      color: { dark: "#1E211A", light: "#F2F1EA" },
    })
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [url]);

  async function download() {
    // Крупный QR для печати (наклейка/тейбл-тент)
    const png = await QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    const a = document.createElement("a");
    a.href = png;
    a.download = `${venueName.replace(/\s+/g, "-")}_стіл-${tableNumber}_QR.png`;
    a.click();
  }

  if (!preview) return <div className="skeleton h-24 w-24 rounded-lg" />;

  return (
    <div className="flex items-center gap-3">
      <img
        src={preview}
        alt={`QR стіл №${tableNumber}`}
        className="h-24 w-24 rounded-lg border border-line"
      />
      <button
        onClick={download}
        className="flex items-center gap-1.5 text-[10px] text-sage hover:text-sage/70 transition-colors"
      >
        <Download className="h-3 w-3" />
        Завантажити PNG
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs text-cream">{value}</span>
    </div>
  );
}
