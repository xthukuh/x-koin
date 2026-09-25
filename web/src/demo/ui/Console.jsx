import { useState } from 'react';

import { ACTORS, ESCROW_DOMAIN, addr, escrow, kes, nameOf, offchain, ownable, pendingTickets, token, treasury } from '../engine.js';
import { bytesToHex, channelId, ticketDigest } from '../crypto.js';
import { runSteps } from '../flows.js';
import { gasStr } from './format.js';
import { GAS } from '../gas.js';

const PEOPLE = Object.keys(ACTORS);
const HOLDERS = [...PEOPLE, 'escrow'];

/**
 * Every state-changing function of the three contracts, plus the off-chain
 * steps around them. `fields` drive the form; `run` maps the form to the
 * engine. Caller is free: pick the wrong one and the contract's own check
 * reverts, which is the point.
 */
const PRIMS = [
  { group: 'xKoinToken', fn: 'setBridge', caller: 'owner', fields: [['bridge', 'actor', 'kiosk'], ['allowed', 'bool', true], ['dailyMintCap', 'kes', 50_000]], run: (w, f) => token.setBridge(w, { from: f.caller, bridge: f.bridge, allowed: f.allowed, dailyMintCap: kes(f.dailyMintCap) }) },
  { group: 'xKoinToken', fn: 'bridgeMint', caller: 'kiosk', fields: [['to', 'actor', 'amina'], ['amount', 'kes', 10], ['fiatRef', 'text', 'ws_CO_manual']], run: (w, f) => token.bridgeMint(w, { from: f.caller, to: f.to, amount: kes(f.amount), fiatRef: f.fiatRef }), warn: 'Direct mint with no M-Pesa payment: the peg check will show the unbacked amount.' },
  { group: 'xKoinToken', fn: 'bridgeBurn', caller: 'kiosk', fields: [['amount', 'kes', 1], ['fiatRef', 'text', 'B2C_manual']], run: (w, f) => token.bridgeBurn(w, { from: f.caller, amount: kes(f.amount), fiatRef: f.fiatRef }) },
  { group: 'xKoinToken', fn: 'approve', caller: 'node', fields: [['spender', 'holder', 'escrow'], ['amount', 'kes', 10]], run: (w, f) => token.approve(w, { from: f.caller, spender: f.spender, amount: kes(f.amount) }) },
  { group: 'xKoinToken', fn: 'transfer', caller: 'node', fields: [['to', 'actor', 'amina'], ['amount', 'kes', 1]], run: (w, f) => token.transfer(w, { from: f.caller, to: f.to, amount: kes(f.amount) }) },
  { group: 'xKoinToken', fn: 'transferFrom', caller: 'kiosk', fields: [['owner', 'actor', 'amina'], ['to', 'actor', 'baraka'], ['amount', 'kes', 1]], run: (w, f) => token.transferFrom(w, { from: f.caller, owner: f.owner, to: f.to, amount: kes(f.amount) }) },
  {
    group: 'xKoinToken', fn: 'permit', caller: 'kiosk', fields: [['owner', 'actor', 'amina'], ['spender', 'holder', 'kiosk'], ['value', 'kes', 5]],
    note: 'The owner wallet signs off chain, then the caller relays.',
    run: (w) => w, multi: (w, f) => runSteps(w, [(x) => offchain.signPermit(x, { owner: f.owner, spender: f.spender, value: kes(f.value) }), (x, p) => token.permit(x, { from: f.caller, permit: p })]),
  },
  { group: 'xKoinEscrow', fn: 'deposit', caller: 'node', fields: [['amount', 'kes', 1]], run: (w, f) => escrow.deposit(w, { from: f.caller, amount: kes(f.amount) }), note: 'Needs an approve for the escrow first.' },
  {
    group: 'xKoinEscrow', fn: 'depositWithPermit', caller: 'kiosk', fields: [['client', 'actor', 'amina'], ['amount', 'kes', 5]],
    multi: (w, f) => runSteps(w, [(x) => offchain.signPermit(x, { owner: f.client, spender: 'escrow', value: kes(f.amount) }), (x, p) => escrow.depositWithPermit(x, { from: f.caller, client: f.client, amount: kes(f.amount), permit: p })]),
  },
  { group: 'xKoinEscrow', fn: 'withdrawDeposit', caller: 'amina', fields: [['amount', 'kes', 1]], run: (w, f) => escrow.withdrawDeposit(w, { from: f.caller, amount: kes(f.amount) }) },
  {
    group: 'xKoinEscrow', fn: 'settleTicketBatch', caller: 'relayer', fields: [],
    note: 'Submits the latest held ticket of every channel.',
    run: (w, f) => escrow.settleTicketBatch(w, { from: f.caller, tickets: pendingTickets(w).map((p) => p.ticket) }),
  },
  { group: 'xKoinEscrow', fn: 'claimEarnings', caller: 'node', fields: [['to', 'actor', 'node'], ['amount', 'kes', 0.5]], run: (w, f) => escrow.claimEarnings(w, { from: f.caller, to: f.to, amount: kes(f.amount) }) },
  { group: 'xKoinEscrow', fn: 'setPricePerUnit', caller: 'owner', fields: [['newPrice', 'int', 600]], run: (w, f) => escrow.setPricePerUnit(w, { from: f.caller, newPrice: Number(f.newPrice) }), note: 'micro-KES per 10 KB unit; band 1 to 50,000, once a day.' },
  { group: 'xKoinTreasury', fn: 'claim', caller: 'mallory', fields: [], run: (w, f) => treasury.claim(w, { from: f.caller }), note: 'Anyone may call; funds only reach the beneficiary.' },
  { group: 'xKoinTreasury', fn: 'setFeeBps', caller: 'owner', fields: [['feeBps', 'int', 300]], run: (w, f) => treasury.setFeeBps(w, { from: f.caller, feeBps: Number(f.feeBps) }) },
  { group: 'xKoinTreasury', fn: 'queueBeneficiary', caller: 'owner', fields: [['next', 'actor', 'mallory']], run: (w, f) => treasury.queueBeneficiary(w, { from: f.caller, next: f.next }) },
  { group: 'xKoinTreasury', fn: 'activateBeneficiary', caller: 'mallory', fields: [], run: (w, f) => treasury.activateBeneficiary(w, { from: f.caller }) },
  { group: 'xKoinTreasury', fn: 'cancelBeneficiaryChange', caller: 'founder', fields: [], run: (w, f) => treasury.cancelBeneficiaryChange(w, { from: f.caller }) },
  { group: 'Ownable2Step (all three)', fn: 'transferOwnership', caller: 'owner', fields: [['contract', 'contract', 'escrow'], ['next', 'actor', 'founder']], run: (w, f) => ownable.transferOwnership(w, { from: f.caller, contract: f.contract, next: f.next }) },
  { group: 'Ownable2Step (all three)', fn: 'acceptOwnership', caller: 'founder', fields: [['contract', 'contract', 'escrow']], run: (w, f) => ownable.acceptOwnership(w, { from: f.caller, contract: f.contract }) },
  { group: 'Off chain', fn: 'signTicket', caller: 'amina', fields: [['nodeAdmin', 'actor', 'node'], ['cumulativeUnits', 'int', 100]], run: (w, f) => offchain.signTicket(w, { client: 'amina', signer: f.caller, nodeAdmin: f.nodeAdmin, cumulativeUnits: Number(f.cumulativeUnits) }), note: 'Client is Amina; a different caller signs as her (a forgery).' },
  { group: 'Off chain', fn: 'issueVoucher', caller: 'kiosk', fields: [['to', 'actor', 'amina'], ['amount', 'kes', 20]], run: (w, f) => offchain.issueVoucher(w, { to: f.to, amount: kes(f.amount), fiatRef: 'manual' }) },
  { group: 'Off chain', fn: 'verifyVoucher', caller: 'node', fields: [['who', 'actor', 'amina']], run: (w, f) => offchain.verifyVoucher(w, { who: f.who }) },
  { group: 'Off chain', fn: 'M-Pesa STK push', caller: 'amina', fields: [['amount', 'kes', 10]], run: (w, f) => offchain.stkPush(w, { client: f.caller, amount: kes(f.amount) }) },
  { group: 'Off chain', fn: 'M-Pesa B2C payout', caller: 'kiosk', fields: [['to', 'actor', 'amina'], ['amount', 'kes', 10]], run: (w, f) => offchain.b2cPayout(w, { to: f.to, amount: kes(f.amount) }) },
  { group: 'Off chain', fn: 'fundGas', caller: 'kiosk', fields: [['to', 'actor', 'amina'], ['gwei', 'int', 5000]], run: (w, f) => offchain.fundGas(w, { to: f.to, gwei: Number(f.gwei) }) },
  { group: 'Off chain', fn: 'warp', caller: 'owner', fields: [['hours', 'int', 25]], run: (w, f) => offchain.warp(w, { seconds: Number(f.hours) * 3600 }) },
  { group: 'Off chain', fn: 'loseDevice', caller: 'amina', fields: [], run: (w, f) => offchain.loseDevice(w, { who: f.caller }) },
  { group: 'Off chain', fn: 'restoreFromSeed', caller: 'amina', fields: [], run: (w, f) => offchain.restoreFromSeed(w, { who: f.caller }) },
];

function Field({ kind, value, onChange }) {
  if (kind === 'bool') return <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />;
  if (kind === 'actor' || kind === 'holder' || kind === 'contract') {
    const list = kind === 'actor' ? PEOPLE : kind === 'holder' ? HOLDERS : ['token', 'escrow', 'treasury'];
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {list.map((a) => (
          <option key={a} value={a}>
            {nameOf(a)}
          </option>
        ))}
      </select>
    );
  }
  return <input type={kind === 'text' ? 'text' : 'number'} value={value} step="any" onChange={(e) => onChange(e.target.value)} />;
}

function Prim({ p, world, commit }) {
  const [form, setForm] = useState(() => Object.fromEntries([['caller', p.caller], ...p.fields.map(([k, , d]) => [k, d])]));
  const set = (k) => (v) => setForm({ ...form, [k]: v });
  const exec = () => {
    const f = { ...form };
    for (const [k, kind] of p.fields) if (kind === 'kes' || kind === 'int') f[k] = Number(f[k]);
    commit(p.multi ? p.multi(world, f) : runSteps(world, [(w) => p.run(w, f)]));
  };
  const g = GAS[p.fn];
  return (
    <div className="xk-dm-prim">
      <div className="xk-dm-prim__head">
        <code>{p.fn}</code>
        {g && <span className="xk-note">{gasStr(g.gas)} gas, {g.src}</span>}
      </div>
      <div className="xk-dm-prim__fields">
        <label>
          caller
          <Field kind="actor" value={form.caller} onChange={set('caller')} />
        </label>
        {p.fields.map(([k, kind]) => (
          <label key={k}>
            {k}
            {kind === 'kes' ? ' (KES)' : ''}
            <Field kind={kind} value={form[k]} onChange={set(k)} />
          </label>
        ))}
        <button type="button" className="xk-btn xk-btn--small" onClick={exec}>
          Run
        </button>
      </div>
      {(p.note || p.warn) && <p className="xk-note">{p.warn ?? p.note}</p>}
    </div>
  );
}

/** Read-only calls: free, computed from the same state the contract would read. */
function Views({ world }) {
  const [units, setUnits] = useState(100);
  const t = { client: addr('amina'), nodeAdmin: addr('node'), sequenceNumber: 1, cumulativeUnits: Number(units), epochExpiry: world.t + world.params.epochSeconds };
  const d = ticketDigest(t, ESCROW_DOMAIN);
  const id = channelId(addr('amina'), addr('node'));
  const ch = world.escrow.channels[id];
  return (
    <div className="xk-dm-prim">
      <div className="xk-dm-prim__head">
        <code>views (eth_call, no gas)</code>
      </div>
      <dl className="xk-dm-kv">
        <dt>hashTicket</dt>
        <dd>
          Amina to Node, seq 1, units <input type="number" value={units} onChange={(e) => setUnits(e.target.value)} className="xk-dm-inline" />
          <ol className="xk-dm-crypto">
            <li>
              <span>typehash</span>
              <code>{bytesToHex(d.typeHash)}</code>
            </li>
            <li>
              <span>structHash</span>
              <code>{bytesToHex(d.structHash)}</code>
            </li>
            <li>
              <span>domainSeparator</span>
              <code>{bytesToHex(d.domain.separator)}</code>
            </li>
            <li>
              <span>digest</span>
              <code>{bytesToHex(d.digest)}</code>
            </li>
          </ol>
        </dd>
        <dt>channelState(Amina, Node)</dt>
        <dd className="xk-mono">
          id {id.slice(0, 18)}.., lastSequence {ch?.lastSequence ?? 0}, settledUnits {ch?.settledUnits ?? 0}
        </dd>
        <dt>feeOn(1 KES)</dt>
        <dd className="xk-mono">{Math.floor((1_000_000 * world.treasury.feeBps) / 10_000)} micro-KES</dd>
        <dt>nonces</dt>
        <dd className="xk-mono">Amina {world.token.nonces.amina}, Baraka {world.token.nonces.baraka}</dd>
      </dl>
    </div>
  );
}

export default function Console({ world, commit }) {
  const groups = [...new Set(PRIMS.map((p) => p.group))];
  const [open, setOpen] = useState('xKoinEscrow');
  return (
    <section className="xk-dm-panel" id="primitives">
      <header className="xk-dm-panel__head">
        <h2>Primitives</h2>
        <p className="xk-note">Every state-changing function of the three contracts and every off-chain step, one at a time. Choose any caller: access control is enforced exactly as on chain, so the wrong caller reverts and still pays revert gas.</p>
        <div className="xk-dm-seg" role="group" aria-label="Contract">
          {[...groups, 'Views'].map((g) => (
            <button type="button" key={g} className={open === g ? 'is-on' : ''} onClick={() => setOpen(g)}>
              {g}
            </button>
          ))}
        </div>
      </header>
      {!world.deployed && open !== 'Off chain' && <p className="xk-dm-warn">Contracts are not deployed yet: run lifecycle step 1.</p>}
      <div className="xk-dm-prims">
        {open === 'Views' ? <Views world={world} /> : PRIMS.filter((p) => p.group === open).map((p) => <Prim key={p.fn} p={p} world={world} commit={commit} />)}
      </div>
    </section>
  );
}
