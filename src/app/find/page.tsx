'use client';
import NavBar from '@/components/NavBar';
import AuthGate from '@/components/AuthGate';
import { useEffect, useRef, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Preferences, AnalyzeResponse } from '@/lib/types';
import { saveResults } from '@/lib/likes';
import { AnimatePresence, motion } from 'framer-motion';

const LOADING_STEPS = [
  'Locking in your price window + condition…',
  'Sweeping dealer feeds for the body styles you tapped…',
  'Applying year and mileage guardrails…',
  'Matching MPG + fuel-type requests to each lead…',
  'Scoring Toyotas and packing the swipe deck…',
] as const;
const MIN_LOADING_MS = 1200;
const SUCCESS_DEMO_DELAY_MS = 850;
const STEP_BASE_MS = 1400;
const STEP_JITTER_MS = 350;
const CONDITION_OPTIONS: Preferences['used'][] = ['Any', 'New', 'Used'];
const BODY_TYPE_OPTIONS = ['SUV', 'Sedan', 'Truck', 'Minivan', 'Hatchback', 'Wagon', 'Coupe'] as const;
const FUEL_TYPE_OPTIONS = ['Gas', 'Hybrid', 'Electric'] as const;
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_ZIP = '75080';
type SectionKey = 'price' | 'body' | 'efficiency';

export default function FindPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    price: true,
    body: false,
    efficiency: false,
  });
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

  const toggleSection = (key: SectionKey) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
    const bodyTypes = fd.getAll('bodyTypes').map(value => value.toString()) as Preferences['bodyTypes'];
    const fuelTypes = fd.getAll('fuelTypes').map(value => value.toString()) as Preferences['fuelTypes'];
    const prefs: Preferences = {
      zipCode: parseZip(fd.get('zipCode')),
      priceMin: parseFormNumber(fd.get('priceMin')),
      priceMax: parseFormNumber(fd.get('priceMax')),
      used: (fd.get('used') as Preferences['used'] | null) ?? 'Any',
      bodyTypes,
      yearMin: parseFormNumber(fd.get('yearMin')),
      yearMax: parseFormNumber(fd.get('yearMax')),
      mileageMin: parseFormNumber(fd.get('mileageMin')),
      mileageMax: parseFormNumber(fd.get('mileageMax')),
      seatsMin: parseFormNumber(fd.get('seatsMin')),
      seatsMax: parseFormNumber(fd.get('seatsMax')),
      fuelTypes,
      mpgMin: parseFormNumber(fd.get('mpgMin')),
      mpgMax: parseFormNumber(fd.get('mpgMax')),
      notes: String(fd.get('notes') || '').trim(),
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
    <AuthGate>
      <main>
        <NavBar />
        <section className="mx-auto max-w-3xl px-4 pt-12 pb-24">
          <h1 className="text-3xl font-bold">Your preferences</h1>
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6">
            <section className="card space-y-5">
              <div className="space-y-4">
                <PreferenceSection
                  id="price"
                  title="Price & condition"
                  isOpen={openSections.price}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="label" htmlFor="priceMin">Price from</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">$</span>
                          <input className="input pl-8" id="priceMin" name="priceMin" type="number" min={0} step={1000} placeholder="30000" />
                        </div>
                      </div>
                      <div>
                        <label className="label" htmlFor="priceMax">Price to</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">$</span>
                          <input className="input pl-8" id="priceMax" name="priceMax" type="number" min={0} step={1000} placeholder="50000" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="label mb-2">Condition</p>
                      <div role="group" aria-label="Condition options" className="flex flex-wrap gap-2">
                        {CONDITION_OPTIONS.map(option => (
                          <label key={option} className="cursor-pointer">
                            <input className="sr-only peer" type="radio" name="used" value={option} defaultChecked={option === 'Any'} />
                            <span className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 peer-checked:border-red-300 peer-checked:bg-red-50 peer-checked:text-red-600">
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </PreferenceSection>

                <PreferenceSection
                  id="body"
                  title="Body style, year & seating"
                  isOpen={openSections.body}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="label mb-2">Body type</p>
                      <div role="group" aria-label="Body type options" className="flex flex-wrap gap-2">
                        {BODY_TYPE_OPTIONS.map(type => (
                          <label key={type} className="cursor-pointer">
                            <input className="sr-only peer" type="checkbox" name="bodyTypes" value={type} />
                            <span className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 peer-checked:border-red-300 peer-checked:bg-red-50 peer-checked:text-red-600">
                              {type}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="label" htmlFor="yearMin">Year from</label>
                        <input className="input" id="yearMin" name="yearMin" type="number" min={2008} max={CURRENT_YEAR} placeholder="2018" />
                      </div>
                      <div>
                        <label className="label" htmlFor="yearMax">Year to</label>
                        <input className="input" id="yearMax" name="yearMax" type="number" min={2008} max={CURRENT_YEAR} placeholder={CURRENT_YEAR.toString()} />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="label" htmlFor="seatsMin">Seats from</label>
                        <input className="input" id="seatsMin" name="seatsMin" type="number" min={2} max={9} placeholder="5" />
                      </div>
                      <div>
                        <label className="label" htmlFor="seatsMax">Seats to</label>
                        <input className="input" id="seatsMax" name="seatsMax" type="number" min={2} max={9} placeholder="8" />
                      </div>
                    </div>
                  </div>
                </PreferenceSection>

                <PreferenceSection
                  id="efficiency"
                  title="Mileage, fuel & MPG"
                  isOpen={openSections.efficiency}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="label" htmlFor="mileageMin">Mileage from</label>
                        <input className="input" id="mileageMin" name="mileageMin" type="number" min={0} step={5000} placeholder="15000" />
                      </div>
                      <div>
                        <label className="label" htmlFor="mileageMax">Mileage to</label>
                        <input className="input" id="mileageMax" name="mileageMax" type="number" min={0} step={5000} placeholder="60000" />
                      </div>
                    </div>
                    <div>
                      <p className="label mb-2">Fuel type</p>
                      <div role="group" aria-label="Fuel type options" className="flex flex-wrap gap-2">
                        {FUEL_TYPE_OPTIONS.map(type => (
                          <label key={type} className="cursor-pointer">
                            <input className="sr-only peer" type="checkbox" name="fuelTypes" value={type} />
                            <span className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 peer-checked:border-red-300 peer-checked:bg-red-50 peer-checked:text-red-600">
                              {type}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="label" htmlFor="mpgMin">MPG from</label>
                        <input className="input" id="mpgMin" name="mpgMin" type="number" min={0} max={80} placeholder="30" />
                      </div>
                      <div>
                        <label className="label" htmlFor="mpgMax">MPG to</label>
                        <input className="input" id="mpgMax" name="mpgMax" type="number" min={0} max={80} placeholder="45" />
                      </div>
                    </div>
                    <div>
                      <label className="label" htmlFor="zipCode">Your zip code</label>
                      <div className="grid gap-2 md:grid-cols-[160px]">
                        <input
                          className="input md:max-w-xs"
                          id="zipCode"
                          name="zipCode"
                          type="text"
                          inputMode="numeric"
                          pattern="\\d{5}"
                          placeholder={DEFAULT_ZIP}
                          maxLength={5}
                        />
                      </div>
                    </div>
                  </div>
                </PreferenceSection>
              </div>

              <div>
                <label className="label" htmlFor="notes">What else should we know?</label>
                <textarea
                  className="textarea"
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Give a large, spacious family car that would be good for roadtrips."
                />
              </div>
            </section>

            <div className="flex flex-col items-center gap-2 text-center">
              <button disabled={loading} className="btn btn-primary px-8" type="submit">
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
    </AuthGate>
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

type PreferenceSectionProps = {
  id: SectionKey;
  title: string;
  isOpen: boolean;
  onToggle: (key: SectionKey) => void;
  children: ReactNode;
};

function PreferenceSection({ id, title, isOpen, onToggle, children }: PreferenceSectionProps) {
  const contentId = `${id}-content`;
  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-4 shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-6 text-left"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

function parseFormNumber(value: FormDataEntryValue | null) {
  if (value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseZip(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (/^\d{5}$/.test(trimmed)) return trimmed;
  return null;
}
