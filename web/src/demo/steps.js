/*
 * The playground's steps, in the order they happen in real life. Each step
 * is a closed box: what goes in, what the box does, what comes out. Words
 * are for a layman; the technical names live in the Proof panel.
 */

import { kes, pendingTickets } from './engine.js';
import {
  DRILLS,
  buy,
  cashOut,
  depositGasless,
  nodeCashOut,
  nodeClaim,
  relayBatch,
  retryPayout,
  runSteps,
  send,
  sendEscrow,
  setupNetwork,
  sweepFees,
  withdraw,
  withdrawGasless,
} from './flows.js';

/** Plain names for the technical ones. Shown in Help; used across the UI. */
export const WORDS = [
  ['xKoin', 'XKN token', 'Digital shillings. 1 xKoin = 1 KES.'],
  ['Wallet', 'token balance', 'xKoin you can send or cash out any time.'],
  ['Meter', 'escrow deposit', 'xKoin set aside for data. Nodes serve you against it.'],
  ['Receipt', 'EIP-712 ticket', 'Your phone signs "I have used this much so far". Only the newest counts.'],
  ['Node', 'gateway node admin', 'The box that carries your data. Paid per 10 KB.'],
  ['Kiosk', 'bridge and relayer', 'Takes M-Pesa, creates xKoin, and pays chain fees for you.'],
  ['Fee box', 'treasury', '5% of every payment. Only the founder can receive it.'],
  ['Gas', 'ETH network fee', 'What the chain charges per action. Fractions of a shilling.'],
  ['Signature', 'secp256k1 / Ed25519', 'Proof only your phone could have made. Cannot be faked or reused.'],
  ['Backed', 'fiat peg', 'Every xKoin in existence has a real shilling behind it.'],
];

export const LANES = [
  { id: 'setup', label: 'Set up' },
  { id: 'in', label: 'Money in' },
  { id: 'use', label: 'Use and pay' },
  { id: 'move', label: 'Move' },
  { id: 'out', label: 'Money out' },
  { id: 'safety', label: 'Safety' },
];

const CLIENTS = ['amina', 'baraka'];
const other = (who) => (who === 'amina' ? 'baraka' : 'amina');

export const STEPS = [
  {
    id: 'setup',
    lane: 'setup',
    short: 'Set up',
    title: 'Set up the rules',
    what: 'Put the three rulebooks on the chain and let the kiosk create xKoin, up to a daily limit.',
    box: { in: ['Owner key'], does: 'Deploy contracts, approve kiosk', by: 'Owner', out: ['Token', 'Meter', 'Fee box', 'Kiosk limit'] },
    form: { price: 0.05, fee: 5 },
    fields: [
      ['price', 'KES per MB', [0.01, 0.05, 0.1, 0.5]],
      ['fee', 'Fee %', [1, 5, 10]],
    ],
    done: (w) => w.deployed && w.token.bridges.kiosk?.allowed,
    run: (w, f) => setupNetwork({ ...w, params: { ...w.params, pricePerUnit: Math.round(f.price * 1e6 / 100), feeBps: Math.round(f.fee * 100) } }),
  },
  {
    id: 'topup',
    lane: 'in',
    short: 'Top up',
    head: (f) => `${f.who}.wallet`,
    title: 'Top up',
    what: 'Pay with M-Pesa. The kiosk creates the same amount of xKoin in your wallet.',
    box: { in: ['M-Pesa KES'], does: 'Confirm payment, create xKoin', by: 'Kiosk', out: ['Wallet +', 'Voucher'] },
    kiosk: true,
    form: { who: 'amina', amount: 100, fail: false },
    fields: [
      ['who', 'Who', CLIENTS],
      ['amount', 'KES', [20, 100, 500]],
      ['fail', 'Payment cancelled', 'bool'],
    ],
    done: (w) => w.ledger.some((e) => e.ok && e.fn === 'bridgeMint'),
    run: (w, f) => buy(w, { client: f.who, amount: kes(f.amount), failStk: f.fail }),
  },
  {
    id: 'fill',
    lane: 'in',
    short: 'Fill meter',
    head: (f) => `${f.who}.escrow`,
    title: 'Fill the data meter',
    what: 'Move xKoin from wallet to meter. Any node can now serve you. You pay no gas.',
    box: { in: ['Wallet', 'Phone signature'], does: 'Lock into meter', by: 'Kiosk submits', out: ['Meter +'] },
    kiosk: true,
    form: { who: 'amina', amount: 50 },
    fields: [
      ['who', 'Who', CLIENTS],
      ['amount', 'KES', [10, 50, 100]],
    ],
    done: (w) => w.ledger.some((e) => e.ok && (e.fn === 'depositWithPermit' || e.fn === 'deposit')),
    run: (w, f) => depositGasless(w, { client: f.who, amount: kes(f.amount) }),
  },
  {
    id: 'browse',
    lane: 'use',
    short: 'Browse',
    title: 'Browse',
    what: 'Use data. Every 1 MB your phone signs a receipt. Nothing touches the chain yet.',
    box: { in: ['Meter credit'], does: 'Serve data, collect receipts', by: 'Node', out: ['Signed receipts', 'Amount owed'] },
    live: true,
    form: { who: 'amina', mb: 12, offline: false },
    fields: [
      ['who', 'Who', CLIENTS],
      ['mb', 'MB', [1, 12, 50, 200]],
      ['offline', 'Internet down', 'bool'],
    ],
    done: (w) => w.ledger.some((e) => e.ok && e.fn === 'signTicket'),
  },
  {
    id: 'settle',
    lane: 'use',
    short: 'Pay node',
    head: () => 'node.earnings',
    title: 'Pay the node',
    what: 'Only the newest receipt is sent. It pays the whole bill in one chain action.',
    box: { in: ['Newest receipt'], does: 'Check signature, move money', by: 'Relayer', out: ['Node earned +', 'Fee box +', 'Meter -'] },
    form: {},
    fields: [],
    done: (w) => w.ledger.some((e) => e.ok && e.fn === 'settleTicketBatch'),
    ready: (w) => (pendingTickets(w).length ? null : 'No receipts waiting. Browse first.'),
    run: (w) => relayBatch(w),
  },
  {
    id: 'nodeout',
    lane: 'use',
    short: 'Node paid',
    head: (f) => (f.mode === 'claim' ? 'node.wallet' : 'node.mpesa'),
    title: 'Node takes its money',
    what: 'The node moves its earnings to its wallet, then to M-Pesa if it wants.',
    box: { in: ['Node earned'], does: 'Claim, then cash out', by: 'Node', out: ['Node M-Pesa +'] },
    form: { mode: 'both' },
    fields: [['mode', 'Do', ['claim', 'both']]],
    done: (w) => w.ledger.some((e) => e.ok && e.fn === 'claimEarnings'),
    ready: (w) => (w.escrow.earnings.node > 0 || w.token.bal.node > 0 ? null : 'Node has earned nothing yet.'),
    run: (w, f) => {
      const r1 = w.escrow.earnings.node > 0 ? nodeClaim(w) : { world: w, ok: true, entries: [] };
      if (!r1.ok || f.mode === 'claim') return r1;
      const r2 = nodeCashOut(r1.world);
      return { ...r2, entries: [...r1.entries, ...r2.entries] };
    },
  },
  {
    id: 'fee',
    lane: 'use',
    short: 'Founder fee',
    head: () => 'founder.wallet',
    title: 'Founder fee',
    what: 'Anyone can press this. The fee can only ever go to the founder.',
    box: { in: ['Fee box'], does: 'Sweep to founder', by: 'Anyone', out: ['Founder wallet +'] },
    form: { by: 'mallory' },
    fields: [['by', 'Pressed by', ['relayer', 'mallory', 'founder']]],
    done: (w) => w.ledger.some((e) => e.ok && e.fn === 'claim'),
    ready: (w) => (w.token.bal.treasury > 0 ? null : 'Fee box is empty. Pay a node first.'),
    run: (w, f) => sweepFees(w, f.by),
  },
  {
    id: 'send',
    lane: 'move',
    short: 'Send',
    head: (f) => `${other(f.who)}.${f.from === 'meter' ? 'escrow' : 'wallet'}`,
    title: 'Send',
    what: 'Wallet to wallet, or meter to meter. The sender pays no gas either way.',
    box: { in: ['Sender signature'], does: 'Move xKoin', by: 'Kiosk submits', out: ['Receiver +'] },
    kiosk: true,
    form: { who: 'amina', amount: 10, from: 'wallet' },
    fields: [
      ['who', 'From', CLIENTS],
      ['from', 'Take from', ['wallet', 'meter']],
      ['amount', 'KES', [5, 10, 20]],
    ],
    done: (w) => w.ledger.some((e) => e.ok && (e.fn === 'transferFrom' || e.fn === 'transferDeposit') && !e.flow?.startsWith('Cash out')),
    run: (w, f) => (f.from === 'meter' ? sendEscrow(w, { from: f.who, to: other(f.who), amount: kes(f.amount) }) : send(w, { from: f.who, to: other(f.who), amount: kes(f.amount) })),
  },
  {
    id: 'unlock',
    lane: 'move',
    short: 'Unlock',
    head: (f) => `${f.who}.wallet`,
    title: 'Unlock the meter',
    what: 'Move xKoin from meter back to wallet. Your phone signs; the kiosk pays the gas.',
    box: { in: ['Meter', 'Phone signature'], does: 'Unlock to wallet', by: 'Kiosk submits', out: ['Wallet +', 'Meter -'] },
    kiosk: true,
    form: { who: 'amina', amount: 10, old: false },
    fields: [
      ['who', 'Who', CLIENTS],
      ['amount', 'KES', [5, 10, 20]],
      ['old', 'Old way (phone pays gas)', 'bool'],
    ],
    done: (w) => w.ledger.some((e) => e.ok && (e.fn === 'withdrawWithSig' || e.fn === 'withdrawDeposit')),
    run: (w, f) => (f.old ? withdraw(w, { client: f.who, amount: kes(f.amount) }) : withdrawGasless(w, { client: f.who, amount: kes(f.amount) })),
  },
  {
    id: 'cashout',
    lane: 'out',
    short: 'Cash out',
    head: (f) => `${f.who}.mpesa`,
    title: 'Cash out',
    what: 'Wallet to M-Pesa. The xKoin is destroyed only after M-Pesa confirms the payout.',
    box: { in: ['Wallet'], does: 'Pay M-Pesa, then destroy xKoin', by: 'Kiosk', out: ['M-Pesa +', 'xKoin supply -'] },
    kiosk: true,
    form: { who: 'amina', amount: 20, fail: false },
    fields: [
      ['who', 'Who', CLIENTS],
      ['amount', 'KES', [10, 20, 50]],
      ['fail', 'M-Pesa payout fails', 'bool'],
    ],
    done: (w) => w.ledger.some((e) => e.ok && e.fn === 'bridgeBurn' && e.flow?.startsWith('Cash out')),
    run: (w, f) => cashOut(w, { client: f.who, amount: kes(f.amount), failPayout: f.fail }),
    retry: (w, f) => retryPayout(w, { client: f.who, amount: kes(f.amount) }),
  },
  {
    id: 'whatif',
    lane: 'safety',
    short: 'What if',
    title: 'What if something goes wrong?',
    what: 'Pick a problem. Watch what the rules do about it.',
    box: { in: ['A problem'], does: 'Rules react', by: 'Contracts', out: ['Blocked or bounded'] },
    form: { drill: DRILLS[0].id },
    fields: [],
    drills: true,
    done: (w) => w.ledger.some((e) => e.flow?.startsWith('Drill')),
  },
];

/** One plain line per drill for the What-if picker. */
export const DRILL_WORDS = {
  'lost-tickets': ['Node loses receipts', 'Only the newest matters. Nothing lost.'],
  replay: ['Someone reuses an old receipt', 'Rejected. It can be paid once.'],
  forged: ['Node fakes a bigger receipt', 'Rejected. Only the phone can sign.'],
  expired: ['Node waits too long to get paid', 'Receipt expired. Node loses it. Settle on time.'],
  drain: ['User empties meter mid-use', 'Node gets what is left. Loss capped small.'],
  redirect: ['Kiosk tries to steal an unlock', 'Rejected. Destination is signed.'],
  'lost-phone': ['Phone lost', 'Restore from seed words. All money back.'],
  'rogue-bridge': ['Kiosk key stolen', 'Thief limited to one day\'s cap. Users untouched.'],
  'stolen-owner': ['Owner key stolen', 'Fees capped, price capped, founder can veto.'],
  'front-run-permit': ['Someone races your deposit', 'Deposit still goes through.'],
  'payout-fails': ['M-Pesa payout fails', 'Coins wait safely. Retry pays.'],
  offline: ['Internet is down', 'Node trusts the kiosk voucher, up to 5 KES.'],
};

export { plainError } from './narrative.js';
export { runSteps };
