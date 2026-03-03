import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { PWARegister } from '@/components/pwa-register';
import { InstallPWABanner } from '@/components/install-pwa-banner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spaced English',
  description: 'Self-hosted English learning platform with spaced repetition (SM-2)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'English C1',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full">
        <PWARegister />
        <InstallPWABanner />
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
