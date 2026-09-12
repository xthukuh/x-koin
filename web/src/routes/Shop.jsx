import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const COLUMNS = [
  ['role', 'Role'],
  ['name', 'Name'],
  ['spec', 'Spec'],
  ['qty', 'Qty'],
  ['unit_price_kes', 'Unit price (KES)'],
  ['store', 'Store'],
];

export default function Shop() {
  const [parts, setParts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch('/shop/parts.json');
        if (!response.ok) {
          throw new Error(`parts.json: HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled) {
          setParts(Array.isArray(data) ? data : []);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause.message);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm">
        <Link className="underline" to="/">
          xKoin index
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold">Shopping list</h1>

      {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}

      {!error && parts !== null && parts.length === 0 ? (
        <p className="mt-6 text-neutral-600">Shopping list not compiled yet</p>
      ) : null}

      {!error && parts !== null && parts.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-400 text-left">
                {COLUMNS.map(([key, label]) => (
                  <th key={key} className="px-3 py-2 font-medium">
                    {label}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part, index) => (
                <tr key={part.id ?? index} className="border-b border-neutral-200 align-top">
                  {COLUMNS.map(([key]) => (
                    <td key={key} className="px-3 py-2">
                      {part[key] ?? ''}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {part.url ? (
                      <a className="underline" href={part.url} rel="noreferrer" target="_blank">
                        open
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
