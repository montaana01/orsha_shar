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
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Гелиевые шары в Орше — Орша Шар',
    template: '%s — Орша Шар',
  },
  description: 'Гелиевые шары, фотозоны, украшения для торжеств в Орше.',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' }],
    shortcut: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: site.defaultLocale,
    url: site.url,
    siteName: site.name,
    images: [{ url: '/assets/hero-desk.webp' }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getPublicCategories();

  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <meta name="apple-mobile-web-app-title" content="Орша Шар" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://mc.yandex.ru" crossOrigin="anonymous" />
      </head>
      <body className="app">
        <Script id="google-tag-manager" strategy="lazyOnload">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N8RX75N9');`}
        </Script>
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N8RX75N9" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
          }}
        />
        <Script id="yandex-metrika" strategy="lazyOnload">
          {`(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js', 'ym');

ym(72543040, 'init', {webvisor:true, clickmap:true, accurateTrackBounce:true, trackLinks:true});`}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NZQNHDRLX7"
          strategy="lazyOnload"
        />
        <Script id="google-gtag" strategy="lazyOnload">
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
              '<div><img src="https://mc.yandex.ru/watch/72543040" style="position:absolute; left:-9999px;" alt="" /></div>',
          }}
        />
      </body>
    </html>
  );
}
