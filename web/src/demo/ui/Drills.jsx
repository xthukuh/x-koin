import { useState } from 'react';

import { DRILLS, ensureReady } from '../flows.js';

export default function Drills({ world, commit }) {
  const [verdicts, setVerdicts] = useState({});
  const runDrill = (d) => {
    const prep = ensureReady(world);
    if (!prep.ok) {
      commit(prep);
      return;
    }
    const r = d.run(prep.world);
    commit({ world: r.world, ok: true, entries: [...prep.entries, ...r.entries] });
    setVerdicts({ ...verdicts, [d.id]: { ok: r.ok, text: r.verdict } });
  };
  return (
    <section className="xk-dm-panel" id="recovery">
      <header className="xk-dm-panel__head">
        <h2>Recovery and redundancy</h2>
        <p className="xk-note">
          Each drill runs on the current state (setting up a funded escrow first if needed) and lands in the ledger, so every revert, partial payment and gas cost is open for inspection. Undo returns to before the drill.
        </p>
      </header>
      <div className="xk-dm-drills">
        {DRILLS.map((d) => (
          <article key={d.id} className="xk-dm-drill">
            <h3>{d.title}</h3>
            <p>{d.claim}</p>
            <button type="button" className="xk-btn xk-btn--small" onClick={() => runDrill(d)}>
              Run drill
            </button>
            {verdicts[d.id] && <p className={`xk-dm-verdict ${verdicts[d.id].ok ? 'xk-dm-ok' : 'xk-dm-bad'}`}>{verdicts[d.id].text}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
