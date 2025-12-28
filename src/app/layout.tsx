import type { Metadata, Viewport } from 'next';
import './globals.css';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { site } from '@/content/site';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff'
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Гелиевые шары в Орше — ORSHA SHAR',
    template: '%s — ORSHA SHAR'
  },
  description:
    'Гелиевые шары, фотозоны, украшения для торжеств в Орше. Бесплатная доставка по г. Орша.',
  icons: {
    icon: '/assets/icon.png',
    apple: '/assets/icon.png'
  },
  openGraph: {
    type: 'website',
    locale: site.defaultLocale,
    url: site.url,
    siteName: site.name,
    images: [{ url: '/assets/hero-desk.webp' }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="app">
        <Header />
        <main className="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
