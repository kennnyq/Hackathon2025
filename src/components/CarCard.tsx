'use client';
import Image from 'next/image';
import { Car } from '@/lib/types';

const FALLBACK_DESCRIPTION = 'Gemini could not generate a personalized note, but this Toyota still lines up with your stated priorities.';

export default function CarCard({ car, className = '' }: { car: Car; className?: string }) {
  const wrapperClass = ['card w-[320px] space-y-3 overflow-hidden', className].filter(Boolean).join(' ');
  const mileage = typeof car.Mileage === 'number' ? `${car.Mileage.toLocaleString()} mi` : '—';
  const distance = typeof car.DistanceMiles === 'number' ? `${car.DistanceMiles} mi away` : 'Distance TBD';
  const fuel = car['Fuel Type'] || car.FuelType || '—';
  const description = car.FitDescription?.trim() || FALLBACK_DESCRIPTION;
  const seating = typeof car.Seating === 'number' ? `${car.Seating} seats` : '—';
  const keyStats = [
    { label: 'Mileage', value: mileage },
    { label: 'Seating', value: seating },
    { label: 'Fuel', value: fuel },
    { label: 'Usage', value: car.Used ? 'Used' : 'New' },
    { label: 'Condition', value: car.Condition || '—' },
    { label: 'Dealer', value: car.Dealer || car.Location },
    { label: 'Distance', value: distance },
  ];
  const specDetails = [
    { label: 'Engine', value: car.Engine },
    { label: 'Transmission', value: car.Transmission },
    { label: 'Drivetrain', value: car.Drivetrain },
    { label: 'MPG', value: car.MPG },
    { label: 'Exterior', value: car.ExteriorColor },
    { label: 'Interior', value: car.InteriorColor },
    { label: 'Listing ID', value: String(car.Id) },
  ];
  const imageSrc = car.ImageUrl || '/car-placeholder.svg';

  return (
    <div className={wrapperClass}>
      <div className="overflow-hidden rounded-3xl border border-white/60 shadow-inner">
        <Image
          src={imageSrc}
          alt={`${car.Year} ${car.Model}`}
          width={640}
          height={360}
          className="h-48 w-full object-cover"
          priority={false}
        />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Toyota Match</p>
          <h3 className="text-2xl font-semibold text-slate-900">{car.Year} {car.Model}</h3>
          <p className="text-slate-700 text-sm">{car.Location} • {car.Type}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">Price</p>
          <p className="text-2xl font-bold text-slate-900">${car.Price.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-700 shadow-inner">
        <p className="text-xs uppercase tracking-[0.3em] text-red-500">Why it fits</p>
        <p className="mt-1 leading-relaxed">{description}</p>
      </div>

      <section>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Key highlights</div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-900">
          {keyStats.map(stat => (
            <div key={stat.label} className="rounded-xl border border-slate-100 bg-white/80 p-3 backdrop-blur-sm">
              <dt className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</dt>
              <dd className="font-medium">{stat.value || '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      <details className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
        <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Detailed specs
          <span className="text-[10px] text-slate-400">Tap to view</span>
        </summary>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-900">
          {specDetails.filter(spec => spec.value && spec.value !== 'null').map(spec => (
            <div key={spec.label} className="rounded-xl border border-slate-200 bg-white/80 p-3 backdrop-blur-sm">
              <dt className="text-xs uppercase tracking-wide text-slate-500">{spec.label}</dt>
              <dd className="font-medium text-slate-900">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
