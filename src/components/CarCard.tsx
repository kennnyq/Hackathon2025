'use client';
import { Car } from '@/lib/types';

export default function CarCard({ car }: { car: Car }) {
  return (
    <div className="card w-[320px]">
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-semibold">{car.Year} {car.Model}</h3>
        <span className="text-fuchsia-300 font-bold">${car.Price.toLocaleString()}</span>
      </div>
      <p className="mt-2 text-white/80 text-sm">{car.Location} • {car.Type}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-white/80">
        <div className="card bg-white/5 p-3">
          <div className="text-white/60">Fuel</div>
          <div className="font-medium">{car["Fuel Type"] || car.FuelType}</div>
        </div>
        <div className="card bg-white/5 p-3">
          <div className="text-white/60">Condition</div>
          <div className="font-medium">{car.Condition}</div>
        </div>
        <div className="card bg-white/5 p-3">
          <div className="text-white/60">Used</div>
          <div className="font-medium">{car.Used ? 'Used' : 'New'}</div>
        </div>
        <div className="card bg-white/5 p-3">
          <div className="text-white/60">ID</div>
          <div className="font-medium">{car.Id}</div>
        </div>
      </div>
    </div>
  );
}