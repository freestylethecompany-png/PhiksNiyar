import type { Metadata, Viewport } from 'next';
import './globals.css';
import PwaRegister from '@/components/common/PwaRegister';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#102F78',
};

export const metadata: Metadata = {
  title: 'PhiksNiyar (ఫిక్స్ నియర్) — Skilled People • Real Solutions | Chilakaluripet, Andhra Pradesh',
  description:
    'PhiksNiyar (ఫిక్స్ నియర్) connects households with verified local AC technicians, electricians, plumbers, and mechanics near you in Chilakaluripet with instant AI matching, upfront pricing, 7-day warranty protection, and UPI payments. Skilled People • Real Solutions.',
  keywords: [
    'PhiksNiyar',
    'PhiksNiyar Chilakaluripet',
    'ఫిక్స్ నియర్',
    'ఫిక్స్ నియర్ చిలకలూరిపేట',
    'Skilled People Real Solutions',
    'Local help. Right when you need it.',
    'Chilakaluripet local services',
    'AC repair Chilakaluripet',
    'electrician Chilakaluripet',
    'plumber Chilakaluripet',
    'bike mechanic Chilakaluripet',
    'Andhra Pradesh hyperlocal services',
  ],
  authors: [{ name: 'PhiksNiyar Technologies' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://phiksniyar.in'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PhiksNiyar',
  },
  openGraph: {
    title: 'PhiksNiyar (ఫిక్స్ నియర్) — Skilled People • Real Solutions',
    description:
      'PhiksNiyar connects households with verified local AC technicians, electricians, plumbers, and mechanics in Chilakaluripet with instant AI matching, upfront pricing, and UPI payments.',
    url: 'https://phiksniyar.in',
    siteName: 'PhiksNiyar',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/phiksniyar-logo.png',
        width: 880,
        height: 738,
        alt: 'PhiksNiyar — Skilled People • Real Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhiksNiyar (ఫిక్స్ నియర్) — Skilled People • Real Solutions',
    description: 'AI-powered local services marketplace in Chilakaluripet, AP. Skilled People • Real Solutions.',
    images: ['/phiksniyar-logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PhiksNiyar" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
