import { NextResponse } from 'next/server';
import { AnalyzeResponse, Car, Preferences } from '@/lib/types';
import { filterCars, pickTopN } from '@/lib/util';
import { GoogleGenAI } from '@google/genai';
import { getCsvCars } from '@/data/csvCars.server';

export async function POST(req: Request) {
  try {
    const prefs = (await req.json()) as Preferences;
    const key = (process.env.GEMINI_API_KEY || '').trim();
    const cars = getCsvCars();
    const filtered = filterCars(cars, prefs);
    const fallbackBase = filtered.length ? filtered : cars;

    if (!key) {
      // Fallback: sample filtered (or entire dataset if empty), pick up to 10
      const sampled = sampleRandom(fallbackBase, 10);
      const res: AnalyzeResponse = {
        cars: decorateCarsForClient(sampled, prefs),
        warning: 'Server missing GEMINI_API_KEY. Showing a randomized filtered selection instead.',
      };
      return NextResponse.json(res);
    }

    // With key: use new @google/genai client to choose the best up to 10 by ID
    const ai = new GoogleGenAI({ apiKey: key });
    const { promptCars, totalMatches } = getPromptDataset(filtered, cars, prefs);
    const prompt = buildPrompt(prefs, promptCars, totalMatches);

    let text = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.2, responseMimeType: 'application/json' },
      });
      text = response.text ?? '';
    } catch (error) {
      console.error('Gemini generateContent failed', error);
      const chosen = pickTopN(fallbackBase, prefs, 10);
      return NextResponse.json({
        cars: decorateCarsForClient(chosen, prefs),
        warning: 'Gemini request failed. Using heuristic results.',
      });
    }

    console.log('Gemini response text:', text);

    let ids: number[] = [];
    let reasoning = '';
    let descriptions: Record<string, string> = {};
    try {
      const parsed = JSON.parse(text || '{}');
      ids = parsed.ids as number[];
      reasoning = parsed.reasoning || '';
      if (parsed.descriptions && typeof parsed.descriptions === 'object') {
        descriptions = parsed.descriptions as Record<string, string>;
      }
    } catch {
      const chosen = pickTopN(fallbackBase, prefs, 10);
      return NextResponse.json({
        cars: decorateCarsForClient(chosen, prefs),
        warning: 'Gemini response could not be parsed. Using heuristic results.',
      });
    }

    const map = new Map<number, Car>();
    cars.forEach(c => map.set(c.Id, c));
    const selected: Car[] = ids.map((id: number) => map.get(id)).filter(Boolean) as Car[];

    // Safety: if Gemini returned nothing, fallback to heuristic top N
    const finalCars = selected.length ? selected.slice(0, 10) : pickTopN(fallbackBase, prefs, 10);

    const res: AnalyzeResponse = {
      cars: decorateCarsForClient(finalCars, prefs, descriptions),
      reasoning,
    };
    return NextResponse.json(res);
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Analyze failed', details: message }, { status: 500 });
  }
}

const PROMPT_ROW_LIMIT = 75;
const PROMPT_HEADER = [
  'Id',
  'Model',
  'Year',
  'Price',
  'Mileage',
  'Fuel',
  'Condition',
  'Type',
  'Dealer',
  'DistanceMi',
  'Engine',
  'Transmission',
  'Drivetrain',
  'MPG',
  'ExteriorColor',
  'InteriorColor',
  'Seats',
  'VehicleCategory',
] as const;

function getPromptDataset(filtered: Car[], all: Car[], prefs: Preferences) {
  if (filtered.length) {
    const subset = filtered.length > PROMPT_ROW_LIMIT ? pickTopN(filtered, prefs, PROMPT_ROW_LIMIT) : filtered;
    return {
      promptCars: subset,
      totalMatches: filtered.length,
    };
  }
  const ranked = pickTopN(all, prefs, PROMPT_ROW_LIMIT * 3);
  return {
    promptCars: ranked.slice(0, PROMPT_ROW_LIMIT),
    totalMatches: all.length,
  };
}

function buildPrompt(prefs: Preferences, cars: Car[], totalMatches: number) {
  const csv = carsToCsv(cars);
  const shown = Math.min(cars.length, PROMPT_ROW_LIMIT);
  const mileageText = prefs.maxMileage
    ? `Keep mileage at or below ${prefs.maxMileage} miles whenever possible.`
    : 'When mileage preferences are unspecified, still favor lower mileage.';
  const notes = prefs.notes?.trim() ? prefs.notes.trim() : 'No additional notes provided.';
  return [
    'You are a Toyota inventory matchmaker. Analyze the CSV data below and choose up to 10 listings that best satisfy the user preferences.',
    'Rankings should prioritize staying within budget, matching used/new preference, matching fuel type, respecting any mileage cap, closer dealership (string match), lower mileage, and newer model years.',
    mileageText,
    `User chat notes to reference when writing descriptions: ${notes}`,
    'User preferences (JSON):',
    JSON.stringify(prefs),
    `Only pick Ids that exist in the CSV rows (showing ${shown} of ${totalMatches} matching records).`,
    'Respond with strict JSON: {"ids":[<Id numbers>],"descriptions":{"<Id>":"1-2 sentence reason referencing user notes"},"reasoning":"concise summary"}',
    '',
    'CSV:',
    csv,
  ].join('\n');
}

function carsToCsv(cars: Car[]) {
  const lines = cars.map(car => PROMPT_HEADER.map(col => encodeCsvValue(getCarField(car, col))).join(','));
  return [PROMPT_HEADER.join(','), ...lines].join('\n');
}

function getCarField(car: Car, column: typeof PROMPT_HEADER[number]) {
  switch (column) {
    case 'Id': return car.Id;
    case 'Model': return car.Model;
    case 'Year': return car.Year;
    case 'Price': return car.Price;
    case 'Mileage': return car.Mileage;
    case 'Fuel': return car['Fuel Type'] || car.FuelType;
    case 'Condition': return car.Condition;
    case 'Type': return car.Type;
    case 'Dealer': return car.Dealer || car.Location;
    case 'DistanceMi': return car.DistanceMiles;
    case 'Engine': return car.Engine;
    case 'Transmission': return car.Transmission;
    case 'Drivetrain': return car.Drivetrain;
    case 'MPG': return car.MPG;
    case 'ExteriorColor': return car.ExteriorColor;
    case 'InteriorColor': return car.InteriorColor;
    case 'Seats': return car.Seating;
    case 'VehicleCategory': return car.VehicleCategory || car.Type;
    default: return '';
  }
}

function encodeCsvValue(value: unknown) {
  if (value === undefined || value === null) return '';
  const str = typeof value === 'number' ? Number(value).toString() : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function sampleRandom(cars: Car[], count: number) {
  if (cars.length <= count) return [...cars];
  const picked = new Set<number>();
  const results: Car[] = [];
  while (results.length < count && picked.size < cars.length) {
    const idx = Math.floor(Math.random() * cars.length);
    if (picked.has(idx)) continue;
    picked.add(idx);
    results.push(cars[idx]);
  }
  return results;
}

const DEFAULT_IMAGE_URL = '/car-placeholder.svg';

function decorateCarsForClient(cars: Car[], prefs: Preferences, descriptions?: Record<string, string>) {
  return cars.map(car => {
    const carId = String(car.Id);
    const provided = descriptions?.[carId];
    return {
      ...car,
      ImageUrl: car.ImageUrl || DEFAULT_IMAGE_URL,
      FitDescription: buildFallbackDescription(car, prefs, provided),
    };
  });
}

function buildFallbackDescription(car: Car, prefs: Preferences, provided?: string) {
  if (provided && provided.trim()) return provided.trim();
  const notes = (prefs.notes || '').trim();
  const intro = notes ? `You mentioned "${notes}", so` : 'This pick';
  const mileage = typeof car.Mileage === 'number'
    ? `${car.Mileage.toLocaleString()} miles on the odometer`
    : 'dealer-reported mileage that will need confirming';
  const fuel = car['Fuel Type'] || car.FuelType || 'versatile fuel setup';
  const dealer = car.Dealer ? ` at ${car.Dealer}` : '';
  const budgetLine = prefs.budget ? ` It stays near your $${prefs.budget.toLocaleString()} target.` : '';
  return `${intro} the ${car.Year} ${car.Model}${dealer} delivers ${mileage}, ${fuel.toLowerCase()} efficiency, and daily comfort that aligns with your priorities.${budgetLine}`;
}
