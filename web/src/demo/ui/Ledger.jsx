import { useState } from 'react';

import { addr, nameOf } from '../engine.js';
import { LAYERS, ethStr, gasStr, isEthKey, kesSmall, kesStr, metricLabel } from './format.js';

const argStr = (v) => (typeof v === 'number' && v >= 1000 ? v.toLocaleString('en-KE') : typeof v === 'string' && v in { amina: 1, baraka: 1, node: 1, kiosk: 1, owner: 1, relayer: 1, founder: 1, mallory: 1, escrow: 1 } ? nameOf(v) : String(v));

/** One ledger row: compact header, detail behind a toggle. */
export function Entry({ e, open: initial = false }) {
  const [open, setOpen] = useState(initial);
  const status = e.rejected ? 'rejected' : e.ok ? 'ok' : 'revert';
  return (
    <li className={`xk-dm-entry xk-dm-entry--${status}`}>
      <button type="button" className="xk-dm-entry__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="xk-dm-entry__id">{e.id}</span>
        <span className={`xk-dm-layer xk-dm-layer--${e.layer}`} title={LAYERS[e.layer]?.hint}>
          {LAYERS[e.layer]?.label ?? e.layer}
        </span>
        <span className="xk-dm-entry__title">{e.title}</span>
        <span className="xk-dm-entry__cost">
          {e.layer === 'chain' ? (
            <>
              {gasStr(e.gas)} gas <b>{kesSmall(e.kes)} KES</b>
            </>
          ) : (
            'no gas'
          )}
        </span>
        <span className={`xk-dm-entry__status xk-dm-entry__status--${status}`}>{status === 'ok' ? 'ok' : status === 'revert' ? 'revert' : 'not sent'}</span>
      </button>
      {!e.ok && <p className="xk-dm-entry__error xk-mono">{e.error}</p>}
      {open && (
        <div className="xk-dm-entry__body">
          <dl className="xk-dm-kv">
            <dt>caller</dt>
            <dd>
              {nameOf(e.from)} <span className="xk-mono xk-note">{addr(e.from)}</span>
            </dd>
            {e.contract && (
              <>
                <dt>call</dt>
                <dd className="xk-mono">
                  {e.contract}.{e.fn}({Object.entries(e.args).map(([k, v]) => `${k}=${argStr(v)}`).join(', ')})
                </dd>
              </>
            )}
            {e.layer === 'chain' && (
              <>
                <dt>block</dt>
                <dd className="xk-mono">{e.block ?? 'none'}</dd>
                <dt>gas payer</dt>
                <dd>{nameOf(e.payer)}</dd>
                <dt>gas</dt>
                <dd>
                  {gasStr(e.gas)}
                  {e.gasSrc && (
                    <span className="xk-note">
                      {' '}
                      <span className={`xk-dm-src xk-dm-src--${e.gasSrc.src}`}>{e.gasSrc.src}</span> {e.gasSrc.note}
                    </span>
                  )}
                </dd>
                <dt>cost</dt>
                <dd>
                  {kesSmall(e.kes)} KES, {e.usd.toFixed(6)} USD
                </dd>
              </>
            )}
          </dl>

          {e.notes.length > 0 && (
            <ul className="xk-dm-notes">
              {e.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}

          {e.crypto.length > 0 && (
            <>
              <h4 className="xk-dm-h4">Crypto steps</h4>
              <ol className="xk-dm-crypto">
                {e.crypto.map((c, i) => (
                  <li key={i}>
                    <span>{c.label}</span>
                    <code>{c.value}</code>
                  </li>
                ))}
              </ol>
            </>
          )}

          {e.events.length > 0 && (
            <>
              <h4 className="xk-dm-h4">Events</h4>
              <ul className="xk-dm-events xk-mono">
                {e.events.map((ev, i) => (
                  <li key={i}>
                    {ev.name}({Object.entries(ev.args).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toLocaleString('en-KE') : v}`).join(', ')})
                  </li>
                ))}
              </ul>
            </>
          )}

          {e.diffs.length > 0 && (
            <>
              <h4 className="xk-dm-h4">State changes</h4>
              <div className="xk-tablewrap">
                <table className="xk-table xk-dm-diff">
                  <thead>
                    <tr>
                      <th>balance</th>
                      <th>before</th>
                      <th>after</th>
                      <th>change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.diffs.map((d) => (
                      <tr key={d.key}>
                        <td>{metricLabel(d.key)}</td>
                        <td className="xk-mono">{isEthKey(d.key) ? ethStr(d.before) : kesStr(d.before)}</td>
                        <td className="xk-mono">{isEthKey(d.key) ? ethStr(d.after) : kesStr(d.after)}</td>
                        <td className={`xk-mono ${d.delta > 0 ? 'xk-dm-up' : 'xk-dm-down'}`}>{isEthKey(d.key) ? ethStr(d.delta) : kesStr(d.delta, { sign: true })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="xk-dm-inv">
            {e.invariants.map((i) => (
              <span key={i.id} className={i.ok ? 'xk-dm-ok' : 'xk-dm-bad'} title={i.rule}>
                {i.ok ? 'holds' : 'BROKEN'}: {i.label}
              </span>
            ))}
          </p>
        </div>
      )}
    </li>
  );
}

export default function Ledger({ ledger }) {
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(40);
  const rows = ledger.filter((e) => filter === 'all' || (filter === 'chain' ? e.layer === 'chain' : filter === 'failed' ? !e.ok : e.layer !== 'chain'));
  const shown = rows.slice(-limit).reverse();
  const onChain = ledger.filter((e) => e.layer === 'chain' && !e.rejected);
  const totalKes = onChain.reduce((a, e) => a + e.kes, 0);
  const totalGas = onChain.reduce((a, e) => a + e.gas, 0);
  return (
    <section className="xk-dm-panel" id="ledger">
      <header className="xk-dm-panel__head">
        <h2>Ledger</h2>
        <p className="xk-note">
          {ledger.length} steps, {onChain.length} transactions, {gasStr(totalGas)} gas, {kesSmall(totalKes)} KES of gas in total. Newest first; open a row for crypto, events and every balance it moved.
        </p>
        <div className="xk-dm-seg" role="group" aria-label="Filter">
          {['all', 'chain', 'off-chain', 'failed'].map((f) => (
            <button type="button" key={f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </header>
      {shown.length === 0 ? (
        <p className="xk-note">Nothing yet. Start with the lifecycle's first step.</p>
      ) : (
        <ol className="xk-dm-ledger">
          {shown.map((e) => (
            <Entry e={e} key={e.id} />
          ))}
        </ol>
      )}
      {rows.length > limit && (
        <button type="button" className="xk-btn xk-btn--small" onClick={() => setLimit(limit + 60)}>
          Show older ({rows.length - limit} more)
        </button>
      )}
    </section>
  );
}
