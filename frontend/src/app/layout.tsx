import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PublicFooter } from '@/components/layout/public-footer';
import { SwRegister } from '@/components/pwa/sw-register';
import { InstallPrompt } from '@/components/pwa/install-prompt';

export const metadata: Metadata = {
  title: 'DeliGo',
  description: 'Move anything, anywhere, faster with verified delivery providers.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DeliGo',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#15705f',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <PublicFooter />
        <InstallPrompt />
        <SwRegister />
      </body>
    </html>
  );
}
