'use client';

const APR_DEALS_URL = 'https://www.toyota.com/deals-incentives/apr/';
const TOOLTIP_TEXT =
  'Estimate uses a sample 7% APR over 72 months. Some Toyota incentives advertise up to 0% APR—tap to explore the latest offers.';

type Props = { className?: string };

export function AprInfoIcon({ className = '' }: Props) {
  return (
    <span
      role="img"
      aria-label={TOOLTIP_TEXT}
      title={TOOLTIP_TEXT}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-600 shadow-sm ${className}`}
    >
      i
    </span>
  );
}

export function AprDealsLink({ className = '' }: Props) {
  return (
    <a
      href={APR_DEALS_URL}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition hover:text-red-500 ${className}`}
    >
      See up to 0% APR deals
      <span aria-hidden="true">↗</span>
    </a>
  );
}
