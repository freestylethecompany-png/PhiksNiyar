import type { Metadata } from 'next';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'FixNear — Local help. Right when you need it. | Chilakaluripet, Andhra Pradesh',
  description:
    'FixNear (ఫిక్స్‌నియర్) connects you with verified local AC technicians, electricians, plumbers, and mechanics near you in Chilakaluripet with instant AI matching, upfront pricing, and UPI payments.',
  keywords: [
    'FixNear',
    'Fix Near',
    'FixNear Chilakaluripet',
    'Local help. Right when you need it.',
    'Chilakaluripet local services',
    'AC repair Chilakaluripet',
    'electrician Chilakaluripet',
    'plumber Chilakaluripet',
    'bike mechanic Chilakaluripet',
    'ఫిక్స్‌నియర్ చిలకలూరిపేట',
  ],
  authors: [{ name: 'FixNear Technologies' }],
  metadataBase: new URL('https://fixnear.in'),
  openGraph: {
    title: 'FixNear — Local help. Right when you need it.',
    description:
      'FixNear connects households with verified local AC technicians, electricians, plumbers, and mechanics in Chilakaluripet with instant AI matching and UPI payments.',
    url: 'https://fixnear.in',
    siteName: 'FixNear',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/fixnear-logo.png',
        width: 1024,
        height: 1024,
        alt: 'FixNear — Local help. Right when you need it.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FixNear — Local help. Right when you need it.',
    description: 'AI-powered local services marketplace in Chilakaluripet, AP.',
    images: ['/fixnear-logo.png'],
  },
  icons: {
    icon: '/fixnear-logo.png',
    shortcut: '/fixnear-logo.png',
    apple: '/fixnear-logo.png',
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
        <link rel="icon" href="/fixnear-logo.png" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
