'use client';
import NavBar from '@/components/NavBar';
import { loadResults, loadResultsMeta, addLike } from '@/lib/likes';
import { Car } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import CarCard from '@/components/CarCard';
import AuthGate from '@/components/AuthGate';

type SwipeMeta = { id: Car['Id'] | null; dir: 'left' | 'right' };

export default function SwipePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [index, setIndex] = useState(0);
  const [warning, setWarning] = useState<string | undefined>();
  const [swipeMeta, setSwipeMeta] = useState<SwipeMeta>({ id: null, dir: 'right' });

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      setCars(loadResults());
      const meta = loadResultsMeta();
      setWarning(meta?.warning);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  const current = cars[index];
  const remaining = Math.max(cars.length - index, 0);
  const isComplete = index >= cars.length;

  function onSwipe(dir: 'left' | 'right') {
    if (!current) return;
    if (dir === 'right') addLike(current.Id);
    setSwipeMeta({ id: current.Id, dir });
  }

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

  if (!cars.length) {
    return (
      <AuthGate>
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
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <main>
        <NavBar />
        <section className="mx-auto max-w-3xl px-4 pt-8 pb-20">
          {warning && (
            <div className="card border-amber-200 bg-amber-50">
              <div className="font-semibold text-amber-700">Heads up</div>
              <div className="text-slate-600 text-sm">{warning}</div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center">
            <AnimatePresence initial={false}>
              {!isComplete && (
                <motion.div
                  key="deck-shell"
                  className="relative rounded-[44px] border border-white/60 bg-white/90 p-6 shadow-[0_40px_90px_rgba(15,23,42,0.25)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl"
                  initial={{ opacity: 0, scale: 0.96, y: 25 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -35 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                >
                  <div className="pointer-events-none absolute inset-3 rounded-[38px] border border-slate-200/80 shadow-inner shadow-white/40" />
                  <Deck
                    cars={cars}
                    index={index}
                    onSwipe={onSwipe}
                    swipeMeta={swipeMeta}
                    resetSwipeMeta={() => setSwipeMeta({ id: null, dir: 'right' })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
                  <p className="text-slate-600 mt-2">View your liked cars or try again.</p>
                  <div className="mt-5 flex gap-3 justify-center">
                    <Link href="/liked" className="btn btn-primary">View Liked</Link>
                    <Link href="/find" className="btn btn-outline">Run again</Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </AuthGate>
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
  const stack = cars.slice(index, index + 3);
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

          return (
            <motion.div
              key={car.Id}
              layout
              className="absolute inset-0 flex justify-center"
              style={{ zIndex, pointerEvents: isTop ? 'auto' : 'none' }}
              drag={isTop ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={(e, info) => {
                if (info.offset.x > 120) onSwipe('right');
                else if (info.offset.x < -120) onSwipe('left');
              }}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{
                opacity: 1,
                y: stackIndex * 10,
                scale: 1 - stackIndex * 0.02,
                rotate: rotation,
              }}
              exit={
                isTop
                  ? {
                      x: exitDirection === 'right' ? 420 : -420,
                      rotate: exitDirection === 'right' ? 16 : -16,
                      opacity: 0,
                      transition: {
                        x: { duration: 0.45, ease: 'easeInOut' },
                        rotate: { duration: 0.45, ease: 'easeInOut' },
                        opacity: { delay: 0.2, duration: 0.25, ease: 'easeInOut' },
                      },
                    }
                  : {
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.2 },
                    }
              }
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              <CarCard
                car={car}
                className={[
                  '!bg-gradient-to-br',
                  gradient,
                  '!border-transparent',
                  isTop
                    ? 'shadow-[0_25px_45px_rgba(244,63,94,0.25)]'
                    : 'opacity-90 shadow-[0_20px_35px_rgba(15,23,42,0.12)]',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
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
