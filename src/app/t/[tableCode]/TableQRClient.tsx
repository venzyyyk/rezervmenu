"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/stores/cart";

interface Props {
  tableCode: string;
  tableNumber: number;
  venueSlug: string;
  venueName: string;
}

export default function TableQRClient({ tableCode, tableNumber, venueSlug, venueName }: Props) {
  const router = useRouter();
  const setTable = useCart((s) => s.setTable);

  useEffect(() => {
    setTable(tableCode);
    // Небольшая пауза для красивого перехода
    const timer = setTimeout(() => {
      router.replace(`/v/${venueSlug}?table=${tableCode}`);
    }, 1600);
    return () => clearTimeout(timer);
  }, [tableCode, venueSlug, router, setTable]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        {/* Иконка */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 text-5xl"
        >
          🪑
        </motion.div>

        <p className="text-xs tracking-widest uppercase text-muted mb-2">{venueName}</p>
        <h1 className="font-serif text-4xl font-light text-cream">
          Стіл №{tableNumber}
        </h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "6rem" }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="mx-auto mt-4 h-px bg-sage"
        />

        <p className="mt-6 text-sm text-muted">Відкриваємо меню...</p>
      </motion.div>
    </div>
  );
}
