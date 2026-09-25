import * as glossaryModule from '../../docs/glossary.js';

/**
 * The words the deck uses, in one line each.
 *
 * A reader meets an abbreviation on a slide and needs it settled in the time it
 * takes to read one line, so every entry here is written short and plain. The
 * full definition is in the paper each entry links to.
 *
 * Shape:
 *
 *   { term, short, doc }
 *
 * `doc` is a /docs slug, so a link is `/docs/${doc}`.
 *
 * Keys are the ids a scene lists in `terms` in manifest.js. A word a scene
 * names that is missing here renders as plain text, so a gap is a gap and never
 * a crash.
 *
 * The site glossary in src/docs/glossary.js is the canonical, longer set. It is
 * read here only to check that both files send a reader to the same paper; the
 * deck keeps its own short wording on purpose, because a footnote under a slide
 * is not a reference entry. Merging the two later means copying these short
 * lines across, not rewriting them.
 */
export const TERMS = {
  xkp: {
    term: 'XKP',
    short: 'The xKoin protocol. One frame format for power line, radio and Wi-Fi alike.',
    doc: 'papers/03-protocol-xkp',
  },
  frame: {
    term: 'frame',
    short: '27 bytes of header, a payload, then a 2 byte check.',
    doc: 'papers/03-protocol-xkp',
  },
  crc16: {
    term: 'CRC16-CCITT',
    short: 'A cheap check over the whole frame. Damaged frames die here, before any signature is read.',
    doc: 'papers/03-protocol-xkp',
  },
  ttl: {
    term: 'TTL',
    short: 'Hops left. Every relay takes one off.',
    doc: 'papers/03-protocol-xkp',
  },
  mtu: {
    term: 'MTU',
    short: 'The biggest payload a medium can send in one go.',
    doc: 'papers/02-system-architecture',
  },
  'node-id': {
    term: 'node id',
    short: 'A short hash of the device public key. There are no accounts to look up.',
    doc: 'papers/00-START-HERE',
  },
  medium: {
    term: 'medium',
    short: 'One physical carrier: HomePlug AV, narrowband PLC, LoRa or Wi-Fi.',
    doc: 'papers/02-system-architecture',
  },
  'medium-score': {
    term: 'medium score',
    short: 'Speed estimate times the chance a frame lands. The sender picks the highest.',
    doc: 'papers/02-system-architecture',
  },
  ewma: {
    term: 'EWMA',
    short: 'A running average that leans on recent results.',
    doc: 'papers/03-protocol-xkp',
  },
  plc: {
    term: 'PLC',
    short: 'Data sent over the mains wiring already in the walls.',
    doc: 'papers/02-system-architecture',
  },
  homeplug: {
    term: 'HomePlug AV',
    short: 'Fast power-line data, modelled at about 10 Mbps. It carries the bulk traffic.',
    doc: 'papers/02-system-architecture',
  },
  'narrowband-plc': {
    term: 'narrowband PLC',
    short: 'Slow power-line data, about 960 bytes a second. It carries receipts and control.',
    doc: 'papers/02-system-architecture',
  },
  kq130f: {
    term: 'KQ-130F',
    short: 'The narrowband power-line modem. 128 bytes per frame.',
    doc: 'papers/05-hardware-node',
  },
  lora: {
    term: 'LoRa',
    short: 'Long range radio at 868.1 MHz. It finds other devices, and it survives a blackout.',
    doc: 'papers/02-system-architecture',
  },
  sx1262: {
    term: 'SX1262',
    short: 'The radio chip behind every LoRa link here.',
    doc: 'papers/07-hardware-satellite',
  },
  sf7: {
    term: 'SF7',
    short: 'The fastest LoRa setting used: about 5.4 kbps, 226 byte payload.',
    doc: 'papers/03-protocol-xkp',
  },
  gfsk: {
    term: 'GFSK',
    short: 'The same radio in a faster mode, 150 kbps, for strong links.',
    doc: 'papers/03-protocol-xkp',
  },
  'duty-cycle': {
    term: 'duty cycle',
    short: 'How much of each hour a transmitter is allowed to talk.',
    doc: 'papers/11-regulatory-and-safety',
  },
  wifi: {
    term: 'Wi-Fi',
    short: 'How phones attach. It carries no mesh frames.',
    doc: 'papers/02-system-architecture',
  },
  esp32s3: {
    term: 'ESP32-S3',
    short: 'The chip in the Node, the relay and the dongle.',
    doc: 'papers/05-hardware-node',
  },
  esp32c3: {
    term: 'ESP32-C3',
    short: 'A smaller chip, used on the sensor nodes.',
    doc: 'papers/09-lora-ecosystem-devices',
  },
  heltec: {
    term: 'Heltec WiFi LoRa 32 V3',
    short: 'An off-the-shelf board with chip and radio on it. Used for the Satellite and the dongle.',
    doc: 'papers/07-hardware-satellite',
  },
  e22: {
    term: 'E22-900M22S',
    short: 'The LoRa module fitted to the Node.',
    doc: 'papers/05-hardware-node',
  },
  'ra-01sh': {
    term: 'Ra-01SH',
    short: 'The LoRa module on the farm sensor.',
    doc: 'papers/09-lora-ecosystem-devices',
  },
  otg: {
    term: 'OTG',
    short: 'The phone acts as host and powers the dongle from its own battery.',
    doc: 'papers/08-hardware-client-and-otg-dongle',
  },
  rssi: {
    term: 'RSSI',
    short: 'How strong a received signal was. An estimate, not a lab measurement.',
    doc: 'papers/12-proof-of-concept-plan',
  },
  meshtastic: {
    term: 'Meshtastic',
    short: 'An open LoRa mesh. xKoin devices can find it, and nothing more is claimed.',
    doc: 'papers/09-lora-ecosystem-devices',
  },
  'free-lan': {
    term: 'free LAN plane',
    short: 'Traffic that never leaves the mesh. It costs nothing and needs no voucher.',
    doc: 'papers/00-START-HERE',
  },
  backhaul: {
    term: 'backhaul',
    short: 'The link from the Node to the internet: LTE, fibre or a phone hotspot.',
    doc: 'papers/02-system-architecture',
  },
  'mains-segment': {
    term: 'mains segment',
    short: 'How far a power-line signal reaches before a transformer or a filter stops it.',
    doc: 'papers/02-system-architecture',
  },
  'captive-portal': {
    term: 'captive portal',
    short: 'The page that opens when you join the Wi-Fi, for buying without the app.',
    doc: 'papers/00-START-HERE',
  },
  voucher: {
    term: 'voucher',
    short: 'A signed note saying this address paid. Checked offline. Good for 24 hours.',
    doc: 'papers/04-settlement-and-economics',
  },
  receipt: {
    term: 'receipt',
    short: 'A signed running total of bytes used. 108 bytes, so it fits the slowest medium.',
    doc: 'papers/03-protocol-xkp',
  },
  cumulative: {
    term: 'cumulative counter',
    short: 'A total that only goes up, so losing one costs nothing.',
    doc: 'papers/03-protocol-xkp',
  },
  ticket: {
    term: 'ticket',
    short: 'The last receipt, signed again in the form the chain can check.',
    doc: 'papers/04-settlement-and-economics',
  },
  escrow: {
    term: 'escrow',
    short: 'The shared prepaid meter. One balance per address, readable by every node.',
    doc: 'papers/04-settlement-and-economics',
  },
  settlement: {
    term: 'settlement',
    short: 'The call that moves money from a balance to an operator and the treasury.',
    doc: 'papers/04-settlement-and-economics',
  },
  treasury: {
    term: 'treasury',
    short: 'Takes the fee. It can pay one address and nowhere else.',
    doc: 'papers/04-settlement-and-economics',
  },
  bridge: {
    term: 'bridge',
    short: 'The key that makes tokens when cash arrives and destroys its own when cash leaves.',
    doc: 'papers/04-settlement-and-economics',
  },
  relayer: {
    term: 'relayer',
    short: 'Whoever sends ticket batches to the chain. It holds no power, so anyone can run one.',
    doc: 'papers/04-settlement-and-economics',
  },
  xkn: {
    term: 'XKN',
    short: 'The token. One XKN is one shilling.',
    doc: 'papers/04-settlement-and-economics',
  },
  'kes-peg': {
    term: 'KES peg',
    short: 'One token is one shilling, because each one was made against a real payment.',
    doc: 'papers/04-settlement-and-economics',
  },
  ukes: {
    term: 'micro-KES',
    short: 'A millionth of a shilling. The smallest amount the token can hold.',
    doc: 'papers/04-settlement-and-economics',
  },
  unit: {
    term: 'billing unit',
    short: '10 KB sent to the internet. The price is set per unit.',
    doc: 'papers/04-settlement-and-economics',
  },
  'kiosk-root-key': {
    term: 'kiosk root key',
    short: 'The key that signs vouchers. Every node carries its public half.',
    doc: 'papers/10-security-and-trust',
  },
  'node-operator': {
    term: 'node operator',
    short: 'The address paid for serving bytes. An address, not a device.',
    doc: 'papers/04-settlement-and-economics',
  },
  ed25519: {
    term: 'Ed25519',
    short: 'The signature used for receipts and vouchers at the edge. Fast to check.',
    doc: 'papers/10-security-and-trust',
  },
  secp256k1: {
    term: 'secp256k1',
    short: 'The signature the chain understands. Used for tickets.',
    doc: 'papers/10-security-and-trust',
  },
  eip712: {
    term: 'EIP-712',
    short: 'A way of signing a structured record so the chain checks the same digest you did.',
    doc: 'papers/04-settlement-and-economics',
  },
  eip2612: {
    term: 'EIP-2612',
    short: 'A signed permission to move tokens, so the user never needs ETH.',
    doc: 'papers/04-settlement-and-economics',
  },
  erc20: {
    term: 'ERC-20',
    short: 'The standard token interface every wallet already knows.',
    doc: 'papers/04-settlement-and-economics',
  },
  base: {
    term: 'Base',
    short: 'The chain the contracts run on. A settlement costs a fraction of a cent.',
    doc: 'papers/04-settlement-and-economics',
  },
  daraja: {
    term: 'Daraja',
    short: 'The Safaricom rail for M-Pesa payments.',
    doc: 'papers/04-settlement-and-economics',
  },
  jenga: {
    term: 'Jenga',
    short: 'The Equity and Equitel rail for payments.',
    doc: 'papers/04-settlement-and-economics',
  },
  'stk-push': {
    term: 'STK push',
    short: 'The prompt on the payer phone asking for their PIN.',
    doc: 'papers/04-settlement-and-economics',
  },
  msisdn: {
    term: 'MSISDN',
    short: 'The phone number a payout goes to.',
    doc: 'papers/10-security-and-trust',
  },
  law3: {
    term: 'Law 3',
    short: 'Only signed bytes are owed. A node risks two receipt intervals and no more.',
    doc: 'papers/10-security-and-trust',
  },
  law5: {
    term: 'Law 5',
    short: 'Replay pays nothing. An old receipt is worth a difference of zero.',
    doc: 'papers/10-security-and-trust',
  },
  law6: {
    term: 'Law 6',
    short: 'Nobody is owed more than they paid in. Settlement stops at the balance.',
    doc: 'papers/10-security-and-trust',
  },
  law7: {
    term: 'Law 7',
    short: 'The ledger cannot go short. What is held equals what is owed, after every call.',
    doc: 'papers/10-security-and-trust',
  },
  law8: {
    term: 'Law 8',
    short: 'Corruption dies at the frame, before any signature is read.',
    doc: 'papers/10-security-and-trust',
  },
  laws: {
    term: 'the eight Laws',
    short: 'The threat model, written as rules that must always hold. Each one has a test.',
    doc: 'papers/10-security-and-trust',
  },
  'session-credit': {
    term: 'session credit limit',
    short: 'How far one session may run before the node settles. 20 KES online, 5 offline.',
    doc: 'papers/04-settlement-and-economics',
  },
  ownable2step: {
    term: 'Ownable2Step',
    short: 'Ownership moves in two steps, so a wrong address cannot strand a contract.',
    doc: 'papers/10-security-and-trust',
  },
  safe: {
    term: 'Gnosis Safe',
    short: 'A 2-of-3 multisig. It must own the contracts before any real money launch.',
    doc: 'papers/10-security-and-trust',
  },
  foundry: {
    term: 'Foundry',
    short: 'The contract test tool. 35 tests pass today.',
    doc: 'papers/13-roadmap',
  },
  'gateway-api': {
    term: 'gateway-api',
    short: 'The service that takes the payment, makes the tokens and signs the voucher.',
    doc: 'papers/02-system-architecture',
  },
  cak: {
    term: 'Communications Authority',
    short: 'The Kenyan regulator whose rules bind the 868 MHz radio.',
    doc: 'papers/11-regulatory-and-safety',
  },
  kebs: {
    term: 'KEBS',
    short: 'The Kenyan standards body. It gates any device wired to the mains.',
    doc: 'papers/11-regulatory-and-safety',
  },
  cbk: {
    term: 'Central Bank of Kenya',
    short: 'It decides what the token counts as in law.',
    doc: 'papers/11-regulatory-and-safety',
  },
  'class-a': {
    term: 'class A service',
    short: 'A web page stripped down to text in the cloud, then sent over the radio.',
    doc: 'papers/03-protocol-xkp',
  },
  'class-b': {
    term: 'class B service',
    short: 'The radio switching to its faster mode when the link is strong enough.',
    doc: 'papers/03-protocol-xkp',
  },
  'class-c': {
    term: 'class C service',
    short: 'Plain frames, no internet protocol: balances, prices, messages.',
    doc: 'papers/03-protocol-xkp',
  },
  node: {
    term: 'xKoin-Node',
    short: 'The gateway. The only device that touches the internet.',
    doc: 'papers/05-hardware-node',
  },
  'node-satellite': {
    term: 'xKoin-Node-Satellite',
    short: 'The wall-socket relay. It admits clients and collects its own receipts.',
    doc: 'papers/06-hardware-node-satellite',
  },
  satellite: {
    term: 'xKoin-Satellite',
    short: 'The solar remote. Radio only, and under 40 mA on average by design.',
    doc: 'papers/07-hardware-satellite',
  },
  client: {
    term: 'xKoin-Client',
    short: 'Whatever holds the user keys: the phone, or the dongle on its lead.',
    doc: 'papers/08-hardware-client-and-otg-dongle',
  },
  demos: {
    term: 'D1 to D6',
    short: 'The six bench tests. Each one names a number it has to beat.',
    doc: 'papers/12-proof-of-concept-plan',
  },
  'price-floor': {
    term: 'price floor formula',
    short: 'Backhaul cost per MB, scaled to the unit, divided by the share the operator keeps.',
    doc: 'papers/04-settlement-and-economics',
  },
  estates: {
    term: 'apartment estates',
    short: 'The pilot case, worked through against a 40 unit block in Ruaka.',
    doc: 'potential/02-apartment-estates',
  },
  farms: {
    term: 'large-scale farm IoT',
    short: 'Sensors on the free plane, worked through against a 400 acre farm in Laikipia.',
    doc: 'potential/01-large-scale-farm-iot',
  },
  'last-network': {
    term: 'last network standing',
    short: 'What the mesh still does when the grid, the fibre and the cell site have all gone.',
    doc: 'potential/00-last-network-standing',
  },
};

/**
 * Where the site glossary and this file disagree about the paper a word belongs
 * to. Empty is the healthy state. Nothing consumes this at runtime; it exists
 * so a drift shows up in one call rather than in a reader's broken link.
 */
export function glossaryDrift() {
  const site = Array.isArray(glossaryModule?.GLOSSARY) ? glossaryModule.GLOSSARY : [];
  if (site.length === 0) {
    return [];
  }
  const byTerm = new Map(site.map((entry) => [String(entry.term).toLowerCase(), entry]));
  const drift = [];
  for (const [id, entry] of Object.entries(TERMS)) {
    const match = byTerm.get(entry.term.toLowerCase());
    if (match && match.paper && match.paper !== entry.doc) {
      drift.push({ id, deck: entry.doc, site: match.paper });
    }
  }
  return drift;
}

/** The entries for a list of ids, skipping anything this file does not define. */
export function termsFor(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids.map((id) => (TERMS[id] ? { id, ...TERMS[id] } : null)).filter(Boolean);
}
