"use client";
import { motion } from "framer-motion";
import type { TableKind } from "@prisma/client";
import { TABLE_KIND_SHORT } from "@/lib/reserve";

export interface ReserveTable {
  id: string;
  number: number;
  seats: number;
  kind: TableKind;
}

interface Props {
  tables: ReserveTable[];
  selectedId: string | null;
  accentColor: string;
  onSelect: (table: ReserveTable) => void;
}

// ─── Схема зала Dry Leaf ────────────────────────────────────
// Ключ = kind-number, позиции в viewBox 760x460.
// DINING №1-2 — столы на 4 места (центр), №3-10 — на 2 места (вдоль стен).
type Spot = { x: number; y: number; w: number; h: number };
const LAYOUT: Record<string, Spot> = {
  // Американка (жёлтые на исходной схеме) — верхний левый угол
  "BILLIARD_SMALL-1": { x: 75, y: 55, w: 46, h: 68 },
  "BILLIARD_SMALL-2": { x: 150, y: 55, w: 46, h: 68 },

  // Русский бильярд (розовые) — слева и справа, симметрично
  "BILLIARD_LARGE-1": { x: 55, y: 180, w: 118, h: 60 },
  "BILLIARD_LARGE-2": { x: 62, y: 295, w: 52, h: 96 },
  "BILLIARD_LARGE-3": { x: 142, y: 295, w: 52, h: 96 },
  "BILLIARD_LARGE-4": { x: 588, y: 55, w: 118, h: 60 },
  "BILLIARD_LARGE-5": { x: 588, y: 160, w: 118, h: 60 },
  "BILLIARD_LARGE-6": { x: 568, y: 295, w: 52, h: 96 },
  "BILLIARD_LARGE-7": { x: 650, y: 295, w: 52, h: 96 },

  // Столы на 4 места — центр
  "DINING-1": { x: 352, y: 175, w: 54, h: 74 },
  "DINING-2": { x: 352, y: 285, w: 54, h: 74 },

  // Столы на 2 места — вдоль стен
  "DINING-3": { x: 205, y: 22, w: 34, h: 34 },
  "DINING-4": { x: 522, y: 22, w: 34, h: 34 },
  "DINING-5": { x: 20, y: 120, w: 34, h: 34 },
  "DINING-6": { x: 20, y: 410, w: 34, h: 34 },
  "DINING-7": { x: 706, y: 120, w: 34, h: 34 },
  "DINING-8": { x: 706, y: 410, w: 34, h: 34 },
  "DINING-9": { x: 205, y: 410, w: 34, h: 34 },
  "DINING-10": { x: 522, y: 410, w: 34, h: 34 },
};

const KIND_FILL: Record<TableKind, string> = {
  DINING: "#2A2E24",
  BILLIARD_SMALL: "#8DA88833",
  BILLIARD_LARGE: "#C9A86A26",
};
const KIND_STROKE: Record<TableKind, string> = {
  DINING: "#3A3F32",
  BILLIARD_SMALL: "#8DA888",
  BILLIARD_LARGE: "#C9A86A",
};

export function FloorPlan({ tables, selectedId, accentColor, onSelect }: Props) {
  const placed: { table: ReserveTable; spot: Spot }[] = [];
  const unplaced: ReserveTable[] = [];

  tables.forEach((t) => {
    const spot = LAYOUT[`${t.kind}-${t.number}`];
    if (spot) placed.push({ table: t, spot });
    else unplaced.push(t);
  });

  // Нет разметки под этот зал — просто кнопки
  if (placed.length === 0) {
    return (
      <TableChips tables={tables} selectedId={selectedId} accentColor={accentColor} onSelect={onSelect} />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-surface border border-line p-3">
        <svg viewBox="0 0 760 460" className="w-full h-auto select-none">
          {/* Стены */}
          <rect x="6" y="6" width="748" height="448" rx="14" fill="none" stroke="#3A3F32" strokeWidth="4" />

          {/* Бар */}
          <rect x="252" y="18" width="256" height="66" rx="8" fill="#8DA88822" stroke="#8DA888" strokeWidth="1.5" />
          <text x="380" y="56" textAnchor="middle" fill="#8DA888" fontSize="17" letterSpacing="3">
            БАР
          </text>

          {/* Вход */}
          <rect x="342" y="446" width="76" height="8" fill="#0E0F0C" />
          <text x="380" y="440" textAnchor="middle" fill="#9A9B90" fontSize="10" letterSpacing="2">
            ВХІД
          </text>

          {/* Столы */}
          {placed.map(({ table, spot }) => {
            const active = table.id === selectedId;
            return (
              <motion.g
                key={table.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(table)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={spot.x}
                  y={spot.y}
                  width={spot.w}
                  height={spot.h}
                  rx="7"
                  fill={active ? accentColor : KIND_FILL[table.kind]}
                  stroke={active ? accentColor : KIND_STROKE[table.kind]}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <text
                  x={spot.x + spot.w / 2}
                  y={spot.y + spot.h / 2 + 5}
                  textAnchor="middle"
                  fill={active ? "#0E0F0C" : "#F2F1EA"}
                  fontSize="15"
                  fontWeight="500"
                >
                  {table.number}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
        <Legend color="#C9A86A" label="Великі більярдні столи" />
        <Legend color="#8DA888" label="Малі більярдні столи" />
        <Legend color="#3A3F32" label="Звичайні столи" />
      </div>

      {unplaced.length > 0 && (
        <TableChips tables={unplaced} selectedId={selectedId} accentColor={accentColor} onSelect={onSelect} />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-muted">
      <span className="h-2.5 w-2.5 rounded-sm border" style={{ borderColor: color, background: color + "33" }} />
      {label}
    </span>
  );
}

// Запасной вариант — сетка кнопок (для заведений без схемы)
function TableChips({ tables, selectedId, accentColor, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {tables.map((t) => {
        const active = t.id === selectedId;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="rounded-xl border px-3.5 py-2.5 text-xs transition-all"
            style={
              active
                ? { background: accentColor, borderColor: accentColor, color: "#0E0F0C" }
                : { borderColor: "#2A2E24", color: "#9A9B90" }
            }
          >
            {TABLE_KIND_SHORT[t.kind]} №{t.number}
            <span className="opacity-60"> · {t.seats} міс.</span>
          </button>
        );
      })}
    </div>
  );
}
