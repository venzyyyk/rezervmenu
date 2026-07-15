"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { useCart } from "@/stores/cart";
import { DishImage } from "./DishImage";
import type { DishData } from "./DishCard";
import { toast } from "sonner";

const ALLERGEN_ICONS: Record<string, string> = {
  глютен: "🌾", лактоза: "🥛", яйце: "🥚", риба: "🐟",
  горіхи: "🥜", арахіс: "🥜", соя: "🫘", молюски: "🦑",
  сульфіти: "🍷", гірчиця: "🌿", кунжут: "🌾", селера: "🥬",
};

interface Props {
  dish: DishData;
  categoryName: string;
  accentColor: string;
  open: boolean;
  onClose: () => void;
}

export function DishModal({ dish, categoryName, accentColor, open, onClose }: Props) {
  const [qty, setQty] = useState(1);
  const [comment, setComment] = useState("");
  const [showComposition, setShowComposition] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const items = useCart((s) => s.items);
  const inCart = items.find((i) => i.dishId === dish.id);

  function handleAdd() {
    for (let i = 0; i < qty; i++) {
      addItem({
        dishId: dish.id,
        venueId: dish.venueId,
        name: dish.name,
        priceCents: dish.priceCents,
        imageUrl: dish.imageUrl,
      });
    }
    toast.success(`${dish.name} × ${qty} додано до кошика`, { duration: 1800 });
    onClose();
    setQty(1);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70"
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340, mass: 0.9 }}
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex max-h-[88vh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[22px] border-t border-line bg-elevated"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-base/60 text-cream backdrop-blur-sm transition-colors hover:bg-base/90"
              aria-label="Закрити"
            >
              <X className="h-[15px] w-[15px]" />
            </button>

            <div className="overflow-y-auto overscroll-contain">
              {/* Фото — співвідношення 62% */}
              <div className="relative w-full overflow-hidden bg-surface pt-[62%]">
                <DishImage
                  src={dish.imageUrl}
                  alt={dish.name}
                  category={categoryName}
                  sizes="(max-width: 520px) 100vw, 520px"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              {/* Ручка */}
              <div className="mx-auto mt-3.5 h-1 w-[38px] rounded-full bg-line" />

              {/* Тіло */}
              <div className="px-6 pt-5">
                <p className="mb-2.5 text-[9px] uppercase tracking-[0.35em] text-sage">
                  {categoryName}
                </p>
                <h2 className="mb-2.5 font-serif text-[30px] font-normal leading-[1.05] text-cream">
                  {dish.name}
                </h2>
                {dish.description && (
                  <p className="mb-5 text-sm leading-relaxed text-muted">{dish.description}</p>
                )}

                {/* Ціна + порція */}
                <div className="flex items-center gap-5 border-t border-line pt-[18px]">
                  <span className="font-serif text-[30px] font-normal" style={{ color: accentColor }}>
                    {formatPrice(dish.priceCents, dish.currency)}
                  </span>
                  {dish.size && <span className="text-xs tracking-wide text-muted">{dish.size}</span>}
                </div>

                {/* Алергени */}
                {dish.allergens.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-[10px] uppercase tracking-widest text-muted/60">Алергени</p>
                    <div className="flex flex-wrap gap-2">
                      {dish.allergens.map((a) => (
                        <span
                          key={a}
                          className="flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-xs text-muted"
                        >
                          <span>{ALLERGEN_ICONS[a] ?? "⚠️"}</span>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Склад — розкривний */}
                {dish.composition && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowComposition((p) => !p)}
                      className="flex w-full items-center justify-between border-t border-line py-3 text-sm text-muted transition-colors hover:text-cream"
                    >
                      <span className="text-[10px] uppercase tracking-widest">Склад</span>
                      <motion.span animate={{ rotate: showComposition ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="h-4 w-4" />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {showComposition && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden text-sm leading-relaxed text-muted/80"
                        >
                          {dish.composition}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Коментар */}
                <div className="mt-4">
                  <label className="mb-2 block text-[10px] uppercase tracking-widest text-muted/60">
                    Коментар до страви
                  </label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Наприклад: без цибулі, алергія на часник..."
                    className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-muted/40 focus:border-sage/50"
                  />
                </div>

                {inCart && (
                  <p className="mt-3 text-center text-xs" style={{ color: accentColor }}>
                    Вже у кошику: {inCart.quantity} шт.
                  </p>
                )}
              </div>
            </div>

            {/* Прилипаючий футер з кнопкою */}
            <div className="shrink-0 border-t border-line bg-elevated px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="text-muted transition-colors hover:text-cream"
                    aria-label="Зменшити"
                  >
                    <Minus className="h-4 w-4" />
                  </motion.button>
                  <span className="w-5 text-center text-sm font-medium text-cream">{qty}</span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setQty((q) => q + 1)}
                    className="text-muted transition-colors hover:text-cream"
                    aria-label="Збільшити"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  className="flex flex-1 items-center justify-between rounded-xl px-5 py-3 text-sm font-medium text-base transition-opacity active:opacity-90"
                  style={{ background: accentColor }}
                >
                  <span>Додати до кошика</span>
                  <span className="font-serif text-base font-light">
                    {formatPrice(dish.priceCents * qty, dish.currency)}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
