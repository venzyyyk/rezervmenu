import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "@/styles/globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Dry Leaf", template: "%s · Dry Leaf" },
  description: "Цифрове меню закладів Dry Leaf та Citadel у Харкові",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#0E0F0C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // предотвращаем зум на iOS при тапе на input
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#1E211A",
              border: "1px solid #2A2E24",
              color: "#F2F1EA",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        </Providers>
      </body>
    </html>
  );
}
