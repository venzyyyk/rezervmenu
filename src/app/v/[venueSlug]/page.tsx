import { getVenueWithMenu } from "@/server/menu";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoryNav } from "@/components/client/CategoryNav";
import { DishCard } from "@/components/client/DishCard";
import type { DishData } from "@/components/client/DishCard";
import { TableSync } from "./TableSync";

interface Props {
  params: { venueSlug: string };
  searchParams: { table?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.venueSlug === "citadel" ? "Citadel" : "Dry Leaf" };
}

export default async function VenueMenuPage({ params, searchParams }: Props) {
  const venue = await getVenueWithMenu(params.venueSlug);
  if (!venue) notFound();

  // Фильтруем категории без доступных блюд
  const categories = venue.categories.filter((c) => c.dishes.length > 0);

  return (
    <div className="pb-32">
      {/* Привязка к столу живёт только в рамках визита по QR */}
      <TableSync tableCode={searchParams.table ?? null} />

      {/* QR-уведомление о столике */}
      {searchParams.table && (
        <TableBadge tableCode={searchParams.table} accentColor={venue.accentColor} />
      )}

      {/* Навигация по категориям */}
      <CategoryNav
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          group: c.group,
        }))}
        accentColor={venue.accentColor}
      />

      {/* Секции с блюдами */}
      <div className="px-4 pt-6 space-y-10">
        {categories.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-28">
            {/* Заголовок категории */}
            <div className="mb-3.5 flex items-center gap-3.5">
              <h2 className="whitespace-nowrap font-serif text-[22px] font-normal text-cream">
                {cat.name}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
            </div>

            {/* Сетка карточек */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {cat.dishes.map((dish, idx) => {
                const dishData: DishData = {
                  id: dish.id,
                  name: dish.name,
                  description: dish.description,
                  composition: dish.composition,
                  size: dish.size,
                  allergens: dish.allergens,
                  priceCents: dish.priceCents,
                  currency: dish.currency,
                  imageUrl: dish.imageUrl,
                  venueId: venue.id,
                };
                return (
                  <DishCard
                    key={dish.id}
                    dish={dishData}
                    categoryName={cat.name}
                    accentColor={venue.accentColor}
                    index={idx}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TableBadge({ tableCode, accentColor }: { tableCode: string; accentColor: string }) {
  return (
    <div
      className="mx-4 mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
      style={{ background: accentColor + "15", border: `1px solid ${accentColor}30` }}
    >
      <span style={{ color: accentColor }}>🪑</span>
      <span className="text-cream/80 text-xs">
        Замовлення за столиком <strong style={{ color: accentColor }}>#{tableCode.slice(0, 4).toUpperCase()}</strong>
      </span>
    </div>
  );
}
