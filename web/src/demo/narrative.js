/*
 * What to say at each step, in plain words. One sentence per operation,
 * built from the operation's real values, so the script always matches the
 * numbers on screen. Used by the Script strip and the DevTools trace.
 */

import { fmt, nameOf } from './engine.js';

/** Plain words for revert and rejection reasons. */
export const PLAIN_ERRORS = {
  InsufficientDeposit: 'not enough in the meter',
  InsufficientEarnings: 'nothing earned to take',
  ERC20InsufficientBalance: 'not enough in the wallet',
  ERC20InsufficientAllowance: 'not allowed to move those coins',
  BadAuthorization: 'signature does not match',
  BadSignature: 'receipt signature is fake',
  StaleSequence: 'receipt already paid',
  NoNewUnits: 'nothing new to pay',
  ExpiredTicket: 'receipt expired',
  AuthorizationExpired: 'signature expired',
  ERC2612InvalidSigner: 'permission signature does not match',
  ERC2612ExpiredSignature: 'permission expired',
  MintCapExceeded: 'kiosk hit its daily limit',
  NotBridge: 'kiosk is not approved',
  NothingToClaim: 'fee box is empty',
  FeeTooHigh: 'fee above the 10% cap',
  PriceOutOfBand: 'price outside the allowed range',
  PriceCooldownActive: 'price changed less than a day ago',
  TimelockActive: 'must wait 7 days',
  NotAuthorized: 'not allowed',
  NoPendingChange: 'nothing to cancel',
  OwnableUnauthorizedAccount: 'only the owner may do this',
  STKCancelled: 'M-Pesa payment cancelled, nothing created',
  B2CFailed: 'M-Pesa payout failed, coins kept safe',
  MpesaInsufficientFunds: 'not enough M-Pesa',
  DeviceUnavailable: 'phone is lost',
  ZeroAmount: 'amount is zero',
  ZeroAddress: 'no destination',
  EmptyBatch: 'no receipts to send',
  VoucherExpired: 'voucher expired',
  VoucherInvalid: 'voucher signature is fake',
  NoVoucher: 'no voucher, top up first',
};

export function plainError(entry) {
  if (!entry?.error) return '';
  if (entry.rejected) return entry.error.includes('holds 0.000000000') ? 'has no gas money' : 'cannot pay gas';
  const name = entry.error.split(':')[0];
  return PLAIN_ERRORS[name] ?? name;
}

const n = (who) => (who ? nameOf(who).replace(' (bridge)', '').replace(' admin', '').replace(' cold key', '').replace(' multisig', '') : '');
const k = (ukes) => `${fmt(ukes, 4)} KES`;

const SAY = {
  'create:xKoinToken': () => 'The xKoin rulebook goes on the chain: who may create coins, and how coins move.',
  'create:xKoinTreasury': () => 'The fee box goes on the chain. It can only ever pay the founder.',
  'create:xKoinEscrow': () => 'The meter rulebook goes on the chain: deposits, receipts and payouts.',
  setBridge: (e) => (e.args.allowed ? `The owner lets the kiosk create up to ${k(e.args.dailyMintCap)} a day.` : 'The owner switches the kiosk off.'),
  'M-Pesa STK push': (e) => `${n(e.from)} pays ${k(e.args.amount)} by M-Pesa. The shillings now sit with the kiosk.`,
  bridgeMint: (e) => `The kiosk creates ${k(e.args.amount)} for ${n(e.args.to)}, only because M-Pesa confirmed the payment.`,
  issueVoucher: (e) => `The kiosk signs a paper-like note: ${n(e.args.to)} paid. A node can check it with no internet.`,
  verifyVoucher: (e) => `The node checks ${n(e.args.who)}'s note against the kiosk's public key, offline.`,
  signPermit: (e) => `${n(e.from)}'s phone signs: "${n(e.args.spender)} may move ${k(e.args.value)} of mine". No gas, no chain yet.`,
  permit: (e) => `The kiosk hands that signed permission to the chain.`,
  depositWithPermit: (e) => `${k(e.args.amount)} moves from ${n(e.args.client)}'s wallet into the meter. The kiosk pays the fee.`,
  deposit: (e) => `${n(e.from)} moves ${k(e.args.amount)} into the meter.`,
  signTicket: (e) => `${n(e.from)}'s phone signs a receipt: "${e.args.cumulativeUnits} units used so far". It stays with the node.`,
  settleTicketBatch: (e) => `The newest receipt goes to the chain. It pays the node for everything up to that point.`,
  claimEarnings: (e) => `The node moves ${k(e.args.amount)} of earnings to ${n(e.args.to)}'s wallet.`,
  claim: (e) => `${n(e.from)} presses the fee button. The fee can only go to the founder.`,
  signAuth: (e) => `${n(e.from)}'s phone signs: "move ${k(e.args.amount)} of my meter to ${n(e.args.to)}". The destination is locked in.`,
  withdrawWithSig: (e) => `The kiosk submits the signed unlock. ${k(e.args.amount)} leaves the meter for ${n(e.args.to)}'s wallet.`,
  transferDeposit: (e) => `The kiosk submits the signed transfer. ${k(e.args.amount)} of meter credit moves to ${n(e.args.to)}. No coins move.`,
  withdrawDeposit: (e) => `${n(e.from)} unlocks ${k(e.args.amount)} and pays the fee from their own gas money.`,
  transfer: (e) => `${n(e.from)} sends ${k(e.args.amount)} to ${n(e.args.to)}.`,
  transferFrom: (e) => `The kiosk moves ${k(e.args.amount)} from ${n(e.args.owner)} to ${n(e.args.to)}, as the signed permission allows.`,
  approve: (e) => `${n(e.from)} allows ${n(e.args.spender)} to move up to ${k(e.args.amount)}.`,
  'M-Pesa B2C payout': (e) => `The kiosk pays ${k(e.args.amount)} to ${n(e.args.to)}'s M-Pesa.`,
  bridgeBurn: (e) => `M-Pesa confirmed the payout, so the kiosk destroys ${k(e.args.amount)}. Every coin left still has a shilling behind it.`,
  setPricePerUnit: (e) => `The owner sets the price to ${e.args.newPrice} micro-KES per 10 KB.`,
  setFeeBps: (e) => `The owner sets the fee to ${(e.args.feeBps / 100).toFixed(2)}%.`,
  queueBeneficiary: (e) => `The owner asks to pay fees to ${n(e.args.newBeneficiary)}. Nothing changes for 7 days.`,
  activateBeneficiary: () => 'Someone tries to finish the fee-receiver change.',
  cancelBeneficiaryChange: (e) => `${n(e.from)} cancels the fee-receiver change.`,
  transferOwnership: (e) => `The owner offers ownership to ${n(e.args.newOwner)}.`,
  acceptOwnership: (e) => `${n(e.from)} accepts ownership.`,
  ethTransfer: (e) => `The kiosk gives ${n(e.args.to)} a little gas money.`,
  warp: (e) => `Time passes: ${Math.round(e.args.seconds / 3600)} hours.`,
  loseDevice: (e) => `${n(e.from)} loses their phone. Their money is on the chain, not on the phone.`,
  restoreFromSeed: (e) => `${n(e.from)} types their seed words into a new phone. Same key, same address, same money.`,
};

/** One sentence for a ledger entry, or its plain failure. */
export function say(entry) {
  const base = SAY[entry.fn]?.(entry) ?? entry.title;
  if (entry.ok) return base;
  return `${base} Blocked: ${plainError(entry)}.`;
}
