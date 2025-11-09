'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Car } from '@/lib/types';
import { formatCurrency, getCategory } from '@/lib/carDisplay';
import { AprDealsLink, AprInfoIcon } from '@/components/AprInfo';

type Props = {
  car: Car;
  closing?: boolean;
  onRequestClose: () => void;
};

export default function CarDetailModal({ car, closing = false, onRequestClose }: Props) {
  const headingId = `car-detail-modal-${car.Id}`;
  const currency = formatCurrency(car.Price);
  const monthlyPayment = typeof car.MonthlyPayment === 'number' ? formatCurrency(car.MonthlyPayment) : null;
  const mpg = car.MPG || '—';
  const seating = typeof car.Seating === 'number' ? `${car.Seating} seats` : 'Seating TBD';
  const fuel = car['Fuel Type'] || car.FuelType || 'Fuel';
  const drivetrain = car.Drivetrain || 'Drivetrain TBD';
  const exterior = car.ExteriorColor || 'Exterior TBD';
  const interior = car.InteriorColor || 'Interior TBD';
  const highlights = buildHighlights(car);
  const category = getCategory(car);
  const badge = car.Used ? 'Certified Used' : fuel;
  const imgSrc = car.ImageUrl || '/car-placeholder.svg';
  const modelUrl = car.ModelUrl;
  const whyItFits = car.FitDescription || 'Reasoning unavailable. Check back soon!';
  const dealerName = car.Dealer || 'Dealer pending';
  const dealerCity = car.DealerCity && car.DealerState ? `${car.DealerCity}, ${car.DealerState}` : car.DealerCity || null;
  const distanceText = car.DistanceLabel || (typeof car.DistanceMiles === 'number' ? `${car.DistanceMiles.toFixed(1)} mi away` : null);
  const dealerDetails = [dealerCity, distanceText].filter(Boolean).join(' • ');
  const dealerWebsite = car.DealerWebsite;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [onRequestClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 md:p-10">
      <div
        className={`liked-modal-overlay${closing ? ' closing' : ''}`}
        onClick={onRequestClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={`liked-modal-panel relative flex flex-col gap-8 lg:flex-row${closing ? ' closing' : ''}`}
        onClick={event => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close details"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-200 hover:text-red-500"
          onClick={onRequestClose}
        >
          <span className="text-2xl leading-none">×</span>
        </button>

        <div className="space-y-6 lg:w-[40%]">
          <div className="rounded-[32px] border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0_25px_55px_rgba(15,23,42,0.12)]">
            <Image
              src={imgSrc}
              alt={`${car.Year} ${car.Model}`}
              width={480}
              height={320}
              className="h-64 w-full object-contain"
            />
          </div>
          <div className="rounded-[26px] border border-slate-100 bg-white/80 p-4 text-sm text-slate-500 shadow-[inset_0_1px_0_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">Snapshot</p>
            <p className="mt-2"><span className="font-semibold text-slate-800">Drivetrain:</span> {drivetrain}</p>
            <p><span className="font-semibold text-slate-800">Fuel:</span> {fuel}</p>
            <p><span className="font-semibold text-slate-800">Exterior:</span> {exterior}</p>
            <p><span className="font-semibold text-slate-800">Interior:</span> {interior}</p>
          </div>
        </div>

        <div className="flex-1 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              <span>{category}</span>
              <span className="rounded-full border border-slate-200 px-3 py-1 tracking-[0.2em] text-slate-500">{badge}</span>
            </div>
            <h2 id={headingId} className="mt-3 text-3xl font-semibold text-slate-900">{car.Year} {car.Model}</h2>
            <p className="mt-1 text-sm text-slate-500">{car.Used ? 'Certified pre-owned listing' : 'Factory-new configuration'}</p>
            {monthlyPayment && (
              <div className="mt-4 space-y-1">
                <p className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <span>Estimated {monthlyPayment}/mo</span>
                  <AprInfoIcon />
                </p>
                <AprDealsLink />
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard label="Price" value={currency} helper={car.Used ? 'Current offer' : 'Starting MSRP *'} />
              <StatCard label="MPG range" value={mpg} helper="Est. combined" />
              <StatCard label="Seating" value={seating} helper="Capacity" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailPill label="Drivetrain" value={drivetrain} />
            <DetailPill label="Fuel Type" value={fuel} />
            <DetailPill label="Exterior Color" value={exterior} />
            <DetailPill label="Interior Color" value={interior} />
          </div>

          <div className="space-y-4 rounded-[36px] border border-slate-100 bg-white/85 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">Why it fits</p>
              <p className="mt-2 text-base text-slate-700">{whyItFits}</p>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Dealer</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{dealerName}</p>
              <p className="text-sm text-slate-500">{dealerDetails || 'Distance visible after sharing a zip code.'}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {dealerWebsite && (
                  <a href={dealerWebsite} target="_blank" rel="noreferrer" className="btn btn-primary px-4 py-2 text-sm" onClick={event => event.stopPropagation()}>
                    Reach out to dealer
                  </a>
                )}
                {modelUrl && (
                  <a href={modelUrl} target="_blank" rel="noreferrer" className="btn btn-outline px-4 py-2 text-sm" onClick={event => event.stopPropagation()}>
                    Explore
                  </a>
                )}
              </div>
            </div>
            {highlights.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Key highlights</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {highlights.map(item => (
                    <li key={item.label} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
                      <span><span className="font-semibold">{item.label}:</span> {item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[28px] border border-slate-100 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.09)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function buildHighlights(car: Car) {
  const seating = typeof car.Seating === 'number' ? `${car.Seating} seats` : null;
  return [
    { label: 'Mileage', value: typeof car.Mileage === 'number' ? `${car.Mileage.toLocaleString()} mi` : null },
    { label: 'Drivetrain', value: car.Drivetrain },
    { label: 'Fuel', value: car['Fuel Type'] || car.FuelType },
    { label: 'MPG', value: car.MPG },
    { label: 'Seating', value: seating },
    { label: 'Exterior', value: car.ExteriorColor },
    { label: 'Interior', value: car.InteriorColor },
  ]
    .filter(item => Boolean(item.value))
    .map(item => ({ label: item.label, value: item.value as string }));
}
