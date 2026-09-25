/*
 * The /demo world: xKoinToken, xKoinEscrow and xKoinTreasury ported rule for
 * rule from contracts/src, plus the off-chain parties around them (the kiosk
 * with its M-Pesa float and Ed25519 root key, the client wallets, the node,
 * the relayer). Every call either commits and appends a ledger entry, or
 * reverts with the same custom error the contract would raise and still
 * charges the gas a revert burns.
 *
 * All token amounts are integers in micro-KES (XKN base units, 6 decimals).
 * ETH balances are in gwei. Time is unix seconds and advances 2 s per
 * transaction, Base's block time.
 *
 * The engine is pure JavaScript with no DOM so web/scripts/verify-demo.mjs can
 * replay the chain proof through it under node.
 */

import {
  bytesToHex,
  channelId,
  demoKey,
  authDigest,
  permitDigest,
  recoverAddress,
  signDigest,
  signVoucher,
  keccakText,
  ticketDigest,
  verifyVoucher,
} from './crypto.js';
import { GAS, PRICES, REVERT_GAS, gasToGwei, gasToKes, gasToUsd, settleGas } from './gas.js';

export const UKES = 1_000_000;
export const kes = (n) => Math.round(n * UKES);

/** The local anvil deployment the chain proof ran against, so ticket digests match hashTicket. */
export const CONTRACTS = {
  chainId: 31337,
  token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  treasury: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  escrow: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

export const ESCROW_DOMAIN = { name: 'xKoinEscrow', version: '1', chainId: CONTRACTS.chainId, verifyingContract: CONTRACTS.escrow };
export const TOKEN_DOMAIN = { name: 'xKoin', version: '1', chainId: CONTRACTS.chainId, verifyingContract: CONTRACTS.token };

export const ACTORS = {
  owner: { name: 'Owner multisig', role: 'Owns all three contracts. HANDOVER item 10: a Safe, never one key.' },
  kiosk: { name: 'Kiosk (bridge)', role: 'gateway-api hot key: mints against M-Pesa, burns after payout, relays gasless calls, Ed25519 voucher root.' },
  relayer: { name: 'Relayer', role: 'Submits ticket batches. Holds no privilege; anyone could run one.' },
  node: { name: 'Node admin', role: 'Operates the gateway Node that relays WAN bytes and is paid per 10 KB unit.' },
  amina: { name: 'Amina', role: 'Client. Holds a seed phrase on her phone and no ETH.' },
  baraka: { name: 'Baraka', role: 'Client. Second wallet for send and receive.' },
  founder: { name: 'Founder cold key', role: 'Treasury beneficiary. Hardware wallet, used only to veto.' },
  mallory: { name: 'Mallory', role: 'Attacker. Used by the recovery drills.' },
};

/** Keys live outside the world so the world stays plain data. Demo keys, public by construction. */
export const KEYS = Object.fromEntries(Object.keys(ACTORS).map((k) => [k, demoKey(k)]));
export const addr = (who) => (CONTRACTS[who] && who !== 'chainId' ? CONTRACTS[who] : KEYS[who]?.address);
export const nameOf = (who) => ACTORS[who]?.name ?? { token: 'xKoinToken', escrow: 'xKoinEscrow', treasury: 'xKoinTreasury' }[who] ?? who;

export const DEFAULT_PARAMS = {
  ...PRICES,
  pricePerUnit: 500, // micro-KES per unit, paper 04 placeholder (0.05 KES/MB)
  unitBytes: 10_000, // 1 unit = 10 KB, xKoinEscrow comment and trace_chain.py
  feeBps: 500, // 5 percent
  mintCapKes: 50_000, // paper 04 s3 default
  receiptBytes: 1_000_000, // run_sim.py S1 receipt_every
  onlineCapKes: 20, // paper 04 session credit rule
  offlineCapKes: 5,
  epochSeconds: 86_400, // ticket expiry window
  voucherSeconds: 86_400, // paper 04 s4: 24-hour voucher
};

const START_TIME = 1_790_000_000;

export function createWorld(params = DEFAULT_PARAMS) {
  const zeroes = () => Object.fromEntries(Object.keys(ACTORS).map((k) => [k, 0]));
  return {
    params: { ...params },
    t: START_TIME,
    block: 0,
    deployed: false,
    token: {
      owner: null,
      pendingOwner: null,
      supply: 0,
      bal: { ...zeroes(), escrow: 0, treasury: 0 },
      allow: {},
      nonces: zeroes(),
      bridges: {},
    },
    escrow: { owner: null, pendingOwner: null, deposits: zeroes(), earnings: zeroes(), channels: {}, authNonces: zeroes(), pricePerUnit: 0, lastPriceChange: 0 },
    treasury: { owner: null, pendingOwner: null, feeBps: 0, beneficiary: null, pending: null, activation: 0 },
    // Off chain.
    fiat: { mpesa: { ...zeroes(), amina: kes(2_000), baraka: kes(500) }, float: 0, payoutsPending: [] },
    eth: { ...zeroes(), owner: 10_000_000, kiosk: 10_000_000, relayer: 10_000_000, node: 5_000_000, founder: 1_000_000, mallory: 5_000_000 },
    gasSpent: {}, // payer -> { gas, kes }
    tickets: {}, // `${client}>${node}` -> [signed tickets], newest last
    permits: [],
    vouchers: [],
    devices: { amina: true, baraka: true },
    session: null,
    ledger: [],
    seq: 0,
  };
}

// ---------------------------------------------------------------------------
// Errors and the call wrapper
// ---------------------------------------------------------------------------

class Revert extends Error {
  constructor(name, detail = '') {
    super(detail ? `${name}: ${detail}` : name);
    this.errorName = name;
  }
}
const need = (cond, name, detail) => {
  if (!cond) throw new Revert(name, detail);
};

/** A flat view of every balance that matters, used to diff each step. */
export function metrics(w) {
  const m = {};
  for (const k of Object.keys(ACTORS)) {
    m[`${k}.wallet`] = w.token.bal[k];
    m[`${k}.escrow`] = w.escrow.deposits[k];
    m[`${k}.earnings`] = w.escrow.earnings[k];
    m[`${k}.mpesa`] = w.fiat.mpesa[k];
    m[`${k}.eth`] = w.eth[k];
  }
  m['token.supply'] = w.token.supply;
  m['escrow.balance'] = w.token.bal.escrow;
  m['treasury.balance'] = w.token.bal.treasury;
  m['kiosk.float'] = w.fiat.float;
  return m;
}

export function invariants(w) {
  const deposits = Object.values(w.escrow.deposits).reduce((a, b) => a + b, 0);
  const earnings = Object.values(w.escrow.earnings).reduce((a, b) => a + b, 0);
  const held = Object.values(w.token.bal).reduce((a, b) => a + b, 0);
  return [
    {
      id: 'solvency',
      label: 'Escrow solvency',
      rule: 'token.balanceOf(escrow) == sum(deposits) + sum(earnings)',
      ok: w.token.bal.escrow === deposits + earnings,
      lhs: w.token.bal.escrow,
      rhs: deposits + earnings,
    },
    {
      id: 'conservation',
      label: 'Supply conservation',
      rule: 'sum(balanceOf) == totalSupply',
      ok: held === w.token.supply,
      lhs: held,
      rhs: w.token.supply,
    },
    {
      id: 'peg',
      label: 'Fiat peg',
      rule: 'totalSupply == KES float held by the kiosk',
      ok: w.token.supply === w.fiat.float,
      lhs: w.token.supply,
      rhs: w.fiat.float,
    },
  ];
}

/**
 * Run one call. `spec` = { fn, from, contract, layer, gasKey, payer, args, flow, title, note }.
 * `body(w, ctx)` mutates the cloned world and may throw Revert; ctx collects
 * events and crypto steps. On-chain calls charge gas to the payer whether or
 * not they revert; off-chain steps cost no gas.
 */
function call(world, spec, body) {
  const w = structuredClone(world);
  const before = metrics(world);
  const ctx = { events: [], crypto: [], notes: [], gasOverride: null, result: undefined };
  const onChain = spec.layer === 'chain';
  let ok = true;
  let error = null;

  if (onChain) {
    w.t += 2;
    w.block += 1;
  }

  try {
    body(w, ctx);
  } catch (err) {
    if (!(err instanceof Revert)) throw err;
    ok = false;
    error = err.message;
  }

  // A reverted call rolls state back but still burns gas.
  const out = ok ? w : Object.assign(structuredClone(world), { t: w.t, block: w.block });
  let gas = 0;
  let gasSrc = null;
  if (onChain) {
    const key = spec.gasKey ?? spec.fn;
    if (ok) {
      gas = ctx.gasOverride?.gas ?? GAS[key]?.gas ?? REVERT_GAS.default;
      gasSrc = ctx.gasOverride ?? GAS[key] ?? { src: 'estimate', note: 'no measurement' };
    } else {
      gas = REVERT_GAS[spec.fn] ?? REVERT_GAS.default;
      gasSrc = { src: REVERT_GAS[spec.fn] ? 'measured' : 'estimate', note: 'gas burned by a revert' };
    }
    const payer = spec.payer ?? spec.from;
    const gwei = gasToGwei(gas, out.params);
    if (out.eth[payer] < gwei) {
      // The node rejects the transaction before it reaches a block: no state, no gas.
      const failed = Object.assign(structuredClone(world), {});
      return finish(failed, spec, {
        ok: false,
        error: `insufficient funds for gas: ${nameOf(payer)} holds ${fmtGwei(out.eth[payer])} ETH, needs ${fmtGwei(gwei)}`,
        gas: 0,
        gasSrc: null,
        before,
        ctx,
        rejected: true,
      });
    }
    out.eth[payer] -= gwei;
    const spent = out.gasSpent[payer] ?? { gas: 0, kes: 0, txs: 0 };
    out.gasSpent[payer] = { gas: spent.gas + gas, kes: spent.kes + gasToKes(gas, out.params), txs: spent.txs + 1 };
  }
  return finish(out, spec, { ok, error, gas, gasSrc, before, ctx });
}

const fmtGwei = (gwei) => (gwei / 1e9).toFixed(9);

function finish(w, spec, { ok, error, gas, gasSrc, before, ctx, rejected = false }) {
  const after = metrics(w);
  const diffs = Object.keys(after)
    .filter((k) => after[k] !== before[k])
    .map((k) => ({ key: k, before: before[k], after: after[k], delta: after[k] - before[k] }));
  w.seq += 1;
  const entry = {
    id: w.seq,
    t: w.t,
    block: spec.layer === 'chain' && !rejected ? w.block : null,
    flow: spec.flow ?? null,
    title: spec.title ?? spec.fn,
    fn: spec.fn,
    contract: spec.contract ?? null,
    layer: spec.layer,
    from: spec.from,
    payer: spec.layer === 'chain' ? spec.payer ?? spec.from : null,
    args: spec.args ?? {},
    ok,
    rejected,
    error,
    gas,
    gasSrc,
    kes: gasToKes(gas, w.params),
    usd: gasToUsd(gas, w.params),
    events: ctx.events,
    crypto: ctx.crypto,
    notes: [...(spec.note ? [spec.note] : []), ...ctx.notes],
    diffs,
    invariants: invariants(w),
  };
  w.ledger = [...w.ledger, entry];
  return { world: w, entry, result: ctx.result };
}

const onlyOwner = (w, c, from) => need(w[c].owner === from, 'OwnableUnauthorizedAccount', `${nameOf(from)} is not the ${c} owner`);

// ---------------------------------------------------------------------------
// Deployment
// ---------------------------------------------------------------------------

export function deploy(world, flow = 'deploy') {
  let w = world;
  const p = w.params;
  const steps = [
    ['create:xKoinToken', 1_512_737, (x) => (x.token.owner = 'owner')],
    ['create:xKoinTreasury', 746_884, (x) => Object.assign(x.treasury, { owner: 'owner', feeBps: p.feeBps, beneficiary: 'founder' })],
    ['create:xKoinEscrow', 2_210_501, (x, ctx) => {
      need(p.pricePerUnit >= 1 && p.pricePerUnit <= 50_000, 'PriceOutOfBand');
      Object.assign(x.escrow, { owner: 'owner', pricePerUnit: p.pricePerUnit, lastPriceChange: x.t });
      x.deployed = true;
      ctx.events.push({ name: 'PricePerUnitSet', args: { pricePerUnit: p.pricePerUnit } });
    }],
  ];
  for (const [fn, gas, fx] of steps) {
    ({ world: w } = call(w, { fn, from: 'owner', layer: 'chain', flow, title: fn.replace('create:', 'Deploy ') }, (x, ctx) => {
      fx(x, ctx);
      ctx.gasOverride = { gas, src: 'measured', note: 'forge deployment cost, chain proof agrees' };
    }));
  }
  return w;
}

// ---------------------------------------------------------------------------
// xKoinToken
// ---------------------------------------------------------------------------

export const token = {
  setBridge: (w, { from, bridge, allowed, dailyMintCap, flow }) =>
    call(w, { fn: 'setBridge', contract: 'token', from, layer: 'chain', flow, args: { bridge, allowed, dailyMintCap } }, (x, ctx) => {
      onlyOwner(x, 'token', from);
      const info = x.token.bridges[bridge] ?? { allowed: false, cap: 0, minted: 0, windowStart: 0 };
      x.token.bridges[bridge] = { ...info, allowed, cap: dailyMintCap };
      ctx.events.push({ name: 'BridgeSet', args: { bridge: addr(bridge), allowed, dailyMintCap } });
    }),

  bridgeMint: (w, { from, to, amount, fiatRef, flow, title }) =>
    call(w, { fn: 'bridgeMint', contract: 'token', from, layer: 'chain', flow, title, args: { to, amount, fiatRef } }, (x, ctx) => {
      const info = x.token.bridges[from];
      need(info?.allowed, 'NotBridge', `${nameOf(from)} is not a listed bridge`);
      if (x.t >= info.windowStart + 86_400) {
        info.windowStart = x.t;
        info.minted = 0;
      }
      need(info.minted + amount <= info.cap, 'MintCapExceeded', `window has ${fmt(info.cap - info.minted)} KES left of ${fmt(info.cap)}`);
      info.minted += amount;
      x.token.supply += amount;
      x.token.bal[to] += amount;
      const ref = bytesToHex(keccakText(fiatRef));
      ctx.crypto.push({ label: 'fiatRef = keccak256(M-Pesa receipt id)', value: ref, input: fiatRef });
      ctx.events.push({ name: 'Transfer', args: { from: '0x0', to: addr(to), value: amount } });
      ctx.events.push({ name: 'BridgeMint', args: { to: addr(to), amount, fiatRef: ref } });
    }),

  bridgeBurn: (w, { from, amount, fiatRef, flow, title }) =>
    call(w, { fn: 'bridgeBurn', contract: 'token', from, layer: 'chain', flow, title, args: { amount, fiatRef } }, (x, ctx) => {
      need(x.token.bridges[from]?.allowed, 'NotBridge');
      need(x.token.bal[from] >= amount, 'ERC20InsufficientBalance', `bridge holds ${fmt(x.token.bal[from])} KES`);
      x.token.bal[from] -= amount;
      x.token.supply -= amount;
      ctx.events.push({ name: 'BridgeBurn', args: { from: addr(from), amount, fiatRef: bytesToHex(keccakText(fiatRef)) } });
      ctx.notes.push('Burns only the bridge\'s own balance. The function takes no account parameter, so no key can burn a user balance.');
    }),

  approve: (w, { from, spender, amount, flow }) =>
    call(w, { fn: 'approve', contract: 'token', from, layer: 'chain', flow, args: { spender, amount } }, (x, ctx) => {
      x.token.allow[from] = { ...(x.token.allow[from] ?? {}), [spender]: amount };
      ctx.events.push({ name: 'Approval', args: { owner: addr(from), spender: addr(spender), value: amount } });
    }),

  transfer: (w, { from, to, amount, flow, title }) =>
    call(w, { fn: 'transfer', contract: 'token', from, layer: 'chain', flow, title, args: { to, amount } }, (x, ctx) => {
      move(x, from, to, amount);
      ctx.events.push({ name: 'Transfer', args: { from: addr(from), to: addr(to), value: amount } });
    }),

  transferFrom: (w, { from, owner, to, amount, flow, title }) =>
    call(w, { fn: 'transferFrom', contract: 'token', from, layer: 'chain', flow, title, args: { owner, to, amount } }, (x, ctx) => {
      spendAllowance(x, owner, from, amount);
      move(x, owner, to, amount);
      ctx.events.push({ name: 'Transfer', args: { from: addr(owner), to: addr(to), value: amount } });
    }),

  /** Relayed EIP-2612 permit. `permit` comes from signPermit. */
  permit: (w, { from, permit, flow, title }) =>
    call(w, { fn: 'permit', contract: 'token', from, layer: 'chain', flow, title, args: { owner: permit.owner, spender: permit.spender, value: permit.value } }, (x, ctx) => {
      applyPermit(x, permit, ctx);
    }),
};

function move(x, from, to, amount) {
  need(x.token.bal[from] >= amount, 'ERC20InsufficientBalance', `${nameOf(from)} holds ${fmt(x.token.bal[from])} KES, needs ${fmt(amount)}`);
  x.token.bal[from] -= amount;
  x.token.bal[to] += amount;
}

function spendAllowance(x, owner, spender, amount) {
  const current = x.token.allow[owner]?.[spender] ?? 0;
  need(current >= amount, 'ERC20InsufficientAllowance', `${nameOf(spender)} may spend ${fmt(current)} KES of ${nameOf(owner)}'s`);
  x.token.allow[owner] = { ...x.token.allow[owner], [spender]: current - amount };
}

function applyPermit(x, permit, ctx) {
  need(x.t <= permit.deadline, 'ERC2612ExpiredSignature');
  const d = permitDigest({ ...permit, owner: addr(permit.owner), spender: addr(permit.spender), nonce: x.token.nonces[permit.owner] }, TOKEN_DOMAIN);
  const signer = recoverAddress(d.digest, permit.signature);
  ctx.crypto.push({ label: 'permit digest, nonce ' + x.token.nonces[permit.owner], value: bytesToHex(d.digest) });
  ctx.crypto.push({ label: 'ecrecover(digest, sig)', value: signer ?? 'invalid signature' });
  need(signer === addr(permit.owner), 'ERC2612InvalidSigner', 'signature does not recover to the owner (nonce already used, or forged)');
  x.token.nonces[permit.owner] += 1;
  x.token.allow[permit.owner] = { ...(x.token.allow[permit.owner] ?? {}), [permit.spender]: permit.value };
  ctx.events.push({ name: 'Approval', args: { owner: addr(permit.owner), spender: addr(permit.spender), value: permit.value } });
}

// ---------------------------------------------------------------------------
// xKoinEscrow
// ---------------------------------------------------------------------------

export const escrow = {
  deposit: (w, { from, amount, flow, title }) =>
    call(w, { fn: 'deposit', contract: 'escrow', from, layer: 'chain', flow, title, gasKey: w.escrow.deposits[from] > 0 ? 'depositRepeat' : 'deposit', args: { amount } }, (x, ctx) => {
      doDeposit(x, from, amount, ctx);
    }),

  depositWithPermit: (w, { from, client, amount, permit, flow, title }) =>
    call(w, { fn: 'depositWithPermit', contract: 'escrow', from, layer: 'chain', flow, title, args: { client, amount } }, (x, ctx) => {
      const warm = x.escrow.deposits[client] > 0;
      try {
        applyPermit(x, permit, ctx);
      } catch (err) {
        if (!(err instanceof Revert)) throw err;
        ctx.notes.push(`permit() failed (${err.errorName}) and was caught: a front-run permit only griefs the relayer. The deposit proceeds on the allowance already set.`);
      }
      doDeposit(x, client, amount, ctx);
      if (warm) ctx.gasOverride = { gas: GAS.depositWithPermit.gas - 17_100, src: 'model', note: 'measured 110,693 less one warm deposit slot (EIP-2200)' };
    }),

  withdrawDeposit: (w, { from, amount, flow, title }) =>
    call(w, { fn: 'withdrawDeposit', contract: 'escrow', from, layer: 'chain', flow, title, args: { amount } }, (x, ctx) => {
      need(amount > 0, 'ZeroAmount');
      need(x.escrow.deposits[from] >= amount, 'InsufficientDeposit', `deposit is ${fmt(x.escrow.deposits[from])} KES`);
      x.escrow.deposits[from] -= amount;
      x.token.bal.escrow -= amount;
      x.token.bal[from] += amount;
      ctx.events.push({ name: 'DepositWithdrawn', args: { client: addr(from), amount } });
    }),

  /** Gasless exit. `auth` comes from offchain.signAuth(kind 'withdraw'). Anyone relays; `to` is signed. */
  withdrawWithSig: (w, { from, auth, to = auth?.to, flow, title }) =>
    call(w, { fn: 'withdrawWithSig', contract: 'escrow', from, layer: 'chain', flow, title, args: { client: auth.from, to, amount: auth.amount } }, (x, ctx) => {
      need(auth.amount > 0, 'ZeroAmount');
      need(to, 'ZeroAddress');
      const warm = (x.token.bal[to] > 0 ? 1 : 0) + (x.escrow.authNonces[auth.from] > 0 ? 1 : 0);
      useAuth(x, 'withdraw', { ...auth, to }, ctx);
      need(x.escrow.deposits[auth.from] >= auth.amount, 'InsufficientDeposit', `deposit is ${fmt(x.escrow.deposits[auth.from])} KES`);
      x.escrow.deposits[auth.from] -= auth.amount;
      x.token.bal.escrow -= auth.amount;
      x.token.bal[to] += auth.amount;
      ctx.events.push({ name: 'DepositWithdrawn', args: { client: addr(auth.from), amount: auth.amount } });
      if (warm) ctx.gasOverride = { gas: GAS.withdrawWithSig.gas - warm * 17_100, src: 'model', note: `measured 93,358 less ${warm} warm slot(s) (EIP-2200)` };
    }),

  /** Escrow-to-escrow, relayed. No token moves. */
  transferDeposit: (w, { from, auth, to = auth?.to, flow, title }) =>
    call(w, { fn: 'transferDeposit', contract: 'escrow', from, layer: 'chain', flow, title, args: { from: auth.from, to, amount: auth.amount } }, (x, ctx) => {
      need(auth.amount > 0, 'ZeroAmount');
      need(to, 'ZeroAddress');
      const warm = (x.escrow.deposits[to] > 0 ? 1 : 0) + (x.escrow.authNonces[auth.from] > 0 ? 1 : 0);
      useAuth(x, 'transfer', { ...auth, to }, ctx);
      need(x.escrow.deposits[auth.from] >= auth.amount, 'InsufficientDeposit', `deposit is ${fmt(x.escrow.deposits[auth.from])} KES`);
      x.escrow.deposits[auth.from] -= auth.amount;
      x.escrow.deposits[to] += auth.amount;
      ctx.events.push({ name: 'DepositTransferred', args: { from: addr(auth.from), to: addr(to), amount: auth.amount } });
      ctx.notes.push('Only two deposit entries change. The escrow token balance is untouched, so solvency holds by construction.');
      if (warm) ctx.gasOverride = { gas: GAS.transferDeposit.gas - warm * 17_100, src: 'model', note: `measured 83,050 less ${warm} warm slot(s) (EIP-2200)` };
    }),

  /** tickets: [{ client, nodeAdmin, sequenceNumber, cumulativeUnits, epochExpiry, signature }] */
  settleTicketBatch: (w, { from, tickets, flow, title }) =>
    call(w, { fn: 'settleTicketBatch', contract: 'escrow', from, layer: 'chain', flow, title, args: { tickets: tickets.length } }, (x, ctx) => {
      need(tickets.length > 0, 'EmptyBatch');
      const treasuryWarm = x.token.bal.treasury > 0;
      const shape = [];
      let gross = 0;
      let totalFee = 0;
      tickets.forEach((t, i) => {
        need(t.epochExpiry >= x.t, 'ExpiredTicket', `index ${i}: expired ${x.t - t.epochExpiry} s ago`);
        const id = channelId(addr(t.client), addr(t.nodeAdmin));
        const ch = x.escrow.channels[id] ?? { lastSequence: 0, settledUnits: 0 };
        need(t.sequenceNumber > ch.lastSequence, 'StaleSequence', `index ${i}: sequence ${t.sequenceNumber} <= last settled ${ch.lastSequence}`);
        need(t.cumulativeUnits > ch.settledUnits, 'NoNewUnits', `index ${i}: ${t.cumulativeUnits} units <= ${ch.settledUnits} settled`);
        const d = ticketDigest({ ...t, client: addr(t.client), nodeAdmin: addr(t.nodeAdmin) }, ESCROW_DOMAIN);
        const signer = recoverAddress(d.digest, t.signature);
        ctx.crypto.push({ label: `ticket ${i} channelId = keccak256(client || nodeAdmin)`, value: id });
        ctx.crypto.push({ label: `ticket ${i} EIP-712 digest`, value: bytesToHex(d.digest) });
        ctx.crypto.push({ label: `ticket ${i} ECDSA.recover`, value: signer ?? 'invalid signature' });
        need(signer === addr(t.client), 'BadSignature', `index ${i}: recovered ${signer ?? 'nothing'}, expected ${addr(t.client)}`);

        const delta = t.cumulativeUnits - ch.settledUnits;
        const owed = delta * x.escrow.pricePerUnit;
        const available = x.escrow.deposits[t.client];
        const paid = Math.min(owed, available);
        shape.push({ channelWarm: ch.lastSequence > 0, earningsWarm: x.escrow.earnings[t.nodeAdmin] > 0 });
        x.escrow.channels[id] = { lastSequence: t.sequenceNumber, settledUnits: t.cumulativeUnits, client: t.client, nodeAdmin: t.nodeAdmin };
        let fee = 0;
        if (paid > 0) {
          x.escrow.deposits[t.client] = available - paid;
          fee = Math.floor((paid * x.treasury.feeBps) / 10_000);
          x.escrow.earnings[t.nodeAdmin] += paid - fee;
        }
        if (paid < owed) ctx.notes.push(`ticket ${i}: owed ${fmt(owed)} KES, deposit held ${fmt(available)} KES, paid ${fmt(paid)}. The node carries the ${fmt(owed - paid)} KES gap.`);
        gross += paid;
        totalFee += fee;
        ctx.events.push({ name: 'TicketSettled', args: { client: addr(t.client), nodeAdmin: addr(t.nodeAdmin), sequenceNumber: t.sequenceNumber, deltaUnits: delta, paidAmount: paid } });
      });
      need(gross > 0, 'ZeroAmount', 'no ticket paid anything');
      if (totalFee > 0) {
        x.token.bal.escrow -= totalFee;
        x.token.bal.treasury += totalFee;
      }
      ctx.events.push({ name: 'BatchSettled', args: { relayer: addr(from), gross, fee: totalFee, net: gross - totalFee } });
      ctx.result = { gross, fee: totalFee, net: gross - totalFee };
      ctx.gasOverride = { gas: settleGas(shape, { treasuryWarm }), src: 'model', note: `${tickets.length} ticket(s): 71,467 + 59,924 each, less 17,100 per warm slot` };
    }),

  claimEarnings: (w, { from, to, amount, flow, title }) =>
    call(w, { fn: 'claimEarnings', contract: 'escrow', from, layer: 'chain', flow, title, args: { to, amount } }, (x, ctx) => {
      need(amount > 0, 'ZeroAmount');
      need(x.escrow.earnings[from] >= amount, 'InsufficientEarnings', `earnings are ${fmt(x.escrow.earnings[from])} KES`);
      x.escrow.earnings[from] -= amount;
      x.token.bal.escrow -= amount;
      x.token.bal[to] += amount;
      ctx.events.push({ name: 'EarningsClaimed', args: { nodeAdmin: addr(from), to: addr(to), amount } });
    }),

  setPricePerUnit: (w, { from, newPrice, flow }) =>
    call(w, { fn: 'setPricePerUnit', contract: 'escrow', from, layer: 'chain', flow, args: { newPrice } }, (x, ctx) => {
      onlyOwner(x, 'escrow', from);
      need(newPrice >= 1 && newPrice <= 50_000, 'PriceOutOfBand', 'band is 1 to 50,000 micro-KES per unit');
      need(x.t >= x.escrow.lastPriceChange + 86_400, 'PriceCooldownActive', `next change allowed in ${fmtDur(x.escrow.lastPriceChange + 86_400 - x.t)}`);
      x.escrow.pricePerUnit = newPrice;
      x.escrow.lastPriceChange = x.t;
      ctx.events.push({ name: 'PricePerUnitSet', args: { pricePerUnit: newPrice } });
    }),
};

/** _useAuthorization: deadline, then signer at the current nonce, then consume the nonce. */
function useAuth(x, kind, auth, ctx) {
  need(x.t <= auth.deadline, 'AuthorizationExpired');
  const nonce = x.escrow.authNonces[auth.from];
  const d = authDigest(kind, { from: addr(auth.from), to: addr(auth.to), amount: auth.amount, nonce, deadline: auth.deadline }, ESCROW_DOMAIN);
  const signer = recoverAddress(d.digest, auth.signature);
  ctx.crypto.push({ label: `${kind === 'withdraw' ? 'Withdraw' : 'TransferDeposit'} digest at nonce ${nonce} (to ${nameOf(auth.to)})`, value: bytesToHex(d.digest) });
  ctx.crypto.push({ label: 'ECDSA.tryRecover', value: signer ?? 'invalid signature' });
  need(signer === addr(auth.from), 'BadAuthorization', 'signature does not recover to the client for this destination, amount and nonce');
  x.escrow.authNonces[auth.from] = nonce + 1;
}

function doDeposit(x, client, amount, ctx) {
  need(amount > 0, 'ZeroAmount');
  spendAllowance(x, client, 'escrow', amount);
  move(x, client, 'escrow', amount);
  x.escrow.deposits[client] += amount;
  ctx.events.push({ name: 'Deposited', args: { client: addr(client), amount } });
}

// ---------------------------------------------------------------------------
// xKoinTreasury
// ---------------------------------------------------------------------------

export const treasury = {
  claim: (w, { from, flow, title }) =>
    call(w, { fn: 'claim', contract: 'treasury', from, layer: 'chain', flow, title, args: { token: 'XKN' } }, (x, ctx) => {
      const amount = x.token.bal.treasury;
      need(amount > 0, 'NothingToClaim');
      x.token.bal.treasury = 0;
      x.token.bal[x.treasury.beneficiary] += amount;
      ctx.events.push({ name: 'Claimed', args: { token: CONTRACTS.token, beneficiary: addr(x.treasury.beneficiary), amount } });
      if (from !== x.treasury.beneficiary) ctx.notes.push(`${nameOf(from)} paid the gas; the funds went to ${nameOf(x.treasury.beneficiary)}. The destination is not a parameter.`);
    }),

  setFeeBps: (w, { from, feeBps, flow }) =>
    call(w, { fn: 'setFeeBps', contract: 'treasury', from, layer: 'chain', flow, args: { feeBps } }, (x, ctx) => {
      onlyOwner(x, 'treasury', from);
      need(feeBps <= 1000, 'FeeTooHigh', 'MAX_FEE_BPS is 1000 (10 percent)');
      x.treasury.feeBps = feeBps;
      ctx.events.push({ name: 'FeeBpsSet', args: { feeBps } });
    }),

  queueBeneficiary: (w, { from, next, flow }) =>
    call(w, { fn: 'queueBeneficiary', contract: 'treasury', from, layer: 'chain', flow, args: { newBeneficiary: next } }, (x, ctx) => {
      onlyOwner(x, 'treasury', from);
      x.treasury.pending = next;
      x.treasury.activation = x.t + 7 * 86_400;
      ctx.events.push({ name: 'BeneficiaryChangeQueued', args: { pending: addr(next), activation: x.treasury.activation } });
    }),

  activateBeneficiary: (w, { from, flow }) =>
    call(w, { fn: 'activateBeneficiary', contract: 'treasury', from, layer: 'chain', flow }, (x, ctx) => {
      need(x.treasury.pending, 'NoPendingChange');
      need(x.t >= x.treasury.activation, 'TimelockActive', `${fmtDur(x.treasury.activation - x.t)} left`);
      x.treasury.beneficiary = x.treasury.pending;
      x.treasury.pending = null;
      x.treasury.activation = 0;
      ctx.events.push({ name: 'BeneficiaryChanged', args: { beneficiary: addr(x.treasury.beneficiary) } });
    }),

  cancelBeneficiaryChange: (w, { from, flow }) =>
    call(w, { fn: 'cancelBeneficiaryChange', contract: 'treasury', from, layer: 'chain', flow }, (x, ctx) => {
      need(from === x.treasury.owner || from === x.treasury.beneficiary, 'NotAuthorized');
      need(x.treasury.pending, 'NoPendingChange');
      x.treasury.pending = null;
      x.treasury.activation = 0;
      ctx.events.push({ name: 'BeneficiaryChangeCancelled', args: { cancelledBy: addr(from) } });
    }),
};

/** Ownable2Step, the same on all three contracts. */
export const ownable = {
  transferOwnership: (w, { from, contract, next, flow }) =>
    call(w, { fn: 'transferOwnership', contract, from, layer: 'chain', flow, args: { newOwner: next } }, (x, ctx) => {
      onlyOwner(x, contract, from);
      x[contract].pendingOwner = next;
      ctx.events.push({ name: 'OwnershipTransferStarted', args: { previousOwner: addr(from), newOwner: addr(next) } });
    }),
  acceptOwnership: (w, { from, contract, flow }) =>
    call(w, { fn: 'acceptOwnership', contract, from, layer: 'chain', flow }, (x, ctx) => {
      need(x[contract].pendingOwner === from, 'OwnableUnauthorizedAccount', 'caller is not the pending owner');
      const prev = x[contract].owner;
      x[contract].owner = from;
      x[contract].pendingOwner = null;
      ctx.events.push({ name: 'OwnershipTransferred', args: { previousOwner: addr(prev), newOwner: addr(from) } });
    }),
};

// ---------------------------------------------------------------------------
// Off chain: wallets, kiosk, fiat rails, time
// ---------------------------------------------------------------------------

const deviceNeeded = (x, who) => need(x.devices[who] !== false, 'DeviceUnavailable', `${nameOf(who)}'s phone is lost; restore the wallet from its seed first`);

export const offchain = {
  /** The client wallet signs a cumulative EIP-712 ticket. Real secp256k1. */
  signTicket: (w, { client, nodeAdmin, cumulativeUnits, flow, title, signer }) =>
    call(w, { fn: 'signTicket', from: signer ?? client, layer: 'wallet', flow, title: title ?? 'Sign ticket', args: { nodeAdmin, cumulativeUnits } }, (x, ctx) => {
      deviceNeeded(x, signer ?? client);
      const key = `${client}>${nodeAdmin}`;
      const list = x.tickets[key] ?? [];
      const id = channelId(addr(client), addr(nodeAdmin));
      const onchainSeq = x.escrow.channels[id]?.lastSequence ?? 0;
      const sequenceNumber = Math.max(onchainSeq, list.at(-1)?.sequenceNumber ?? 0) + 1;
      const t = { client, nodeAdmin, sequenceNumber, cumulativeUnits, epochExpiry: x.t + x.params.epochSeconds };
      const d = ticketDigest({ ...t, client: addr(client), nodeAdmin: addr(nodeAdmin) }, ESCROW_DOMAIN);
      const sig = signDigest(d.digest, KEYS[signer ?? client].secret);
      const signed = { ...t, signature: sig.signature, digest: bytesToHex(d.digest), signedBy: signer ?? client, at: x.t };
      x.tickets[key] = [...list, signed];
      ctx.crypto.push({ label: 'TICKET_TYPEHASH', value: bytesToHex(d.typeHash) });
      ctx.crypto.push({ label: 'structHash = keccak256(typehash, client, nodeAdmin, seq, units, expiry)', value: bytesToHex(d.structHash) });
      ctx.crypto.push({ label: 'domainSeparator (xKoinEscrow, 1, chain ' + CONTRACTS.chainId + ')', value: bytesToHex(d.domain.separator) });
      ctx.crypto.push({ label: 'digest = keccak256(0x1901 || domain || structHash)', value: bytesToHex(d.digest) });
      ctx.crypto.push({ label: 'secp256k1 signature r || s || v', value: sig.signature });
      ctx.result = signed;
    }),

  /** The client wallet signs an EIP-2612 permit for the kiosk to relay. */
  signPermit: (w, { owner, spender, value, flow, title }) =>
    call(w, { fn: 'signPermit', from: owner, layer: 'wallet', flow, title: title ?? 'Sign permit', args: { spender, value } }, (x, ctx) => {
      deviceNeeded(x, owner);
      const deadline = x.t + 3_600;
      const nonce = x.token.nonces[owner];
      const d = permitDigest({ owner: addr(owner), spender: addr(spender), value, nonce, deadline }, TOKEN_DOMAIN);
      const sig = signDigest(d.digest, KEYS[owner].secret);
      const permit = { owner, spender, value, nonce, deadline, signature: sig.signature };
      x.permits = [...x.permits, permit];
      ctx.crypto.push({ label: 'Permit struct hash (owner, spender, value, nonce ' + nonce + ', deadline)', value: bytesToHex(d.structHash) });
      ctx.crypto.push({ label: 'digest (domain xKoin, 1)', value: bytesToHex(d.digest) });
      ctx.crypto.push({ label: 'secp256k1 signature', value: sig.signature });
      ctx.result = permit;
    }),

  /** The client wallet signs a Withdraw or TransferDeposit authorisation for the kiosk to relay. */
  signAuth: (w, { kind, owner, to, amount, flow, title }) =>
    call(w, { fn: 'signAuth', from: owner, layer: 'wallet', flow, title: title ?? `Sign ${kind} authorisation`, args: { kind, to, amount } }, (x, ctx) => {
      deviceNeeded(x, owner);
      const deadline = x.t + 3_600;
      const nonce = x.escrow.authNonces[owner];
      const d = authDigest(kind, { from: addr(owner), to: addr(to), amount, nonce, deadline }, ESCROW_DOMAIN);
      const sig = signDigest(d.digest, KEYS[owner].secret);
      ctx.crypto.push({ label: `${kind === 'withdraw' ? 'WITHDRAW' : 'TRANSFER'}_TYPEHASH`, value: bytesToHex(d.typeHash) });
      ctx.crypto.push({ label: `structHash (from, to ${nameOf(to)}, amount, nonce ${nonce}, deadline)`, value: bytesToHex(d.structHash) });
      ctx.crypto.push({ label: 'digest (domain xKoinEscrow, 1)', value: bytesToHex(d.digest) });
      ctx.crypto.push({ label: 'secp256k1 signature', value: sig.signature });
      ctx.result = { kind, from: owner, to, amount, nonce, deadline, signature: sig.signature };
    }),

  /** Customer pays the kiosk paybill over M-Pesa STK push. */
  stkPush: (w, { client, amount, flow, fail = false }) =>
    call(w, { fn: 'M-Pesa STK push', from: client, layer: 'fiat', flow, title: 'M-Pesa pays kiosk', args: { amount } }, (x, ctx) => {
      need(!fail, 'STKCancelled', 'customer cancelled the prompt; nothing minted');
      need(x.fiat.mpesa[client] >= amount, 'MpesaInsufficientFunds', `M-Pesa balance ${fmt(x.fiat.mpesa[client])} KES`);
      x.fiat.mpesa[client] -= amount;
      x.fiat.float += amount;
      const receipt = `ws_CO_${x.seq + 1}_${Math.round(amount / UKES)}`;
      ctx.result = receipt;
      ctx.notes.push(`Daraja callback ResultCode 0, receipt ${receipt}. The mint waits for this callback.`);
    }),

  /** Kiosk pays out through B2C; the burn follows only on a success callback. */
  b2cPayout: (w, { to, amount, flow, fail = false }) =>
    call(w, { fn: 'M-Pesa B2C payout', from: 'kiosk', layer: 'fiat', flow, title: 'Kiosk pays M-Pesa', args: { to, amount } }, (x, ctx) => {
      need(!fail, 'B2CFailed', 'bank result callback failed; the XKN stays on the bridge and nothing is burned');
      need(x.fiat.float >= amount, 'FloatShort', 'kiosk float below payout');
      x.fiat.float -= amount;
      x.fiat.mpesa[to] += amount;
      ctx.result = `B2C_${x.seq + 1}`;
    }),

  /** Kiosk root key signs an admission voucher. Real Ed25519. */
  issueVoucher: (w, { to, amount, fiatRef, flow }) =>
    call(w, { fn: 'issueVoucher', from: 'kiosk', layer: 'kiosk', flow, title: 'Kiosk signs voucher', args: { to, amount } }, (x, ctx) => {
      const voucher = { address: addr(to), amount_ukes: amount, fiat_ref: fiatRef, rail: 'daraja', issued: x.t, expires: x.t + x.params.voucherSeconds };
      const s = signVoucher(voucher, KEYS.kiosk.secret);
      x.vouchers = [...x.vouchers, { who: to, voucher, signature: s.signature }];
      ctx.crypto.push({ label: 'canonical voucher JSON', value: new TextDecoder().decode(s.message) });
      ctx.crypto.push({ label: 'Ed25519 signature by kiosk root key', value: s.signature });
      ctx.crypto.push({ label: 'kiosk root public key (the 32 bytes in node firmware)', value: KEYS.kiosk.edPublic });
    }),

  /** Node verifies the latest voucher with no network. */
  verifyVoucher: (w, { who, flow }) =>
    call(w, { fn: 'verifyVoucher', from: 'node', layer: 'node', flow, title: 'Node verifies voucher offline', args: { who } }, (x, ctx) => {
      const v = [...x.vouchers].reverse().find((item) => item.who === who);
      need(v, 'NoVoucher', `${nameOf(who)} has no voucher`);
      const ok = verifyVoucher(v.voucher, v.signature, KEYS.kiosk.edPublic);
      ctx.crypto.push({ label: 'Ed25519 verify against kiosk public key', value: ok ? 'valid' : 'INVALID' });
      need(ok, 'VoucherInvalid');
      need(x.t <= v.voucher.expires, 'VoucherExpired', `expired ${fmtDur(x.t - v.voucher.expires)} ago`);
      ctx.result = v;
    }),

  warp: (w, { seconds, flow }) =>
    call(w, { fn: 'warp', from: 'owner', layer: 'time', flow, title: `Time passes: ${fmtDur(seconds)}`, args: { seconds } }, (x) => {
      x.t += seconds;
    }),

  loseDevice: (w, { who, flow }) =>
    call(w, { fn: 'loseDevice', from: who, layer: 'wallet', flow, title: `${nameOf(who)} loses her phone` }, (x, ctx) => {
      x.devices[who] = false;
      ctx.notes.push('Nothing on chain changes. The key is gone from this device; the funds are not.');
    }),

  restoreFromSeed: (w, { who, flow }) =>
    call(w, { fn: 'restoreFromSeed', from: who, layer: 'wallet', flow, title: 'Restore wallet from seed phrase' }, (x, ctx) => {
      x.devices[who] = true;
      ctx.crypto.push({ label: 'seed -> private key -> secp256k1 public key -> keccak256 -> address', value: addr(who) });
      ctx.notes.push('Same seed, same key, same address. Wallet balance and escrow deposit are both keyed by address, so both return intact.');
    }),

  /** Kiosk sends native gas to a client that holds none: the workaround for calls with no relayed path. */
  fundGas: (w, { to, gwei, flow }) =>
    call(w, { fn: 'ethTransfer', from: 'kiosk', layer: 'chain', flow, title: `Kiosk sends gas to ${nameOf(to)}`, args: { to, gwei } }, (x) => {
      need(x.eth.kiosk >= gwei, 'InsufficientEth');
      x.eth.kiosk -= gwei;
      x.eth[to] += gwei;
    }),
};

// ---------------------------------------------------------------------------
// Helpers shared with the UI
// ---------------------------------------------------------------------------

export const fmt = (ukes, digits = 6) => {
  const v = ukes / UKES;
  return v.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: digits });
};

export function fmtDur(seconds) {
  const s = Math.max(0, Math.round(seconds));
  if (s >= 86_400) return `${(s / 86_400).toFixed(s % 86_400 ? 1 : 0)} d`;
  if (s >= 3_600) return `${(s / 3_600).toFixed(1)} h`;
  if (s >= 60) return `${Math.round(s / 60)} min`;
  return `${s} s`;
}

/** Latest signed, unsettled ticket per channel: all a relayer ever needs to submit. */
export function pendingTickets(w, nodeAdmin) {
  const out = [];
  for (const [key, list] of Object.entries(w.tickets)) {
    const latest = list.at(-1);
    if (!latest || (nodeAdmin && latest.nodeAdmin !== nodeAdmin)) continue;
    const ch = w.escrow.channels[channelId(addr(latest.client), addr(latest.nodeAdmin))] ?? { lastSequence: 0, settledUnits: 0 };
    if (latest.sequenceNumber > ch.lastSequence && latest.cumulativeUnits > ch.settledUnits) {
      out.push({ key, ticket: latest, settledUnits: ch.settledUnits, deltaUnits: latest.cumulativeUnits - ch.settledUnits, heldCount: list.length });
    }
  }
  return out;
}

/** What settling `pending` would cost and earn right now, and whether the relayer rule says go. */
export function batchQuote(w, pending) {
  const price = w.escrow.pricePerUnit;
  let gross = 0;
  let fee = 0;
  const shape = pending.map((p) => {
    const owed = p.deltaUnits * price;
    const paid = Math.min(owed, w.escrow.deposits[p.ticket.client]);
    gross += paid;
    fee += Math.floor((paid * w.treasury.feeBps) / 10_000);
    const ch = w.escrow.channels[channelId(addr(p.ticket.client), addr(p.ticket.nodeAdmin))];
    return { channelWarm: Boolean(ch?.lastSequence), earningsWarm: w.escrow.earnings[p.ticket.nodeAdmin] > 0 };
  });
  const gas = pending.length ? settleGas(shape, { treasuryWarm: w.token.bal.treasury > 0 }) : 0;
  const gasKes = gasToKes(gas, w.params);
  return { gross, fee, net: gross - fee, gas, gasKes, feeKes: fee / UKES, go: fee / UKES >= 2 * gasKes };
}
