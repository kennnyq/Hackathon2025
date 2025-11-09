'use client';
import NavBar from '@/components/NavBar';
import { loadResults, loadResultsMeta, addLike, saveResults, loadUserFilter } from '@/lib/likes';
import { Car, RecommendationResponse, UserFilter } from '@/lib/types';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, MotionProps } from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import CarCard from '@/components/CarCard';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useSessionId } from '@/hooks/useSessionId';

type SwipeMeta = { id: Car['Id'] | null; dir: 'left' | 'right' };
const STACK_LIMIT = 3;
const PRELOAD_THRESHOLD = 5;
const ENTER_TRANSITION: MotionProps['transition'] = { type: 'spring', stiffness: 240, damping: 28 };

export default function SwipePage() {
  useRequireAuth();
  const sessionId = useSessionId();
  const [cars, setCars] = useState<Car[]>([]);
  const [index, setIndex] = useState(0);
  const [swipeMeta, setSwipeMeta] = useState<SwipeMeta>({ id: null, dir: 'right' });
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<UserFilter | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const lastFetchIndexRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      const storedCars = loadResults();
      setCars(storedCars);
      seenIdsRef.current = new Set(storedCars.map(car => car.Id));
      setUserFilter(loadUserFilter());
      const meta = loadResultsMeta();
      const warningMessage = meta?.warning;
      setWarning(warningMessage);
      setWarningToast(warningMessage ?? null);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!warningToast || typeof window === 'undefined') return;
    const timeout = window.setTimeout(() => setWarningToast(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [warningToast]);

  const sendFeedback = useCallback((listingId: number, feedback: 'like' | 'reject') => {
    if (!sessionId) return;
    void fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, listingId, feedback }),
    }).catch(() => undefined);
  }, [sessionId]);

  const current = cars[index];
  const remaining = Math.max(cars.length - index, 0);
  const isComplete = index >= cars.length;

  const fetchMore = useCallback(async (limit = 10) => {
    if (!userFilter || !sessionId) return;
    setIsFetchingMore(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userFilter, limit }),
      });
      if (!res.ok) throw new Error('Unable to refresh recommendations');
      const data: RecommendationResponse = await res.json();
      if (!Array.isArray(data.results)) throw new Error('Recommendation response malformed');
      const additions: Car[] = [];
      data.results.forEach(result => {
        if (seenIdsRef.current.has(result.Id)) return;
        seenIdsRef.current.add(result.Id);
        const { generated_description, score, ...rest } = result;
        additions.push({
          ...rest,
          FitDescription: generated_description,
          Score: score,
        });
      });
      if (additions.length) {
        setCars(prev => {
          const merged = [...prev, ...additions];
          saveResults(merged, null);
          return merged;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to refresh matches';
      setFetchError(message);
    } finally {
      setIsFetchingMore(false);
    }
  }, [sessionId, userFilter]);

  function onSwipe(dir: 'left' | 'right') {
    if (!current) return;
    if (dir === 'right') addLike(current);
    sendFeedback(current.Id, dir === 'right' ? 'like' : 'reject');
    setSwipeMeta({ id: current.Id, dir });
  }

  useEffect(() => {
    if (cars.length || !userFilter || isFetchingMore) return;
    fetchMore();
  }, [cars.length, userFilter, isFetchingMore, fetchMore]);

  useEffect(() => {
    if (!userFilter || isFetchingMore) return;
    if (!cars.length) return;
    const remaining = cars.length - index;
    if (remaining > 0 && remaining <= PRELOAD_THRESHOLD) {
      if (lastFetchIndexRef.current === index) return;
      lastFetchIndexRef.current = index;
      fetchMore();
    }
  }, [cars.length, index, userFilter, isFetchingMore, fetchMore]);

  useEffect(() => {
    if (!swipeMeta.id) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      setIndex(i => Math.min(i + 1, cars.length));
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [swipeMeta.id, cars.length]);

  const handleKeepGoing = () => {
    lastFetchIndexRef.current = index;
    void fetchMore();
  };

  if (!cars.length && isFetchingMore) {
    return (
      <main>
        <NavBar />
        <section className="mx-auto max-w-3xl px-4 pt-12">
          <div className="card">
            <h1 className="text-2xl font-bold">Warming up matches…</h1>
            <p className="text-slate-600 mt-2">We&apos;re ranking Toyotas that fit your vibe.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!cars.length) {
    return (
      <main>
        <NavBar />
        <section className="mx-auto max-w-3xl px-4 pt-12">
          <div className="card">
            <h1 className="text-2xl font-bold">No matches yet</h1>
            <p className="text-slate-600 mt-2">Go to the Find page and submit your preferences.</p>
            <div className="mt-4"><Link href="/find" className="btn btn-primary">Find cars</Link></div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <NavBar />
        <AnimatePresence>
          {warningToast && (
            <motion.div
              key="warning-toast"
              className="pointer-events-none fixed inset-x-0 top-24 z-30 flex justify-center px-4"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="pointer-events-auto max-w-md rounded-2xl border border-amber-200 bg-white/95 px-4 py-3 text-sm font-medium text-amber-700 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                {warningToast}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <section className="mx-auto max-w-3xl px-4 pt-8 pb-20">
          {warning && (
            <div className="card border-amber-200 bg-amber-50">
              <div className="font-semibold text-amber-700">Heads up</div>
              <div className="text-sm text-slate-600">{warning}</div>
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <Deck
              cars={cars}
              index={index}
              onSwipe={onSwipe}
              swipeMeta={swipeMeta}
              resetSwipeMeta={() => setSwipeMeta({ id: null, dir: 'right' })}
            />
          </div>
          <AnimatePresence>
            {!isComplete && (
              <motion.div
                key="controls"
                className="mt-10 flex items-center justify-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <button className="btn btn-outline" onClick={() => onSwipe('left')}>Skip</button>
                <button className="btn btn-primary" onClick={() => onSwipe('right')}>Like</button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isComplete && (
              <motion.p
                key="remaining"
                className="text-center text-slate-500 mt-3 text-sm"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {remaining} remaining
              </motion.p>
            )}
          </AnimatePresence>
          {fetchError && !isComplete && (
            <p className="text-center text-sm text-red-500 mt-3">{fetchError}</p>
          )}
          {isFetchingMore && (
            <p className="text-center text-xs text-slate-500 mt-2">Refreshing matches…</p>
          )}

        </section>
      </motion.main>
      <AnimatePresence>
        {isComplete && (
          <motion.div
            key="complete-card"
            className="fixed inset-0 z-40 flex items-center justify-center px-4"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="card text-center shadow-2xl max-w-sm w-full bg-white">
              <h2 className="text-2xl font-bold">All done!</h2>
              <p className="text-slate-600 mt-2">View your liked cars or keep adding fresh matches.</p>
              <div className="mt-5 flex gap-3 justify-center">
                <Link href="/liked" className="btn btn-primary">View Liked</Link>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleKeepGoing}
                  disabled={isFetchingMore || !userFilter || !sessionId}
                >
                  Keep going
                </button>
              </div>
              {fetchError && (
                <p className="text-sm text-red-500 mt-3">{fetchError}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Deck({
  cars,
  index,
  onSwipe,
  swipeMeta,
  resetSwipeMeta,
}: {
  cars: Car[];
  index: number;
  onSwipe: (dir: 'left' | 'right') => void;
  swipeMeta: SwipeMeta;
  resetSwipeMeta: () => void;
}) {
  const remaining = Math.max(cars.length - index, 0);
  const visibleStackSize = Math.min(STACK_LIMIT, remaining);
  const stack = cars.slice(index, index + visibleStackSize);
  if (!stack.length) return <div className="text-slate-500">No more cards</div>;

  return (
    <div className="relative h-[580px] w-[340px] sm:w-[360px]">
      <AnimatePresence initial={false} onExitComplete={resetSwipeMeta}>
        {stack.map((car, stackIndex) => {
          const isTop = stackIndex === 0;
          const gradient = gradientForId(car.Id);
          const rotation = rotationForCard(car.Id, stackIndex);
          const globalPosition = index + stackIndex;
          const zIndex = cars.length - globalPosition;
          const exitDirection = swipeMeta.id === car.Id ? swipeMeta.dir : 'right';
          const isExiting = swipeMeta.id === car.Id;

          const initial = { opacity: 0, y: 32, scale: 1.04 };
          const animateProps = {
            opacity: 1,
            x: 0,
            y: stackIndex * 12,
            scale: 1 - stackIndex * 0.025,
          };
          const exitProps: MotionProps['exit'] = isTop
            ? {
                x: exitDirection === 'right' ? 360 : -360,
                opacity: 0,
                transition: {
                  x: { duration: 0.22, ease: 'easeInOut' },
                  opacity: { delay: 0.08, duration: 0.12, ease: 'easeInOut' },
                },
              }
            : {
                opacity: 0,
                scale: 0.92,
                transition: { duration: 0.18, ease: 'easeInOut' },
              };
          const initialRotation = rotation - 4;

          return (
            <DeckCard
              key={car.Id}
              car={car}
              gradient={gradient}
              isTop={isTop}
              isInteractive
              initialProps={initial}
              animateProps={animateProps}
              exitProps={exitProps}
              transitionProps={ENTER_TRANSITION}
              zIndex={zIndex}
              onSwipe={onSwipe}
              initialRotation={initialRotation}
              targetRotation={rotation}
              exitDirection={exitDirection}
              isExiting={isExiting && isTop}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

type DeckCardProps = {
  car: Car;
  gradient: string;
  isTop: boolean;
  isInteractive: boolean;
  initialProps: MotionProps['initial'];
  animateProps: MotionProps['animate'];
  exitProps: MotionProps['exit'];
  transitionProps: MotionProps['transition'];
  zIndex: number;
  onSwipe: (dir: 'left' | 'right') => void;
  initialRotation: number;
  targetRotation: number;
  exitDirection: 'left' | 'right';
  isExiting: boolean;
};

function DeckCard({
  car,
  gradient,
  isTop,
  isInteractive,
  initialProps,
  animateProps,
  exitProps,
  transitionProps,
  zIndex,
  onSwipe,
  initialRotation,
  targetRotation,
  exitDirection,
  isExiting,
}: DeckCardProps) {
  const dragTilt = useMotionValue<number>(0);
  const baseRotation = useMotionValue<number>(initialRotation);
  const combinedRotate = useTransform([baseRotation, dragTilt], ([base, drag]) => (base as number) + (drag as number));

  useEffect(() => {
    const target = isExiting ? targetRotation + (exitDirection === 'right' ? 22 : -22) : targetRotation;
    const controls = animate(baseRotation, target, isExiting
      ? { duration: 0.22, ease: 'easeInOut' }
      : { type: 'spring', stiffness: 260, damping: 26 });
    return () => controls.stop();
  }, [baseRotation, targetRotation, exitDirection, isExiting]);

  const resetDragTilt = useCallback(() => {
    animate(dragTilt, 0, { type: 'spring', stiffness: 260, damping: 20 });
  }, [dragTilt]);

  return (
    <motion.div
      layout
      className="absolute inset-0 flex justify-center"
      style={{ zIndex, pointerEvents: isInteractive && isTop ? 'auto' : 'none', rotate: combinedRotate }}
      drag={isInteractive && isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDrag={(e, info) => {
        dragTilt.set(clamp(info.offset.x / 18, -18, 18));
      }}
      onDragEnd={(e, info) => {
        const offsetX = info.offset.x;
        if (offsetX > 120) {
          onSwipe('right');
          return;
        }
        if (offsetX < -120) {
          onSwipe('left');
          return;
        }
        resetDragTilt();
      }}
      initial={initialProps}
      animate={animateProps}
      exit={exitProps}
      transition={transitionProps}
    >
      <CarCard
        car={car}
        className={[
          'bg-linear-to-br!',
          gradient,
          'border-transparent!',
          isTop
            ? 'shadow-[0_25px_45px_rgba(244,63,94,0.25)]'
            : 'opacity-90 shadow-[0_20px_35px_rgba(15,23,42,0.12)]',
        ]
          .filter(Boolean)
          .join(' ')}
      />
    </motion.div>
  );
}

const CARD_GRADIENTS = [
  'from-rose-50 via-red-50 to-amber-100',
  'from-orange-50 via-rose-50 to-pink-100',
  'from-red-50 via-white to-rose-100',
  'from-amber-50 via-rose-50 to-orange-100',
  'from-rose-100 via-orange-50 to-white',
];

function gradientForId(id: Car['Id']) {
  const hash = hashString(String(id));
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length];
}

function rotationForCard(id: Car['Id'], stackIndex: number) {
  const base = (hashString(String(id)) % 8) - 4;
  return base + stackIndex * 2;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
function setWarning(warningMessage: string | undefined) {
  throw new Error('Function not implemented.');
}

