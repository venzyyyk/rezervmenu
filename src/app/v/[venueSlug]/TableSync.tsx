"use client";
import { useEffect } from "react";
import { useCart } from "@/stores/cart";

// Синхронизирует привязку к столу с URL:
// пришёл по QR (?table=...) — привязываем, зашёл в меню без QR — сбрасываем.
// Иначе код стола вечно висит в localStorage и человек может
// "заказать за столик" через неделю с дивана.
export function TableSync({ tableCode }: { tableCode: string | null }) {
  const setTable = useCart((s) => s.setTable);
  const clearTable = useCart((s) => s.clearTable);

  useEffect(() => {
    if (tableCode) {
      setTable(tableCode);
    } else {
      clearTable();
    }
  }, [tableCode, setTable, clearTable]);

  return null;
}
