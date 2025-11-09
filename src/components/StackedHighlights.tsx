'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

type HighlightCard = {
  title: string;
  description: string;
  gradient: string;
  border: string;
};

const HIGHLIGHTS: HighlightCard[] = [
  {
    title: 'AI-Picked Matches',
    description: 'Gemini ranks Toyotas by your budget, range, and vibe so you start with a curated shortlist.',
    gradient: 'from-rose-50 to-red-100',
    border: 'border-rose-200',
  },
  {
    title: 'Swipe-Ready Deck',
    description: 'Dive into tactile cards with fast skip/like controls that feel built for mobile speed.',
    gradient: 'from-red-50 to-amber-100',
    border: 'border-amber-200',
  },
  {
    title: 'Exportable Favorites',
    description: 'Build a red-hot favorites list you can revisit, share, or start over in a tap.',
    gradient: 'from-orange-50 to-rose-100',
    border: 'border-orange-200',
  },
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const cardVariants = {
  hidden: { opacity: 0, filter: 'blur(12px)' },
  show: (index: number) => ({
    opacity: 1,
    filter: 'blur(0px)',
    transition: { delay: 0.3 + index * 0.1, duration: 0.55, ease: 'easeOut' },
  }),
};

export default function StackedHighlights({ className = '' }: { className?: string }) {
  const cards = useMemo(() => (
    HIGHLIGHTS.map((card, index) => {
      const hash = hashString(card.title);
      const rotation = (hash % 8) - 4 + (index === 0 ? 1 : 0);
      const xShift = ((hash >> 3) % 16) - 8;
      const yShift = index * 20;
      return { ...card, rotation, xShift, yShift, z: HIGHLIGHTS.length - index };
    })
  ), []);

  return (
    <div className={`relative h-[320px] ${className}`}>
      {cards.map((card, index) => (
        <motion.article
          key={card.title}
          className={`pointer-events-none select-none absolute inset-x-6 mx-auto rounded-3xl border ${card.border} bg-gradient-to-br ${card.gradient} p-6 shadow-2xl shadow-red-100/70`}
          style={{
            zIndex: card.z,
            transform: `translate(${card.xShift}px, ${card.yShift}px) rotate(${card.rotation}deg)`,
          }}
          variants={cardVariants}
          initial="hidden"
          animate="show"
          custom={index}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">Feature</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-900">{card.title}</h3>
          <p className="mt-2 text-slate-700 text-sm leading-relaxed">{card.description}</p>
        </motion.article>
      ))}
    </div>
  );
}
