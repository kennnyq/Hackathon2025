import fs from 'fs';
import path from 'path';
import { Car } from '@/lib/types';

const CSV_PATH = path.join(process.cwd(), 'src/data/CarData.csv');

let cachedCars: Car[] | null = null;

export function getCsvCars(): Car[] {
  if (cachedCars) return cachedCars;
  cachedCars = loadCsv();
  return cachedCars;
}

function loadCsv(): Car[] {
  if (!fs.existsSync(CSV_PATH)) return [];
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter(line => line.trim().length);
  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]);
  const cars: Car[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const values = parseCsvLine(line);
    if (!values.length) continue;
    const record: Record<string, string> = {};
    header.forEach((key, idx) => {
      record[key] = values[idx] ?? '';
    });
    const car = recordToCar(record, cars.length + 1);
    if (car) cars.push(car);
  }
  return cars;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const peek = line[i + 1];
      if (inQuotes && peek === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values.map(val => val.trim());
}

function recordToCar(record: Record<string, string>, id: number): Car | null {
  const price = Number.parseFloat(record.price);
  if (!Number.isFinite(price)) return null;

  const mileage = Number.parseFloat(record.mileage);
  const year = Number.parseInt(record.year, 10);
  const distance = Number.parseFloat(record.distance_from_richardson_mi);
  const dealer = record.dealership_name?.trim();
  const conditionRaw = (record.condition || '').toLowerCase();
  const used = conditionRaw !== 'new';
  const fuelCategory = formatFuelCategory(record.fuel_type);
  const seating = Number.parseInt(record.available_seating, 10);
  const vehicleCategory = formatVehicleCategory(record.vehicle_category, record.model);

  const car: Car = {
    Id: id,
    Model: record.model?.trim() || 'Toyota',
    Price: Math.round(price),
    Used: used,
    Location: buildLocation(dealer, distance),
    'Fuel Type': fuelCategory,
    FuelType: fuelCategory,
    Condition: deriveCondition(conditionRaw, mileage),
    Year: Number.isFinite(year) ? year : 0,
    Type: vehicleCategory || inferType(record.model),
    VehicleCategory: vehicleCategory || undefined,
    Mileage: Number.isFinite(mileage) ? Math.round(mileage) : undefined,
    Engine: record.engine?.trim() || undefined,
    Transmission: record.transmission?.trim() || undefined,
    Drivetrain: record.drivetrain?.trim() || undefined,
    MPG: record.mpg?.trim() || undefined,
    ExteriorColor: record.exterior_color?.trim() || undefined,
    InteriorColor: record.interior_color?.trim() || undefined,
    Dealer: dealer || undefined,
    DistanceMiles: Number.isFinite(distance) ? Number(distance.toFixed(1)) : undefined,
    Seating: Number.isFinite(seating) ? seating : deriveSeating(record.model, vehicleCategory),
  };

  return car;
}

function buildLocation(dealer?: string, distance?: number) {
  const hasDistance = Number.isFinite(distance);
  if (!dealer && !hasDistance) return 'Unknown dealer';
  if (dealer && hasDistance) {
    return `${dealer} (${distance!.toFixed(1)} mi from Richardson)`;
  }
  if (dealer) return dealer;
  return `${distance!.toFixed(1)} mi away`;
}

function formatFuelCategory(raw: string) {
  const normalized = (raw || '').toLowerCase();
  if (!normalized) return 'Fuel';
  if (normalized.includes('hybrid')) return 'Hybrid';
  if (normalized.includes('electric') || normalized.includes('ev')) return 'EV';
  if (normalized.includes('hydrogen')) return 'Other';
  if (normalized.includes('gas') || normalized.includes('fuel') || normalized.includes('petrol') || normalized.includes('diesel')) return 'Fuel';
  return 'Other';
}

function deriveCondition(rawCondition: string, mileage?: number) {
  if (rawCondition === 'new') return 'Excellent';
  if (!Number.isFinite(mileage)) return 'Good';
  if ((mileage || 0) < 20000) return 'Excellent';
  if ((mileage || 0) < 90000) return 'Good';
  return 'Fair';
}

function formatVehicleCategory(raw: string | undefined, model: string | undefined) {
  const normalized = (raw || '').trim();
  if (normalized) return normalizeCategoryLabel(normalized);
  return normalizeCategoryLabel(inferType(model || ''));
}

function normalizeCategoryLabel(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes('truck')) return 'Trucks';
  if (lower.includes('van')) return 'Minivan';
  if (lower.includes('suv')) return 'SUVs';
  if (lower.includes('cross')) return 'Crossovers';
  if (lower.includes('sedan') || lower.includes('car') || lower.includes('coupe') || lower.includes('hatch')) return 'Cars';
  return value.trim();
}

function deriveSeating(model: string | undefined, vehicleCategory?: string) {
  const value = (model || '').toLowerCase();
  const has = (...keywords: string[]) => keywords.some(k => value.includes(k));
  if (has('sienna')) return 8;
  if (has('sequoia') || has('grand highlander') || has('land cruiser')) return 8;
  if (has('highlander') || has('4runner')) return 7;
  if (has('supra')) return 2;
  if (has('gr86') || has('gr 86')) return 4;
  if (has('tundra') || has('tacoma')) return 5;
  if (vehicleCategory === 'Minivan') return 8;
  if (vehicleCategory === 'SUVs') return 7;
  if (vehicleCategory === 'Trucks') return 5;
  return 5;
}

function inferType(model: string) {
  const value = (model || '').toLowerCase();
  if (includesOne(value, ['tacoma', 'tundra'])) return 'Truck';
  if (includesOne(value, ['sienna'])) return 'Van';
  if (includesOne(value, ['rav4', 'ravo', '4runner', 'highlander', 'land cruiser', 'sequoia', 'corolla cross', 'grand highlander', 'venza', 'c-hr'])) {
    return 'SUV';
  }
  if (includesOne(value, ['prius', 'corolla', 'camry', 'avalon', 'crown', 'mirai', 'yaris'])) return 'Sedan';
  if (includesOne(value, ['supra', 'gr86', '86', 'gr corolla'])) return 'Other';
  return 'Other';
}

function includesOne(value: string, words: string[]) {
  return words.some(word => value.includes(word));
}
