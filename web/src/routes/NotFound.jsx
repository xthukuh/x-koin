import { Link, useLocation } from 'react-router-dom';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="mt-2 text-neutral-600">
        No route at <code className="font-mono">{pathname}</code>.
      </p>
      <p className="mt-4">
        <Link className="underline" to="/">
          Back to the index
        </Link>
      </p>
    </main>
  );
}
