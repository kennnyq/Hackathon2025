import NavBar from '@/components/NavBar';
import LoginForm from './LoginForm';

type LoginPageProps = {
  searchParams?: {
    next?: string | string[];
  };
};

function resolveNextPath(value?: string | string[]) {
  if (!value) return '/find';
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return '/find';
  const trimmed = raw.trim();
  if (!trimmed || !trimmed.startsWith('/')) return '/find';
  return trimmed;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = resolveNextPath(searchParams?.next);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <NavBar />
      <div className="page-fade-in mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center">
        <section className="flex-1">
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">
            Log in to start matching
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Sign in with your pit-crew credentials to unlock tailored Toyota matches, swipe through curated lineups, and keep track of every car that sparks joy.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Personalized recommendations powered by your inputs.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Save likes and revisit every favorite ride.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Export-ready summaries when you&apos;re ready to buy.
            </li>
          </ul>
        </section>

        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
