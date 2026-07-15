"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { DishImage } from "./DishImage";

type Venue = {
  slug: string;
  name: string;
  address: string;
  tagline: string | null;
  accentColor: string;
  heroImageUrl: string | null;
};

interface Props {
  venues: Venue[];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.85 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export function HeroSection({ venues }: Props) {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-base">
      {/* Фоновий градієнт (радіальний вгорі) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(168,184,154,0.13) 0%, transparent 65%)",
        }}
      />

      {/* Декоративні лінії 28% / 30% */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 right-0 top-[28%] h-px bg-gradient-to-r from-transparent via-line to-transparent" />
        <div className="absolute bottom-[30%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      </div>

      {/* Шапка з логотипами */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex w-full items-center justify-between p-5"
      >
        <Image
          src="/logo-left.png"
          alt="Dry Leaf"
          width={120}
          height={48}
          priority
          className="h-12 w-auto max-w-[120px] object-contain"
        />
        <Image
          src="/logo-right.png"
          alt="Dry Leaf"
          width={120}
          height={48}
          priority
          className="h-12 w-auto max-w-[120px] object-contain"
        />
      </motion.header>

      {/* Центр */}
      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-5 pb-9 pt-3 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-3.5 text-[9px] uppercase tracking-[0.45em] text-sage">Меню закладу</p>
          <h1 className="font-serif text-[clamp(3.5rem,14vw,7rem)] font-light leading-[0.9] tracking-tight text-cream">
            Dry&nbsp;Leaf
          </h1>
          <div className="mx-auto mt-[18px] h-px w-20 bg-gradient-to-r from-transparent via-sage to-transparent" />
          <p className="mt-[18px] text-xs tracking-wide text-muted">
            Оберіть локацію, щоб переглянути меню
          </p>
        </motion.div>

        {/* Картки закладів */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-9 grid w-full max-w-[580px] grid-cols-2 gap-2.5 max-[380px]:grid-cols-1"
        >
          {venues.map((venue) => (
            <motion.div key={venue.slug} variants={item}>
              <VenueCard venue={venue} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Футер */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="relative z-[1] pb-6 text-center"
      >
        <p className="text-[9px] tracking-[0.18em] text-muted/30">
          Доставляємо прямо до ваших дверей
        </p>
        <p className="mt-1 text-[9px] tracking-[0.18em] text-muted/30">
          Фото в меню не відповідають дійсності
        </p>
      </motion.div>
    </main>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Link href={`/v/${venue.slug}`} className="group block outline-none">
      <motion.div
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-[18px] border border-line bg-surface"
      >
        {/* Фото */}
        <div className="relative h-[150px] overflow-hidden bg-elevated">
          <DishImage
            src={venue.heroImageUrl}
            alt={venue.name}
            category={venue.name}
            sizes="(max-width: 640px) 100vw, 290px"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/10 to-transparent" />
          <div
            className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full opacity-80"
            style={{ background: venue.accentColor }}
          />
        </div>

        {/* Інфо */}
        <div className="p-3.5">
          <h2 className="font-serif text-xl font-normal tracking-wide text-cream">{venue.name}</h2>
          <p className="mt-1.5 text-[10px] leading-relaxed tracking-wide text-muted">
            {venue.address}
          </p>
          {venue.tagline && (
            <p className="mt-2 text-[9px] tracking-wide" style={{ color: venue.accentColor }}>
              {venue.tagline}
            </p>
          )}

          <div
            className="mt-3 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.3em] transition-all duration-300 group-hover:gap-2.5"
            style={{ color: venue.accentColor }}
          >
            <span>Переглянути меню</span>
            <svg
              className="h-[11px] w-[11px] transition-transform duration-300 group-hover:translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
