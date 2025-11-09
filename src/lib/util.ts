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
    const condOk = prefs.condition === 'Any' || c.Condition.toLowerCase().startsWith(prefs.condition.toLowerCase());
    const locOk = !prefs.location || c.Location.toLowerCase().includes(prefs.location.toLowerCase());
    return usedOk && fuelOk && priceOk && condOk && locOk;
  });
}

export function scoreCar(c: Car, prefs: Preferences): number {
  const pricePenalty = Math.max(0, c.Price - prefs.budget);
  const ageBonus = Math.max(0, c.Year - 2015) * 200; // newer is better
  return -pricePenalty + ageBonus;
}

export function pickTopN(cars: Car[], prefs: Preferences, n = 10): Car[] {
  return [...cars]
    .sort((a, b) => scoreCar(b, prefs) - scoreCar(a, prefs))
    .slice(0, n);
}
