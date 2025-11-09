'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem('tt-auth');
    if (!token) {
      const destination = pathname && pathname !== '/login' ? pathname : '/';
      router.replace(`/login?next=${encodeURIComponent(destination)}`);
      return;
    }
    setIsReady(true);
  }, [router, pathname]);

  if (!isReady) {
    return (
      <main className="min-h-[60vh] bg-slate-50 flex items-center justify-center px-4">
        <div className="card text-center">
          <p className="text-sm font-semibold text-slate-500">Authenticating…</p>
          <p className="text-xs text-slate-400 mt-1">One pit-stop before the showroom.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
