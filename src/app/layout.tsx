import './globals.css';
import PageTransition from '@/components/PageTransition';
export const metadata = { title: "ToyotaTinder", description: "Find your optimal Toyota" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
