'use client';
import NavBar from '@/components/NavBar';
import CarCard from '@/components/CarCard';
import { loadResults, loadResultsMeta, addLike } from '@/lib/likes';
import { Car } from '@/lib/types';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function SwipePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [index, setIndex] = useState(0);
  const [warning, setWarning] = useState<string | undefined>();

  useEffect(() => {
    setCars(loadResults());
    const meta = loadResultsMeta();
    setWarning(meta?.warning);
  }, []);

  const current = cars[index];
  const remaining = cars.length - index - 1;

  function onSwipe(dir: 'left' | 'right') {
    if (!current) return;
    if (dir === 'right') addLike(current.Id);
    setIndex(i => Math.min(i + 1, cars.length));
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
          <Deck car={current} onSwipe={onSwipe} />
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
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
    </main>
  );
}

function Deck({ car, onSwipe }: { car?: Car; onSwipe: (dir: 'left'|'right') => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -80, 0, 80, 200], [0.2, 0.7, 1, 0.7, 0.2]);

  if (!car) return <div className="text-slate-500">No more cards</div>;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={car.Id}
        className="relative"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={(e, info) => {
          if (info.offset.x > 120) onSwipe('right');
          else if (info.offset.x < -120) onSwipe('left');
          else x.set(0);
        }}
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: -20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <CarCard car={car} />
        <div className="absolute -top-2 -left-2 text-xs text-slate-500">Drag → Like</div>
        <div className="absolute -top-2 -right-2 text-xs text-slate-500">Drag ← Skip</div>
      </motion.div>
    </AnimatePresence>
  );
}
