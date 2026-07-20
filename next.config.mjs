/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Отключена серверная оптимизация: на бесплатном Render (512MB)
    // ресайзер картинок приводит к Out of Memory
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.ufs.sh" },
      // Реальні фото меню розміщені на десятках зовнішніх хостів —
      // дозволяємо будь-який https-хост, щоб зображення завжди завантажувались.
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};
export default nextConfig;
