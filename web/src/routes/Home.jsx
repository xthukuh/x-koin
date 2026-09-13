import { Link } from 'react-router-dom';

/**
 * A plain index of what exists. The landing page took over `/` and this route
 * moved to `/map`, where it only has to make every other route reachable.
 */
const ROUTES = [
  { to: '/', label: '/', text: 'The landing page: what xKoin is, the three mediums, the money, the devices, the Laws.' },
  { to: '/docs', label: '/docs', text: 'Markdown viewer for docs/papers, docs/potential and docs/x-koin-beta.' },
  { to: '/investors', label: '/investors', text: 'Investor demo: what powers xKoin, with the real proof figures inlined.' },
  { to: '/landlord', label: '/landlord', text: 'Landlord pilot page: the incentive for a building owner, no internals.' },
  { to: '/replay', label: '/replay', text: 'Protocol replay: frame trace, chain settlement, kiosk journeys, board schematics.' },
  { to: '/shop', label: '/shop', text: 'Hardware shopping list for the pilot build. Empty until the parts list is compiled.' },
];

const PROOFS = [
  { value: '28', label: 'forge tests passing', note: 'contracts, including the fuzz solvency invariant' },
  { value: '191,698', label: 'gas to settle', note: 'cumulative-unit delta settlement on xKoinEscrow' },
  { value: '9.768 Mbps', label: 'measured goodput', note: 'PLC backhaul, measured not modelled' },
  { value: '0 / 20,000', label: 'garbage frames accepted', note: 'protocol fuzz over malformed input' },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="border-b border-neutral-300 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">xKoin</h1>
        <p className="mt-2 text-neutral-600">
          Decentralized hybrid PLC and LoRa mesh with trust-minimized state-channel
          micro-settlement and M-Pesa / Equitel fiat bridging.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Proof</h2>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROOFS.map((proof) => (
            <div key={proof.label} className="rounded border border-neutral-300 p-4">
              <dt className="text-2xl font-semibold tabular-nums">{proof.value}</dt>
              <dd className="text-sm font-medium text-neutral-700">{proof.label}</dd>
              <dd className="mt-1 text-xs text-neutral-500">{proof.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Pages</h2>
        <ul className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
          {ROUTES.map((route) => (
            <li key={route.to} className="py-3">
              <Link className="font-mono text-sm font-medium underline" to={route.to}>
                {route.label}
              </Link>
              <p className="mt-1 text-sm text-neutral-600">{route.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-10 text-xs text-neutral-500">
        Source of truth for scope and phases is the repository README and HANDOVER.md.
      </footer>
    </main>
  );
}
