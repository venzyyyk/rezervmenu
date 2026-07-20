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
type Spot = { x: number; y: number; w: number; h: number };
const LAYOUT: Record<string, Spot> = {
  // Малый бильярд — верхний левый угол
  "BILLIARD_SMALL-1": { x: 70, y: 52, w: 50, h: 74 },
  "BILLIARD_SMALL-2": { x: 148, y: 52, w: 50, h: 74 },

  // Большой бильярд — слева и справа, симметрично
  "BILLIARD_LARGE-1": { x: 52, y: 178, w: 124, h: 64 },
  "BILLIARD_LARGE-2": { x: 58, y: 288, w: 56, h: 104 },
  "BILLIARD_LARGE-3": { x: 140, y: 288, w: 56, h: 104 },
  "BILLIARD_LARGE-4": { x: 584, y: 52, w: 124, h: 64 },
  "BILLIARD_LARGE-5": { x: 584, y: 160, w: 124, h: 64 },
  "BILLIARD_LARGE-6": { x: 566, y: 288, w: 56, h: 104 },
  "BILLIARD_LARGE-7": { x: 648, y: 288, w: 56, h: 104 },

  // Столы на 4 места — центр
  "DINING-1": { x: 350, y: 172, w: 58, h: 78 },
  "DINING-2": { x: 350, y: 284, w: 58, h: 78 },

  // Столы на 2 места — вдоль стен
  "DINING-3": { x: 212, y: 24, w: 36, h: 36 },
  "DINING-4": { x: 514, y: 24, w: 36, h: 36 },
  "DINING-5": { x: 22, y: 120, w: 36, h: 36 },
  "DINING-6": { x: 22, y: 404, w: 36, h: 36 },
  "DINING-7": { x: 702, y: 120, w: 36, h: 36 },
  "DINING-8": { x: 702, y: 404, w: 36, h: 36 },
  "DINING-9": { x: 212, y: 404, w: 36, h: 36 },
  "DINING-10": { x: 514, y: 404, w: 36, h: 36 },
};

const GOLD = "#C9A86A";
const SAGE = "#8DA888";
const FELT = "#3E5C46";
const FELT_LIGHT = "#4A6B52";

export function FloorPlan({ tables, selectedId, accentColor, onSelect }: Props) {
  const placed: { table: ReserveTable; spot: Spot }[] = [];
  const unplaced: ReserveTable[] = [];

  tables.forEach((t) => {
    const spot = LAYOUT[`${t.kind}-${t.number}`];
    if (spot) placed.push({ table: t, spot });
    else unplaced.push(t);
  });

  if (placed.length === 0) {
    return (
      <TableChips tables={tables} selectedId={selectedId} accentColor={accentColor} onSelect={onSelect} />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-surface border border-line p-3 sm:p-4">
        <svg viewBox="0 0 760 460" className="w-full h-auto select-none">
          <defs>
            <radialGradient id="hallGlow" cx="50%" cy="18%" r="80%">
              <stop offset="0%" stopColor="#8DA888" stopOpacity="0.07" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Пол */}
          <rect x="10" y="10" width="740" height="440" rx="16" fill="#15170F" />
          <rect x="10" y="10" width="740" height="440" rx="16" fill="url(#hallGlow)" />

          {/* Стены */}
          <rect x="10" y="10" width="740" height="440" rx="16" fill="none" stroke="#3A3F32" strokeWidth="5" />

          {/* Окна (верхняя стена) */}
          <line x1="120" y1="8" x2="185" y2="8" stroke="#5A6050" strokeWidth="7" strokeLinecap="round" />
          <line x1="575" y1="8" x2="640" y2="8" stroke="#5A6050" strokeWidth="7" strokeLinecap="round" />

          {/* Бар */}
          <g filter="url(#softShadow)">
            <rect x="252" y="20" width="256" height="64" rx="10" fill="#232619" stroke={SAGE} strokeWidth="1.5" />
            <rect x="252" y="72" width="256" height="12" rx="6" fill={SAGE} opacity="0.25" />
            <text x="380" y="55" textAnchor="middle" fill={SAGE} fontSize="16" letterSpacing="6" fontWeight="500">
              БАР
            </text>
          </g>
          {/* Барные стулья */}
          {[288, 334, 380, 426, 472].map((cx) => (
            <circle key={cx} cx={cx} cy={100} r="6" fill="none" stroke="#5A6050" strokeWidth="1.5" />
          ))}

          {/* Вход */}
          <path d="M 342 450 A 38 38 0 0 1 380 412" fill="none" stroke="#5A6050" strokeWidth="1.5" strokeDasharray="3 4" />
          <rect x="342" y="446" width="76" height="9" rx="3" fill="#0E0F0C" stroke="#5A6050" strokeWidth="1" />
          <text x="380" y="436" textAnchor="middle" fill="#9A9B90" fontSize="10" letterSpacing="3">
            ВХІД
          </text>

          {/* Столы */}
          {placed.map(({ table, spot }) => (
            <TableShape
              key={table.id}
              table={table}
              spot={spot}
              active={table.id === selectedId}
              accentColor={accentColor}
              onSelect={onSelect}
            />
          ))}
        </svg>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
        <Legend color={GOLD} label="Великі більярдні столи" />
        <Legend color={SAGE} label="Малі більярдні столи" />
        <Legend color="#5A6050" label="Звичайні столи" />
      </div>

      {/* Столы вне схемы не показываем — на схеме есть всё, что можно бронировать */}
    </div>
  );
}

// ─── Отрисовка одного стола ────────────────────────────────
function TableShape({
  table, spot, active, accentColor, onSelect,
}: {
  table: ReserveTable;
  spot: Spot;
  active: boolean;
  accentColor: string;
  onSelect: (t: ReserveTable) => void;
}) {
  const { x, y, w, h } = spot;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const isBilliard = table.kind !== "DINING";
  const rim = table.kind === "BILLIARD_LARGE" ? GOLD : table.kind === "BILLIARD_SMALL" ? SAGE : "#5A6050";

  return (
    <motion.g
      whileHover={{ opacity: 0.85 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onSelect(table)}
      style={{ cursor: "pointer", transformOrigin: `${cx}px ${cy}px` }}
      filter="url(#softShadow)"
    >
      {isBilliard ? (
        <>
          {/* Борт */}
          <rect
            x={x} y={y} width={w} height={h} rx="8"
            fill="#26291C"
            stroke={active ? accentColor : rim}
            strokeWidth={active ? 3 : 1.6}
          />
          {/* Сукно */}
          <rect
            x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx="5"
            fill={active ? FELT_LIGHT : FELT}
          />
          {/* Лузы */}
          {[
            [x + 7, y + 7], [x + w - 7, y + 7],
            [x + 7, y + h - 7], [x + w - 7, y + h - 7],
            ...(w > h
              ? [[cx, y + 6], [cx, y + h - 6]]
              : [[x + 6, cy], [x + w - 6, cy]]),
          ].map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r="2.6" fill="#141610" />
          ))}
          <text x={cx} y={cy + 5} textAnchor="middle" fill="#F2F1EA" fontSize="15" fontWeight="600">
            {table.number}
          </text>
        </>
      ) : (
        <>
          {/* Стулья вокруг */}
          {(table.seats >= 4
            ? [[cx, y - 7], [cx, y + h + 7], [x - 7, cy], [x + w + 7, cy]]
            : [[x - 7, cy], [x + w + 7, cy]]
          ).map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r="5.5" fill="#1C1F15" stroke="#5A6050" strokeWidth="1.3" />
          ))}
          {/* Столешница */}
          <rect
            x={x} y={y} width={w} height={h} rx={Math.min(w, h) / 4}
            fill={active ? accentColor : "#2A2E24"}
            stroke={active ? accentColor : "#4A5040"}
            strokeWidth={active ? 2.5 : 1.4}
          />
          <text
            x={cx} y={cy + 5} textAnchor="middle"
            fill={active ? "#0E0F0C" : "#D9D8CC"} fontSize="14" fontWeight="500"
          >
            {table.number}
          </text>
        </>
      )}
    </motion.g>
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
