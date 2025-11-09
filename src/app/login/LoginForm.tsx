'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginFormProps = {
  nextPath: string;
};

export default function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
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
        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account yet?{' '}
          <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-red-600 hover:text-red-500">
            Create an account
          </Link>
        </p>
      </form>
    </section>
  );
}
