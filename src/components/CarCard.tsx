'use client';
import { Car } from '@/lib/types';

export default function CarCard({ car }: { car: Car }) {
  return (
    <div className="card w-[320px]">
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-semibold">{car.Year} {car.Model}</h3>
        <span className="text-red-600 font-bold">${car.Price.toLocaleString()}</span>
      </div>
      <p className="mt-2 text-slate-600 text-sm">{car.Location} • {car.Type}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-slate-500 text-xs uppercase tracking-wide">Fuel</div>
          <div className="font-medium">{car["Fuel Type"] || car.FuelType}</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-slate-500 text-xs uppercase tracking-wide">Condition</div>
          <div className="font-medium">{car.Condition}</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-slate-500 text-xs uppercase tracking-wide">Used</div>
          <div className="font-medium">{car.Used ? 'Used' : 'New'}</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-slate-500 text-xs uppercase tracking-wide">ID</div>
          <div className="font-medium">{car.Id}</div>
        </div>
      </div>
    </div>
  );
}
