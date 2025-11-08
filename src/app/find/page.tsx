'use client';
import NavBar from '@/components/NavBar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Preferences, AnalyzeResponse } from '@/lib/types';
import { saveResults } from '@/lib/likes';

export default function FindPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const prefs: Preferences = {
      budget: Number(fd.get('budget') || 0),
      used: (fd.get('used') as any) || 'Any',
      location: String(fd.get('location') || ''),
      fuelType: (fd.get('fuelType') as any) || 'Any',
      condition: (fd.get('condition') as any) || 'Any',
      notes: String(fd.get('notes') || ''),
      apiKey: String(fd.get('apiKey') || '').trim() || undefined,
    };
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Failed to analyze');
      const data: AnalyzeResponse = await res.json();
      saveResults(data.cars, { warning: data.warning, reasoning: data.reasoning });
      router.push('/swipe');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally { setLoading(false); }
  }

  return (
    <main>
      <NavBar />
      <section className="mx-auto max-w-3xl px-4 pt-12 pb-24">
        <h1 className="text-3xl font-bold">Your preferences</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 card">
          <div>
            <label className="label" htmlFor="budget">Budget (USD)</label>
            <input className="input" id="budget" name="budget" type="number" min={0} placeholder="30000" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="used">New / Used</label>
              <select className="select" id="used" name="used" defaultValue="Any">
                <option>Any</option>
                <option>New</option>
                <option>Used</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="fuelType">Fuel Type</label>
              <select className="select" id="fuelType" name="fuelType" defaultValue="Any">
                <option>Any</option>
                <option>Hybrid</option>
                <option>EV</option>
                <option>Fuel</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="condition">Condition</label>
              <select className="select" id="condition" name="condition" defaultValue="Any">
                <option>Any</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Fair</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input className="input" id="location" name="location" placeholder="Dallas, TX" />
          </div>
          <div>
            <label className="label" htmlFor="notes">Additional details</label>
            <textarea className="textarea" id="notes" name="notes" rows={4} placeholder="Must fit 2 car seats, highway commute, AWD preferred..." />
          </div>

          <details className="mt-2">
            <summary className="cursor-pointer text-slate-600">Optional: Gemini API key</summary>
            <div className="mt-2">
              <input className="input" id="apiKey" name="apiKey" placeholder="Paste key or set GEMINI_API_KEY in .env.local" />
              <p className="text-xs text-slate-500 mt-1">Key is used only server-side in this request, never stored.</p>
            </div>
          </details>

          <div className="flex items-center gap-3 pt-2">
            <button disabled={loading} className="btn btn-primary" type="submit">
              {loading ? 'Analyzing…' : 'Find Matches'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      </section>
    </main>
  );
}
