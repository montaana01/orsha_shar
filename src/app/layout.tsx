import type { Metadata, Viewport } from 'next';
import './globals.css';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { site } from '@/content/site';
import { getPublicCategories } from '@/lib/public-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff'
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Гелиевые шары в Орше — Орша Шар',
    template: '%s — Орша Шар'
  },
  description:
    'Гелиевые шары, фотозоны, украшения для торжеств в Орше.',
  icons: {
    icon: [
      { url: '/favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' }],
    shortcut: '/favicon/web-app-manifest-192x192.png'
  },
  openGraph: {
    type: 'website',
    locale: site.defaultLocale,
    url: site.url,
    siteName: site.name,
    images: [{ url: '/assets/hero-desk.webp' }]
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getPublicCategories();

  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <head>
        <meta name="apple-mobile-web-app-title" content="Орша Шар" />
      </head>
      <body className="app">
        <Header categories={categories} />
        <main className="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
