import type { Metadata } from 'next';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Sevanta (సేవంత) — Local help. Right when you need it. | Chilakaluripet, Andhra Pradesh',
  description:
    'Sevanta (సేవంత) connects you with verified local AC technicians, electricians, plumbers, and mechanics near you in Chilakaluripet with instant AI matching, upfront pricing, and UPI payments.',
  keywords: [
    'Sevanta',
    'Sevanta Chilakaluripet',
    'సేవంత',
    'సేవంత చిలకలూరిపేట',
    'Local help. Right when you need it.',
    'Chilakaluripet local services',
    'AC repair Chilakaluripet',
    'electrician Chilakaluripet',
    'plumber Chilakaluripet',
    'bike mechanic Chilakaluripet',
    'FixNear',
  ],
  authors: [{ name: 'Sevanta Technologies' }],
  metadataBase: new URL('https://fixnear.in'),
  openGraph: {
    title: 'Sevanta (సేవంత) — Local help. Right when you need it.',
    description:
      'Sevanta connects households with verified local AC technicians, electricians, plumbers, and mechanics in Chilakaluripet with instant AI matching and UPI payments.',
    url: 'https://fixnear.in',
    siteName: 'Sevanta',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/sevanta-logo.png',
        width: 1024,
        height: 1024,
        alt: 'Sevanta — Local help. Right when you need it.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sevanta (సేవంత) — Local help. Right when you need it.',
    description: 'AI-powered local services marketplace in Chilakaluripet, AP.',
    images: ['/sevanta-logo.png'],
  },
  icons: {
    icon: '/sevanta-logo.png',
    shortcut: '/sevanta-logo.png',
    apple: '/sevanta-logo.png',
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
        <link rel="icon" href="/sevanta-logo.png" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
