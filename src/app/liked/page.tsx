'use client';
import NavBar from '@/components/NavBar';
import carsData from '@/data/cars.json';
import { getLikes, clearLikes } from '@/lib/likes';
import { useEffect, useState } from 'react';
import { Car } from '@/lib/types';
import AuthGate from '@/components/AuthGate';

export default function LikedPage() {
  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    const ids = new Set(getLikes());
    setCars((carsData as Car[]).filter(c => ids.has(c.Id)));
  }, []);

  return (
    <AuthGate>
      <main>
        <NavBar />
        <section className="mx-auto max-w-5xl px-4 pt-12 pb-24">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Liked cars</h1>
            <button className="btn btn-outline" onClick={() => { clearLikes(); location.reload(); }}>Clear</button>
          </div>
          {cars.length === 0 ? (
            <p className="text-slate-500 mt-6">Nothing here yet. Go like a few!</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map(c => (
                <div key={c.Id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{c.Year} {c.Model}</div>
                      <div className="text-slate-500 text-sm">{c.Location} • {c.Type}</div>
                    </div>
                    <div className="font-bold text-red-600">${c.Price.toLocaleString()}</div>
                  </div>
                  <div className="mt-3 text-slate-600 text-sm">
                    {c.Used ? 'Used' : 'New'} • {(c["Fuel Type"] || c.FuelType)} • {c.Condition}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </AuthGate>
  );
}
