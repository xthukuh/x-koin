import { ACTORS, UKES, nameOf } from '../engine.js';

/** micro-KES to a KES string. Small values keep enough digits to see a single unit (0.0005). */
export function kesStr(ukes, { sign = false } = {}) {
  const v = ukes / UKES;
  const abs = Math.abs(v);
  const digits = abs !== 0 && abs < 0.01 ? 6 : abs < 100 ? 4 : 2;
  const s = abs.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: digits });
  const pre = v < 0 ? '-' : sign && v > 0 ? '+' : '';
  return `${pre}${s}`;
}

/** A KES float (already in shillings) with enough digits for gas-sized amounts. */
export function kesSmall(v) {
  if (v === 0) return '0';
  const abs = Math.abs(v);
  const digits = abs < 0.001 ? 6 : abs < 1 ? 4 : 2;
  return v.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: digits });
}

export const ethStr = (gwei) => (gwei / 1e9).toFixed(gwei < 1e5 ? 9 : 6);
export const gasStr = (g) => g.toLocaleString('en-KE');
export const intStr = (n) => n.toLocaleString('en-KE');

export const LAYERS = {
  chain: { label: 'chain', hint: 'on-chain transaction, gas paid' },
  wallet: { label: 'wallet', hint: 'signed on the client device, no gas' },
  kiosk: { label: 'kiosk', hint: 'kiosk server, no gas' },
  node: { label: 'node', hint: 'node firmware, offline' },
  fiat: { label: 'fiat', hint: 'M-Pesa rail' },
  time: { label: 'time', hint: 'clock advanced' },
};

/** A metric key such as "amina.wallet" to a readable label. */
export function metricLabel(key) {
  const [who, what] = key.split('.');
  const names = { wallet: 'wallet XKN', escrow: 'escrow deposit', earnings: 'node earnings', mpesa: 'M-Pesa', eth: 'ETH (gas)', supply: 'total supply', balance: 'balance', float: 'M-Pesa float' };
  const owner = ACTORS[who] ? nameOf(who) : { token: 'XKN', escrow: 'Escrow contract', treasury: 'Treasury', kiosk: 'Kiosk' }[who] ?? who;
  return `${owner} ${names[what] ?? what}`;
}

export const isEthKey = (key) => key.endsWith('.eth');
