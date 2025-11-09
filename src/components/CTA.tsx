'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const chipVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.45 + index * 0.08, ease: 'easeOut' },
  }),
};

const quickHits = [
  'Live market data',
  'Gemini-ranked deck',
  'Tap to export likes',
];

const stats = [
  { label: 'Active seekers', value: '3.4k+' },
  { label: 'Avg match time', value: '14s' },
  { label: 'Swipe delight', value: '4.9 / 5' },
];

export default function CTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-rose-100 via-transparent to-transparent" aria-hidden />
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-200/70 blur-[110px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-8 h-56 w-56 rounded-full bg-orange-200/60 blur-[90px]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-12 left-12 h-32 w-32 rounded-full bg-red-200/40 blur-[70px]" aria-hidden />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-white/90 to-white" aria-hidden />

      <motion.div
        className="relative mx-auto max-w-5xl px-4 pt-24 pb-16 text-center"
        variants={heroContainer}
        initial="hidden"
        animate="show"
      >
        <motion.p
          className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500/80"
          variants={heroItem}
        >
          Toyota matchmaking
        </motion.p>

        <motion.h1
          className="mt-4 text-balance text-5xl font-black tracking-tight md:text-6xl"
          variants={heroItem}
        >
          Find your{' '}
          <motion.span className="hero-title-accent drop-shadow-[0_10px_35px_rgba(248,113,113,0.35)]">
            perfect Toyota
          </motion.span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-4 max-w-2xl text-lg text-slate-600"
          variants={heroItem}
        >
          Answer a few quick questions, let AI do the sorting, and swipe through a curated deck of Toyotas that updates with the market.
        </motion.p>

        <motion.div
          className="mt-8 flex items-center justify-center gap-4"
          variants={heroItem}
        >
          <Link href="/find" className="btn btn-primary shadow-[0_20px_45px_rgba(239,68,68,0.35)]">
            Start Matching
          </Link>
          <Link href="/liked" className="btn btn-outline backdrop-blur-sm bg-white/70">
            View Liked
          </Link>
        </motion.div>

        <motion.ul
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          variants={heroItem}
        >
          {quickHits.map((hit, index) => (
            <motion.li
              key={hit}
              className="hero-chip"
              variants={chipVariants}
              initial="hidden"
              animate="show"
              custom={index}
            >
              {hit}
            </motion.li>
          ))}
        </motion.ul>

        <motion.dl
          className="mt-10 grid gap-4 text-left md:grid-cols-3"
          variants={heroItem}
        >
          {stats.map(stat => (
            <motion.div
              key={stat.label}
              className="rounded-2xl border border-white/50 bg-white/70 p-5 text-center shadow-[0_15px_45px_rgba(15,23,42,0.08)] backdrop-blur"
              whileHover={{ scale: 1.02 }}
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {stat.label}
              </dt>
              <dd className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</dd>
            </motion.div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}
