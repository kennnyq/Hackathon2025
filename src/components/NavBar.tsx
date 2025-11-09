'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NavBar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        setIsAuthenticated(Boolean(window.localStorage.getItem('tt-auth')));
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  function handleSignOut() {
    try {
      window.localStorage.removeItem('tt-auth');
    } catch {
      // ignore storage errors on sign out
    }
    setIsAuthenticated(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur bg-white/80 border-b border-red-100/70 shadow-sm">
      <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4 text-slate-900">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="h-3 w-3 rounded-full bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)]" /> ToyotaTinder
        </Link>
        <div className="ml-auto flex items-center gap-4 text-sm font-semibold">
          <Link className="hover:text-red-600 transition-colors" href="/find">Find</Link>
          <Link className="hover:text-red-600 transition-colors" href="/liked">Liked</Link>
          <a className="hover:text-red-600 transition-colors" href="https://www.toyota.com/" target="_blank" rel="noreferrer">Toyota</a>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-red-200 px-3 py-1 text-red-600 transition hover:border-red-400 hover:bg-red-50"
            >
              Sign out
            </button>
          ) : (
            <Link className="hover:text-red-600 transition-colors" href="/login">Log in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
