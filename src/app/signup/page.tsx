'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignupPage() {
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
    const confirm = (formData.get('confirm') as string)?.trim();

    if (!email || !password || !confirm) {
      setError('Fill out all fields to create your account.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const rawAccounts = window.localStorage.getItem('tt-accounts');
    let accounts: Record<string, string> = {};
    if (rawAccounts) {
      try {
        accounts = JSON.parse(rawAccounts);
      } catch {
        setError('Unable to read your stored accounts. Clear storage and try again.');
        setIsSubmitting(false);
        return;
      }
    }

    if (accounts[email]) {
      setError('That email is already registered. Try signing in.');
      setIsSubmitting(false);
      return;
    }

    const updatedAccounts = { ...accounts, [email]: password };
    window.localStorage.setItem('tt-accounts', JSON.stringify(updatedAccounts));
    window.localStorage.setItem('tt-auth', JSON.stringify({ user: email, ts: Date.now() }));
    router.push(nextPath);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center">
        <section className="flex-1">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="h-3 w-3 rounded-full bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
            ToyotaTinder
          </Link>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">Create your driver profile</h1>
          <p className="mt-4 text-lg text-slate-600">
            Spin up a ToyotaTinder account to sync your preferences, unlock swipe mode, and keep your pit crew
            in lockstep across devices.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Store custom budgets, body styles, and features.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Sync likes so you never lose track of standouts.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Seamless hand-off into swipe and comparison flows.
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
                id="signup-email"
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
                id="signup-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <div className="label">Confirm Password</div>
              <input
                className="input"
                name="confirm"
                id="signup-confirm"
                type="password"
                placeholder="repeat password"
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating profile…' : 'Create account'}
            </button>
            <p className="text-center text-sm text-slate-600">
              Already have a login?{' '}
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-red-600 hover:text-red-500">
                Sign in
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
