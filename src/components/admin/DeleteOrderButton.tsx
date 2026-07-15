"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { adminDeleteOrder } from "@/server/admin";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Видалити замовлення? Цю дію не можна скасувати.")) return;
    startTransition(async () => {
      await adminDeleteOrder(orderId);
      router.refresh();
    });
  }

  return (
    <button
      disabled={isPending}
      onClick={handleDelete}
      title="Видалити замовлення"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted/60 hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
