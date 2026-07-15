// Елегантний SVG-плейсхолдер для страв без фото.
// Портовано з нового дизайну (sitemenudryleaf-main/script.js), щоб зберегти
// однаковий вигляд «фейкового фото» з логотипом-листком і назвою страви.

const CAT_GRADIENTS: Record<string, [string, string]> = {
  "Перші страви": ["#3a4030", "#5a6047"],
  "Другі страви": ["#40382e", "#60543f"],
  "М'ясні страви": ["#4a2e2a", "#6a4038"],
  Салати: ["#2e4030", "#3f6047"],
  Гарніри: ["#40402e", "#605a3f"],
  Закуски: ["#2e3a40", "#3f5460"],
  Фастфуд: ["#402e2e", "#604040"],
  Снеки: ["#3a3a2e", "#54543f"],
  Нарізки: ["#3a2e40", "#54406a"],
  Солодощі: ["#402e3a", "#603f54"],
  default: ["#2A2E24", "#4a503f"],
};

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Повертає data:image/svg+xml плейсхолдер із назвою страви та листком. */
export function dishPlaceholder(name: string, category?: string | null): string {
  const g = (category && CAT_GRADIENTS[category]) || CAT_GRADIENTS.default;
  const safe = esc(name);

  // Розбиваємо назву на до 2 рядків по ~22 символи
  const lines: string[] = [];
  let cur = "";
  for (const w of safe.split(" ")) {
    if ((cur + " " + w).trim().length > 22) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);

  const txt = lines
    .slice(0, 2)
    .map(
      (l, i) =>
        `<text x="300" y="${360 + i * 34}" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#fff" fill-opacity="0.95">${l}</text>`
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="440" viewBox="0 0 600 440">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${g[0]}"/>
        <stop offset="1" stop-color="${g[1]}"/>
      </linearGradient>
      <radialGradient id="v" cx="0.5" cy="0.4" r="0.75">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
      </radialGradient>
    </defs>
    <rect width="600" height="440" fill="url(#g)"/>
    <rect width="600" height="440" fill="url(#v)"/>
    <g transform="translate(300 165)" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <g transform="scale(3.2) translate(-12 -12)">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6"/>
      </g>
    </g>
    ${txt}
  </svg>`;

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
