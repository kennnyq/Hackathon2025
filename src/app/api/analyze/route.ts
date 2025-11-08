import { NextResponse } from 'next/server';
import cars from '@/data/cars.json';
import { AnalyzeResponse, Car, Preferences } from '@/lib/types';
import { filterCars, pickTopN } from '@/lib/util';

export async function POST(req: Request) {
  try {
    const prefs = (await req.json()) as Preferences;
    const key = (prefs.apiKey || process.env.GEMINI_API_KEY || '').trim();

    const filtered = filterCars(cars as Car[], prefs);

    if (!key) {
      // Fallback: shuffle filtered (or entire dataset if empty), pick up to 10
      const base = filtered.length ? filtered : (cars as Car[]);
      const shuffled = [...base].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, Math.min(10, shuffled.length));
      const res: AnalyzeResponse = {
        cars: chosen,
        warning: 'No Gemini API key provided. Showing a randomized filtered selection instead.',
      };
      return NextResponse.json(res);
    }

    // With key: ask Gemini to choose the best up to 10 by ID
    const prompt = buildPrompt(prefs, cars as Car[], filtered);
    const gem = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!gem.ok) throw new Error(`Gemini request failed (${gem.status})`);
    const out = await gem.json();
    const text = out?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let ids: number[] = [];
    let reasoning = '';
    try {
      const parsed = JSON.parse(text);
      ids = parsed.ids as number[];
      reasoning = parsed.reasoning || '';
    } catch {
      // If parse fails, fall back to heuristic top N
      const chosen = pickTopN(filtered.length ? filtered : (cars as Car[]), prefs, 10);
      return NextResponse.json({ cars: chosen, warning: 'Gemini response could not be parsed. Using heuristic results.' });
    }

    const map = new Map<number, Car>();
    (cars as Car[]).forEach(c => map.set(c.Id, c));
    const selected: Car[] = ids.map((id: number) => map.get(id)).filter(Boolean) as Car[];

    // Safety: if Gemini returned nothing, fallback to heuristic top N
    const finalCars = selected.length ? selected.slice(0, 10) : pickTopN(filtered.length ? filtered : (cars as Car[]), prefs, 10);

    const res: AnalyzeResponse = { cars: finalCars, reasoning };
    return NextResponse.json(res);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Analyze failed', details: String(err?.message || err) }, { status: 500 });
  }
}

function buildPrompt(prefs: Preferences, all: Car[], filtered: Car[]) {
  const trimmed = (filtered.length ? filtered : all).slice(0, 50); // cap prompt size
  const data = JSON.stringify(trimmed);
  return `You are a car‑matching assistant. The user preferences are:\n${JSON.stringify(prefs)}\n\n` +
    `From the following Toyota listings (JSON array), choose up to 10 that best fit. \n` +
    `Prefer cars under budget, closer to location string match, correct fuel type, desired condition, and newer year.\n` +
    `Return STRICT JSON: {\"ids\":[<Id numbers>],\"reasoning\":\"short explanation\"}.\n\nLISTINGS:\n${data}`;
}