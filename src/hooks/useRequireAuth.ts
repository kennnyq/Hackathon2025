'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const AUTH_STORAGE_KEY = 'tt-auth';

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(() => {
    if (typeof window === 'undefined') return true;
    return Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
  });

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      const token = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!token) {
        setIsAuthorized(false);
        const destination = pathname && pathname !== '/login' ? pathname : '/';
        router.replace(`/login?next=${encodeURIComponent(destination)}`);
        return;
      }
      setIsAuthorized(true);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [router, pathname]);

  return isAuthorized;
}
