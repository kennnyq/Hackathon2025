'use client';
import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur bg-black/30 border-b border-white/10">
      <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="h-3 w-3 rounded-full bg-fuchsia-500" /> ToyotaTinder
        </Link>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <Link className="hover:underline" href="/find">Find</Link>
          <Link className="hover:underline" href="/liked">Liked</Link>
          <a className="hover:underline" href="https://www.toyota.com/" target="_blank" rel="noreferrer">Toyota</a>
        </div>
      </nav>
    </header>
  );
}