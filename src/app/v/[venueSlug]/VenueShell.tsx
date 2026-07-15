"use client";
import Link from "next/link";
import { ChevronLeft, CalendarDays } from "lucide-react";
import { CartButton } from "@/components/client/CartButton";
import { CartSheet } from "@/components/client/CartSheet";

interface Venue {
  slug: string;
  name: string;
  address: string;
  accentColor: string;
}

export default function VenueShell({
  children,
  venue,
}: {
  children: React.ReactNode;
  venue: Venue;
}) {
  return (
    <div className="min-h-screen bg-base">
      <header className="sticky top-0 z-40 glass border-b border-line">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-muted hover:text-cream transition-colors shrink-0"
            aria-label="Назад"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-lg font-light leading-none text-cream truncate">
              {venue.name}
            </h1>
            <p className="mt-0.5 text-[10px] text-muted tracking-wide truncate">{venue.address}</p>
          </div>

          {/* Кнопка бронирования */}
          <Link
            href={`/v/${venue.slug}/reserve`}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-cream hover:border-line/60 transition-all shrink-0"
          >
            <CalendarDays className="h-3 w-3" />
            <span className="hidden sm:inline">Бронювати</span>
          </Link>

          <div
            className="h-2 w-2 rounded-full shrink-0 opacity-70"
            style={{ background: venue.accentColor }}
          />
        </div>
      </header>

      {children}

      <CartButton accentColor={venue.accentColor} />
      <CartSheet venueSlug={venue.slug} accentColor={venue.accentColor} />
    </div>
  );
}
