/**
 * Every figure on the landing page, with the file it came from. Nothing here is
 * invented: the mediums and Laws are protocol/spec.md, the proof counts are the
 * README and demo/index.html, the device lineup and the demo matrix are
 * docs/_plan/revamp-plan.md, and the price is the deferred 500 uKES placeholder
 * that the code uses everywhere a price is needed.
 */

/** Placeholder price, deferred until it clears measured backhaul cost. */
export const PRICE_UKES_PER_UNIT = 500;

/** The billing unit, spec s5. */
export const UNIT_BYTES = 10 * 1024;

/** 500 uKES per 10 KB unit works out at 0.05 KES per MB. */
export const KES_PER_MB = 0.05;

export const STATS = [
  { value: '3', label: 'mediums, one frame format', note: 'HomePlug AV, KQ-130F, LoRa SX1262' },
  { value: '10 KB', label: 'billing unit', note: 'one cumulative unit per settled ticket' },
  { value: '95%', label: 'of every byte to the operator', note: '5 percent fee, capped at 10 on chain' },
  { value: '8', label: 'Laws, each with a named test', note: 'threat model written as invariants' },
  { value: '28', label: 'forge tests passing', note: 'including the 256-run solvency fuzz' },
];

export const MEDIUMS = [
  {
    name: 'HomePlug AV',
    model: 'Ethernet bridge over mains',
    goodput: '~10 Mbps',
    payload: '1400 B',
    role: 'Bulk in-building data',
  },
  {
    name: 'KQ-130F',
    model: 'narrowband PLC, UART 9600 baud',
    goodput: '~960 B/s',
    payload: '128 B',
    role: 'Telemetry, receipts, control',
  },
  {
    name: 'LoRa SX1262',
    model: '868.1 MHz SF7 BW125 CR4/5',
    goodput: '~5.4 kbps',
    payload: '226 B',
    role: 'Discovery, off-grid survival plane',
  },
  {
    name: 'Wi-Fi 802.11',
    model: 'client access point',
    goodput: 'not metered here',
    payload: 'n/a',
    role: 'Client attach, captive portal',
  },
];

export const BEATS = [
  {
    n: '01',
    title: 'Voucher',
    text: 'A phone pays KES by M-Pesa or Equitel. The bridge mints XKN one for one against the confirmed payment and the kiosk root key signs a small admission voucher that expires in 24 hours. A node verifies it offline, with no internet of its own.',
  },
  {
    n: '02',
    title: 'Receipt',
    text: 'Bytes flow. Every receipt interval the client signs a cumulative counter with its Ed25519 key: client id, node id, session nonce, bytes so far, sequence. 108 bytes, which fits one narrowband PLC frame. The node keeps only the latest one.',
  },
  {
    n: '03',
    title: 'Ticket',
    text: 'The node maps the last receipt to an EIP-712 ticket signed by the client EVM key: node admin, sequence, cumulative 10 KB units, epoch expiry. Losing an intermediate receipt costs nothing, because the contract pays the delta over what it already settled.',
  },
  {
    n: '04',
    title: 'Settlement',
    text: 'Anyone can batch tickets into settleTicketBatch. The escrow moves value from the payer deposit to the operator earnings and 5 percent to the treasury, capped at what was actually deposited. A 2-ticket batch measured 191,698 gas.',
  },
];

export const DEVICES = [
  {
    key: 'xKoin-Node',
    name: 'xKoin-Node',
    role: 'The gateway. Backhaul in, mains and radio out, and it meters every WAN byte it carries.',
    mediums: 'HomePlug AV, KQ-130F, LoRa SX1262, Wi-Fi',
    power: 'Mains. Backhaul from the existing router or a phone hotspot for the pilot.',
    build: 'ESP32-S3 DevKitC N16R8, SX1262, KQ-130F, HomePlug AV injector',
    demo: 'D1',
    proves: 'Bulk plane over mains, admission, metering.',
  },
  {
    key: 'xKoin-Node-Satellite',
    name: 'xKoin-Node-Satellite',
    role: 'Wall-socket relay on the same mains segment. Pulls the PLC signal, regenerates Wi-Fi, enforces admission.',
    mediums: 'HomePlug AV, KQ-130F, Wi-Fi',
    power: 'Mains, from the socket it plugs into.',
    build: 'HomePlug AV extractor with Wi-Fi, ESP32-S3, KQ-130F',
    demo: 'D3',
    proves: 'Mesh continuity where the mains segment ends.',
  },
  {
    key: 'xKoin-Satellite',
    name: 'xKoin-Satellite',
    role: 'Off-grid LoRa remote. Solar, deep sleep, class C service, relays to the nearest Node.',
    mediums: 'LoRa SX1262',
    power: 'Solar panel, TP4056 charger, one 18650 cell, deep sleep between wakes.',
    build: 'ESP32-S3, SX1262, TP4056, 18650, 6 V 2 W panel',
    demo: 'D2',
    proves: 'Survival plane, offline admission, distance through 60 dB of path loss.',
  },
  {
    key: 'xKoin-Client',
    name: 'xKoin-Client and OTG dongle',
    role: 'The user. A phone with the companion app over Wi-Fi, or the USB-C OTG dongle for direct LoRa reach.',
    mediums: 'Wi-Fi on the phone, LoRa SX1262 on the dongle',
    power: 'Phone battery. The dongle draws from the phone over USB-C.',
    build: 'ESP32-S3 with native USB, SX1262, on a USB-C OTG lead',
    demo: 'D4',
    proves: 'Cumulative counters, no loss, degrade rather than die when the WAN is unplugged.',
  },
];

export const LAWS = [
  {
    n: 1,
    law: 'Identity is the key',
    mechanism: 'node id = SHA-256(Ed25519 pk)[:8]; no accounts anywhere',
    test: 'test_receipt_roundtrip_and_tamper',
  },
  {
    n: 2,
    law: 'No admission without a fiat-backed voucher',
    mechanism: 'kiosk root key signature verified offline at the edge',
    test: 'test_join_voucher',
  },
  {
    n: 3,
    law: 'Only signed bytes are owed',
    mechanism: 'a node extends at most 2x the receipt interval of unproven credit',
    test: 'S1 max_unproven_bytes bounded',
  },
  {
    n: 4,
    law: 'A forged counter is a broken signature',
    mechanism: 'Ed25519 over canonical receipt bytes',
    test: 'fuzz and tamper tests, 0 forgeries accepted',
  },
  {
    n: 5,
    law: 'Replay pays nothing',
    mechanism: 'receiver dedupe by (src, seq); on-chain monotonic sequence and cumulative delta',
    test: 'test_revert_staleSequence, test_revert_noNewUnits',
  },
  {
    n: 6,
    law: 'Nobody is owed more than they escrowed',
    mechanism: 'settlement caps at the deposit',
    test: 'testFuzz_settleNeverExceedsDeposit (256 runs)',
  },
  {
    n: 7,
    law: 'The ledger cannot go insolvent',
    mechanism: 'escrow balance equals deposits plus earnings, fee-exact transfer',
    test: 'test_solvencyInvariant plus the e2e chain assert',
  },
  {
    n: 8,
    law: 'Corruption dies at the frame',
    mechanism: 'magic, length and CRC16 below the crypto',
    test: 'S5: 0 of 20,000 garbage frames accepted',
  },
];

export const TRUSTED = [
  {
    key: 'Kiosk root key (Ed25519)',
    holder: 'Founder',
    power: 'Signs admission vouchers',
    radius: 'Free network admission. No fund theft: funds need on-chain ECDSA.',
    exit: 'Firmware pubkey rotation now; HSM and threshold signing at scale',
  },
  {
    key: 'Bridge hot wallet',
    holder: 'gateway-api service',
    power: 'bridgeMint and self-only bridgeBurn',
    radius:
      'Unbacked XKN up to the on-chain daily cap, 50,000 KES by default. Third-party balances are unburnable by construction.',
    exit: 'Hot and cold split; the owner revokes with setBridge',
  },
  {
    key: 'Owner key (3 contracts)',
    holder: 'Founder',
    power: 'Fee capped at 10 percent, price banded 1 to 50,000 uKES with one change a day, bridge allowlist',
    radius:
      'Bounded griefing only. Cannot halt settlement, cannot touch escrow, cannot redirect fees.',
    exit: 'Ownable2Step now; Gnosis Safe before mainnet',
  },
  {
    key: 'Settlement relayer',
    holder: 'Anyone',
    power: 'None',
    radius: 'None. Signatures and monotonic counters gate everything.',
    exit: 'Already trustless',
  },
];

export const ROADMAP = [
  {
    status: 'built',
    item: 'Contracts: token, escrow, treasury',
    detail:
      'EIP-712 tickets, cumulative-unit delta settlement, 7-day beneficiary timelock with founder veto. 28 forge tests including a 256-run solvency fuzz and a stolen-owner-key drill.',
    date: '2026-09-08',
  },
  {
    status: 'built',
    item: 'gateway-api: Daraja, Jenga, vouchers, relayer',
    detail: '31 pytest tests with every external call mocked. XKOIN_DRY_RUN defaults to true.',
    date: '2026-09-09',
  },
  {
    status: 'built',
    item: 'XKP protocol reference and scenarios S1 to S6',
    detail:
      'Deterministic discrete-event simulation. 11 unit tests, all scenarios passing, 0 of 20,000 garbage frames accepted.',
    date: '2026-09-08',
  },
  {
    status: 'built',
    item: 'Founder payout worker',
    detail:
      'Watches Transfer(beneficiary to bridge), fires a Daraja B2C to the pinned MSISDN, burns exactly what was paid out once the result callback lands.',
    date: '2026-09-09',
  },
  {
    status: 'built',
    item: 'Full loop on a real chain',
    detail:
      'anvil, forge deploy, simulation-derived tickets settled on the real escrow, stranger-triggered founder payout. Digest parity, solvency and the payout property all asserted.',
    date: '2026-09-09',
  },
  {
    status: 'progress',
    item: 'Node firmware bench bring-up',
    detail:
      'The ESP32-S3 glue compiles clean against the documented pinout. The portable C core passes 75 host checks including a Python-signed Ed25519 receipt verified in C. Real hardware next.',
    date: 'from 2026-09-09',
  },
  {
    status: 'progress',
    item: 'Hardware sourcing for the proof-of-concept kit',
    detail:
      'One kit that runs demos D1 to D6 once. Each part line is scouted with at least two candidate listings and an authenticity check on the photos.',
    date: 'from 2026-09-12',
  },
  {
    status: 'progress',
    item: 'Sandbox credentials',
    detail:
      'Daraja sandbox app, Jenga UAT and the RSA keypair still need registering before dry-run mode can be turned off.',
    date: 'open',
  },
  {
    status: 'progress',
    item: 'Regulatory questions with counsel',
    detail:
      'CAK duty-cycle rules for 868 MHz, CAK transit-resale licensing, and the CBK e-money classification of XKN. All three are on the critical path before any field trial or mainnet fiat.',
    date: 'open',
  },
  {
    status: 'planned',
    item: 'Per-unit price',
    detail:
      'Deferred by the founder until it clears measured backhaul cost. A 500 uKES placeholder stands in everywhere the code needs a number.',
    date: 'after the backhaul measurement',
  },
  {
    status: 'planned',
    item: 'Session credit limit and balance on demand',
    detail: 'Makes roaming safe for operators. Firmware session manager plus one gateway route.',
    date: 'first MVP',
  },
  {
    status: 'planned',
    item: 'Android companion app',
    detail:
      'One seed in the Android Keystore, 12-word backup, buy, deposit, auto-sign receipts, send, withdraw. The largest single item in the MVP.',
    date: 'first MVP',
  },
  {
    status: 'planned',
    item: 'Gnosis Safe multisig owner',
    detail: 'Required before any mainnet deployment.',
    date: 'before mainnet',
  },
];

export const FAQ = [
  {
    q: 'Is this legal?',
    a: 'Not settled, and we will not pretend otherwise. Three questions are open with counsel: whether CAK licensing applies to reselling internet transit, what the CAK duty-cycle rules are for 868 MHz in Kenya (we have not verified them), and whether a KES-redeemable token lands inside the CBK definition of e-money. All three sit on the critical path before any field trial or live fiat. Nothing on this page is a service offer.',
  },
  {
    q: 'What happens if I lose my phone?',
    a: 'Your balance was never in the phone. It is one number in an escrow contract, keyed by an address that your 12-word seed derives. Restore the seed on a new phone and the same address, the same deposit and the same voucher validity come back. Nobody has to be asked for anything.',
  },
  {
    q: 'What if the node operator disappears?',
    a: 'You lose that node, not your money. Your deposit sits in the escrow contract, not with the operator, and any other node can serve you against the same deposit. The operator is an address in a ticket, so a device that is stolen or re-flashed does not carry the earnings away with it.',
  },
  {
    q: 'Do I need to know anything about crypto?',
    a: 'No. You pay KES by M-Pesa or Equitel and you get a balance in KES. One XKN is one shilling by construction, with six decimals so a 10 KB unit can be priced. The token exists so that a node can be paid for bytes without trusting anyone, and the app signs the receipts in the background.',
  },
  {
    q: 'What happens when there is no electricity?',
    a: 'The mains mediums go quiet and LoRa carries the session. Three consecutive delivery failures quarantine a medium for 2 seconds and the next-best medium takes over; the measured failover in the simulation run was 0.8 s. Heartbeats keep the session sequence numbers alive, so no paid byte is lost and no new byte is owed until a fresh receipt is signed. The off-grid Satellite runs on solar and a single cell.',
  },
  {
    q: 'Is xKoin an internet service provider?',
    a: 'It is a protocol and a set of devices that meter and settle carried bytes, and today it is a proof-of-concept with a test suite, not a service anyone can buy. Whether the thing it enables needs a licence to operate in Kenya is the first question on this list, and counsel answers it before anything is offered to a customer.',
  },
];

export const DOC_LINKS = [
  {
    href: '/docs',
    label: '/docs',
    text: 'The paper set, the use cases and the compact beta board version, rendered from the repository.',
    internal: true,
  },
  {
    href: '/investors',
    label: '/investors',
    text: 'The investor walkthrough: eight screens with the real proof figures inlined from the last run.',
    internal: true,
  },
  {
    href: '/replay',
    label: '/replay',
    text: 'Protocol replay: the frame trace second by second, the chain settlement, the kiosk journeys, the board schematics.',
    internal: true,
  },
  {
    href: '/shop',
    label: '/shop',
    text: 'The proof-of-concept shopping list, one scouted listing per part line.',
    internal: true,
  },
  {
    href: 'https://github.com/xthukuh/x-koin',
    label: 'github.com/xthukuh/x-koin',
    text: 'Contracts, gateway-api, protocol reference, firmware and this page. protocol/spec.md is the protocol source of truth.',
    internal: false,
  },
];
