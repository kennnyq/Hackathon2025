import './globals.css';
export const metadata = { title: "ToyotaTinder", description: "Find your optimal Toyota" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white antialiased">
        {children}
      </body>
    </html>
  );
}