import './screens/index.js';

export { default as Phone, SCREEN_NAMES, registerScreen } from './Phone.jsx';
export * from './screens/index.js';

/**
 * The controls a story can point at, per screen.
 *
 *   <Phone screen="buy" highlight="buy" />
 *
 * Names outside this map highlight nothing; the screen renders as usual. Some
 * controls answer to two names where a story might say either, so "send" and
 * "confirm" both point at the fingerprint button on the send screen.
 */
export const HIGHLIGHTS = {
  onboard: ['seed', 'confirm', 'create', 'restore'],
  main: [
    'address',
    'meter',
    'balance',
    'wallet',
    'buy',
    'send',
    'withdraw',
    'receive',
    'attach',
    'node',
    'recent',
    'tabs',
  ],
  attach: ['status', 'attach', 'node', 'session', 'free', 'nearby', 'pause'],
  buy: ['amount', 'presets', 'method', 'phone', 'steps', 'deposit', 'buy', 'confirm'],
  send: ['to', 'qr', 'amount', 'settles', 'send', 'confirm'],
  unlock: ['amount', 'to', 'signed', 'gas', 'unlock'],
  withdraw: ['amount', 'short', 'payout', 'steps', 'charges', 'withdraw'],
};
