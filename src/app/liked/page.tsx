'use client';
import NavBar from '@/components/NavBar';
import { getLikedCars, clearLikes } from '@/lib/likes';
import { useEffect, useMemo, useState } from 'react';
import { Car } from '@/lib/types';
import AuthGate from '@/components/AuthGate';
import Image from 'next/image';

type SortKey = 'az' | 'price-asc' | 'price-desc';

export default function LikedPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('az');
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      setCars(getLikedCars());
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  const priceLimits = useMemo(() => {
    if (!cars.length) return { min: 0, max: 0 };
    const prices = cars.map(car => car.Price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [cars]);

  const typeOptions = useMemo(() => countByCategory(cars), [cars]);
  const seatingOptions = useMemo(() => countBySeating(cars), [cars]);

  const filteredCars = useMemo(() => {
    if (!cars.length) return [];
    return cars.filter(car => {
      const category = getCategory(car);
      const seat = typeof car.Seating === 'number' ? car.Seating : null;
      const matchesType = !selectedTypes.length || selectedTypes.includes(category);
      const matchesSeats = !selectedSeats.length || (seat !== null && selectedSeats.includes(seat));
      const minPrice = priceRange.min ?? priceLimits.min;
      const fallbackMax = priceRange.min ?? priceLimits.min;
      const maxPrice = priceRange.max ?? priceLimits.max ?? fallbackMax;
      const matchesPrice = car.Price >= minPrice && car.Price <= maxPrice;
      return matchesType && matchesSeats && matchesPrice;
    });
  }, [cars, selectedSeats, selectedTypes, priceRange, priceLimits]);

  const sortedCars = useMemo(() => {
    const list = [...filteredCars];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.Price - b.Price);
      case 'price-desc':
        return list.sort((a, b) => b.Price - a.Price);
      case 'az':
      default:
        return list.sort((a, b) => (a.Model || '').localeCompare(b.Model || ''));
    }
  }, [filteredCars, sortBy]);

  const effectiveMinPrice = priceRange.min ?? priceLimits.min;
  const effectiveMaxPrice = priceRange.max ?? priceLimits.max ?? effectiveMinPrice;
  const disablePriceControls = !cars.length || priceLimits.min === priceLimits.max;

  function toggleType(type: string) {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  }

  function toggleSeat(seat: number) {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  }

  function updateMinPrice(value: number) {
    setPriceRange(range => {
      const maxBound = range.max ?? priceLimits.max ?? value;
      const bounded = clamp(value, priceLimits.min, maxBound);
      return { ...range, min: Math.min(bounded, maxBound) };
    });
  }

  function updateMaxPrice(value: number) {
    setPriceRange(range => {
      const minBound = range.min ?? priceLimits.min ?? value;
      const bounded = clamp(value, minBound, priceLimits.max || value);
      return { ...range, max: Math.max(bounded, minBound) };
    });
  }

  function resetFilters() {
    setSelectedTypes([]);
    setSelectedSeats([]);
    setSortBy('az');
    setPriceRange({ min: priceLimits.min, max: priceLimits.max });
  }

  function handleClearLikes() {
    clearLikes();
    setCars([]);
    setPriceRange({ min: null, max: null });
    setSelectedTypes([]);
    setSelectedSeats([]);
    setSortBy('az');
  }

  return (
    <AuthGate>
      <main>
        <NavBar />
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-24">
          <header className="text-center">
            <p className="text-sm uppercase tracking-[0.45em] text-red-500">Toyota Vehicles</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-900">Find your saved Toyotas</h1>
            <p className="mt-2 text-slate-600">Dial in seating, budget, and body style filters to revisit the Toyotas you loved.</p>
          </header>

          <div className="mt-10 rounded-[36px] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.12)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[280px,1fr]">
              <aside className="border-r border-slate-100 pr-0 lg:pr-8">
                <div className="flex items-center justify-between pb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
                  <button className="text-sm font-semibold text-red-600 hover:underline" onClick={resetFilters}>
                    Reset
                  </button>
                </div>
                <FilterBlock title="Vehicles">
                  {typeOptions.length === 0 && <p className="text-sm text-slate-500">No vehicle types tracked yet.</p>}
                  {typeOptions.map(([type, count]) => (
                    <FilterCheckbox
                      key={type}
                      label={`${type} (${count})`}
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                    />
                  ))}
                </FilterBlock>

                <FilterBlock title="Price (MSRP)">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <input
                        type="range"
                        min={priceLimits.min}
                        max={priceLimits.max || priceLimits.min + 1}
                        value={effectiveMinPrice}
                        onChange={e => updateMinPrice(Number(e.target.value))}
                        className="w-full accent-red-500"
                        disabled={disablePriceControls}
                      />
                      <input
                        type="range"
                        min={priceLimits.min}
                        max={priceLimits.max || priceLimits.min + 1}
                        value={effectiveMaxPrice}
                        onChange={e => updateMaxPrice(Number(e.target.value))}
                        className="w-full accent-red-500"
                        disabled={disablePriceControls}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <PriceInput label="Min" value={effectiveMinPrice} onChange={val => updateMinPrice(val)} disabled={!cars.length} />
                      <PriceInput label="Max" value={effectiveMaxPrice} onChange={val => updateMaxPrice(val)} disabled={!cars.length} />
                    </div>
                  </div>
                </FilterBlock>

                <FilterBlock title="Available seating">
                  {seatingOptions.length === 0 && <p className="text-sm text-slate-500">No seating data captured yet.</p>}
                  {seatingOptions.map(([seat, count]) => (
                    <FilterCheckbox
                      key={seat}
                      label={`${seat} (${count})`}
                      checked={selectedSeats.includes(seat)}
                      onChange={() => toggleSeat(seat)}
                    />
                  ))}
                </FilterBlock>

                <button className="btn btn-outline mt-6 w-full" onClick={handleClearLikes}>Clear liked cars</button>
              </aside>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Matches</p>
                    <h2 className="text-3xl font-semibold text-slate-900">{sortedCars.length} {sortedCars.length === 1 ? 'Match' : 'Matches'}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-sm font-semibold text-slate-600">Vehicle</label>
                    <select
                      id="sort"
                      className="select w-48"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortKey)}
                    >
                      <option value="az">Vehicle: A-Z</option>
                      <option value="price-asc">Price: Low → High</option>
                      <option value="price-desc">Price: High → Low</option>
                    </select>
                  </div>
                </div>

                {sortedCars.length === 0 ? (
                  <div className="mt-10 rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                    {!cars.length ? 'You have not liked any cars yet. Head to the swipe deck to get started.' : 'No liked cars match these filters. Adjust your filters to see more results.'}
                  </div>
                ) : (
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {sortedCars.map(car => (
                      <VehicleCard key={car.Id} car={car} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </AuthGate>
  );
}

function getCategory(car: Car) {
  return car.VehicleCategory || car.Type || 'Other';
}

function countByCategory(cars: Car[]): [string, number][] {
  const map = new Map<string, number>();
  cars.forEach(car => {
    const category = getCategory(car);
    map.set(category, (map.get(category) ?? 0) + 1);
  });
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function countBySeating(cars: Car[]): [number, number][] {
  const map = new Map<number, number>();
  cars.forEach(car => {
    if (typeof car.Seating !== 'number') return;
    map.set(car.Seating, (map.get(car.Seating) ?? 0) + 1);
  });
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 py-5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">{title}</h3>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-400 text-red-500 focus:ring-red-200"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function PriceInput({ label, value, onChange, disabled }: { label: string; value: number; onChange: (val: number) => void; disabled: boolean }) {
  return (
    <label className="flex flex-1 flex-col text-sm font-semibold text-slate-600">
      {label}
      <input
        type="number"
        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-base font-normal text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-200"
        value={value}
        min={0}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    </label>
  );
}

function VehicleCard({ car }: { car: Car }) {
  const currency = formatCurrency(car.Price);
  const mpg = car.MPG || '—';
  const seating = typeof car.Seating === 'number' ? `${car.Seating} seats` : 'Seating TBD';
  const fuel = car['Fuel Type'] || car.FuelType || 'Fuel';
  const category = getCategory(car);
  const badge = car.Used ? 'Certified Used' : fuel;
  const imgSrc = car.ImageUrl || '/car-placeholder.svg';
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_35px_65px_rgba(244,63,94,0.25)]">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        <span>{category}</span>
        <span>{badge}</span>
      </div>
      <div className="mt-4 flex h-40 items-center justify-center rounded-2xl bg-slate-50">
        <Image src={imgSrc} alt={`${car.Year} ${car.Model}`} width={320} height={180} className="h-full w-full object-contain" />
      </div>
      <div className="mt-4 text-sm text-slate-500">{car.Year}</div>
      <h3 className="text-2xl font-semibold text-slate-900">{car.Model}</h3>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-slate-900">{currency}</p>
          <p className="text-xs text-slate-500">{car.Used ? 'Pre-owned asking price' : 'Starting MSRP *'}</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p className="font-semibold text-slate-900">{mpg}</p>
          <p>Up to est. MPG*</p>
          <p className="mt-1">{seating}</p>
        </div>
      </div>
      <div className="mt-5 flex gap-5 text-sm font-semibold">
        <button className="text-red-600 hover:underline" type="button">Explore</button>
        <button className="text-red-600 hover:underline" type="button">Build</button>
      </div>
    </div>
  );
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}
