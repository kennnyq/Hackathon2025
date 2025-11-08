import Link from 'next/link';


export default function CTA() {
return (
<section className="relative">
<div className="mx-auto max-w-5xl px-4 pt-24 pb-16 text-center">
<h1 className="text-5xl md:text-6xl font-black tracking-tight">
Find your <span className="text-fuchsia-400">perfect Toyota</span>
</h1>
<p className="mt-4 text-white/80 max-w-2xl mx-auto">
Answer a few quick questions and swipe through curated matches.
</p>
<div className="mt-8 flex items-center justify-center gap-3">
<Link href="/find" className="btn btn-primary">Start Matching</Link>
<Link href="/liked" className="btn btn-outline">View Liked</Link>
</div>
</div>
</section>
);
}