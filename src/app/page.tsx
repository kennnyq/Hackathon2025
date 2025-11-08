import NavBar from '@/components/NavBar';
import CTA from '@/components/CTA';

export default function Page() {
  return (
    <main>
      <NavBar />
      <CTA />
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="card">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-3 list-decimal list-inside text-white/80 space-y-1">
            <li>Tell us your budget & preferences.</li>
            <li>We analyze with Gemini (or fall back to a quick filter).</li>
            <li>Swipe through up to 10 curated Toyota matches.</li>
            <li>View (and export) your liked cars.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}