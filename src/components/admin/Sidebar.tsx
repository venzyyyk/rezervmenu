"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingBag, CalendarDays,
  UtensilsCrossed, Building2, LogOut, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNewSince } from "@/server/admin";

const NAV = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Замовлення", icon: ShoppingBag },
  { href: "/admin/reservations", label: "Бронювання", icon: CalendarDays },
  { href: "/admin/menu", label: "Меню", icon: UtensilsCrossed },
  { href: "/admin/venues", label: "Заклади", icon: Building2 },
];

export function AdminSidebar({ newOrders = 0, newReservations = 0 }: {
  newOrders?: number;
  newReservations?: number;
}) {
  const path = usePathname();
  const [liveNew, setLiveNew] = useState({ orders: newOrders, reservations: newReservations });
  const [lastChecked] = useState(() => new Date().toISOString());

  // Polling каждые 15 секунд
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await getNewSince(lastChecked);
        setLiveNew(data);
      } catch {}
    };
    const id = setInterval(poll, 15_000);
    return () => clearInterval(id);
  }, [lastChecked]);

  const totalNew = liveNew.orders + liveNew.reservations;

  function isActive(href: string, exact = false) {
    return exact ? path === href : path.startsWith(href);
  }

  return (
    <>
      {/* ─── Desktop sidebar ─── */}
      <aside className="hidden md:flex flex-col w-56 bg-surface border-r border-line shrink-0">
        {/* Лого */}
        <div className="px-6 py-6 border-b border-line">
          <p className="text-[9px] tracking-[.45em] uppercase text-sage mb-1">Admin</p>
          <p className="font-serif text-xl font-light text-cream">Dry Leaf</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            const badge =
              href === "/admin/orders"
                ? liveNew.orders
                : href === "/admin/reservations"
                ? liveNew.reservations
                : 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-sage/15 text-sage"
                    : "text-muted hover:text-cream hover:bg-elevated"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sage text-[9px] font-bold text-base px-1">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 border-t border-line pt-4">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:text-danger hover:bg-danger/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Вийти
          </button>
        </div>
      </aside>

      {/* ─── Mobile bottom bar ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line flex">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[9px] transition-colors",
                active ? "text-sage" : "text-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden xs:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ─── Mobile top bar (notification) ─── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass border-b border-line px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] tracking-[.4em] uppercase text-sage">Admin</p>
          <p className="font-serif text-base font-light text-cream">Dry Leaf</p>
        </div>
        <div className="flex items-center gap-3">
          {totalNew > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage text-[9px] font-bold text-base">
              {totalNew}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-muted hover:text-cream transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
