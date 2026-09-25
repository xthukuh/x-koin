/**
 * The canonical xKoin glossary.
 *
 * One entry per term the papers assume you already know: a short definition in
 * plain words and the slug of the paper that explains it properly. The docs
 * renderer wraps the first occurrence of each term in an article, so a reader
 * who meets "narrowband PLC" in paragraph three can hover it instead of leaving
 * the page. Any other route may import GLOSSARY; this file is the one place a
 * definition is written down.
 *
 * `term` is what is shown. `match` lists the spellings to look for, longest
 * first; without it the term itself is the only spelling. `exact` marks a term
 * whose case carries meaning, such as XKN or CA, so an ordinary lowercase word
 * is never wrapped by mistake.
 */
export const GLOSSARY = [
  // ---------------------------------------------------------------- money
  {
    term: 'XKN',
    exact: true,
    definition: 'The token you spend. One XKN is one shilling, and it exists only because a shilling was paid in.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'KES',
    exact: true,
    definition: 'The Kenyan shilling. Every price in the set is in shillings.',
    paper: 'papers/01-problem-and-market',
  },
  {
    term: 'KES peg',
    definition: 'One XKN is always one shilling: each is minted against money paid in and burned on payout.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'escrow',
    match: ['xKoinEscrow', 'escrow'],
    definition: 'The prepaid meter on chain. One balance per user, readable by every node and withdrawable any time.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'treasury',
    match: ['xKoinTreasury', 'treasury'],
    definition: 'The contract that collects the fee, capped at 10 percent on chain, and pays only its named beneficiary.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'ticket',
    definition: 'The last receipt, in the form the chain understands. One ticket closes a whole session.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'receipt',
    definition: 'A signed count of the bytes so far. It is 108 bytes, small enough for the slowest link in the system.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'voucher',
    definition: 'A signed note from the kiosk saying this address paid. A node checks it offline, and it lasts 24 hours.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'cumulative counter',
    definition: 'A count that only goes up, so a lost reading costs nothing. The contract pays the difference.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'state channel',
    definition: 'One client and one node keep a running tally off chain. Only the closing number reaches the chain.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'settlement',
    match: ['settleTicketBatch', 'settlement'],
    definition: 'The call that moves the money: out of the user deposit, to the operator, minus the fee.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'relayer',
    definition: 'Whoever sends tickets to the chain. It holds no special power, so anyone can run one.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'bridge',
    definition: 'The key that mints XKN once the bank confirms a payment. It can burn only its own balance.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'kiosk',
    definition: 'Where you buy. It takes the mobile money, signs the voucher and pays the gas for you.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'kiosk root key',
    definition: 'The key that signs vouchers. Its public half is built into every node, which is why admission works offline.',
    paper: 'papers/10-security-and-trust',
  },
  {
    term: 'node operator',
    match: ['node operator', 'nodeAdmin'],
    definition: 'The address that gets paid. It is an address, not a device, so a stolen board earns nothing.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'M-Pesa',
    definition: 'Safaricom mobile money, one of the two ways to pay in.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'Equitel',
    definition: 'Equity Bank mobile money, the other way to pay in.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'Safaricom',
    definition: 'Kenya largest mobile operator. Its data prices are the ones xKoin has to beat.',
    paper: 'papers/01-problem-and-market',
  },
  {
    term: 'gas',
    definition: 'What the chain charges for a transaction. A two-ticket settlement costs about 191,698 gas on Base.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'CapEx',
    exact: true,
    definition: 'The hardware an operator buys before selling a single byte.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'VAT',
    exact: true,
    definition: 'Kenyan value added tax, on imported hardware and on the price of service.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'USDT',
    exact: true,
    definition: 'The dollar stablecoin used as the reference when shillings are converted to chain value.',
    paper: 'papers/04-settlement-and-economics',
  },

  // ------------------------------------------------------------- protocol
  {
    term: 'XKP',
    exact: true,
    definition: 'The xKoin protocol: one frame, five phases, and signed receipts that only ever count up.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'frame',
    definition: 'The unit the protocol sends. The same 29 bytes of overhead on power line, radio or Wi-Fi.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'hop',
    definition: 'One relay of a frame. Each hop drops the TTL by one.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'TTL',
    exact: true,
    definition: 'The hop budget in a frame header. It stops a frame circling the mesh forever.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'MTU',
    exact: true,
    definition: 'The biggest payload a link carries at once: 1400 B on HomePlug, 226 B on LoRa, 128 B on narrowband.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'mesh',
    definition: 'Every node you can reach, whichever link the hops used to get there.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'medium',
    definition: 'One physical carrier: HomePlug AV, narrowband PLC, LoRa or Wi-Fi.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'medium score',
    definition: 'Goodput times one minus loss. The sender uses the highest, never a fixed order.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'EWMA',
    exact: true,
    definition: 'A rolling average. It is how goodput and loss are tracked for each medium.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'goodput',
    definition: 'What actually arrives per second, as against the line rate.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'quarantine',
    definition: 'Three failures in a row and a medium sits out two seconds while the next best takes over.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'free LAN plane',
    match: ['free LAN plane', 'free LAN'],
    definition: 'Traffic that stays in the mesh. It costs nothing and keeps working with the backhaul down.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'WAN',
    exact: true,
    definition: 'Anything past the gateway. It is the only traffic that is ever billed.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'LAN',
    exact: true,
    definition: 'The local side, inside the building or the mesh. Free by design.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'backhaul',
    definition: 'The node link to the internet: LTE, fibre or a phone hotspot. It is the thing being sold.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'captive portal',
    definition: 'The node Wi-Fi landing page, for buying without the app.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'class A service',
    definition: 'A web page stripped to about 12 KB of text in the cloud, then sent over the radio.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'class B service',
    definition: 'The radio switches between LoRa and GFSK by link quality, for light real internet.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'class C service',
    match: ['class C service', 'class C'],
    definition: 'Plain frames, no internet protocol: balances, messages, prices and kiosk work.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'store-and-forward',
    match: ['store-and-forward', 'store and forward'],
    definition: 'A device with nothing in reach saves its readings to flash and sends them when a listener finally appears.',
    paper: 'potential/09-field-geology-sensors',
  },
  {
    term: 'Sybil',
    definition: 'Faking many identities. It earns nothing here, because only a signed byte count pays.',
    paper: 'papers/10-security-and-trust',
  },
  {
    term: 'iptables',
    definition: 'The Linux packet filter a node uses to keep free local traffic out of the billed path.',
    paper: 'papers/02-system-architecture',
  },

  // ------------------------------------------------------------ mediums
  {
    term: 'PLC',
    exact: true,
    definition: 'Power-line communication: data over the mains wiring already in the walls.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'HomePlug AV',
    match: ['HomePlug AV', 'HomePlug'],
    definition: 'Broadband over the mains, about 10 Mbps. It carries the bulk of the traffic.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'narrowband PLC',
    definition: 'A slow, tough carrier on the mains, about 960 B/s. It carries control and receipts.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'KQ-130F',
    exact: true,
    definition: 'The narrowband modem. Its 128-byte frame is why a receipt is 108 bytes.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'LoRa',
    exact: true,
    definition: 'Long-range radio at 868 MHz. It finds neighbours, and it survives a power cut.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'SX1262',
    exact: true,
    definition: 'The radio chip in every xKoin device. It does both LoRa and GFSK.',
    paper: 'papers/07-hardware-satellite',
  },
  {
    term: 'E22-900M22S',
    exact: true,
    definition: 'The module that carries the SX1262 in the field kit, with an amplifier and an aerial socket.',
    paper: 'papers/07-hardware-satellite',
  },
  {
    term: 'GFSK',
    exact: true,
    definition: 'The same radio in a faster mode, 150 kbps, for strong links.',
    paper: 'papers/03-protocol-xkp',
  },
  {
    term: 'SF7',
    exact: true,
    definition: 'The fastest LoRa setting used here, about 5.4 kbps.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'SF12',
    exact: true,
    definition: 'The slowest LoRa setting used here: the longest reach, and about 24 times the airtime of SF7 for the same frame.',
    paper: 'potential/09-field-geology-sensors',
  },
  {
    term: 'BW125',
    exact: true,
    definition: 'A 125 kHz LoRa channel, the width the firmware uses.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'CR4/5',
    exact: true,
    definition: 'LoRa error correction: one spare symbol for every four sent.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'OFDM',
    exact: true,
    definition: 'The modulation HomePlug spreads across the mains band.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'duty cycle',
    definition: 'How much of an hour a radio is allowed to transmit under the spectrum rules.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'mains segment',
    definition: 'How far a power-line signal reaches before a transformer, a phase change or a filter stops it.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'Meshtastic',
    definition: 'Open LoRa mesh firmware. Its handsets ride the free local plane.',
    paper: 'papers/09-lora-ecosystem-devices',
  },

  // ------------------------------------------------------------- devices
  {
    term: 'Node',
    match: ['xKoin-Node', 'Node'],
    exact: true,
    definition: 'The gateway. Internet in, mains and radio out, and it counts every byte that leaves.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'Node-Satellite',
    match: ['xKoin-Node-Satellite', 'Node-Satellite'],
    exact: true,
    definition: 'A relay in a wall socket. It repeats Wi-Fi, admits clients and collects its own receipts.',
    paper: 'papers/06-hardware-node-satellite',
  },
  {
    term: 'Satellite',
    match: ['xKoin-Satellite', 'Satellite'],
    exact: true,
    definition: 'The solar radio box off grid. It sleeps, serves class C and relays to the nearest Node.',
    paper: 'papers/07-hardware-satellite',
  },
  {
    term: 'Client',
    match: ['xKoin-Client', 'Client'],
    exact: true,
    definition: 'Whatever holds your keys: the phone app, or the dongle.',
    paper: 'papers/08-hardware-client-and-otg-dongle',
  },
  {
    term: 'OTG',
    exact: true,
    definition: 'The USB mode that lets a phone run the dongle that gives it a radio.',
    paper: 'papers/08-hardware-client-and-otg-dongle',
  },
  {
    term: 'ESP32-S3',
    exact: true,
    definition: 'The microcontroller in the Node, the relay and the dongle.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'ESP32-C3',
    exact: true,
    definition: 'The smaller, cheaper chip for sensor devices.',
    paper: 'papers/09-lora-ecosystem-devices',
  },
  {
    term: 'ESP-IDF',
    exact: true,
    definition: 'Espressif build system. Every board here is built with it.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'MCU',
    exact: true,
    definition: 'The small processor on a board.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'PSRAM',
    exact: true,
    definition: 'Extra memory on the ESP32-S3, 8 MB, enough to hold a few dozen sessions.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'UART',
    exact: true,
    definition: 'A simple serial line. The narrowband modem hangs off one at 9600 baud.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'SPI',
    exact: true,
    definition: 'The fast serial bus the radio and the Ethernet chip share.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'I2C',
    exact: true,
    definition: 'The two-wire bus for the display and the sensors.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'GPIO',
    exact: true,
    definition: 'A pin on the microcontroller. Every board follows one fixed pin map.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'LTE',
    exact: true,
    definition: 'Mobile data, one of three ways to give a Node its internet.',
    paper: 'papers/02-system-architecture',
  },
  {
    term: 'SIM7600E',
    exact: true,
    definition: 'The LTE modem in the kit, and the priciest part of a Node.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'W5500',
    exact: true,
    definition: 'The chip that gives a Node a wired network socket.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'HLK-PM01',
    exact: true,
    definition: 'A sealed module that turns mains into 5 V inside the case.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'TP4056',
    exact: true,
    definition: 'The charger between the solar panel and the cell.',
    paper: 'papers/07-hardware-satellite',
  },
  {
    term: 'OLED',
    exact: true,
    definition: 'The small status screen on a Node.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'DHT22',
    exact: true,
    definition: 'A temperature and humidity sensor.',
    paper: 'papers/09-lora-ecosystem-devices',
  },
  {
    term: 'AHT20',
    exact: true,
    definition: 'A temperature and humidity sensor on I2C, better behaved than the DHT22.',
    paper: 'papers/09-lora-ecosystem-devices',
  },
  {
    term: 'HC-SR04',
    exact: true,
    definition: 'An ultrasonic range finder, used here to read a water tank.',
    paper: 'papers/09-lora-ecosystem-devices',
  },
  {
    term: 'tiltmeter',
    definition: 'An instrument that measures very small changes in the slope of the ground, used to watch a hillside or a quarry face.',
    paper: 'potential/09-field-geology-sensors',
  },
  {
    term: 'piezometer',
    definition: 'An instrument that measures water pressure inside the ground, which is how the stability of a slope or a borehole is judged.',
    paper: 'potential/09-field-geology-sensors',
  },
  {
    term: 'IPEX',
    exact: true,
    definition: 'The tiny aerial socket on a radio module.',
    paper: 'papers/07-hardware-satellite',
  },
  {
    term: 'SMA',
    exact: true,
    definition: 'The screw-on aerial socket on the outside of a case.',
    paper: 'papers/07-hardware-satellite',
  },
  {
    term: 'BOM',
    exact: true,
    definition: 'The parts list: every part, how many, where from and what it costs.',
    paper: 'papers/05-hardware-node',
  },
  {
    term: 'MVP',
    exact: true,
    definition: 'The smallest build that proves the claim: one Node, one relay, one solar box and a phone.',
    paper: 'papers/12-proof-of-concept-plan',
  },
  {
    term: 'PCB',
    exact: true,
    definition: 'A circuit board. The beta folder replaces the kit of modules with one of these.',
    paper: 'x-koin-beta/02-pcb-blueprint',
  },
  {
    term: 'DFM',
    exact: true,
    definition: 'The checks a factory runs on a board before it will quote for it.',
    paper: 'x-koin-beta/02-pcb-blueprint',
  },

  // ------------------------------------------------------ cryptography
  {
    term: 'Ed25519',
    exact: true,
    definition: 'The signature on vouchers and receipts. A check takes under 4.5 ms on the device.',
    paper: 'papers/10-security-and-trust',
  },
  {
    term: 'secp256k1',
    definition: 'The signature the chain itself can check.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'EIP-712',
    exact: true,
    definition: 'The Ethereum way of signing a structured message. The ticket is signed like this.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'EIP-2612',
    exact: true,
    definition: 'A signature that funds a deposit, so the user never has to hold ETH.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'ERC-20',
    exact: true,
    definition: 'The standard token interface. It is why an ordinary wallet can already hold XKN.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'Base L2',
    match: ['Base L2', 'Base'],
    exact: true,
    definition: 'The chain the token, the escrow and the treasury live on.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'SHA-256',
    exact: true,
    definition: 'The hash that turns a public key into an 8-byte node id. That is Law 1.',
    paper: 'papers/10-security-and-trust',
  },
  {
    term: 'keccak256',
    definition: 'The Ethereum hash. It keys each channel on the pair of addresses.',
    paper: 'papers/04-settlement-and-economics',
  },
  {
    term: 'CRC16-CCITT',
    match: ['CRC16-CCITT', 'CRC16'],
    exact: true,
    definition: 'A cheap checksum. It throws out corrupt frames before any signature is checked.',
    paper: 'papers/03-protocol-xkp',
  },

  // -------------------------------------------------------- regulatory
  {
    term: 'CA',
    exact: true,
    match: ['Communications Authority', 'CA'],
    definition: 'The Communications Authority of Kenya. It licenses spectrum and approves radios.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'CBK',
    exact: true,
    definition: 'The Central Bank of Kenya. Its rules apply where shillings meet the token.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'KEBS',
    exact: true,
    definition: 'The Kenya Bureau of Standards. It sets the marks imported electronics must carry.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'PVoC',
    exact: true,
    definition: 'The inspection an import has to pass before it reaches Mombasa.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'EPRA',
    exact: true,
    definition: 'The energy regulator. Its rules cover anything wired to mains.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'KPLC',
    exact: true,
    definition: 'Kenya Power. It owns the wiring the bulk traffic rides on.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'ETSI',
    exact: true,
    definition: 'The European standards body. The Kenyan radio limits follow its lead.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'e.r.p.',
    definition: 'How much power a radio actually puts into the air. The rules cap it at 25 mW in this band.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'LBT',
    exact: true,
    definition: 'Listen before talk: check the channel is clear before transmitting.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'AFA',
    exact: true,
    definition: 'Move to another channel when one is busy. It goes with listen before talk.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'RCD',
    exact: true,
    definition: 'The earth-leakage breaker that has to sit between mains and a person.',
    paper: 'papers/11-regulatory-and-safety',
  },
  {
    term: 'EMI',
    exact: true,
    definition: 'Radio noise. It is why a power-line carrier has a band it must stay inside.',
    paper: 'papers/11-regulatory-and-safety',
  },
];

/** Lookup by the shown term. */
export const GLOSSARY_BY_TERM = new Map(GLOSSARY.map((entry) => [entry.term, entry]));

/**
 * Every spelling to look for, longest first, each carrying its entry. Longest
 * first matters: "narrowband PLC" has to beat "PLC", and "Node-Satellite" has
 * to beat "Node".
 */
export function glossaryMatches() {
  const matches = [];
  for (const entry of GLOSSARY) {
    for (const text of entry.match ?? [entry.term]) {
      matches.push({ text, entry });
    }
  }
  matches.sort((a, b) => b.text.length - a.text.length);
  return matches;
}

export default GLOSSARY;
