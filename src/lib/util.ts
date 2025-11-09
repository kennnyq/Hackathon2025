import { Car, Preferences } from './types';

type NoteConstraints = {
  minMpg?: number;
  requiresAwd?: boolean;
  minSeating?: number;
  preferredCategories?: string[];
  maxMileage?: number;
  preferredFuel?: 'Hybrid' | 'EV' | 'Fuel' | 'Other';
};

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
  const noteConstraints = deriveNoteConstraints(prefs.notes);
  return cars.filter(c => {
    const fuel = normalizeFuel(c);
    const usedOk = prefs.used === 'Any' || (prefs.used === 'Used' ? c.Used : !c.Used);
    const fuelOk = prefs.fuelType === 'Any' || fuel.startsWith(prefs.fuelType.toLowerCase());
    const priceOk = !prefs.budget || c.Price <= prefs.budget * 1.1; // small cushion
    const mileageOk = !prefs.maxMileage || typeof c.Mileage !== 'number' || c.Mileage <= prefs.maxMileage;
    const locOk = !prefs.location || c.Location.toLowerCase().includes(prefs.location.toLowerCase());
    const notesOk = matchesNoteConstraints(c, noteConstraints);
    return usedOk && fuelOk && priceOk && mileageOk && locOk && notesOk;
  });
}

export function scoreCar(c: Car, prefs: Preferences): number {
  const noteConstraints = deriveNoteConstraints(prefs.notes);
  const pricePenalty = prefs.budget ? Math.max(0, c.Price - prefs.budget) : 0;
  const preferredMileage = typeof prefs.maxMileage === 'number' && prefs.maxMileage > 0 ? prefs.maxMileage : null;
  const mileagePenalty = preferredMileage && typeof c.Mileage === 'number'
    ? Math.max(0, c.Mileage - preferredMileage) * 0.05
    : 0;
  const ageBonus = Math.max(0, c.Year - 2015) * 100; // newer is better
  const budgetProximity = prefs.budget
    ? Math.max(0, 1 - Math.abs(c.Price - prefs.budget) / Math.max(prefs.budget, 1)) * 1500
    : 0;
  const noteScore = noteMatchScore(c, noteConstraints);
  return -pricePenalty - mileagePenalty + ageBonus + budgetProximity + noteScore;
}

export function pickTopN(cars: Car[], prefs: Preferences, n = 10): Car[] {
  return [...cars]
    .sort((a, b) => scoreCar(b, prefs) - scoreCar(a, prefs))
    .slice(0, n);
}

export function orderCarsForDisplay(cars: Car[], prefs: Preferences): Car[] {
  return [...cars].sort((a, b) => scoreCar(b, prefs) - scoreCar(a, prefs));
}

export function deriveNoteConstraints(notes: string | undefined | null): NoteConstraints {
  const text = (notes || '').toLowerCase();
  const constraints: NoteConstraints = {};
  if (/high\s+mpg|good\s+mpg|great\s+mpg|fuel\s+(efficient|economy)|better\s+mpg/.test(text)) {
    constraints.minMpg = 30;
  }
  const mpgMatch = text.match(/(\d+)\s*mpg/);
  if (mpgMatch) {
    const mpgValue = Number.parseInt(mpgMatch[1], 10);
    if (Number.isFinite(mpgValue)) constraints.minMpg = Math.max(constraints.minMpg ?? 0, mpgValue);
  }
  if (/(awd|all[-\s]?wheel|4x4|4wd|four wheel drive)/.test(text)) {
    constraints.requiresAwd = true;
  }
  const seatingMatch = text.match(/(\d+)\s*(seat|passenger)/);
  if (seatingMatch) {
    const seats = Number.parseInt(seatingMatch[1], 10);
    if (Number.isFinite(seats)) constraints.minSeating = seats;
  }
  if (/suv|sport utility/.test(text)) {
    constraints.preferredCategories = [...new Set([...(constraints.preferredCategories || []), 'suv'])];
  }
  if (/truck/.test(text)) {
    constraints.preferredCategories = [...new Set([...(constraints.preferredCategories || []), 'truck'])];
  }
  if (/sedan|car/.test(text)) {
    constraints.preferredCategories = [...new Set([...(constraints.preferredCategories || []), 'car'])];
  }
  if (/van|minivan/.test(text)) {
    constraints.preferredCategories = [...new Set([...(constraints.preferredCategories || []), 'van'])];
  }
  const mileageMatch = text.match(/under\s+(\d{2,3})(k)?\s+miles/);
  if (mileageMatch) {
    const raw = Number.parseInt(mileageMatch[1], 10);
    if (Number.isFinite(raw)) {
      const value = mileageMatch[2] ? raw * 1000 : raw;
      constraints.maxMileage = value;
    }
  } else if (/low\s+mileage/.test(text)) {
    constraints.maxMileage = 60000;
  }
  if (/hybrid/.test(text)) constraints.preferredFuel = 'Hybrid';
  else if (/(electric|ev\b)/.test(text)) constraints.preferredFuel = 'EV';
  else if (/diesel|gasoline|gas/.test(text)) constraints.preferredFuel = 'Fuel';
  return constraints;
}

export function describeNoteConstraints(constraints: NoteConstraints): string {
  const parts: string[] = [];
  if (constraints.minMpg) parts.push(`Require MPG ≥ ${constraints.minMpg}`);
  if (constraints.requiresAwd) parts.push('Must be AWD / 4x4');
  if (constraints.minSeating) parts.push(`Need at least ${constraints.minSeating} seats`);
  if (constraints.maxMileage) parts.push(`Mileage under ${constraints.maxMileage.toLocaleString()} miles`);
  if (constraints.preferredCategories?.length) parts.push(`Prefer categories: ${constraints.preferredCategories.join(', ')}`);
  if (constraints.preferredFuel) parts.push(`Prefer fuel type: ${constraints.preferredFuel}`);
  return parts.length ? parts.join('; ') : 'No additional hard constraints inferred from notes.';
}

function matchesNoteConstraints(car: Car, constraints: NoteConstraints) {
  if (constraints.minMpg) {
    const mpg = extractAverageMpg(car.MPG);
    if (!mpg || mpg < constraints.minMpg) return false;
  }
  if (constraints.requiresAwd) {
    const drive = (car.Drivetrain || '').toLowerCase();
    if (!drive.includes('all') && !drive.includes('awd') && !drive.includes('4x4') && !drive.includes('4wd')) return false;
  }
  if (constraints.minSeating && typeof car.Seating === 'number' && car.Seating < constraints.minSeating) return false;
  if (constraints.maxMileage && typeof car.Mileage === 'number' && car.Mileage > constraints.maxMileage) return false;
  if (constraints.preferredCategories?.length) {
    const category = (car.VehicleCategory || car.Type || '').toLowerCase();
    const matches = constraints.preferredCategories.some(cat => category.includes(cat));
    if (!matches) return false;
  }
  if (constraints.preferredFuel) {
    const fuel = (car['Fuel Type'] || car.FuelType || '').toLowerCase();
    if (!fuel.startsWith(constraints.preferredFuel.toLowerCase())) return false;
  }
  return true;
}

function noteMatchScore(car: Car, constraints: NoteConstraints) {
  let score = 0;
  if (constraints.minMpg) {
    const mpg = extractAverageMpg(car.MPG);
    if (mpg) score += (mpg - constraints.minMpg) * 40;
  }
  if (constraints.requiresAwd) {
    const drive = (car.Drivetrain || '').toLowerCase();
    if (drive.includes('all') || drive.includes('awd') || drive.includes('4x4') || drive.includes('4wd')) score += 400;
  }
  if (constraints.minSeating && typeof car.Seating === 'number') {
    score += (car.Seating - constraints.minSeating) * 60;
  }
  if (constraints.maxMileage && typeof car.Mileage === 'number') {
    score += Math.max(0, constraints.maxMileage - car.Mileage) * 0.02;
  }
  if (constraints.preferredCategories?.length) {
    const category = (car.VehicleCategory || car.Type || '').toLowerCase();
    if (constraints.preferredCategories.some(cat => category.includes(cat))) score += 200;
  }
  if (constraints.preferredFuel) {
    const fuel = (car['Fuel Type'] || car.FuelType || '').toLowerCase();
    if (fuel.startsWith(constraints.preferredFuel.toLowerCase())) score += 150;
  }
  return score;
}

function extractAverageMpg(mpgString?: string) {
  if (!mpgString) return null;
  const match = mpgString.match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return null;
  const first = Number.parseFloat(match[1]);
  if (!Number.isFinite(first)) return null;
  if (match[2]) {
    const second = Number.parseFloat(match[2]);
    if (Number.isFinite(second)) return (first + second) / 2;
  }
  return first;
}
