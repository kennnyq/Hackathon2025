import NavBar from '@/components/NavBar';
import SignupForm from './SignupForm';

type SignupPageProps = {
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

export default function SignupPage({ searchParams }: SignupPageProps) {
  const nextPath = resolveNextPath(searchParams?.next);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <NavBar />
      <div className="page-fade-in mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center">
        <section className="flex-1">
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Create your driver profile</h1>
          <p className="mt-4 text-lg text-slate-600">
            Spin up a ToyotaTinder account to sync your preferences, unlock swipe mode, and keep your pit crew
            in lockstep across devices.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Store custom budgets, body styles, and features.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Sync likes so you never lose track of standouts.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Seamless hand-off into swipe and comparison flows.
            </li>
          </ul>
        </section>

        <SignupForm nextPath={nextPath} />
      </div>
    </main>
  );
}
