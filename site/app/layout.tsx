import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Inventory Sentry — Shopify feed safety',
  description:
    'Catch dangerous supplier inventory changes before they reach Shopify.',
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
