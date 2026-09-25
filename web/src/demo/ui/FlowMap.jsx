import { LANES, STEPS } from '../steps.js';
import { kesStr } from './format.js';

/** Aerial view: every step in order, grouped by lane, with status and the headline result. */
export default function FlowMap({ world, active, results, onPick }) {
  return (
    <nav className="pg-map" aria-label="Steps">
      {LANES.map((lane) => {
        const steps = STEPS.map((s, i) => ({ s, i })).filter(({ s }) => s.lane === lane.id);
        return (
          <div className="pg-lane" key={lane.id}>
            <span className="pg-lane__label">{lane.label}</span>
            <ol className="pg-lane__steps">
              {steps.map(({ s, i }) => {
                const r = results[s.id];
                const state = i === active ? 'active' : r && !r.ok ? 'fail' : s.done(world) ? 'done' : 'todo';
                return (
                  <li key={s.id}>
                    <button type="button" className={`pg-node pg-node--${state}`} onClick={() => onPick(i)} title={s.what}>
                      <span className="pg-node__n">{state === 'done' ? '✓' : state === 'fail' ? '!' : i + 1}</span>
                      <span className="pg-node__label">{s.short}</span>
                      {r?.headline && <span className="pg-node__res">{r.headline}</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </nav>
  );
}

/** The one number that best says what a step did. */
export function headline(entries, ok, key) {
  if (!ok) return 'blocked';
  const keys = {};
  for (const e of entries) for (const d of e.diffs) keys[d.key] = (keys[d.key] ?? 0) + d.delta;
  const pick = (key && keys[key] ? key : null) ?? Object.keys(keys).find((k) => !k.endsWith('.eth') && keys[k] > 0);
  if (pick) return kesStr(keys[pick], { sign: true });
  const signed = entries.filter((e) => e.fn === 'signTicket').length;
  return signed ? `${signed} receipts` : 'ok';
}
