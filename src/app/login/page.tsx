'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = (formData.get('password') as string)?.trim();

    if (!email || !password) {
      setError('Enter both an email and password to continue.');
      return;
    }

    setIsSubmitting(true);
    const rawAccounts = window.localStorage.getItem('tt-accounts');
    if (!rawAccounts) {
      setError('No account found for that email. Create one to get started.');
      setIsSubmitting(false);
      return;
    }

    try {
      const accounts: Record<string, string> = JSON.parse(rawAccounts);
      if (accounts[email] !== password) {
        setError('Invalid credentials. Double-check your email and password.');
        setIsSubmitting(false);
        return;
      }
    } catch {
      setError('Something went wrong loading your account.');
      setIsSubmitting(false);
      return;
    }

    window.localStorage.setItem('tt-auth', JSON.stringify({ user: email, ts: Date.now() }));
    router.push(nextPath);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <NavBar />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center">
        <section className="flex-1">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="h-3 w-3 rounded-full bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
            ToyotaTinder
          </Link>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
            Log in to start matching
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Sign in with your pit-crew credentials to unlock tailored Toyota matches, swipe through curated lineups, and keep track of every car that sparks joy.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Personalized recommendations powered by your inputs.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Save likes and revisit every favorite ride.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Export-ready summaries when you&apos;re ready to buy.
            </li>
          </ul>
        </section>

        <section className="flex-1">
          <form onSubmit={handleSubmit} className="card space-y-6">
            <div>
              <div className="label">Email</div>
              <input
                className="input"
                name="email"
                id="email"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="label">Password</div>
              <input
                className="input"
                name="password"
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Checking credentials…' : 'Log in'}
            </button>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Access granted upon validation
            </p>
            <p className="text-center text-sm text-slate-600">
              No pit-pass yet?{' '}
              <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-red-600 hover:text-red-500">
                Create an account
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
