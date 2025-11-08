import NavBar from '@/components/NavBar';
import CTA from '@/components/CTA';
import StackedHighlights from '@/components/StackedHighlights';

export default function Page() {
  return (
    <main>
      <NavBar />
      <CTA />
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">How it works</p>
            <div className="card mt-3">
              <h2 className="text-2xl font-bold">The ToyotaTinder flow</h2>
              <ol className="mt-3 list-decimal list-inside text-slate-600 space-y-1">
                <li>Tell us your budget & preferences.</li>
                <li>We analyze with Gemini (or fall back to a quick filter).</li>
                <li>Swipe through up to 10 curated Toyota matches.</li>
                <li>View (and export) your liked cars.</li>
              </ol>
            </div>
          </div>
          <StackedHighlights className="mt-3 md:mt-0 max-w-md w-full mx-auto" />
        </div>
      </section>
    </main>
  );
}
