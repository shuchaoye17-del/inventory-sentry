import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Inventory Sentry — Shopify feed safety',
  description:
    'Catch dangerous supplier inventory changes before they reach Shopify.',
  openGraph: {
    title: 'Inventory Sentry',
    description:
      'Catch dangerous supplier inventory changes before they reach Shopify.',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Inventory Sentry supplier inventory safety preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inventory Sentry',
    description:
      'Catch dangerous supplier inventory changes before they reach Shopify.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
