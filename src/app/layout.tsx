import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
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
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js', 'ym');

ym(72543040, 'init', {webvisor:true, clickmap:true, accurateTrackBounce:true, trackLinks:true});`}
        </Script>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-NZQNHDRLX7" strategy="afterInteractive" />
        <Script id="google-gtag" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-NZQNHDRLX7');`}
        </Script>
        <Header categories={categories} />
        <main className="main">{children}</main>
        <Footer />
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              '<div><img src="https://mc.yandex.ru/watch/72543040" style="position:absolute; left:-9999px;" alt="" /></div>'
          }}
        />
      </body>
    </html>
  );
}
