'use client';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import CTA from '@/components/CTA';
import StackedHighlights from '@/components/StackedHighlights';

const FLOW_STEPS = [
  { title: 'Dial-in your vibe', detail: 'Budget, range, lifestyle cues, even color cravings.' },
  { title: 'Gemini narrows it down', detail: 'Specs + market pricing ranked into a swipeable stack.' },
  { title: 'Swipe the curated deck', detail: 'Tap like or pass to train the results in real time.' },
  { title: 'Save & share favorites', detail: 'Export the shortlist or revisit it whenever you want.' },
];

export default function Page() {
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

  return (
    <main>
      <NavBar />
      <CTA isAuthenticated={isAuthenticated} />

      <section className="relative -mt-6 mx-auto max-w-5xl px-4 pb-24 pt-16 md:pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/90 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute -left-10 top-10 h-32 w-32 rounded-full bg-rose-100 blur-[80px]" aria-hidden />
        <div className="pointer-events-none absolute bottom-6 right-0 h-36 w-36 rounded-full bg-orange-100 blur-[90px]" aria-hidden />

        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-[30px] border border-red-100/60 bg-white/90 p-6 shadow-[0_25px_75px_rgba(15,23,42,0.08)] backdrop-blur-md">
            <div className="absolute -top-16 right-0 h-32 w-32 rounded-full bg-red-200/60 blur-3xl" aria-hidden />
            <p className="animate-fade-up text-sm font-semibold uppercase tracking-[0.3em] text-red-500/80" style={{ animationDelay: '0.05s' }}>
              How it works
            </p>
            <h2 className="animate-fade-up mt-3 text-3xl font-bold text-slate-900" style={{ animationDelay: '0.15s' }}>
              The ToyotaTinder flow
            </h2>

            <ol className="relative z-10 mt-6 space-y-4">
              {FLOW_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="animate-fade-up rounded-2xl border border-red-50 bg-white/90 p-4 shadow-sm ring-1 ring-red-100/70"
                  style={{ animationDelay: `${0.25 + index * 0.1}s` }}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-400 text-sm font-semibold text-white shadow-lg shadow-red-200/70">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                      <p className="text-sm text-slate-600">{step.detail}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <StackedHighlights className="mt-3 md:mt-0 max-w-md w-full mx-auto" />
        </div>
      </section>
    </main>
  );
}
