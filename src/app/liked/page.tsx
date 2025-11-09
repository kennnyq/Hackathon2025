'use client';
import NavBar from '@/components/NavBar';
import { getLikedCars, clearLikes } from '@/lib/likes';
import { useEffect, useMemo, useState, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Car } from '@/lib/types';
import Image from 'next/image';
import { useRequireAuth } from '@/hooks/useRequireAuth';

type SortKey = 'az' | 'price-asc' | 'price-desc' | 'mpg-asc' | 'mpg-desc';

const MODAL_ANIMATION_MS = 240;

export default function LikedPage() {
  useRequireAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('az');
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

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
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      min: roundDownToThousand(min),
      max: roundUpToThousand(max),
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
      const defaultMin = priceLimits.min;
      const defaultMax = priceLimits.max || priceLimits.min;
      const minPrice = roundDownToThousand(priceRange.min ?? defaultMin);
      const maxPrice = roundUpToThousand(priceRange.max ?? defaultMax ?? minPrice);
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
      case 'mpg-asc':
        return list.sort((a, b) => compareMpg(a, b, 'asc'));
      case 'mpg-desc':
        return list.sort((a, b) => compareMpg(a, b, 'desc'));
      case 'az':
      default:
        return list.sort((a, b) => (a.Model || '').localeCompare(b.Model || ''));
    }
  }, [filteredCars, sortBy]);

  const effectiveMinPrice = roundDownToThousand(priceRange.min ?? priceLimits.min);
  const effectiveMaxPrice = roundUpToThousand(priceRange.max ?? priceLimits.max ?? effectiveMinPrice);
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
      const roundedMax = roundUpToThousand(maxBound);
      const bounded = clamp(value, priceLimits.min, roundedMax);
      const roundedMin = Math.min(roundDownToThousand(bounded), roundedMax);
      return { ...range, min: roundedMin };
    });
  }

  function updateMaxPrice(value: number) {
    setPriceRange(range => {
      const minBound = range.min ?? priceLimits.min ?? value;
      const roundedMin = roundDownToThousand(minBound);
      const bounded = clamp(value, roundedMin, priceLimits.max ?? value);
      const roundedMax = Math.max(roundUpToThousand(bounded), roundedMin);
      return { ...range, max: roundedMax };
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
    setSelectedCar(null);
    setModalVisible(false);
  }

  function openCarModal(car: Car) {
    setSelectedCar(car);
    setModalVisible(true);
  }

  function requestModalClose() {
    if (!selectedCar) return;
    setModalVisible(false);
  }

  useEffect(() => {
    if (isModalVisible || !selectedCar) return;
    const timeout = setTimeout(() => {
      setSelectedCar(null);
    }, MODAL_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [isModalVisible, selectedCar]);

  useEffect(() => {
    if (!selectedCar) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [selectedCar]);

  useEffect(() => {
    if (!selectedCar) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedCar]);


  return (
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
                        step={1000}
                        onChange={e => updateMinPrice(Number(e.target.value))}
                        className="w-full accent-red-500"
                        disabled={disablePriceControls}
                      />
                      <input
                        type="range"
                        min={priceLimits.min}
                        max={priceLimits.max || priceLimits.min + 1}
                        value={effectiveMaxPrice}
                        step={1000}
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
                      <option value="mpg-asc">MPG: Low → High</option>
                      <option value="mpg-desc">MPG: High → Low</option>
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
                      <VehicleCard
                        key={car.Id}
                        car={car}
                        onSelect={() => openCarModal(car)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        {selectedCar && (
          <CarDetailModal
            car={selectedCar}
            closing={!isModalVisible}
            onRequestClose={requestModalClose}
          />
        )}
      </main>
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

function VehicleCard({ car, onSelect }: { car: Car; onSelect: () => void }) {
  const currency = formatCurrency(car.Price);
  const mpg = car.MPG || '—';
  const seating = typeof car.Seating === 'number' ? `${car.Seating} seats` : 'Seating TBD';
  const fuel = car['Fuel Type'] || car.FuelType || 'Fuel';
  const category = getCategory(car);
  const badge = car.Used ? 'Certified Used' : fuel;
  const imgSrc = car.ImageUrl || '/car-placeholder.svg';
  const dealerName = car.Dealer || 'Dealer pending';
  const dealerCity = car.DealerCity && car.DealerState ? `${car.DealerCity}, ${car.DealerState}` : car.DealerCity || null;
  const distanceText = car.DistanceLabel || (typeof car.DistanceMiles === 'number' ? `${car.DistanceMiles.toFixed(1)} mi away` : null);
  const dealerDetails = [dealerCity, distanceText].filter(Boolean).join(' • ');
  const dealerWebsite = car.DealerWebsite;

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className="group h-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_35px_65px_rgba(244,63,94,0.25)] focus:outline-none focus:ring-2 focus:ring-red-300"
    >
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
      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-600">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Dealer</p>
        <p className="font-semibold text-slate-900">{dealerName}</p>
        <p>{dealerDetails || 'Distance visible after sharing a zip code.'}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {dealerWebsite && (
          <a
            href={dealerWebsite}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary px-4 py-2 text-sm"
            onClick={event => event.stopPropagation()}
          >
            Reach out to dealer
          </a>
        )}
        <button
          type="button"
          className="btn btn-outline px-4 py-2 text-sm"
          onClick={event => event.stopPropagation()}
        >
          Explore
        </button>
      </div>
    </article>
  );
}

function CarDetailModal({ car, closing, onRequestClose }: { car: Car; closing: boolean; onRequestClose: () => void }) {
  const headingId = `liked-car-modal-${car.Id}`;
  const currency = formatCurrency(car.Price);
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
  const whyItFits = car.FitDescription || 'Reasoning unavailable. Check back soon!';
  const dealerName = car.Dealer || 'Dealer pending';
  const dealerCity = car.DealerCity && car.DealerState ? `${car.DealerCity}, ${car.DealerState}` : car.DealerCity || null;
  const distanceText = car.DistanceLabel || (typeof car.DistanceMiles === 'number' ? `${car.DistanceMiles.toFixed(1)} mi away` : null);
  const dealerDetails = [dealerCity, distanceText].filter(Boolean).join(' • ');
  const dealerWebsite = car.DealerWebsite;

  return (
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
                  <a href={dealerWebsite} target="_blank" rel="noreferrer" className="btn btn-primary px-4 py-2 text-sm">
                    Reach out to dealer
                  </a>
                )}
                <button type="button" className="btn btn-outline px-4 py-2 text-sm">Explore</button>
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
    </div>
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

function getAverageMpg(car: Car): number | null {
  if (!car.MPG) return null;
  const cleaned = car.MPG.replace(/[^0-9.–-]/g, '');
  if (!cleaned) return null;
  const parts = cleaned.split(/[-–]/).map(part => parseFloat(part)).filter(val => !Number.isNaN(val));
  if (!parts.length) return null;
  const sum = parts.reduce((acc, val) => acc + val, 0);
  return sum / parts.length;
}

function compareMpg(a: Car, b: Car, direction: 'asc' | 'desc') {
  const mpgA = getAverageMpg(a);
  const mpgB = getAverageMpg(b);
  if (mpgA === null && mpgB === null) return 0;
  if (mpgA === null) return 1;
  if (mpgB === null) return -1;
  return direction === 'asc' ? mpgA - mpgB : mpgB - mpgA;
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function roundDownToThousand(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.floor(value / 1000) * 1000;
}

function roundUpToThousand(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.ceil(value / 1000) * 1000;
}
