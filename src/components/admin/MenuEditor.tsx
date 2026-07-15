"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/money";
import {
  createDish, updateDish, deleteDish,
  toggleDishAvailability, getMenuForAdmin,
} from "@/server/admin";

type VenueMenu = Awaited<ReturnType<typeof getMenuForAdmin>>[number];
type DishRow = VenueMenu["categories"][number]["dishes"][number];

interface Props {
  initialData: VenueMenu[];
}

const EMPTY_FORM = {
  name: "", description: "", composition: "", size: "",
  allergens: "", priceCents: 0, imageUrl: "", isAvailable: true,
};

export function MenuEditor({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [activeVenueIdx, setActiveVenueIdx] = useState(0);
  const [modal, setModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    dish?: DishRow;
    categoryId: string;
    venueId: string;
  } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const venue = data[activeVenueIdx];

  async function refreshData() {
    const fresh = await getMenuForAdmin();
    setData(fresh);
  }

  function openCreate(categoryId: string, venueId: string) {
    setSaveError(null);
    setForm(EMPTY_FORM);
    setModal({ open: true, mode: "create", categoryId, venueId });
  }

  function openEdit(dish: DishRow, categoryId: string, venueId: string) {
    setSaveError(null);
    setForm({
      name: dish.name,
      description: dish.description ?? "",
      composition: dish.composition ?? "",
      size: dish.size ?? "",
      allergens: dish.allergens.join(", "),
      priceCents: dish.priceCents,
      imageUrl: dish.imageUrl ?? "",
      isAvailable: dish.isAvailable,
    });
    setModal({ open: true, mode: "edit", dish, categoryId, venueId });
  }

  function handleSave() {
    if (!modal) return;
    setSaveError(null);
    startTransition(async () => {
      const payload = {
        venueId: modal.venueId,
        categoryId: modal.categoryId,
        name: form.name,
        description: form.description || undefined,
        composition: form.composition || undefined,
        size: form.size || undefined,
        allergens: form.allergens.split(",").map((a) => a.trim()).filter(Boolean),
        priceCents: Number(form.priceCents),
        imageUrl: form.imageUrl || undefined,
        isAvailable: form.isAvailable,
        sortOrder: 0,
      };
      try {
        if (modal.mode === "create") {
          await createDish(payload);
        } else if (modal.dish) {
          await updateDish(modal.dish.id, payload);
        }
        setModal(null);
        await refreshData();
      } catch (e) {
        setSaveError(
          e instanceof Error ? e.message : "Не вдалося зберегти страву"
        );
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Видалити страву?")) return;
    startTransition(async () => {
      await deleteDish(id);
      await refreshData();
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleDishAvailability(id, !current);
      await refreshData();
    });
  }

  return (
    <div className="px-5 py-6 md:px-8">
      <div className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-muted/55 mb-1">Управління</p>
        <h1 className="font-serif text-3xl font-light text-cream mb-4">Меню</h1>

        {/* Venue tabs */}
        <div className="flex gap-2">
          {data.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setActiveVenueIdx(i)}
              className={`rounded-full px-4 py-1.5 text-sm border transition-all ${
                activeVenueIdx === i
                  ? "text-base border-transparent"
                  : "text-muted border-line hover:text-cream"
              }`}
              style={activeVenueIdx === i ? { background: v.accentColor, borderColor: v.accentColor } : {}}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Категории */}
      <div className="space-y-8 max-w-3xl">
        {venue?.categories.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-lg font-light text-cream">{cat.name}</h2>
                <span className="text-xs text-muted">{cat.dishes.length} страв</span>
              </div>
              <button
                onClick={() => openCreate(cat.id, venue.id)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs border border-line text-muted hover:text-cream hover:border-sage/40 transition-all"
              >
                <Plus className="h-3 w-3" />
                Додати
              </button>
            </div>

            <div className="space-y-2">
              {cat.dishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`flex items-center gap-3 rounded-xl bg-surface border border-line px-4 py-3 transition-opacity ${
                    dish.isAvailable ? "" : "opacity-50"
                  }`}
                >
                  {/* Фото */}
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-elevated shrink-0">
                    {dish.imageUrl ? (
                      <Image src={dish.imageUrl} alt={dish.name} width={48} height={48} className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-lg opacity-20">🍽</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cream truncate">{dish.name}</p>
                    <p className="text-xs text-muted mt-0.5">{formatPrice(dish.priceCents, dish.currency)}</p>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggle(dish.id, dish.isAvailable)}
                      disabled={isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-cream transition-colors"
                      title={dish.isAvailable ? "Прибрати з меню" : "Показати в меню"}
                    >
                      {dish.isAvailable
                        ? <Eye className="h-3.5 w-3.5" />
                        : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => openEdit(dish, cat.id, venue.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-cream transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dish.id)}
                      disabled={isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cat.dishes.length === 0 && (
                <p className="text-xs text-muted/50 text-center py-4">Страв ще немає</p>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* ─── MODAL ─── */}
      <AnimatePresence>
        {modal?.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="fixed inset-0 z-50 bg-base/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-x-4 top-[5%] z-60 max-w-lg mx-auto rounded-2xl bg-surface border border-line overflow-hidden max-h-[90svh] flex flex-col"
              style={{ zIndex: 60 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
                <h3 className="font-serif text-lg font-light text-cream">
                  {modal.mode === "create" ? "Нова страва" : "Редагувати страву"}
                </h3>
                <button onClick={() => setModal(null)} className="text-muted hover:text-cream transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* Категорія — куди зберегти страву */}
                <div>
                  <label className="mb-1.5 block text-[10px] tracking-widest uppercase text-muted/55">
                    Категорія *
                  </label>
                  <select
                    value={modal.categoryId}
                    onChange={(e) => setModal({ ...modal, categoryId: e.target.value })}
                    className="w-full rounded-xl bg-elevated border border-line px-4 py-2.5 text-sm text-cream outline-none focus:border-sage/40 transition-colors"
                  >
                    {venue?.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <MField label="Назва *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <MField label="Опис" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
                <MField label="Склад" value={form.composition} onChange={(v) => setForm({ ...form, composition: v })} multiline />
                <MField
                  label="Алергени (через кому)"
                  value={form.allergens}
                  onChange={(v) => setForm({ ...form, allergens: v })}
                  placeholder="глютен, лактоза, яйце"
                />
                <MField
                  label="Порція"
                  value={form.size}
                  onChange={(v) => setForm({ ...form, size: v })}
                  placeholder="400г / 300мл / 2шт"
                />
                <div>
                  <label className="mb-1.5 block text-[10px] tracking-widest uppercase text-muted/55">
                    Ціна (копійки) *
                  </label>
                  <input
                    type="number" min={0}
                    value={form.priceCents}
                    onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })}
                    className="w-full rounded-xl bg-elevated border border-line px-4 py-2.5 text-sm text-cream outline-none focus:border-sage/40 transition-colors"
                  />
                  <p className="mt-1 text-xs text-muted">
                    = {formatPrice(form.priceCents, "UAH")}
                    <span className="ml-2 text-muted/50">(185 ₴ = 18500)</span>
                  </p>
                </div>
                <MField label="URL фото" value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} placeholder="https://..." />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                    className={`relative inline-flex h-6 w-10 rounded-full transition-colors ${form.isAvailable ? "bg-sage" : "bg-elevated border border-line"}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-cream shadow m-1 transition-transform ${form.isAvailable ? "translate-x-4" : ""}`} />
                  </button>
                  <span className="text-sm text-muted">Доступна в меню</span>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-line flex flex-col gap-3 shrink-0">
                {saveError && (
                  <p className="rounded-xl bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger text-center">
                    {saveError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-line py-2.5 text-sm text-muted hover:text-cream transition-colors">
                    Скасувати
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isPending || !form.name}
                    className="flex-1 rounded-xl bg-sage py-2.5 text-sm font-medium text-base transition-opacity disabled:opacity-50"
                  >
                    {isPending ? "Зберігаємо..." : "Зберегти"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MField({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  const cls = "w-full rounded-xl bg-elevated border border-line px-4 py-2.5 text-sm text-cream placeholder:text-muted/40 outline-none focus:border-sage/40 transition-colors resize-none";
  return (
    <div>
      <label className="mb-1.5 block text-[10px] tracking-widest uppercase text-muted/55">{label}</label>
      {multiline
        ? <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}
