import { Car } from './types';

export type ResultsMeta = {
  warning?: string;
  reasoning?: string;
};

const LIKES_KEY = 'toyotaTinder.likes';
const LIKE_DETAILS_KEY = 'toyotaTinder.likeDetails';
const RESULTS_KEY = 'toyotaTinder.results';
const META_KEY = 'toyotaTinder.resultsMeta';

export function getLikes(): number[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LIKES_KEY) || '[]'); } catch { return []; }
}

export function addLike(car: Car) {
  if (typeof window === 'undefined') return;
  const ids = new Set(getLikes());
  ids.add(car.Id);
  localStorage.setItem(LIKES_KEY, JSON.stringify([...ids]));
  const details = getLikeDetails();
  details[String(car.Id)] = car;
  localStorage.setItem(LIKE_DETAILS_KEY, JSON.stringify(details));
}

export function getLikedCars(): Car[] {
  if (typeof window === 'undefined') return [];
  const ids = getLikes();
  const details = getLikeDetails();
  return ids.map(id => details[String(id)]).filter(Boolean);
}

export function clearLikes() {
  localStorage.removeItem(LIKES_KEY);
  localStorage.removeItem(LIKE_DETAILS_KEY);
}

export function saveResults(cars: Car[], meta?: ResultsMeta | null) {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(cars));
  if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function loadResults(): Car[] {
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]'); } catch { return []; }
}

export function loadResultsMeta(): ResultsMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ResultsMeta;
  } catch {
    return null;
  }
}

function getLikeDetails(): Record<string, Car> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LIKE_DETAILS_KEY) || '{}'); } catch { return {}; }
}
