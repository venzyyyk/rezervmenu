"use client";
import { useState } from "react";
import { dishPlaceholder } from "@/lib/placeholder";

interface Props {
  src?: string | null;
  alt: string;
  category?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Зображення страви з елегантним SVG-фолбеком (як у новому дизайні).
 * Використовуємо звичайний <img> замість next/image, щоб:
 *  - не залежати від remotePatterns для довільних хостів фото;
 *  - плавно падати на SVG-плейсхолдер при відсутньому/битому URL.
 */
export function DishImage({ src, alt, category, className, sizes, priority }: Props) {
  const fallback = dishPlaceholder(alt, category);
  const [current, setCurrent] = useState<string>(src && src.trim() ? src : fallback);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
      className={className}
    />
  );
}
