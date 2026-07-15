"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-6 text-center">
      <p className="text-[10px] tracking-[.4em] uppercase text-danger mb-4">Помилка</p>
      <h1 className="font-serif text-4xl font-light text-cream mb-4">Щось пішло не так</h1>
      <div className="mx-auto mb-6 h-px w-16 bg-gradient-to-r from-transparent via-danger to-transparent opacity-50" />
      <p className="text-sm text-muted mb-8 max-w-xs">
        {error.message ?? "Сталася несподівана помилка. Спробуйте ще раз."}
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-sage px-6 py-3 text-sm font-medium text-base transition-opacity hover:opacity-90"
      >
        Спробувати знову
      </button>
    </div>
  );
}
