import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // База — почти чёрный с зелёным подтоном
        base: "#0E0F0C",
        surface: "#16180F",
        elevated: "#1E211A",
        line: "#2A2E24",
        // Акценты
        sage: "#A8B89A",        // приглушённый шалфей (Dry Leaf)
        gold: "#C9A86A",        // тёплое золото — цены, CTA
        graphite: "#7E8794",    // холодный акцент (Citadel)
        cream: "#F2F1EA",       // основной текст
        muted: "#9A9B90",       // вторичный текст
        danger: "#C5705D",
        success: "#8DA888",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 40px -12px rgba(0,0,0,0.6)",
        lift: "0 24px 60px -20px rgba(0,0,0,0.7)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
