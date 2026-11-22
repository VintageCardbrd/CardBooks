import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CardBooks',
  description: 'Sports card dealer operating system',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'CardBooks',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="CardBooks" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1E2A44" />
      </head>
      <body className="min-h-screen bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
