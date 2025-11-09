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
        cars: sampled,
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
        cars: chosen,
        warning: 'Gemini request failed. Using heuristic results.',
      });
    }

    console.log('Gemini response text:', text);

    let ids: number[] = [];
    let reasoning = '';
    try {
      const parsed = JSON.parse(text || '{}');
      ids = parsed.ids as number[];
      reasoning = parsed.reasoning || '';
    } catch {
      const chosen = pickTopN(fallbackBase, prefs, 10);
      return NextResponse.json({ cars: chosen, warning: 'Gemini response could not be parsed. Using heuristic results.' });
    }

    const map = new Map<number, Car>();
    cars.forEach(c => map.set(c.Id, c));
    const selected: Car[] = ids.map((id: number) => map.get(id)).filter(Boolean) as Car[];

    // Safety: if Gemini returned nothing, fallback to heuristic top N
    const finalCars = selected.length ? selected.slice(0, 10) : pickTopN(fallbackBase, prefs, 10);

    const res: AnalyzeResponse = { cars: finalCars, reasoning };
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
  return [
    'You are a Toyota inventory matchmaker. Analyze the CSV data below and choose up to 10 listings that best satisfy the user preferences.',
    'Rankings should prioritize staying within budget, matching used/new preference, matching fuel type, better condition, closer dealership (string match), lower mileage, and newer model years.',
    'User preferences (JSON):',
    JSON.stringify(prefs),
    `Only pick Ids that exist in the CSV rows (showing ${shown} of ${totalMatches} matching records).`,
    'Respond with strict JSON: {"ids":[<Id numbers>],"reasoning":"concise summary"}',
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
