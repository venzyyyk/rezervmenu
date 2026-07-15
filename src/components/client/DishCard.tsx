"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { useCart } from "@/stores/cart";
import { DishModal } from "./DishModal";
import { DishImage } from "./DishImage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DishData {
  id: string;
  name: string;
  description: string | null;
  composition: string | null;
  size: string | null;
  allergens: string[];
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  venueId: string;
}

interface Props {
  dish: DishData;
  categoryName: string;
  accentColor: string;
  index: number;
}

export function DishCard({ dish, categoryName, accentColor, index }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const items = useCart((s) => s.items);
  const inCart = items.find((i) => i.dishId === dish.id);

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    addItem({
      dishId: dish.id,
      venueId: dish.venueId,
      name: dish.name,
      priceCents: dish.priceCents,
      imageUrl: dish.imageUrl,
    });
    toast.success(`${dish.name} додано до кошика`, { duration: 1500 });
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setModalOpen(true)}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-card transition-colors duration-300 hover:border-sage/25"
      >
        {/* Фото — співвідношення 72% */}
        <div className="relative overflow-hidden bg-elevated pt-[72%]">
          <DishImage
            src={dish.imageUrl}
            alt={dish.name}
            category={categoryName}
            sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/50 to-transparent" />

          {/* Швидке додавання */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={quickAdd}
            aria-label={`Додати ${dish.name}`}
            className={cn(
              "absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-lift transition-opacity duration-300",
              inCart ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            style={{ background: accentColor }}
          >
            {inCart ? (
              <span className="text-xs font-bold text-base">{inCart.quantity}</span>
            ) : (
              <Plus className="h-4 w-4 stroke-[2.5] text-base" />
            )}
          </motion.button>
        </div>

        {/* Тіло */}
        <div className="p-[11px]">
          <h3 className="line-clamp-2 min-h-[38px] font-serif text-[15px] font-medium leading-[1.25] text-cream">
            {dish.name}
          </h3>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-serif text-lg font-normal" style={{ color: accentColor }}>
              {formatPrice(dish.priceCents, dish.currency)}
            </span>
            {dish.size && (
              <span className="whitespace-nowrap text-[9px] tracking-wide text-muted">
                {dish.size}
              </span>
            )}
          </div>
        </div>
      </motion.article>

      <DishModal
        dish={dish}
        categoryName={categoryName}
        accentColor={accentColor}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
