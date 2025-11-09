'use client';
import Image from 'next/image';
import { Car } from '@/lib/types';

const FALLBACK_DESCRIPTION = 'Gemini could not generate a personalized note, but this Toyota still lines up with your stated priorities.';

export default function CarCard({ car, className = '' }: { car: Car; className?: string }) {
  const wrapperClass = [
    'card relative flex w-[320px] max-w-[360px] flex-col gap-4 overflow-hidden sm:w-[360px] h-[560px] max-h-[88vh]',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const mileage = typeof car.Mileage === 'number' ? `${car.Mileage.toLocaleString()} mi` : null;
  const fuel = car['Fuel Type'] || car.FuelType || null;
  const description = car.FitDescription?.trim() || FALLBACK_DESCRIPTION;
  const seating = typeof car.Seating === 'number' ? `${car.Seating} seats` : null;
  const mpg = car.MPG || null;
  const drivetrain = car.Drivetrain || null;
  const exterior = car.ExteriorColor || null;
  const interior = car.InteriorColor || null;
  const dealerName = car.Dealer || 'Dealer pending';
  const matchPercent = typeof car.Score === 'number' ? Math.round(car.Score * 100) : null;
  const dealerCity = car.DealerCity && car.DealerState ? `${car.DealerCity}, ${car.DealerState}` : car.DealerCity || null;
  const distanceText = car.DistanceLabel || (typeof car.DistanceMiles === 'number' ? `${car.DistanceMiles.toFixed(1)} mi away` : null);
  const dealerDetails = [dealerCity, distanceText].filter(Boolean).join(' • ');
  const keyHighlights = [
    { label: 'Dealer', value: car.Dealer },
    { label: 'Distance', value: distanceText },
    { label: 'Mileage', value: mileage },
    { label: 'Drivetrain', value: drivetrain },
    { label: 'Fuel', value: fuel },
    { label: 'MPG', value: mpg },
    { label: 'Seating', value: seating },
    { label: 'Exterior', value: exterior },
    { label: 'Interior', value: interior },
  ].filter(item => Boolean(item.value));
  const specDetails = [
    { label: 'Engine', value: car.Engine },
    { label: 'Transmission', value: car.Transmission },
    { label: 'Listing ID', value: String(car.Id) },
  ].filter(detail => detail.value && detail.value !== 'null');
  const imageSrc = car.ImageUrl || '/car-placeholder.svg';
  const category = car.VehicleCategory || car.Type || 'Toyota Match';

  return (
    <div className={wrapperClass}>
      <div className="card-top space-y-4">
        <div className="card-image-wrapper">
          <Image
            src={imageSrc}
            alt={`${car.Year} ${car.Model}`}
            fill
            sizes="(max-width: 640px) 90vw, 360px"
            className="card-image"
            priority={false}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{category}</p>
            <h3 className="text-[1.65rem] leading-snug font-semibold text-slate-900">
              {car.Year} {car.Model}
            </h3>
            <p className="text-sm text-slate-600 capitalize">{car.Condition || (car.Used ? 'Used' : 'New')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Price</p>
            <p className="text-2xl font-bold text-slate-900">${car.Price.toLocaleString()}</p>
            {matchPercent != null && (
              <p className="text-xs font-semibold text-emerald-600">{matchPercent}% match</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner shadow-white/40">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Dealer & distance</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{dealerName}</p>
          <p className="text-sm text-slate-500">{dealerDetails || 'Share a zip code to unlock drive distance.'}</p>
        </div>
      </div>

      <div className="card-content-scroll">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-700 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">Why it fits</p>
            <p className="mt-1 leading-relaxed">{description}</p>
          </div>

          {keyHighlights.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Key highlights</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {keyHighlights.map(item => (
                  <li key={item.label} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />
                    <span><span className="font-semibold">{item.label}:</span> {item.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {specDetails.length > 0 && (
            <details className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
              <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Detailed specs
                <span className="text-[10px] text-slate-400">Tap to view</span>
              </summary>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-900">
                {specDetails.map(spec => (
                  <div key={spec.label} className="rounded-xl border border-slate-200 bg-white/80 p-2">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{spec.label}</dt>
                    <dd className="font-medium text-slate-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
