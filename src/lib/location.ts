import zipcodes from 'zipcodes';
import { DEALER_LOCATIONS, DealerLocation } from '@/data/dealers';

export type Coordinates = { lat: number; lon: number };

export const DEFAULT_ZIP_CODE = '75080';

export function normalizeZipCode(input?: string | null): string {
  if (!input) return DEFAULT_ZIP_CODE;
  const trimmed = input.trim();
  if (/^\d{5}$/.test(trimmed)) return trimmed;
  return DEFAULT_ZIP_CODE;
}

export function getZipCoordinates(zip: string): Coordinates | null {
  const lookup = zipcodes.lookup(zip);
  if (!lookup) return null;
  const lat = Number(lookup.latitude);
  const lon = Number(lookup.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

export function getDealerLocation(name?: string | null): (DealerLocation & { coordinates: Coordinates }) | null {
  if (!name) return null;
  const meta = DEALER_LOCATIONS[name];
  if (!meta) return null;
  const coordinates = getZipCoordinates(meta.zip);
  if (!coordinates) return null;
  return { ...meta, coordinates };
}

export function computeDistanceMiles(from: Coordinates, to: Coordinates): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = degreesToRadians(to.lat - from.lat);
  const dLon = degreesToRadians(to.lon - from.lon);
  const lat1 = degreesToRadians(from.lat);
  const lat2 = degreesToRadians(to.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}
