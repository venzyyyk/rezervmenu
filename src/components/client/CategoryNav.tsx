"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  group: string | null;
}

interface Props {
  categories: Category[];
  accentColor: string;
}

export function CategoryNav({ categories, accentColor }: Props) {
  const [active, setActive] = useState<string>(categories[0]?.id ?? "");
  const navRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // IntersectionObserver — определяем какая секция в viewport
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    categories.forEach((cat) => {
      const el = document.getElementById(`cat-${cat.id}`);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isScrolling.current) {
            setActive(cat.id);
            scrollNavTo(cat.id);
          }
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  const scrollNavTo = useCallback((catId: string) => {
    const btn = navRef.current?.querySelector<HTMLElement>(`[data-cat="${catId}"]`);
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);

  const handleClick = (catId: string) => {
    setActive(catId);
    isScrolling.current = true;
    const section = document.getElementById(`cat-${catId}`);
    if (section) {
      // Offset под sticky header (56px nav + 8px gap)
      const y = section.getBoundingClientRect().top + window.scrollY - 112;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setTimeout(() => { isScrolling.current = false; }, 800);
  };

  return (
    <div className="sticky top-0 z-30 glass border-b border-line">
      {/* Категорії */}
      <div
        ref={navRef}
        className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {categories.map((cat) => {
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              data-cat={cat.id}
              onClick={() => handleClick(cat.id)}
              className={cn(
                "relative shrink-0 rounded-full px-4 py-1.5 text-sm tracking-wide whitespace-nowrap transition-all duration-300",
                isActive ? "text-base font-medium" : "text-muted hover:text-cream"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="cat-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: accentColor + "22", border: `1px solid ${accentColor}55` }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10" style={isActive ? { color: accentColor } : {}}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
