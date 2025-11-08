import Link from 'next/link';

export default function CTA() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
          Toyota matchmaking
        </p>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mt-4">
          Find your <span className="text-red-600">perfect Toyota</span>
        </h1>
        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
          Answer a few quick questions, let AI do the sorting, and swipe through the red-hot short list.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/find" className="btn btn-primary">Start Matching</Link>
          <Link href="/liked" className="btn btn-outline">View Liked</Link>
        </div>
      </div>
    </section>
  );
}
