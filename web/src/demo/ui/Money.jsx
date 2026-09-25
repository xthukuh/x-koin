import { useState } from 'react';

import { invariants, nameOf } from '../engine.js';
import { kesSmall, kesStr } from './format.js';

const MAIN = ['amina', 'baraka', 'node', 'kiosk', 'founder'];
const MORE = ['relayer', 'owner', 'mallory'];
const COLS = [
  ['mpesa', 'M-Pesa', (w, k) => w.fiat.mpesa[k]],
  ['wallet', 'Wallet', (w, k) => w.token.bal[k]],
  ['escrow', 'Meter', (w, k) => w.escrow.deposits[k]],
  ['earnings', 'Earned', (w, k) => w.escrow.earnings[k]],
];
const HEALTH = {
  peg: ['Backed', 'Every xKoin has a real shilling behind it'],
  solvency: ['Solvent', 'The meter pool covers every meter and every earning'],
  conservation: ['Balanced', 'No xKoin appears or vanishes outside the rules'],
};

function Cell({ v, d }) {
  return (
    <td className={d ? 'is-changed' : ''}>
      <span className={v === 0 ? 'pg-zero' : ''}>{kesStr(v)}</span>
      {d ? <em className={d > 0 ? 'pg-up' : 'pg-down'}>{kesStr(d, { sign: true })}</em> : null}
    </td>
  );
}

export default function Money({ world, changed }) {
  const [more, setMore] = useState(false);
  const w = world;
  const gasKes = (who) => w.eth[who] * 1e-9 * w.params.ethUsd * w.params.usdKes;
  const rows = more ? [...MAIN, ...MORE] : MAIN;
  return (
    <aside className="pg-panel pg-money" aria-label="Money">
      <header className="pg-panel__head">
        <h2>Money</h2>
        <span className="pg-hint">KES</span>
      </header>
      <ul className="pg-health">
        {invariants(w).map((i) => (
          <li key={i.id} className={i.ok ? 'is-ok' : 'is-bad'} title={`${HEALTH[i.id][1]}. ${i.rule}`}>
            <span className="pg-dot" />
            {HEALTH[i.id][0]}
          </li>
        ))}
      </ul>
      <div className="pg-table">
        <table>
          <thead>
            <tr>
              <th />
              {COLS.map(([k, label]) => (
                <th key={k}>{label}</th>
              ))}
              <th title="Network fee money, in KES">Gas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((who) => (
              <tr key={who}>
                <th scope="row">
                  {nameOf(who).replace(' (bridge)', '').replace(' admin', '').replace(' cold key', '').replace(' multisig', '')}
                  {w.devices[who] === false && <span className="pg-bad"> lost</span>}
                </th>
                {COLS.map(([k, , get]) => (
                  <Cell key={k} v={get(w, who)} d={changed[`${who}.${k}`]} />
                ))}
                <td className={changed[`${who}.eth`] ? 'is-changed' : ''} title={`${w.eth[who]} gwei`}>
                  <span className={w.eth[who] === 0 ? 'pg-zero' : ''}>{w.eth[who] === 0 ? '0' : kesSmall(gasKes(who))}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="pg-link" onClick={() => setMore(!more)}>
        {more ? 'fewer people' : 'more people'}
      </button>
      <dl className="pg-system">
        {[
          ['xKoin in existence', w.token.supply, 'token.supply'],
          ['Kiosk M-Pesa', w.fiat.float, 'kiosk.float'],
          ['Meter pool', w.token.bal.escrow, 'escrow.balance'],
          ['Fee box', w.token.bal.treasury, 'treasury.balance'],
        ].map(([label, v, k]) => (
          <div key={k} className={changed[k] ? 'is-changed' : ''}>
            <dt>{label}</dt>
            <dd>
              {kesStr(v)}
              {changed[k] ? <em className={changed[k] > 0 ? 'pg-up' : 'pg-down'}>{kesStr(changed[k], { sign: true })}</em> : null}
            </dd>
          </div>
        ))}
      </dl>
      {w.session && (
        <p className="pg-hint">
          {nameOf(w.session.client)} browsing: credit {kesStr(w.session.limit)} KES
        </p>
      )}
    </aside>
  );
}
