"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart, cartTotal } from "@/stores/cart";
import { formatPrice } from "@/lib/money";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  venueSlug: string;
  accentColor: string;
}

export function CartSheet({ venueSlug, accentColor }: Props) {
  const isOpen = useCart((s) => s.isOpen);
  const items = useCart((s) => s.items);
  const closeCart = useCart((s) => s.closeCart);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const updateComment = useCart((s) => s.updateComment);
  const removeItem = useCart((s) => s.removeItem);
  const total = cartTotal(items);
  const router = useRouter();

  function handleCheckout() {
    closeCart();
    router.push(`/v/${venueSlug}/checkout`);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-40 bg-base/80 backdrop-blur-sm"
          />

          {/* Sheet — справа на десктопе, снизу на мобиле */}
          <motion.aside
            key="cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface border-l border-line sm:max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <div>
                <h2 className="font-serif text-xl font-light text-cream">Кошик</h2>
                <p className="text-xs text-muted mt-0.5">{items.length} позиц{items.length === 1 ? "ія" : "ії"}</p>
              </div>
              <button
                onClick={closeCart}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-muted hover:text-cream transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
                <span className="text-4xl opacity-20">🛒</span>
                <p className="text-muted text-sm">Кошик порожній</p>
                <button
                  onClick={closeCart}
                  className="text-xs tracking-widest uppercase"
                  style={{ color: accentColor }}
                >
                  Повернутись до меню
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <ul className="divide-y divide-line">
                  {items.map((item) => (
                    <motion.li
                      key={item.dishId}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="px-5 py-4"
                    >
                      <div className="flex gap-3">
                        {/* Фото */}
                        {item.imageUrl && (
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-cream leading-snug line-clamp-2">
                              {item.name}
                            </p>
                            <button
                              onClick={() => removeItem(item.dishId)}
                              className="shrink-0 text-muted/40 hover:text-danger transition-colors"
                              aria-label="Видалити"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="mt-1 font-serif text-base font-light" style={{ color: accentColor }}>
                            {formatPrice(item.priceCents * item.quantity, "UAH")}
                          </p>

                          {/* Qty */}
                          <div className="mt-2.5 flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-lg bg-elevated px-2.5 py-1.5">
                              <button
                                onClick={() => updateQuantity(item.dishId, -1)}
                                className="text-muted hover:text-cream transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-4 text-center text-sm text-cream">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.dishId, 1)}
                                className="text-muted hover:text-cream transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-xs text-muted">
                              {formatPrice(item.priceCents, "UAH")} / шт
                            </span>
                          </div>

                          {/* Комментарий */}
                          <input
                            value={item.comment}
                            onChange={(e) => updateComment(item.dishId, e.target.value)}
                            placeholder="Коментар..."
                            className="mt-2 w-full rounded-lg bg-elevated border border-line/60 px-3 py-1.5 text-xs text-cream placeholder:text-muted/40 outline-none focus:border-sage/50"
                          />
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div className="shrink-0 border-t border-line px-5 py-5 space-y-4">
                {/* Итог */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Разом</span>
                  <span className="font-serif text-xl font-light" style={{ color: accentColor }}>
                    {formatPrice(total, "UAH")}
                  </span>
                </div>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="flex w-full items-center justify-between rounded-xl px-5 py-4 font-medium text-base transition-opacity active:opacity-90"
                  style={{ background: accentColor }}
                >
                  <span className="text-sm text-base">Оформити замовлення</span>
                  <ArrowRight className="h-4 w-4 text-base" />
                </motion.button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
