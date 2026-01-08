/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // NOTE:
    // - AVIF меньше по размеру, но обычно заметно медленнее кодируется при первом запросе,
    //   особенно на дешёвых VPS.
    // - Для витрины с большим количеством фото при self-hosting чаще выгоднее WebP-only.
    formats: ['image/webp'],
    // Сужаем набор возможных размеров, чтобы Next генерировал меньше вариантов srcset.
    deviceSizes: [360, 640, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    // Держим кэш оптимизированных картинок дольше (уменьшает повторные перерасчёты)
    minimumCacheTTL: 2678400, // 31 day
  },
  async redirects() {
    return [
      { source: '/page16831385.html', destination: '/', permanent: true },
      { source: '/page16833487.html', destination: '/photozony', permanent: true },
      { source: '/page16998401.html', destination: '/fountains', permanent: true },
      { source: '/page16834119.html', destination: '/boxes', permanent: true },
      { source: '/page17015616.html', destination: '/bouquets', permanent: true },
      { source: '/page16852621.html', destination: '/figures', permanent: true },
      { source: '/page17355325.html', destination: '/numerals', permanent: true },
      { source: '/page16834900.html', destination: '/tematicheskiye', permanent: true },
      { source: '/page17124782.html', destination: '/bubbles', permanent: true },
    ];
  },
};

export default nextConfig;
