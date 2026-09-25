import { useMemo, useState } from 'react';

import { addr, kes, nameOf, offchain } from '../engine.js';
import { buy, cashOut, depositGasless, runSteps, send, withdraw } from '../flows.js';
import { LAYERS, ethStr, gasStr, isEthKey, kesSmall, kesStr, metricLabel } from './format.js';

const ACTIONS = [
  { id: 'buy', label: 'Buy xKoin', sub: 'M-Pesa to wallet', needsAmount: true },
  { id: 'deposit', label: 'Deposit', sub: 'wallet to escrow', needsAmount: true },
  { id: 'withdraw', label: 'Withdraw', sub: 'escrow to wallet', needsAmount: true },
  { id: 'send', label: 'Send', sub: 'wallet to wallet', needsAmount: true },
  { id: 'receive', label: 'Receive', sub: 'your address', needsAmount: false },
  { id: 'cashout', label: 'Cash out', sub: 'wallet to M-Pesa', needsAmount: true },
  { id: 'browse', label: 'Browse', sub: 'use data', needsAmount: false },
  { id: 'escrowSend', label: 'Send from escrow', sub: 'proposed, not built', needsAmount: false, disabled: true },
];

const EXPLAIN = {
  buy: 'STK push to the customer phone. Only after the bank callback does the kiosk mint, with the receipt hashed into the event. The kiosk root key then signs an Ed25519 voucher so an offline node can admit the customer.',
  deposit: 'The wallet signs an EIP-2612 permit (no gas). The kiosk relays depositWithPermit and pays the gas. The money leaves the portable wallet and becomes session credit every node can see.',
  withdraw: 'withdrawDeposit must be sent by the client address itself and has no relayed form, so the client needs ETH. Clients hold none by design: this is a gap worth closing with a signed withdraw.',
  send: 'The sender signs a permit naming the kiosk, the kiosk relays permit then transferFrom. Works with the deployed contracts today; costs the kiosk two transactions. Escrow is untouched, so a live session keeps running.',
  receive: 'A wallet receives with no action and no gas. Share the address; any sender, kiosk or node can pay into it.',
  cashout: 'Permit, then XKN moves to the bridge, then B2C pays M-Pesa, and only on the success callback does the bridge burn its own balance. Supply and float fall together, so the peg holds.',
  browse: 'Opens the data meter below: the node serves bytes against the escrow deposit and the wallet signs a cumulative ticket every receipt interval.',
  escrowSend: 'transferDeposit(from, to, amount, nonce, deadline, sig) moves value between two escrow entries in one relayed call. Paper 04 s8 recommends it at about 40 lines of Solidity; it is not in xKoinEscrow yet.',
};

function flowFor(action, world, who, other, amount, failStep) {
  switch (action) {
    case 'buy':
      return buy(world, { client: who, amount, failStk: failStep });
    case 'deposit':
      return depositGasless(world, { client: who, amount });
    case 'withdraw':
      return withdraw(world, { client: who, amount });
    case 'send':
      return send(world, { from: who, to: other, amount });
    case 'cashout':
      return cashOut(world, { client: who, amount, failPayout: failStep });
    default:
      return null;
  }
}

/** What a flow did to one person, summed across its steps. */
function personDelta(result, who) {
  const out = {};
  for (const e of result.entries) for (const d of e.diffs) if (d.key.startsWith(`${who}.`)) out[d.key] = (out[d.key] ?? 0) + d.delta;
  return out;
}

export default function Kiosk({ world, commit, onBrowse }) {
  const [who, setWho] = useState('amina');
  const [action, setAction] = useState('buy');
  const [amountKes, setAmountKes] = useState(100);
  const [failStep, setFailStep] = useState(false);
  const other = who === 'amina' ? 'baraka' : 'amina';
  const w = world;
  const amount = kes(Number(amountKes) || 0);
  const def = ACTIONS.find((a) => a.id === action);

  const preview = useMemo(() => (def.needsAmount && amount > 0 && w.deployed ? flowFor(action, w, who, other, amount, failStep) : null), [def, amount, w, action, who, other, failStep]);

  const byPayer = {};
  if (preview) for (const e of preview.entries) if (e.layer === 'chain' && !e.rejected) byPayer[e.payer] = (byPayer[e.payer] ?? 0) + e.kes;
  const mine = preview ? personDelta(preview, who) : {};

  const fundGas = () => commit(runSteps(w, [(x) => offchain.fundGas(x, { to: who, gwei: 5_000, flow: 'Gas top-up' })]));

  return (
    <section className="xk-dm-panel xk-dm-kiosk" id="kiosk">
      <header className="xk-dm-panel__head">
        <h2>xKoin kiosk</h2>
        <p className="xk-note">A mock of the kiosk screen. Pick a customer and an action; the preview below is the exact run, computed on a copy of the world before you commit.</p>
      </header>

      <div className="xk-dm-screen">
        <div className="xk-dm-screen__bar">
          <span>xKoin kiosk</span>
          <span className="xk-mono">{w.deployed ? `chain ${31337}` : 'not deployed'}</span>
        </div>

        <div className="xk-dm-seg" role="group" aria-label="Customer">
          {['amina', 'baraka'].map((c) => (
            <button type="button" key={c} className={who === c ? 'is-on' : ''} onClick={() => setWho(c)}>
              {nameOf(c)}
            </button>
          ))}
        </div>

        <dl className="xk-dm-screen__bal">
          <div>
            <dt>M-Pesa</dt>
            <dd>{kesStr(w.fiat.mpesa[who])}</dd>
          </div>
          <div>
            <dt>Wallet</dt>
            <dd>{kesStr(w.token.bal[who])}</dd>
          </div>
          <div>
            <dt>Escrow</dt>
            <dd>{kesStr(w.escrow.deposits[who])}</dd>
          </div>
          <div>
            <dt>ETH</dt>
            <dd>{ethStr(w.eth[who])}</dd>
          </div>
        </dl>

        <div className="xk-dm-actions">
          {ACTIONS.map((a) => (
            <button
              type="button"
              key={a.id}
              className={`xk-dm-action${action === a.id ? ' is-on' : ''}${a.disabled ? ' is-proposed' : ''}`}
              onClick={() => {
                setAction(a.id);
                setFailStep(false);
                if (a.id === 'browse') onBrowse(who);
              }}
            >
              <b>{a.label}</b>
              <span>{a.sub}</span>
            </button>
          ))}
        </div>

        <p className="xk-dm-explain">{EXPLAIN[action]}</p>

        {!w.deployed && <p className="xk-dm-warn">Deploy the contracts first: the lifecycle's step 1.</p>}

        {action === 'receive' && (
          <div className="xk-dm-receive">
            <p>
              {nameOf(who)}'s address (EIP-55 checksummed):
            </p>
            <code className="xk-dm-addr">{addr(who)}</code>
            <button type="button" className="xk-btn xk-btn--small" disabled={!w.deployed} onClick={() => commit(send(w, { from: other, to: who, amount: kes(5) }))}>
              Have {nameOf(other)} send 5 KES here
            </button>
          </div>
        )}

        {def.needsAmount && w.deployed && (
          <div className="xk-dm-form">
            <label>
              Amount, KES
              <input type="number" min="0" step="1" value={amountKes} onChange={(ev) => setAmountKes(ev.target.value)} />
            </label>
            <div className="xk-dm-chips">
              {[5, 20, 50, 100, 500].map((v) => (
                <button type="button" key={v} onClick={() => setAmountKes(v)}>
                  {v}
                </button>
              ))}
            </div>
            {(action === 'buy' || action === 'cashout') && (
              <label className="xk-dm-check">
                <input type="checkbox" checked={failStep} onChange={(ev) => setFailStep(ev.target.checked)} />
                make the M-Pesa {action === 'buy' ? 'prompt get cancelled' : 'payout fail'}
              </label>
            )}
            {action === 'send' && <p className="xk-note">To {nameOf(other)}, {addr(other).slice(0, 10)}..</p>}
          </div>
        )}

        {preview && (
          <div className="xk-dm-preview">
            <h4 className="xk-dm-h4">What will happen</h4>
            <ol>
              {preview.entries.map((e) => (
                <li key={e.id} className={e.ok ? '' : 'is-fail'}>
                  <span className={`xk-dm-layer xk-dm-layer--${e.layer}`}>{LAYERS[e.layer]?.label}</span>
                  <span>{e.title}</span>
                  <span className="xk-mono xk-note">
                    {e.layer === 'chain' && !e.rejected ? `${gasStr(e.gas)} gas, ${kesSmall(e.kes)} KES, ${nameOf(e.payer)} pays` : e.ok ? 'no gas' : ''}
                  </span>
                  {!e.ok && <span className="xk-dm-bad xk-mono">{e.error}</span>}
                </li>
              ))}
            </ol>
            {Object.keys(mine).length > 0 && (
              <p className="xk-dm-delta">
                {nameOf(who)}:{' '}
                {Object.entries(mine)
                  .filter(([, v]) => v !== 0)
                  .map(([k, v]) => `${metricLabel(k).replace(`${nameOf(who)} `, '')} ${isEthKey(k) ? ethStr(v) : kesStr(v, { sign: true })}`)
                  .join(', ')}
              </p>
            )}
            {Object.keys(byPayer).length > 0 && (
              <p className="xk-note">
                Gas: {Object.entries(byPayer).map(([p, v]) => `${nameOf(p)} ${kesSmall(v)} KES`).join(', ')}
              </p>
            )}
            <div className="xk-dm-row">
              <button type="button" className="xk-btn xk-btn--primary" onClick={() => commit(preview)}>
                {preview.ok ? 'Confirm' : 'Record the failed attempt'}
              </button>
              {action === 'withdraw' && preview.failed?.rejected && (
                <button type="button" className="xk-btn" onClick={fundGas}>
                  Kiosk sends {nameOf(who)} gas (21,000 gas)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
