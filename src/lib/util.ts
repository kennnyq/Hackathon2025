import { Car, Preferences } from './types';

export function normalizeFuel(car: Car) {
  const raw = (car.FuelType || car["Fuel Type"] || '').toLowerCase();
  if (!raw) return '';
  if (raw.includes('hybrid')) return 'hybrid';
  if (raw.includes('ev') || raw.includes('electric')) return 'ev';
  if (raw.includes('hydrogen')) return 'other';
  if (raw.includes('fuel') || raw.includes('gasoline') || raw.includes('gas') || raw.includes('diesel')) return 'fuel';
  return raw;
}

export function filterCars(cars: Car[], prefs: Preferences): Car[] {
  return cars.filter(c => {
    const fuel = normalizeFuel(c);
    const usedOk = prefs.used === 'Any' || (prefs.used === 'Used' ? c.Used : !c.Used);
    const fuelOk = prefs.fuelType === 'Any' || fuel.startsWith(prefs.fuelType.toLowerCase());
    const priceOk = !prefs.budget || c.Price <= prefs.budget * 1.1; // small cushion
    const mileageOk = !prefs.maxMileage || typeof c.Mileage !== 'number' || c.Mileage <= prefs.maxMileage;
    const locOk = !prefs.location || c.Location.toLowerCase().includes(prefs.location.toLowerCase());
    return usedOk && fuelOk && priceOk && mileageOk && locOk;
  });
}

export function scoreCar(c: Car, prefs: Preferences): number {
  const pricePenalty = Math.max(0, c.Price - prefs.budget);
  const preferredMileage = typeof prefs.maxMileage === 'number' && prefs.maxMileage > 0 ? prefs.maxMileage : null;
  const mileagePenalty = preferredMileage && typeof c.Mileage === 'number'
    ? Math.max(0, c.Mileage - preferredMileage) * 0.05
    : 0;
  const ageBonus = Math.max(0, c.Year - 2015) * 200; // newer is better
  return -pricePenalty - mileagePenalty + ageBonus;
}

export function pickTopN(cars: Car[], prefs: Preferences, n = 10): Car[] {
  return [...cars]
    .sort((a, b) => scoreCar(b, prefs) - scoreCar(a, prefs))
    .slice(0, n);
}
