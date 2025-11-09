import type { Metadata } from 'next';
import './globals.css';
import PageTransition from '@/components/PageTransition';

import LoadingOverlayProvider from '@/components/LoadingOverlayProvider';
export const metadata: Metadata = {
  title: 'ToyotaTinder',
  description: 'Find your optimal Toyota',
  icons: {
    icon: [
      { url: '/toyotatinder.png', type: 'image/png', sizes: '32x32' },
      { url: '/toyotatinder.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/toyotatinder.png',
    apple: '/toyotatinder.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <LoadingOverlayProvider>
          <PageTransition>{children}</PageTransition>
        </LoadingOverlayProvider>
      </body>
    </html>
  );
}
