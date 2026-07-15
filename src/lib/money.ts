// Все цены хранятся в целых (копейки/центы). Здесь — единственное место форматирования.
const SYMBOLS: Record<string, string> = { UAH: "₴", USD: "$", EUR: "€" };

export function formatPrice(cents: number, currency = "UAH"): string {
  const value = (cents / 100).toLocaleString("uk-UA", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const sym = SYMBOLS[currency] ?? currency;
  return `${value} ${sym}`;
}

export function sumCents(items: { priceCents: number; quantity: number }[]): number {
  return items.reduce((acc, i) => acc + i.priceCents * i.quantity, 0);
}
