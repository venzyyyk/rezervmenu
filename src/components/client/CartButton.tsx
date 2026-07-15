"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart, cartCount, cartTotal } from "@/stores/cart";
import { formatPrice } from "@/lib/money";

interface Props {
  accentColor: string;
}

export function CartButton({ accentColor }: Props) {
  const items = useCart((s) => s.items);
  const toggleCart = useCart((s) => s.toggleCart);
  const count = cartCount(items);
  const total = cartTotal(items);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="fixed bottom-6 inset-x-4 z-30 sm:inset-x-auto sm:right-6 sm:left-auto sm:w-auto"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={toggleCart}
            className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 shadow-lift sm:min-w-64"
            style={{ background: accentColor }}
          >
            {/* Иконка + счётчик */}
            <div className="relative shrink-0">
              <ShoppingBag className="h-5 w-5 text-base" />
              <motion.span
                key={count}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-base text-[10px] font-bold text-cream"
              >
                {count}
              </motion.span>
            </div>

            <span className="flex-1 text-left text-sm font-medium text-base">
              Переглянути кошик
            </span>

            <span className="font-serif text-base font-light text-base">
              {formatPrice(total, "UAH")}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
