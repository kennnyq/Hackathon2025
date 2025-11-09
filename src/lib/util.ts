import { Car, Preferences } from './types';

type NoteConstraints = {
  minMpg?: number;
  requiresAwd?: boolean;
  minSeating?: number;
  preferredCategories?: string[];
  maxMileage?: number;
  preferredFuel?: 'Hybrid' | 'Electric' | 'Gas' | 'Other';
};

export function normalizeFuel(car: Car) {
  const raw = (car.FuelType || car["Fuel Type"] || '').toLowerCase();
  if (!raw) return '';
  if (raw.includes('hybrid')) return 'hybrid';
  if (raw.includes('ev') || raw.includes('electric')) return 'electric';
  if (raw.includes('diesel') || raw.includes('gasoline') || raw.includes('gas') || raw.includes('fuel') || raw.includes('petrol')) return 'gas';
  if (raw.includes('hydrogen') || raw.includes('plug-in')) return 'other';
  return raw.split(' ')[0] || 'gas';
}

export function filterCars(cars: Car[], prefs: Preferences): Car[] {
  const noteConstraints = deriveNoteConstraints(prefs.notes);
  const priceMin = toNumber(prefs.priceMin);
  const priceMax = toNumber(prefs.priceMax);
  const yearMin = toNumber(prefs.yearMin);
  const yearMax = toNumber(prefs.yearMax);
  const mileageMin = toNumber(prefs.mileageMin);
  const mileageMax = toNumber(prefs.mileageMax);
  const seatsMin = toNumber(prefs.seatsMin);
  const seatsMax = toNumber(prefs.seatsMax);
  const mpgMin = toNumber(prefs.mpgMin);
  const mpgMax = toNumber(prefs.mpgMax);
  const bodyTypes = (prefs.bodyTypes || []).map(b => b.toLowerCase());
  const fuelTypes = (prefs.fuelTypes || []).map(f => f.toLowerCase());

  return cars.filter(c => {
    const fuel = normalizeFuel(c);
    const carBody = (c.VehicleCategory || c.Type || '').toLowerCase();
    const mileageValue = typeof c.Mileage === 'number' ? c.Mileage : null;
    const mpg = extractAverageMpg(c.MPG);
    const seatsValue = typeof c.Seating === 'number' ? c.Seating : null;

    const usedOk = prefs.used === 'Any' || (prefs.used === 'Used' ? c.Used : !c.Used);
    const fuelOk = !fuelTypes.length || (fuel && fuelTypes.includes(fuel));
    const priceOk =
      (priceMin == null || c.Price >= priceMin) &&
      (priceMax == null || c.Price <= priceMax);
    const mileageOk =
      (mileageMin == null || mileageValue === null || mileageValue >= mileageMin) &&
      (mileageMax == null || mileageValue === null || mileageValue <= mileageMax);
    const bodyOk = !bodyTypes.length || bodyTypes.some(type => carBody.includes(type));
    const yearOk =
      (yearMin == null || c.Year >= yearMin) &&
      (yearMax == null || c.Year <= yearMax);
    const seatsOk =
      (seatsMin == null || seatsValue === null || seatsValue >= seatsMin) &&
      (seatsMax == null || seatsValue === null || seatsValue <= seatsMax);
    const mpgOk =
      (mpgMin == null || mpg === null || mpg >= mpgMin) &&
      (mpgMax == null || mpg === null || mpg <= mpgMax);
    const notesOk = matchesNoteConstraints(c, noteConstraints);
    return usedOk && fuelOk && priceOk && mileageOk && bodyOk && yearOk && seatsOk && mpgOk && notesOk;
  });
}

export function scoreCar(c: Car, prefs: Preferences): number {
  const noteConstraints = deriveNoteConstraints(prefs.notes);
  const priceMax = toNumber(prefs.priceMax);
  const priceMin = toNumber(prefs.priceMin);
  const mileageMax = toNumber(prefs.mileageMax);
  const mileageMin = toNumber(prefs.mileageMin);
  const yearMax = toNumber(prefs.yearMax);
  const yearMin = toNumber(prefs.yearMin);
  const seatsMax = toNumber(prefs.seatsMax);
  const seatsMin = toNumber(prefs.seatsMin);
  const mpgMin = toNumber(prefs.mpgMin);
  const mpgMax = toNumber(prefs.mpgMax);
  const mileageValue = typeof c.Mileage === 'number' ? c.Mileage : null;
  const mpgValue = extractAverageMpg(c.MPG);
  const seatsValue = typeof c.Seating === 'number' ? c.Seating : null;

  const targetPrice = midpoint(priceMin, priceMax);
  const pricePenalty = priceMax ? Math.max(0, c.Price - priceMax) * 0.4 : 0;
  const priceFloorPenalty = priceMin ? Math.max(0, priceMin - c.Price) * 0.25 : 0;
  const priceAffinity = targetPrice
    ? Math.max(0, 1 - Math.abs(c.Price - targetPrice) / Math.max(targetPrice, 1)) * 2200
    : 0;

  const mileagePenalty = mileageMax && mileageValue !== null
    ? Math.max(0, mileageValue - mileageMax) * 0.04
    : 0;
  const mileageFloorPenalty = mileageMin && mileageValue !== null
    ? Math.max(0, mileageMin - mileageValue) * 0.02
    : 0;
  const mileageBonus = mileageMax && mileageValue !== null
    ? Math.max(0, mileageMax - mileageValue) * 0.015
    : 0;

  const recencyTarget = yearMax ?? new Date().getFullYear();
  const recencyFloor = yearMin ?? 2015;
  const ageBonus = Math.max(0, c.Year - recencyFloor) * 85;
  const yearCeilingPenalty = yearMax ? Math.max(0, c.Year - yearMax) * 60 : 0;
  const yearFloorPenalty = yearMin ? Math.max(0, yearMin - c.Year) * 140 : 0;
  const recencyBonus = Math.max(0, c.Year - (recencyTarget - 2)) * 50;

  const mpgBonus = mpgMin && mpgValue
    ? Math.max(0, mpgValue - mpgMin) * 70
    : 0;
  const mpgCeilingPenalty = mpgMax && mpgValue
    ? Math.max(0, mpgValue - mpgMax) * 25
    : 0;

  const seatingScore = computeSeatingScore(seatsValue, seatsMin, seatsMax);

  const bodyScore = computeBodyMatchScore(c, prefs.bodyTypes);
  const fuelScore = computeFuelMatchScore(c, prefs.fuelTypes);
  const usedScore = prefs.used === 'Any'
    ? 0
    : (prefs.used === 'Used'
      ? (c.Used ? 450 : -450)
      : (!c.Used ? 450 : -450));

  const noteScore = noteMatchScore(c, noteConstraints);

  return (
    priceAffinity
    + mileageBonus
    + ageBonus
    + recencyBonus
    + mpgBonus
    + seatingScore
    + bodyScore
    + fuelScore
    + usedScore
    + noteScore
    - pricePenalty
    - priceFloorPenalty
    - mileagePenalty
    - mileageFloorPenalty
    - yearCeilingPenalty
    - yearFloorPenalty
    - mpgCeilingPenalty
  );
}

export function pickTopN(cars: Car[], prefs: Preferences, n = 10): Car[] {
  const sorted = [...cars].sort((a, b) => scoreCar(b, prefs) - scoreCar(a, prefs));
  return promoteModelVariety(sorted, n);
}

export function orderCarsForDisplay(cars: Car[], prefs: Preferences): Car[] {
  const sorted = [...cars].sort((a, b) => scoreCar(b, prefs) - scoreCar(a, prefs));
  return promoteModelVariety(sorted, sorted.length);
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
    addPreferredCategories(constraints, ['suv']);
  }
  if (/truck/.test(text)) {
    addPreferredCategories(constraints, ['truck']);
  }
  if (/sedan|car/.test(text)) {
    addPreferredCategories(constraints, ['car']);
  }
  if (/van|minivan/.test(text)) {
    addPreferredCategories(constraints, ['van']);
  }
  const largeVehicleIntent = hasLargeVehicleIntent(text);
  if (largeVehicleIntent) {
    addPreferredCategories(constraints, ['suv', 'truck', 'van']);
    const desiredSeats = Math.max(constraints.minSeating ?? 0, 6);
    constraints.minSeating = desiredSeats;
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
  else if (/(electric|ev\b)/.test(text)) constraints.preferredFuel = 'Electric';
  else if (/diesel|gasoline|gas/.test(text)) constraints.preferredFuel = 'Gas';
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

function addPreferredCategories(constraints: NoteConstraints, categories: string[]) {
  const existing = new Set((constraints.preferredCategories || []).map(cat => cat.toLowerCase()));
  categories.forEach(category => {
    if (category) existing.add(category.toLowerCase());
  });
  constraints.preferredCategories = Array.from(existing);
}

function hasLargeVehicleIntent(text: string): boolean {
  const sizeKeywords = ['large', 'larger', 'big', 'bigger', 'spacious', 'roomy', 'full size', 'full-size'];
  const contextKeywords = ['car', 'vehicle', 'suv', 'truck', 'van', 'minivan', 'ride', 'hauler', 'family', 'roadtrip', 'road trip', 'road-trip', 'camping', 'cargo', 'third row', '3rd row', 'three row'];
  const sizeMentioned = sizeKeywords.some(keyword => text.includes(keyword));
  const contextMentioned = contextKeywords.some(keyword => text.includes(keyword));
  if (sizeMentioned && contextMentioned) return true;
  const haulingMentions = /(haul|hauling|gear|luggage)/.test(text);
  return haulingMentions || /(third|3rd)\s*row/.test(text);
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
    const normalizedFuel = normalizeFuel(car);
    const desired = constraints.preferredFuel.toLowerCase();
    if (!normalizedFuel) return false;
    if (desired === 'other') {
      if (normalizedFuel === 'gas' || normalizedFuel === 'hybrid' || normalizedFuel === 'electric') return false;
    } else if (normalizedFuel !== desired) {
      return false;
    }
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
    const normalizedFuel = normalizeFuel(car);
    const desired = constraints.preferredFuel.toLowerCase();
    const fuelMatches = desired === 'other'
      ? Boolean(normalizedFuel && normalizedFuel !== 'gas' && normalizedFuel !== 'hybrid' && normalizedFuel !== 'electric')
      : normalizedFuel === desired;
    if (fuelMatches) score += 180;
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

function computeBodyMatchScore(car: Car, bodyTypes: Preferences['bodyTypes']) {
  if (!bodyTypes?.length) return 0;
  const body = (car.VehicleCategory || car.Type || '').toLowerCase();
  if (!body) return -120;
  const matches = bodyTypes.some(type => body.includes(type.toLowerCase()));
  return matches ? 320 : -180;
}

function computeFuelMatchScore(car: Car, fuelTypes: Preferences['fuelTypes']) {
  if (!fuelTypes?.length) return 0;
  const normalizedFuel = normalizeFuel(car) || 'gas';
  const matches = fuelTypes.some(fuel => fuel.toLowerCase() === normalizedFuel);
  return matches ? 260 : -160;
}

function computeSeatingScore(value: number | null, seatsMin?: number | null, seatsMax?: number | null) {
  if (seatsMin == null && seatsMax == null) return 0;
  if (value === null) return -60;
  let score = 0;
  if (seatsMin != null) {
    score += (value - seatsMin) * 90;
  }
  if (seatsMax != null && value > seatsMax) {
    score -= (value - seatsMax) * 75;
  }
  return score;
}

function toNumber(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function midpoint(min?: number | null, max?: number | null) {
  const minVal = toNumber(min);
  const maxVal = toNumber(max);
  if (minVal != null && maxVal != null) return (minVal + maxVal) / 2;
  if (maxVal != null) return maxVal * 0.9;
  if (minVal != null) return minVal * 1.1;
  return null;
}

function promoteModelVariety(cars: Car[], limit = cars.length): Car[] {
  const target = Math.min(limit, cars.length);
  if (target <= 1) return cars.slice(0, target);

  const buckets = new Map<string, Car[]>();
  cars.forEach(car => {
    const key = normalizeModelKey(car.Model);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(car);
    } else {
      buckets.set(key, [car]);
    }
  });

  const diversified: Car[] = [];
  const bucketList = Array.from(buckets.values());
  let depth = 0;

  while (diversified.length < target) {
    let addedThisPass = false;
    for (const bucket of bucketList) {
      if (bucket.length > depth) {
        diversified.push(bucket[depth]);
        addedThisPass = true;
        if (diversified.length === target) {
          return diversified;
        }
      }
    }
    if (!addedThisPass) break;
    depth += 1;
  }

  return diversified;
}

const MODEL_NAME_OVERRIDES: Array<{ regex: RegExp; key: string }> = [
  { regex: /^corolla\s+cross/, key: 'corolla cross' },
  { regex: /^crown\s+signia/, key: 'crown signia' },
  { regex: /^grand\s+highlander/, key: 'grand highlander' },
  { regex: /^land\s+cruiser/, key: 'land cruiser' },
  { regex: /^gr\s*supra/, key: 'gr supra' },
  { regex: /^gr\s*corolla/, key: 'gr corolla' },
  { regex: /^gr\s*86/, key: 'gr86' },
  { regex: /^c\s*-?\s*hr/, key: 'c-hr' },
  { regex: /^b\s*z4x/, key: 'bz4x' },
  { regex: /^prius\s+prime/, key: 'prius' },
];

const TRIM_TOKENS = new Set([
  'le',
  'se',
  'l',
  'xl',
  'xle',
  'xse',
  'xe',
  'limited',
  'platinum',
  'premium',
  'nightshade',
  'trd',
  'trail',
  'capstone',
  'sr',
  'sr5',
  'sport',
  'hybrid',
  'prime',
  'plugin',
  'plug',
  'phev',
  'awd',
  'fwd',
  '2wd',
  '4wd',
  '4x4',
  'edition',
  'plus',
  'cab',
  'crew',
  'double',
  'access',
  'base',
  'standard',
  'xlt',
  'luxury',
  'apex',
]);

function normalizeModelKey(model?: string | null) {
  if (!model) return 'unknown';
  const normalized = model
    .toLowerCase()
    .replace(/toyota/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return 'unknown';

  for (const { regex, key } of MODEL_NAME_OVERRIDES) {
    if (regex.test(normalized)) return key;
  }

  const tokens = normalized.split(' ');
  const baseTokens: string[] = [];
  for (const token of tokens) {
    const cleaned = token.replace(/[^a-z0-9]/g, '');
    if (!cleaned) continue;
    if (cleaned.length === 4 && /^\d+$/.test(cleaned)) continue; // skip years & 1794 trims
    const isTrim = TRIM_TOKENS.has(cleaned);
    if (!baseTokens.length && isTrim) continue;
    if (baseTokens.length && isTrim) break;
    baseTokens.push(cleaned);
    if (baseTokens.length === 1) break;
  }

  return baseTokens.length ? baseTokens.join(' ') : normalized;
}
