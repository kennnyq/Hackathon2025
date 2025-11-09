'use client';
import NavBar from '@/components/NavBar';
import { loadResults, loadResultsMeta, addLike } from '@/lib/likes';
import { Car } from '@/lib/types';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, MotionProps } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CarCard from '@/components/CarCard';
import { useRequireAuth } from '@/hooks/useRequireAuth';

type SwipeMeta = { id: Car['Id'] | null; dir: 'left' | 'right' };
const STACK_LIMIT = 3;
const ENTER_TRANSITION: MotionProps['transition'] = { type: 'spring', stiffness: 240, damping: 28 };

export default function SwipePage() {
  useRequireAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [index, setIndex] = useState(0);
  const [warning, setWarning] = useState<string | undefined>();
  const [swipeMeta, setSwipeMeta] = useState<SwipeMeta>({ id: null, dir: 'right' });
  const [warningToast, setWarningToast] = useState<string | null>(null);

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

  useEffect(() => {
    if (!warning) return;
    setWarningToast(warning);
  }, [warning]);

  useEffect(() => {
    if (!warningToast || typeof window === 'undefined') return;
    const timeout = window.setTimeout(() => setWarningToast(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [warningToast]);

  const current = cars[index];
  const remaining = Math.max(cars.length - index, 0);

  function onSwipe(dir: 'left' | 'right') {
    if (!current) return;
    if (dir === 'right') addLike(current);
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
          <div className="mt-6 flex justify-center">
            <Deck
              cars={cars}
              index={index}
              onSwipe={onSwipe}
              swipeMeta={swipeMeta}
              resetSwipeMeta={() => setSwipeMeta({ id: null, dir: 'right' })}
            />
          </div>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button className="btn btn-outline" onClick={() => onSwipe('left')}>Skip</button>
            <button className="btn btn-primary" onClick={() => onSwipe('right')}>Like</button>
          </div>
          <p className="text-center text-slate-500 mt-3 text-sm">{remaining} remaining</p>

          {index >= cars.length && (
            <div className="card mt-8 text-center">
              <h2 className="text-xl font-semibold">All done!</h2>
              <p className="text-slate-600 mt-1">View your liked cars or try again.</p>
              <div className="mt-4 flex gap-3 justify-center">
                <Link href="/liked" className="btn btn-primary">View Liked</Link>
                <Link href="/find" className="btn btn-outline">Run again</Link>
              </div>
            </div>
          )}
        </section>
      </motion.main>
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
