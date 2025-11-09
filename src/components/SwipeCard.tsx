'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import CarDetailModal from '@/components/CarDetailModal';
import { Car } from '@/lib/types';

type Props = {
  car: Car;
  className?: string;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const MODAL_ANIMATION_MS = 240;

export default function SwipeCard({ car, className = '' }: Props) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gradient = gradientForColor(car);
  const imageSrc = car.ImageUrl || '/car-placeholder.svg';
  const mileage = typeof car.Mileage === 'number' ? `${car.Mileage.toLocaleString()} mi` : null;
  const type = car.Type || car.VehicleCategory || '—';
  const description = (car.FitDescription || '').trim();
  const price = typeof car.Price === 'number' ? currencyFormatter.format(car.Price) : '—';
  const monthlyPayment = typeof car.MonthlyPayment === 'number' ? currencyFormatter.format(car.MonthlyPayment) : null;

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function openDetails() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsClosing(false);
    setModalOpen(true);
  }

  function requestClose() {
    if (!isModalOpen || isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setModalOpen(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, MODAL_ANIMATION_MS);
  }

  const wrapperClass = useMemo(
    () =>
      [
        'card relative flex w-[320px] max-w-[360px] flex-col overflow-hidden sm:w-[360px] h-[560px] max-h-[88vh] p-0',
        'bg-gradient-to-br',
        gradient,
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [className, gradient],
  );

  return (
    <div className={wrapperClass}>
      <div className="relative">
        <div className="relative w-full aspect-[16/10] overflow-hidden">
          <Image
            src={imageSrc}
            alt={`${car.Year} ${car.Model}`}
            fill
            sizes="(max-width: 640px) 90vw, 360px"
            className="h-full w-full object-contain"
            priority={false}
          />
        </div>
      </div>
      <div className="flex-1 space-y-2 p-5">
        <h3
          className="text-xl font-semibold text-slate-900 leading-snug truncate"
          title={`${car.Year} ${car.Model}`}
        >
          {car.Year} {car.Model}
        </h3>
        <p className="text-sm text-slate-700">
          <span className="capitalize">{type}</span>
          {mileage ? <span> • {mileage}</span> : null}
        </p>
        <p className="text-2xl font-bold text-slate-900">{price}</p>
        {monthlyPayment && (
          <p className="text-sm font-medium text-slate-700">
            Est. {monthlyPayment}/mo · 7% APR · 72 mo*
          </p>
        )}
        {description && (
          <p
            className="text-sm leading-relaxed text-slate-800/90 overflow-hidden"
            style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}
          >
            {description}
          </p>
        )}
        <div className="pt-2">
          <button
            type="button"
            className="btn btn-outline w-full"
            onClick={openDetails}
          >
            View details
          </button>
        </div>
      </div>

      {isModalOpen && (
        <CarDetailModal car={car} closing={isClosing} onRequestClose={requestClose} />
      )}
    </div>
  );
}

function gradientForColor(car: Car) {
  const color = (car.ExteriorColor || '').toLowerCase();
  if (!color) return 'from-slate-50 via-white to-red-50';

  if (/supersonic\s*red|ruby\s*flare|soul\s*red/.test(color)) return 'from-rose-50 via-red-50 to-amber-100';
  if (/wind\s*chill\s*pearl|ice\s*cap|blizzard|pearl|white/.test(color)) return 'from-white via-slate-50 to-white';
  if (/midnight\s*black|jet\s*black|black/.test(color)) return 'from-slate-200 via-slate-100 to-slate-300';
  if (/blueprint|heritage\s*blue|cavalry\s*blue|wave\s*maker|ocean\s*gem|blue/.test(color)) return 'from-sky-50 via-blue-50 to-cyan-100';
  if (/celestite|everest|ice\s*cap\s*blue/.test(color)) return 'from-cyan-50 via-sky-50 to-blue-100';
  if (/classic\s*silver|celestial\s*silver|sonic\s*silver|heavy\s*metal|cutting\s*edge|silver/.test(color)) return 'from-slate-50 via-slate-100 to-slate-200';
  if (/magnetic\s*gray|grey|underground|gunmetal|graphite/.test(color)) return 'from-stone-100 via-slate-100 to-stone-200';
  if (/lunar\s*rock/.test(color)) return 'from-stone-100 via-emerald-50 to-lime-100';
  if (/cypress|forest|green|olive/.test(color)) return 'from-emerald-50 via-green-50 to-lime-100';
  if (/mudbath|bronze|cocoa|brown/.test(color)) return 'from-amber-100 via-stone-100 to-amber-200';
  if (/yellow|gold|champagne/.test(color)) return 'from-yellow-50 via-amber-50 to-orange-100';
  if (/orange|inferno|solar\s*octane|coral|copper/.test(color)) return 'from-orange-50 via-amber-50 to-rose-100';
  if (/dark\s*cosmos|plum|violet|purple/.test(color)) return 'from-fuchsia-50 via-purple-50 to-pink-100';
  if (/teal|turquoise/.test(color)) return 'from-teal-50 via-cyan-50 to-sky-100';

  if (/(red|crimson|maroon)/.test(color)) return 'from-rose-50 via-red-50 to-amber-100';
  if (/(blue|navy|cyan)/.test(color)) return 'from-sky-50 via-blue-50 to-cyan-100';
  if (/(green|emerald|forest|olive)/.test(color)) return 'from-emerald-50 via-green-50 to-lime-100';
  if (/(orange|coral|copper)/.test(color)) return 'from-orange-50 via-amber-50 to-rose-100';
  if (/(yellow|gold|champagne)/.test(color)) return 'from-yellow-50 via-amber-50 to-orange-100';
  if (/(beige|sand|tan|khaki)/.test(color)) return 'from-amber-50 via-stone-50 to-orange-100';
  if (/(brown|bronze)/.test(color)) return 'from-amber-100 via-orange-50 to-stone-100';
  if (/(purple|violet|plum)/.test(color)) return 'from-fuchsia-50 via-purple-50 to-pink-100';
  if (/(silver|gray|grey|gunmetal)/.test(color)) return 'from-slate-50 via-slate-100 to-slate-200';
  if (/(black)/.test(color)) return 'from-slate-200 via-slate-100 to-slate-300';
  if (/(white|pearl|ivory)/.test(color)) return 'from-white via-slate-50 to-white';
  return 'from-slate-50 via-white to-red-50';
}
