import { Car } from './types';

const LIKES_KEY = 'toyotaTinder.likes';
const RESULTS_KEY = 'toyotaTinder.results';
const META_KEY = 'toyotaTinder.resultsMeta';

export function getLikes(): number[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LIKES_KEY) || '[]'); } catch { return []; }
}
export function addLike(id: number) {
  const ids = new Set(getLikes());
  ids.add(id);
  localStorage.setItem(LIKES_KEY, JSON.stringify([...ids]));
}
export function clearLikes() { localStorage.removeItem(LIKES_KEY); }

export function saveResults(cars: Car[], meta?: any) {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(cars));
  if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
}
export function loadResults(): Car[] {
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]'); } catch { return []; }
}
export function loadResultsMeta(): any {
  try { return JSON.parse(localStorage.getItem(META_KEY) || 'null'); } catch { return null; }
}