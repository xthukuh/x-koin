import { useState } from 'react';

import { UKES, nameOf } from '../engine.js';
import { economics } from '../flows.js';
import { GAS } from '../gas.js';
import { gasStr, intStr, kesSmall, kesStr } from './format.js';

const MARKET = [
  ['gasPriceGwei', 'Base gas price, gwei', 0.001],
  ['ethUsd', 'ETH, USD', 1],
  ['usdKes', 'USD to KES', 0.01],
  ['l1FeePct', 'L1 data fee surcharge, %', 1],
];
const PROTOCOL = [
  ['receiptBytes', 'Receipt interval, bytes', 100_000],
  ['onlineCapKes', 'Online credit cap, KES', 1],
  ['offlineCapKes', 'Offline credit cap, KES', 1],
  ['epochSeconds', 'Ticket lifetime, s', 3600],
];
const DEPLOY = [
  ['pricePerUnit', 'Price, micro-KES per unit', 50],
  ['feeBps', 'Fee, basis points', 50],
  ['mintCapKes', 'Bridge daily cap, KES', 1000],
];

function Num({ label, value, step, onChange }) {
  return (
    <label>
      {label}
      <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export default function Economics({ world, setParams, resetWith }) {
  const w = world;
  const p = w.params;
  const [mb, setMb] = useState(12);
  const [draft, setDraft] = useState(() => Object.fromEntries(DEPLOY.map(([k]) => [k, p[k]])));
  const e = economics(w.deployed ? w : { ...w, escrow: { ...w.escrow, pricePerUnit: p.pricePerUnit }, treasury: { ...w.treasury, feeBps: p.feeBps } }, mb);
  const price = w.deployed ? w.escrow.pricePerUnit : p.pricePerUnit;
  const kesPerGas = p.gasPriceGwei * 1e-9 * p.ethUsd * p.usdKes * (1 + p.l1FeePct / 100);
  const perSettlePct = e.gross > 0 ? (e.oneTicketKes / (e.gross / UKES)) * 100 : 0;
  const payers = Object.entries(w.gasSpent).sort((a, b) => b[1].kes - a[1].kes);

  return (
    <section className="xk-dm-panel" id="costs">
      <header className="xk-dm-panel__head">
        <h2>Live costs</h2>
        <p className="xk-note">Every figure below is recomputed from the inputs on the right. Change one and the next steps price from it; ledger rows keep the prices of the moment they ran.</p>
      </header>

      <div className="xk-dm-econ">
        <div>
          <label className="xk-dm-mb">
            Data used, MB
            <input type="number" min="0.01" step="1" value={mb} onChange={(ev) => setMb(Number(ev.target.value))} />
          </label>
          <ol className="xk-dm-math">
            <li>
              <span>units = ceil({intStr(mb * 1e6)} B / {intStr(p.unitBytes)} B)</span>
              <b>{intStr(e.units)}</b>
            </li>
            <li>
              <span>gross = {intStr(e.units)} x {intStr(price)} micro-KES</span>
              <b>{kesStr(e.gross)} KES</b>
            </li>
            <li>
              <span>fee = floor(gross x {w.deployed ? w.treasury.feeBps : p.feeBps} / 10,000)</span>
              <b>{kesStr(e.fee)} KES</b>
            </li>
            <li>
              <span>node net = gross - fee</span>
              <b>{kesStr(e.net)} KES</b>
            </li>
            <li>
              <span>receipts = ceil({intStr(mb * 1e6)} / {intStr(p.receiptBytes)}), 108 B each</span>
              <b>
                {intStr(e.receipts)}, {intStr(e.receiptOverheadBytes)} B
              </b>
            </li>
            <li>
              <span>
                1 KES per gas = {p.gasPriceGwei} gwei x 1e-9 x {p.ethUsd} USD x {p.usdKes}
                {p.l1FeePct ? ` x ${1 + p.l1FeePct / 100}` : ''}
              </span>
              <b>{kesPerGas.toExponential(4)} KES</b>
            </li>
            <li>
              <span>settle this alone: {gasStr(e.oneTicketGas)} gas (one fresh ticket)</span>
              <b>{kesSmall(e.oneTicketKes)} KES</b>
            </li>
            <li>
              <span>that is of the gross</span>
              <b className={perSettlePct > 100 ? 'xk-dm-bad' : perSettlePct > 10 ? 'xk-dm-warn' : 'xk-dm-ok'}>{perSettlePct.toFixed(1)}%</b>
            </li>
            <li>
              <span>relayer break-even (fee &gt;= 2 x gas) needs</span>
              <b>{intStr(Math.ceil(e.breakEvenMb))} MB per batch</b>
            </li>
          </ol>
          <p className="xk-note">
            Reading: at these inputs {mb} MB earns the treasury {kesStr(e.fee)} KES while one settlement costs {kesSmall(e.oneTicketKes)} KES of gas, so single-session batches lose money until about {intStr(Math.ceil(e.breakEvenMb))} MB accumulate. Levers, in order of effect: batch many channels per transaction (each extra ticket adds about {gasStr(59_924)} gas instead of {gasStr(131_391)}), settle a warm channel ({gasStr(80_103)} gas), raise the price, or the fee. Fiat rail charges are not modelled and dominate all of these.
          </p>

          <h3>Gas by payer so far</h3>
          {payers.length === 0 ? (
            <p className="xk-note">No transactions yet.</p>
          ) : (
            <div className="xk-tablewrap">
              <table className="xk-table">
                <thead>
                  <tr>
                    <th>payer</th>
                    <th>tx</th>
                    <th>gas</th>
                    <th>KES</th>
                  </tr>
                </thead>
                <tbody>
                  {payers.map(([who, s]) => (
                    <tr key={who}>
                      <td>{nameOf(who)}</td>
                      <td className="xk-mono">{s.txs}</td>
                      <td className="xk-mono">{gasStr(s.gas)}</td>
                      <td className="xk-mono">{kesSmall(s.kes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="xk-dm-params-form">
          <h3>Market inputs</h3>
          <p className="xk-note">Defaults measured 2026-09-09, paper 04 s9. Apply live.</p>
          {MARKET.map(([k, label, step]) => (
            <Num key={k} label={label} step={step} value={p[k]} onChange={(v) => setParams({ [k]: v })} />
          ))}
          <h3>Protocol inputs</h3>
          <p className="xk-note">Node and relayer policy. Apply live.</p>
          {PROTOCOL.map(([k, label, step]) => (
            <Num key={k} label={label} step={step} value={p[k]} onChange={(v) => setParams({ [k]: v })} />
          ))}
          <h3>Deployment inputs</h3>
          <p className="xk-note">Set in the constructors. Changing them starts a new world; after deploy use setPricePerUnit or setFeeBps instead.</p>
          {DEPLOY.map(([k, label, step]) => (
            <Num key={k} label={label} step={step} value={draft[k]} onChange={(v) => setDraft({ ...draft, [k]: v })} />
          ))}
          <button type="button" className="xk-btn xk-btn--small" onClick={() => resetWith(draft)}>
            Reset with these
          </button>

          <h3>Gas table</h3>
          <div className="xk-tablewrap">
            <table className="xk-table xk-dm-gastable">
              <tbody>
                {Object.entries(GAS).map(([fn, g]) => (
                  <tr key={fn}>
                    <td className="xk-mono">{fn}</td>
                    <td className="xk-mono">{gasStr(g.gas)}</td>
                    <td className="xk-mono">{kesSmall(g.gas * kesPerGas)}</td>
                    <td>
                      <span className={`xk-dm-src xk-dm-src--${g.src}`}>{g.src}</span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="xk-mono">settleTicketBatch</td>
                  <td className="xk-mono">71,467 + 59,924 n</td>
                  <td className="xk-mono">{kesSmall(131_391 * kesPerGas)} (n=1)</td>
                  <td>
                    <span className="xk-dm-src xk-dm-src--model">model</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
