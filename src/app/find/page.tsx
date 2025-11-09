'use client';
import NavBar from '@/components/NavBar';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Preferences, AnalyzeResponse } from '@/lib/types';
import { saveResults } from '@/lib/likes';
import { AnimatePresence, motion } from 'framer-motion';

const LOADING_STEPS = [
  'Pinging Carvana for fresh Toyota arrivals…',
  'Checking CarMax certified inventory in your radius…',
  'Sweeping AutoTrader + dealer feeds for wild cards…',
  'Analyzing your budget, fuel, and mileage preferences…',
  'Scoring Toyotas and packing the swipe deck…',
] as const;
const MIN_LOADING_MS = 1200;
const SUCCESS_DEMO_DELAY_MS = 850;
const STEP_BASE_MS = 1400;
const STEP_JITTER_MS = 350;

export default function FindPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const sequenceControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    sequenceControllerRef.current?.abort();
  }, []);

  function beginSequence() {
    sequenceControllerRef.current?.abort();
    const controller = new AbortController();
    sequenceControllerRef.current = controller;
    const promise = runLoadingSequence(controller.signal)
      .catch(err => {
        if (err?.name !== 'AbortError') throw err;
      })
      .finally(() => {
        if (sequenceControllerRef.current === controller) {
          sequenceControllerRef.current = null;
        }
      });
    return promise as Promise<void>;
  }

  async function runLoadingSequence(signal: AbortSignal) {
    for (let i = 0; i < LOADING_STEPS.length; i += 1) {
      if (signal.aborted) throw createAbortError();
      setActiveStep(i);
      const isLast = i === LOADING_STEPS.length - 1;
      if (!isLast) {
        const delay = STEP_BASE_MS + Math.random() * STEP_JITTER_MS;
        await sleep(delay, signal);
      }
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const maxMileageRaw = Number(fd.get('maxMileage'));
    const prefs: Preferences = {
      budget: Number(fd.get('budget') || 0),
      used: (fd.get('used') as Preferences['used'] | null) ?? 'Any',
      location: String(fd.get('location') || ''),
      fuelType: (fd.get('fuelType') as Preferences['fuelType'] | null) ?? 'Any',
      maxMileage: Number.isFinite(maxMileageRaw) && maxMileageRaw > 0 ? maxMileageRaw : null,
      notes: String(fd.get('notes') || ''),
    };
    setLoading(true);
    const sequencePromise = beginSequence();
    const startedAt = Date.now();
    let shouldResetLoading = true;
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Failed to analyze');
      const data: AnalyzeResponse = await res.json();
      saveResults(data.cars, { warning: data.warning, reasoning: data.reasoning });
      await Promise.all([
        sequencePromise,
        sleep(SUCCESS_DEMO_DELAY_MS),
      ]);
      router.push('/swipe');
      shouldResetLoading = false;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message || 'Something went wrong');
    } finally {
      if (shouldResetLoading) {
        sequenceControllerRef.current?.abort();
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_LOADING_MS) {
          await sleep(MIN_LOADING_MS - elapsed);
        }
        setLoading(false);
      }
    }
  }

  return (
    <main>
      <NavBar />
      <section className="mx-auto max-w-3xl px-4 pt-12 pb-24">
        <h1 className="text-3xl font-bold">Your preferences</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 card">
          <div>
            <label className="label" htmlFor="budget">Budget (USD)</label>
            <input className="input" id="budget" name="budget" type="number" min={0} placeholder="30000" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="used">New / Used</label>
              <select className="select" id="used" name="used" defaultValue="Any">
                <option>Any</option>
                <option>New</option>
                <option>Used</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="fuelType">Fuel Type</label>
              <select className="select" id="fuelType" name="fuelType" defaultValue="Any">
                <option>Any</option>
                <option>Hybrid</option>
                <option>EV</option>
                <option>Fuel</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="maxMileage">Max Mileage</label>
              <input className="input" id="maxMileage" name="maxMileage" type="number" min={0} step={5000} placeholder="60000" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input className="input" id="location" name="location" placeholder="Dallas, TX" />
          </div>
          <div>
            <label className="label" htmlFor="notes">Additional details</label>
            <textarea className="textarea" id="notes" name="notes" rows={4} placeholder="Must fit 2 car seats, highway commute, AWD preferred..." />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button disabled={loading} className="btn btn-primary" type="submit">
              {loading ? 'Analyzing…' : 'Find Matches'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      </section>
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen key="loading" activeStep={activeStep} />}
      </AnimatePresence>
    </main>
  );
}

function LoadingScreen({ activeStep }: { activeStep: number }) {
  const message = LOADING_STEPS[activeStep];

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex h-full flex-col items-center justify-center px-4">
        <motion.div
          className="w-full max-w-lg rounded-3xl border border-red-100 bg-white/85 p-7 shadow-[0_25px_65px_rgba(244,63,94,0.16)]"
          initial={{ opacity: 0, y: 22, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="h-14 w-14 rounded-full border-[3px] border-red-100 border-t-red-500"
              aria-hidden="true"
              animate={{ rotate: 360, scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 1.3, ease: [0.65, 0, 0.35, 1] }}
            />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.4em] text-red-500">Analyzing</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Building your Toyota swipe deck…</h2>
          </div>
          <div className="mt-6 w-full" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={message}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="text-base font-medium text-slate-400 text-center"
              >
                {message}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function sleep(ms: number, signal?: AbortSignal) {
  if (!signal) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError());
      return;
    }

    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      reject(createAbortError());
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function createAbortError() {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}
