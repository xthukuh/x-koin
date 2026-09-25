/*
 * Composite journeys built only from the primitives in engine.js. A flow is a
 * list of steps; it stops at the first step that fails and reports where, so
 * a kiosk button never hides a partial result.
 */

import {
  UKES,
  addr,
  batchQuote,
  deploy,
  escrow,
  fmt,
  kes,
  nameOf,
  offchain,
  ownable,
  pendingTickets,
  token,
  treasury,
} from './engine.js';

let flowSeq = 0;
const newFlow = (label) => `${label}#${(flowSeq += 1)}`;

/** Run steps in order. Each step is (world, previousResult) => { world, entry, result }. */
export function runSteps(world, steps) {
  let w = world;
  let prev;
  const entries = [];
  for (const step of steps) {
    const r = step(w, prev);
    w = r.world;
    entries.push(r.entry);
    if (!r.entry.ok) return { world: w, ok: false, entries, failed: r.entry };
    prev = r.result;
  }
  return { world: w, ok: true, entries, result: prev };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function setupNetwork(world) {
  const flow = newFlow('Deploy and configure');
  let w = world.deployed ? world : deploy(world, flow);
  return runSteps(w, [(x) => token.setBridge(x, { from: 'owner', bridge: 'kiosk', allowed: true, dailyMintCap: kes(x.params.mintCapKes), flow })]);
}

/** On-ramp: M-Pesa into the kiosk float, mint only after the callback, then the voucher. */
export function buy(world, { client, amount, failStk = false }) {
  const flow = newFlow(`Buy ${fmt(amount, 2)} KES`);
  let receipt = null;
  return runSteps(world, [
    (w) => {
      const r = offchain.stkPush(w, { client, amount, flow, fail: failStk });
      receipt = r.result;
      return r;
    },
    (w) => token.bridgeMint(w, { from: 'kiosk', to: client, amount, fiatRef: receipt, flow, title: 'Kiosk mints XKN' }),
    (w) => offchain.issueVoucher(w, { to: client, amount, fiatRef: receipt, flow }),
  ]);
}

/** Wallet to escrow, gasless: the client signs a permit, the kiosk relays depositWithPermit. */
export function depositGasless(world, { client, amount }) {
  const flow = newFlow(`Deposit ${fmt(amount, 2)} KES`);
  return runSteps(world, [
    (w) => offchain.signPermit(w, { owner: client, spender: 'escrow', value: amount, flow, title: 'Wallet signs permit for escrow' }),
    (w, permit) => escrow.depositWithPermit(w, { from: 'kiosk', client, amount, permit, flow, title: 'Kiosk relays depositWithPermit' }),
  ]);
}

/** Escrow back to wallet. withdrawDeposit has no relayed form, so the client pays gas. */
export function withdraw(world, { client, amount }) {
  const flow = newFlow(`Withdraw ${fmt(amount, 2)} KES`);
  return runSteps(world, [(w) => escrow.withdrawDeposit(w, { from: client, amount, flow, title: 'Client calls withdrawDeposit' })]);
}

/** Escrow back to wallet, gasless: the client signs a Withdraw authorisation, the kiosk relays withdrawWithSig. */
export function withdrawGasless(world, { client, amount, to = client }) {
  const flow = newFlow(`Withdraw ${fmt(amount, 2)} KES`);
  return runSteps(world, [
    (w) => offchain.signAuth(w, { kind: 'withdraw', owner: client, to, amount, flow, title: 'Phone signs: unlock to my wallet' }),
    (w, auth) => escrow.withdrawWithSig(w, { from: 'kiosk', auth, flow, title: 'Kiosk submits withdrawWithSig' }),
  ]);
}

/** Escrow to escrow: the sender signs TransferDeposit, the kiosk relays. Credit moves, no token does. */
export function sendEscrow(world, { from, to, amount }) {
  const flow = newFlow(`Meter send ${fmt(amount, 2)} KES`);
  return runSteps(world, [
    (w) => offchain.signAuth(w, { kind: 'transfer', owner: from, to, amount, flow, title: 'Phone signs: move meter credit' }),
    (w, auth) => escrow.transferDeposit(w, { from: 'kiosk', auth, flow, title: `Kiosk submits transferDeposit to ${nameOf(to)}` }),
  ]);
}

/** Wallet to wallet with no ETH on the sender: permit to the kiosk, kiosk relays transferFrom. */
export function send(world, { from, to, amount }) {
  const flow = newFlow(`Send ${fmt(amount, 2)} KES`);
  return runSteps(world, [
    (w) => offchain.signPermit(w, { owner: from, spender: 'kiosk', value: amount, flow, title: 'Sender signs permit for kiosk' }),
    (w, permit) => token.permit(w, { from: 'kiosk', permit, flow, title: 'Kiosk relays permit' }),
    (w) => token.transferFrom(w, { from: 'kiosk', owner: from, to, amount, flow, title: `Kiosk relays transferFrom to ${nameOf(to)}` }),
  ]);
}

/** Off-ramp: XKN to the bridge, B2C payout, and only after its callback the bridge burns its own balance. */
export function cashOut(world, { client, amount, failPayout = false }) {
  const flow = newFlow(`Cash out ${fmt(amount, 2)} KES`);
  return runSteps(world, [
    (w) => offchain.signPermit(w, { owner: client, spender: 'kiosk', value: amount, flow, title: 'Client signs permit for kiosk' }),
    (w, permit) => token.permit(w, { from: 'kiosk', permit, flow, title: 'Kiosk relays permit' }),
    (w) => token.transferFrom(w, { from: 'kiosk', owner: client, to: 'kiosk', amount, flow, title: 'XKN moves to the bridge' }),
    (w) => offchain.b2cPayout(w, { to: client, amount, flow, fail: failPayout }),
    (w) => token.bridgeBurn(w, { from: 'kiosk', amount, fiatRef: `B2C_${client}_${amount}`, flow, title: 'Bridge burns its own XKN' }),
  ]);
}

/** Retry a failed payout: the XKN waited on the bridge, so nothing was lost. */
export function retryPayout(world, { client, amount }) {
  const flow = newFlow('Retry payout');
  return runSteps(world, [
    (w) => offchain.b2cPayout(w, { to: client, amount, flow }),
    (w) => token.bridgeBurn(w, { from: 'kiosk', amount, fiatRef: `B2C_retry_${client}_${amount}`, flow, title: 'Bridge burns after success' }),
  ]);
}

/** Relayer submits the latest ticket per channel. */
export function relayBatch(world, { nodeAdmin = null, only = null } = {}) {
  const flow = newFlow('Settle batch');
  const pending = only ?? pendingTickets(world, nodeAdmin).map((p) => p.ticket);
  return runSteps(world, [(w) => escrow.settleTicketBatch(w, { from: 'relayer', tickets: pending, flow, title: `Relayer settles ${pending.length} ticket(s)` })]);
}

export function nodeClaim(world) {
  const flow = newFlow('Node claims');
  const amount = world.escrow.earnings.node;
  return runSteps(world, [(w) => escrow.claimEarnings(w, { from: 'node', to: 'node', amount, flow, title: 'Node admin claims earnings' })]);
}

/** Node admin holds ETH, so its off-ramp is a direct transfer then payout and burn. */
export function nodeCashOut(world) {
  const flow = newFlow('Node cashes out');
  const amount = world.token.bal.node;
  return runSteps(world, [
    (w) => token.transfer(w, { from: 'node', to: 'kiosk', amount, flow, title: 'Node sends XKN to the bridge' }),
    (w) => offchain.b2cPayout(w, { to: 'node', amount, flow }),
    (w) => token.bridgeBurn(w, { from: 'kiosk', amount, fiatRef: `B2C_node_${amount}`, flow, title: 'Bridge burns its own XKN' }),
  ]);
}

export function sweepFees(world, from = 'relayer') {
  const flow = newFlow('Fee sweep');
  return runSteps(world, [(w) => treasury.claim(w, { from, flow, title: `${nameOf(from)} triggers treasury claim` })]);
}

// ---------------------------------------------------------------------------
// The data session: bytes served, tickets signed, credit enforced
// ---------------------------------------------------------------------------

/**
 * Open a session. Online the node reads the deposit and grants
 * min(deposit, online cap). Offline it cannot read the chain, so it verifies
 * the Ed25519 voucher with no network and grants min(voucher, offline cap).
 */
export function openSession(world, { client, nodeAdmin = 'node', targetBytes, offline = false }) {
  const flow = newFlow(`${offline ? 'Offline' : 'Online'} session`);
  const steps = [];
  if (offline) steps.push((w) => offchain.verifyVoucher(w, { who: client, flow }));
  const r = runSteps(world, steps);
  if (!r.ok) return r;
  const w = structuredClone(r.world);
  const p = w.params;
  const key = `${client}>${nodeAdmin}`;
  const signed = w.tickets[key]?.at(-1)?.cumulativeUnits ?? 0;
  const id = Object.values(w.escrow.channels).find((c) => c.client === client && c.nodeAdmin === nodeAdmin);
  const baseUnits = Math.max(signed, id?.settledUnits ?? 0);
  const unsettledUnits = baseUnits - (id?.settledUnits ?? 0);
  const source = offline ? r.result.voucher.amount_ukes : w.escrow.deposits[client];
  const cap = kes(offline ? p.offlineCapKes : p.onlineCapKes);
  const limit = Math.min(source, cap);
  w.session = {
    flow,
    client,
    nodeAdmin,
    offline,
    targetBytes,
    bytes: 0,
    baseUnits,
    unsettledAtStart: unsettledUnits * w.escrow.pricePerUnit,
    limit,
    limitReason: `min(${offline ? 'voucher' : 'deposit'} ${fmt(source, 2)} KES, ${offline ? 'offline' : 'online'} cap ${fmt(cap, 2)} KES)`,
    lastReceiptBytes: 0,
    receipts: 0,
    throttled: null,
    done: false,
    startedAt: w.t,
  };
  return { world: w, ok: true, entries: r.entries };
}

/** Units the channel will have signed for once `bytes` of this session are acknowledged. */
export const sessionUnits = (s, bytes, unitBytes) => s.baseUnits + Math.ceil(bytes / unitBytes);

/** Credit the node has left, in micro-KES, before it must stop serving. */
export function sessionCredit(w) {
  const s = w.session;
  if (!s) return 0;
  const used = s.unsettledAtStart + Math.ceil(s.bytes / w.params.unitBytes) * w.escrow.pricePerUnit;
  return s.limit - used;
}

/**
 * Serve up to `chunk` bytes. The node stops at the credit limit; the client
 * signs a cumulative ticket every receiptBytes and at the end.
 */
export function serve(world, chunk) {
  let w = world;
  const s0 = w.session;
  if (!s0 || s0.done) return { world: w, entries: [] };
  const p = w.params;
  const price = w.escrow.pricePerUnit;
  const entries = [];

  // How many more bytes the credit allows, rounded down to whole units.
  const creditUnits = Math.floor((s0.limit - s0.unsettledAtStart) / price);
  const maxBytes = Math.max(0, creditUnits * p.unitBytes);
  let next = Math.min(s0.bytes + chunk, s0.targetBytes, maxBytes);
  const throttled = next < Math.min(s0.bytes + chunk, s0.targetBytes);

  w = structuredClone(w);
  w.session.bytes = next;
  w.t += Math.max(1, Math.round((next - s0.bytes) / 250_000)); // about 2 Mbit/s

  // Sign every receipt boundary crossed, plus at the end or the throttle point.
  const finished = next >= s0.targetBytes || throttled;
  const boundaries = [];
  for (let b = s0.lastReceiptBytes + p.receiptBytes; b <= next; b += p.receiptBytes) boundaries.push(b);
  if (finished && (boundaries.at(-1) ?? s0.lastReceiptBytes) < next) boundaries.push(next);

  for (const b of boundaries) {
    const units = sessionUnits(w.session, b, p.unitBytes);
    const r = offchain.signTicket(w, {
      client: s0.client,
      nodeAdmin: s0.nodeAdmin,
      cumulativeUnits: units,
      flow: s0.flow,
      title: `Receipt ${w.session.receipts + 1}: ${(b / 1e6).toFixed(2)} MB, ${units} units cumulative`,
    });
    w = r.world;
    entries.push(r.entry);
    if (!r.entry.ok) {
      w = structuredClone(w);
      w.session.throttled = 'client wallet cannot sign: the node stops within one receipt interval';
      w.session.done = true;
      return { world: w, entries };
    }
    w = structuredClone(w);
    w.session.lastReceiptBytes = b;
    w.session.receipts += 1;
  }

  if (throttled) {
    w.session.throttled = `credit limit reached at ${(next / 1e6).toFixed(2)} MB: ${w.session.limitReason}`;
    w.session.done = true;
  } else if (next >= s0.targetBytes) {
    w.session.done = true;
  }
  return { world: w, entries };
}

export function closeSession(world) {
  const w = structuredClone(world);
  w.session = null;
  return w;
}

// ---------------------------------------------------------------------------
// Economics: the live numbers the cost panel prints
// ---------------------------------------------------------------------------

export function economics(w, megabytes) {
  const p = w.params;
  const units = Math.ceil((megabytes * 1e6) / p.unitBytes);
  const gross = units * w.escrow.pricePerUnit;
  const fee = Math.floor((gross * w.treasury.feeBps) / 10_000);
  const quote = batchQuote(w, []);
  const oneTicketGas = 131_391;
  const oneTicketKes = (oneTicketGas * p.gasPriceGwei * 1e-9 * p.ethUsd * p.usdKes * (1 + p.l1FeePct / 100));
  const breakEvenFeeUkes = 2 * oneTicketKes * UKES;
  const breakEvenGross = breakEvenFeeUkes / (w.treasury.feeBps / 10_000);
  const breakEvenMb = (breakEvenGross / w.escrow.pricePerUnit) * p.unitBytes / 1e6;
  return {
    units,
    gross,
    fee,
    net: gross - fee,
    receipts: Math.ceil((megabytes * 1e6) / p.receiptBytes),
    receiptOverheadBytes: Math.ceil((megabytes * 1e6) / p.receiptBytes) * 108,
    oneTicketGas,
    oneTicketKes,
    breakEvenMb,
    quote,
  };
}

// ---------------------------------------------------------------------------
// Recovery and redundancy drills
// ---------------------------------------------------------------------------

/** Bring the world to: deployed, bridge listed, Amina bought 100 KES and escrowed 50. */
export function ensureReady(world) {
  let w = world;
  const entries = [];
  const take = (r) => {
    w = r.world;
    entries.push(...r.entries);
    return r.ok;
  };
  if (!w.deployed || !w.token.bridges.kiosk?.allowed) if (!take(setupNetwork(w))) return { world: w, ok: false, entries };
  if (w.escrow.deposits.amina < kes(20)) {
    if (w.token.bal.amina < kes(50) && !take(buy(w, { client: 'amina', amount: kes(100) }))) return { world: w, ok: false, entries };
    if (!take(depositGasless(w, { client: 'amina', amount: kes(50) }))) return { world: w, ok: false, entries };
  }
  return { world: w, ok: true, entries };
}

function signN(world, n, step, flow) {
  let w = world;
  const out = [];
  const entries = [];
  const base = w.tickets['amina>node']?.at(-1)?.cumulativeUnits ?? Object.values(w.escrow.channels).find((c) => c.client === 'amina' && c.nodeAdmin === 'node')?.settledUnits ?? 0;
  for (let i = 1; i <= n; i += 1) {
    const r = offchain.signTicket(w, { client: 'amina', nodeAdmin: 'node', cumulativeUnits: base + i * step, flow, title: `Amina signs ticket at ${base + i * step} units` });
    w = r.world;
    entries.push(r.entry);
    out.push(r.result);
  }
  return { world: w, tickets: out, entries };
}

export const DRILLS = [
  {
    id: 'lost-tickets',
    title: 'Node loses intermediate tickets',
    claim: 'Cumulative units mean only the latest ticket matters. Losing the rest loses nothing.',
    run(world) {
      const flow = newFlow('Drill: lost tickets');
      const { world: w, tickets, entries } = signN(world, 4, 100, flow);
      const r = runSteps(w, [(x) => escrow.settleTicketBatch(x, { from: 'relayer', tickets: [tickets.at(-1)], flow, title: 'Settle only the last of four tickets' })]);
      return { ...r, entries: [...entries, ...r.entries], verdict: r.ok ? 'All 400 units paid from one ticket; the three lost ones were never needed.' : 'Unexpected revert.' };
    },
  },
  {
    id: 'replay',
    title: 'Replay an old ticket',
    claim: 'A settled sequence number can never be paid twice.',
    run(world) {
      const flow = newFlow('Drill: replay');
      const { world: w, tickets, entries } = signN(world, 2, 100, flow);
      const r1 = runSteps(w, [(x) => escrow.settleTicketBatch(x, { from: 'relayer', tickets: [tickets[1]], flow, title: 'Settle ticket 2' })]);
      const r2 = runSteps(r1.world, [(x) => escrow.settleTicketBatch(x, { from: 'mallory', tickets: [tickets[0]], flow, title: 'Mallory replays ticket 1' })]);
      return { world: r2.world, ok: !r2.ok, entries: [...entries, ...r1.entries, ...r2.entries], verdict: r2.ok ? 'Replay was accepted: rule broken.' : 'Reverted StaleSequence. Mallory paid the revert gas; nobody lost anything.' };
    },
  },
  {
    id: 'forged',
    title: 'Node inflates a ticket',
    claim: 'Only the client key can sign units. A node that edits the count fails ECDSA.recover.',
    run(world) {
      const flow = newFlow('Drill: forged ticket');
      const r0 = offchain.signTicket(world, { client: 'amina', nodeAdmin: 'node', signer: 'node', cumulativeUnits: 1_000_000, flow, title: 'Node signs 1,000,000 units as if it were Amina' });
      const r = runSteps(r0.world, [(x) => escrow.settleTicketBatch(x, { from: 'relayer', tickets: [r0.result], flow, title: 'Relayer submits the forged ticket' })]);
      const clean = structuredClone(r.world);
      clean.tickets['amina>node'] = (clean.tickets['amina>node'] ?? []).filter((t) => t.signedBy === 'amina');
      return { world: clean, ok: !r.ok, entries: [r0.entry, ...r.entries], verdict: r.ok ? 'Forgery paid: rule broken.' : 'Reverted BadSignature: the digest recovers to the node, not Amina. The forged ticket is dropped from the node store.' };
    },
  },
  {
    id: 'expired',
    title: 'Node settles too late',
    claim: 'Tickets expire. This is the one drill where an honest party can lose value, and the rule that prevents it.',
    run(world) {
      const flow = newFlow('Drill: expiry');
      const { world: w, tickets, entries } = signN(world, 1, 200, flow);
      const r = runSteps(w, [
        (x) => offchain.warp(x, { seconds: x.params.epochSeconds + 3_600, flow }),
        (x) => escrow.settleTicketBatch(x, { from: 'relayer', tickets: [tickets[0]], flow, title: 'Settle a ticket past epochExpiry' }),
      ]);
      const clean = structuredClone(r.world);
      clean.tickets['amina>node'] = (clean.tickets['amina>node'] ?? []).filter((t) => t.epochExpiry >= clean.t);
      return { world: clean, ok: !r.ok, entries: [...entries, ...r.entries], verdict: 'Reverted ExpiredTicket. The node forfeits those 200 units. Mitigation: the relayer settles before expiry whatever the fee threshold says, and the client re-signs a fresh cumulative ticket next session, which recovers the units if she agrees.' };
    },
  },
  {
    id: 'drain',
    title: 'Client drains escrow mid-session',
    claim: 'withdrawDeposit is always open. Settlement pays what is left and the node carries the gap, bounded by its credit cap.',
    run(world) {
      const flow = newFlow('Drill: drain');
      const entries = [];
      const { world: w2, tickets, entries: e2 } = signN(world, 1, 2_000, flow);
      const left = w2.escrow.deposits.amina;
      const settled = Object.values(w2.escrow.channels).find((c) => c.client === 'amina' && c.nodeAdmin === 'node')?.settledUnits ?? 0;
      const owed = (tickets[0].cumulativeUnits - settled) * w2.escrow.pricePerUnit;
      const keep = Math.min(kes(0.4), left);
      const out = withdrawGasless(w2, { client: 'amina', amount: left - keep });
      const r0 = { ...out, entries: out.entries };
      const r1 = runSteps(out.world, [
        (x) => escrow.settleTicketBatch(x, { from: 'relayer', tickets: [tickets[0]], flow, title: `Settle ticket owing ${fmt(owed, 2)} KES` }),
      ]);
      const r = { world: r1.world, ok: out.ok && r1.ok, entries: [...r0.entries, ...r1.entries], result: r1.result };
      const paid = r.result?.gross ?? 0;
      return { world: r.world, ok: r.ok, entries: [...entries, ...e2, ...r.entries], verdict: `Paid ${fmt(paid, 2)} of ${fmt(owed, 2)} KES owed. The node carries ${fmt(owed - paid, 2)} KES, and the session credit rule (settle at half the cap) keeps that under one cap. Solvency holds throughout.` };
    },
  },
  {
    id: 'redirect',
    title: 'Kiosk tries to redirect an unlock',
    claim: 'The destination is inside the signature. A relayer that changes it fails the signature check.',
    run(world) {
      const flow = newFlow('Drill: redirect');
      const s = offchain.signAuth(world, { kind: 'withdraw', owner: 'amina', to: 'amina', amount: kes(5), flow, title: 'Amina signs: unlock 5 KES to me' });
      const r = runSteps(s.world, [(w) => escrow.withdrawWithSig(w, { from: 'mallory', auth: s.result, to: 'mallory', flow, title: 'Mallory submits it with herself as destination' })]);
      return { world: r.world, ok: !r.ok, entries: [s.entry, ...r.entries], verdict: r.ok ? 'Redirect accepted: rule broken.' : 'Reverted BadAuthorization. The coins stayed in Amina\'s meter.' };
    },
  },
  {
    id: 'lost-phone',
    title: 'Lost phone, restore from seed',
    claim: 'Funds are keyed by address, not by device. The seed brings back both balances.',
    run(world) {
      const flow = newFlow('Drill: lost phone');
      const r = runSteps(world, [
        (w) => offchain.loseDevice(w, { who: 'amina', flow }),
        (w) => offchain.signTicket(w, { client: 'amina', nodeAdmin: 'node', cumulativeUnits: 999_999, flow, title: 'Anyone tries to sign as Amina' }),
      ]);
      const r2 = runSteps(r.world, [(w) => offchain.restoreFromSeed(w, { who: 'amina', flow })]);
      return { world: r2.world, ok: r2.ok, entries: [...r.entries, ...r2.entries], verdict: `Restored ${addr('amina')}: wallet ${fmt(r2.world.token.bal.amina, 2)} KES and escrow ${fmt(r2.world.escrow.deposits.amina, 2)} KES, unchanged. Without the seed there is no recovery path on chain: no admin can move a user balance, by design.` };
    },
  },
  {
    id: 'rogue-bridge',
    title: 'Kiosk bridge key stolen',
    claim: 'A stolen bridge key mints at most one day\'s cap and can burn nothing but its own balance.',
    run(world) {
      const flow = newFlow('Drill: rogue bridge');
      const cap = world.token.bridges.kiosk.cap;
      const room = cap - (world.t >= world.token.bridges.kiosk.windowStart + 86_400 ? 0 : world.token.bridges.kiosk.minted);
      const r = runSteps(world, [(w) => token.bridgeMint(w, { from: 'kiosk', to: 'mallory', amount: room, fiatRef: 'forged', flow, title: 'Thief mints the rest of today\'s cap to Mallory' })]);
      const r2 = runSteps(r.world, [(w) => token.bridgeMint(w, { from: 'kiosk', to: 'mallory', amount: kes(1), fiatRef: 'forged-2', flow, title: 'Thief tries 1 KES more' })]);
      const r3 = runSteps(r2.world, [(w) => token.setBridge(w, { from: 'owner', bridge: 'kiosk', allowed: false, dailyMintCap: 0, flow })]);
      return { world: r3.world, ok: !r2.ok, entries: [...r.entries, ...r2.entries, ...r3.entries], verdict: `Loss bounded at ${fmt(room, 2)} KES of unbacked XKN (the peg check shows the gap). MintCapExceeded stopped the next mint; the owner then revoked the bridge. User balances were never reachable. Re-list the kiosk with Setup to continue.` };
    },
  },
  {
    id: 'stolen-owner',
    title: 'Owner key stolen',
    claim: 'Every owner lever is bounded: fee cap, price band with cooldown, and a 7-day vetoable timelock on the beneficiary.',
    run(world) {
      const flow = newFlow('Drill: stolen owner key');
      const steps = [
        (w) => treasury.setFeeBps(w, { from: 'owner', feeBps: 5_000, flow }),
        (w) => escrow.setPricePerUnit(w, { from: 'owner', newPrice: 1_000_000, flow }),
        (w) => treasury.queueBeneficiary(w, { from: 'owner', next: 'mallory', flow }),
        (w) => treasury.activateBeneficiary(w, { from: 'mallory', flow }),
        (w) => treasury.cancelBeneficiaryChange(w, { from: 'founder', flow }),
      ];
      let w = world;
      const entries = [];
      for (const s of steps) {
        const r = s(w);
        w = r.world;
        entries.push(r.entry);
      }
      return { world: w, ok: w.treasury.beneficiary === 'founder', entries, verdict: 'FeeTooHigh, PriceOutOfBand and TimelockActive all fired; the founder vetoed inside the window. Beneficiary is still the founder. The real fix is the Safe multisig owner, HANDOVER item 10.' };
    },
  },
  {
    id: 'front-run-permit',
    title: 'Permit front-run',
    claim: 'depositWithPermit wraps permit() in try/catch, so a front-runner cannot block the deposit.',
    run(world) {
      const flow = newFlow('Drill: permit front-run');
      const r0 = offchain.signPermit(world, { owner: 'amina', spender: 'escrow', value: kes(5), flow, title: 'Amina signs a 5 KES permit' });
      const r = runSteps(r0.world, [
        (w) => token.permit(w, { from: 'mallory', permit: r0.result, flow, title: 'Mallory submits the permit first' }),
        (w) => escrow.depositWithPermit(w, { from: 'kiosk', client: 'amina', amount: kes(5), permit: r0.result, flow, title: 'Kiosk relays the same permit' }),
      ]);
      return { world: r.world, ok: r.ok, entries: [r0.entry, ...r.entries], verdict: 'The inner permit() failed on a used nonce and was caught; the allowance Mallory set was used; the deposit landed. Mallory only burned her own gas.' };
    },
  },
  {
    id: 'payout-fails',
    title: 'M-Pesa payout fails',
    claim: 'The burn waits for the bank\'s success callback, so a failed payout never destroys XKN.',
    run(world) {
      let w = world;
      const entries = [];
      if (w.token.bal.amina < kes(10)) {
        const b = buy(w, { client: 'amina', amount: kes(20) });
        w = b.world;
        entries.push(...b.entries);
      }
      const r = cashOut(w, { client: 'amina', amount: kes(10), failPayout: true });
      const r2 = retryPayout(r.world, { client: 'amina', amount: kes(10) });
      return { world: r2.world, ok: r2.ok, entries: [...entries, ...r.entries, ...r2.entries], verdict: 'First payout failed; 10 XKN waited on the bridge with the peg intact (float and supply both still counted it). The retry paid and only then burned.' };
    },
  },
  {
    id: 'offline',
    title: 'Backhaul down',
    claim: 'The node cannot read the chain, so it admits on the Ed25519 voucher alone, up to the smaller offline cap.',
    run(world) {
      let w = world;
      const entries = [];
      if (!w.vouchers.some((v) => v.who === 'amina')) {
        const b = buy(w, { client: 'amina', amount: kes(20) });
        w = b.world;
        entries.push(...b.entries);
      }
      const o = openSession(w, { client: 'amina', targetBytes: 200_000_000, offline: true });
      entries.push(...o.entries);
      if (!o.ok) return { world: o.world, ok: false, entries, verdict: 'Voucher rejected.' };
      const s = serve(o.world, 200_000_000);
      entries.push(...s.entries);
      return { world: s.world, ok: true, entries, verdict: `Served ${(s.world.session.bytes / 1e6).toFixed(2)} MB against the voucher, then stopped at the offline cap. Tickets are held and settle when the backhaul returns.` };
    },
  },
];

export { ownable };
