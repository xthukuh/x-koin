/**
 * Every number on /startup, with the file it came from.
 *
 * Rules this file keeps, because the page is shown to people deciding whether
 * to put money in:
 *
 *  1. No total is written down. Totals are summed from line items by the
 *     helpers at the bottom, so a table and its footer cannot disagree.
 *  2. Every line carries a `confidence` and a footnote id. `verified` means it
 *     was read on a listing or measured in a run; `derived` is arithmetic on
 *     such a figure; `estimate` is this page's own number with its basis named;
 *     `unquoted` is an estimate standing in for a quotation nobody has asked
 *     for yet; `unpriced` means the repository deliberately prints no number.
 *  3. Foreign-sourced lines keep their foreign amount, and the KES value is
 *     computed from web/src/lib/money.js rather than typed in.
 *  4. Every revenue figure is conditional on the 500 micro-KES per 10 KB unit
 *     price, which is a placeholder until it clears measured backhaul cost.
 *     Paper 13 section 1 states that rule and this page obeys it.
 *
 * Sources: docs/papers/13-roadmap.md (phases, entry and exit conditions,
 * funding ranges), 04-settlement-and-economics.md (unit economics, measured
 * gas, the treasury), 01-problem-and-market.md (bundle prices, the three
 * buyers, the per-site figure), 11-regulatory-and-safety.md (the gates),
 * 12-proof-of-concept-plan.md (the six demos, the ten-day bench schedule),
 * hardware/shopping/mvp-kit.json and mvp-sourcing.md (the kit, verified
 * 2026-09-14).
 */

import { KES_PER_MB, PRICE_UKES_PER_UNIT } from '../landing/data.js';
import { fmtKes, usdToKes } from '../lib/money.js';

export { KES_PER_MB, PRICE_UKES_PER_UNIT };

/** Contingency added to every priced phase, as a fraction of its other lines. */
export const CONTINGENCY_PCT = 0.15;

/* ------------------------------------------------------------------ tranches */

export const TRANCHES = [
  {
    key: 'a',
    label: 'Tranche A',
    name: 'Bench, gates, app and one building',
    phases: ['poc-hardware', 'gates', 'app', 'pilot'],
    runwayMonths: [9, 12],
    unlocks:
      'Six demos passing on real hardware, a company that exists, counsel answers in writing, an app a tenant can install, and thirty consecutive days of paying tenants in one building.',
    milestone:
      "The pilot's exit condition in paper 13 section 4: thirty days with paying tenants and a per-unit price derived from the spec section 8 floor formula rather than the placeholder.",
    verify: [
      { label: 'Run the proofs', to: '/replay', text: 'The frame trace, the chain settlement and the kiosk journeys, replayed from the recorded runs.' },
      { label: 'Price the kit', to: '/shop', text: 'Every part line with the listing it was read on, ship-to Kenya, 2026-09-14.' },
      { label: 'Read the plan', to: '/docs/papers/13-roadmap', text: 'Paper 13, the phases with their entry and exit conditions.' },
    ],
  },
  {
    key: 'b',
    label: 'Tranche B',
    name: 'The compact board',
    phases: ['pcb'],
    runwayMonths: [6, 9],
    unlocks:
      'One printed circuit board with four populations replacing breakout modules with the bare silicon underneath them, passing the same six demos the breadboard passed.',
    milestone:
      'Paper 13 section 6: a schematic, a layout and a manufacturing brief in a state a contract manufacturer can quote against, plus written quotations for the two unpriced silicon lines.',
    verify: [
      { label: 'See the boards', to: '/blueprints', text: 'Schematics and board outlines as they stand today.' },
      { label: 'Read the board paper', to: '/docs/x-koin-beta/00-compact-board-concept', text: 'The four populations, the seven proof points and the cost target.' },
    ],
  },
  {
    key: 'c',
    label: 'Tranche C',
    name: 'Certification and a first run',
    phases: ['manufacture'],
    runwayMonths: [8, 12],
    unlocks:
      'Device certification, a settled tariff classification, and units landed in Nairobi at a known landed cost.',
    milestone:
      'Paper 13 section 7: units landed at a known cost with the import classification settled rather than assumed.',
    verify: [
      { label: 'See the factory brief', to: '/manufacturing', text: 'What a contract manufacturer is handed, and what it costs at volume.' },
      { label: 'Read the gates', to: '/docs/papers/11-regulatory-and-safety', text: 'Paper 11, the four regulators and the fifteen questions for counsel.' },
    ],
  },
];

/* -------------------------------------------------------------------- phases */

/**
 * The phase names are Martin's, so /startup and the landing roadmap agree. The
 * entry, exit and reversal text is paper 13. Where Martin's ordering differs
 * from paper 13's numbering, the phase carries `paper` saying so, because an
 * investor reading both should not have to reconcile them.
 */
export const PHASES = [
  {
    key: 'poc-software',
    n: 1,
    name: 'Proof of concept, software tests (simulated)',
    short: 'Software PoC',
    status: 'done',
    paper: 'Paper 13, section 2',
    plan: 'to 2026-09',
    months: null,
    tranche: null,
    entry: 'A protocol specification and a chain to settle on. Nothing to buy.',
    exit:
      'Every claim in the repository has a command that proves it: 28 forge tests including a 256-run solvency fuzz and a stolen-owner-key drill, 9 gateway tests, 11 protocol unit tests, scenarios S1 to S6, 75 firmware host checks, and a full loop on a real chain with a stranger-triggered founder payout.',
    backwards:
      'Nothing. These runs are reproducible from the repository and are the floor everything else stands on.',
    note:
      'Headline measurements out of those runs: a two-ticket settlement batch costs 191,698 gas, the protocol reached 9.768 Mbps against a 10 Mbps HomePlug model, failover to LoRa took about 0.8 seconds, and 0 of 20,000 garbage frames were accepted.',
    lines: [
      {
        id: 'sw-time',
        group: 'people',
        label: 'Founder time, contracts, gateway, protocol and the portable firmware core',
        low: 0,
        high: 0,
        confidence: 'verified',
        note: 'n1',
      },
      {
        id: 'sw-gas',
        group: 'cloud',
        label: 'Chain gas for the test runs',
        low: 0,
        high: 0,
        confidence: 'measured',
        note: 'n2',
      },
    ],
  },
  {
    key: 'poc-hardware',
    n: 2,
    name: 'Proof of concept, hardware tests',
    short: 'Hardware PoC',
    status: 'progress',
    paper: 'Paper 13, phase 1',
    plan: '2026 Q4 to 2027 Q1',
    months: [2, 4],
    tranche: 'a',
    entry: 'The parts arrive. That is the whole entry condition, and it is why the sourcing work came before the roadmap.',
    exit:
      'All six demos D1 to D6 pass on a bench, recorded on video, and four repository claims are confirmed or corrected against a measurement: the Satellite average current against the 40 mA design ceiling, the SX1262 registers carrying VERIFY tags, KQ-130F behaviour on a real mains segment, and HomePlug goodput on real wiring against the 10 Mbps model.',
    backwards:
      'Demo D5 failing on real wiring is the one that changes the product rather than the schedule, because the bulk plane is what separates this network from a mesh messenger. Demo D2 failing through 60 dB of loss sends the radio front end back for an external amplifier and a low-noise amplifier.',
    note:
      'Ten working days of bench time for one person once the kit lands. Day 1 is the gate: the ESP-IDF glue is written to the documented pin map and has never been compiled on a dev machine.',
    lines: [
      {
        id: 'hw-kit',
        group: 'hardware',
        label: 'Bare minimum kit, six device roles, every medium and basic journey',
        low: 26986,
        high: 26986,
        confidence: 'verified',
        note: 'n3',
      },
      {
        id: 'hw-ship',
        group: 'hardware',
        label: 'AliExpress shipping on the single parcel',
        low: 569,
        high: 569,
        confidence: 'verified',
        note: 'n3',
      },
      {
        id: 'hw-import',
        group: 'hardware',
        label: 'Import charges on the parcel: duty, VAT, the 2.25 percent declaration fee and the 1.5 percent railway levy',
        low: 3000,
        high: 6500,
        confidence: 'estimate',
        note: 'n4',
      },
      {
        id: 'hw-vat',
        group: 'hardware',
        label: 'VAT on the Nairobi HomePlug kit if it is charged',
        low: 0,
        high: 1440,
        confidence: 'derived',
        note: 'n5',
      },
      {
        id: 'hw-spares',
        group: 'hardware',
        label: 'Spares of the two parts most likely to fail on a bench, plus one dev board',
        low: 0,
        high: 3913,
        confidence: 'derived',
        note: 'n6',
      },
      {
        id: 'hw-safety',
        group: 'hardware',
        label: 'Bench safety: residual current device, fused strip, insulated tools',
        low: 1500,
        high: 4000,
        confidence: 'estimate',
        note: 'n7',
      },
      {
        id: 'hw-stage2',
        group: 'hardware',
        label: 'Stage two parts for demo D3, the transformer jump across a blocking filter',
        low: 0,
        high: 8000,
        confidence: 'estimate',
        note: 'n8',
      },
      {
        id: 'hw-bench-time',
        group: 'people',
        label: 'Ten working days of founder bench time',
        low: 0,
        high: 0,
        confidence: 'verified',
        note: 'n1',
      },
    ],
  },
  {
    key: 'pcb',
    n: 3,
    name: 'Prototyping custom PCB',
    short: 'Custom PCB',
    status: 'planned',
    paper: 'Paper 13, phase 4',
    plan: '2027 Q3 to Q4',
    months: [4, 7],
    tranche: 'b',
    entry:
      'Phase 2 exit met, and specifically the seven proof points the beta concept paper names as the things a breadboard has to settle before a printed circuit board is committed.',
    exit:
      'A board that passes the same six demos the breadboard passed, with the schematic, the layout and the manufacturing brief in a state a Shenzhen contract manufacturer can quote against.',
    backwards:
      'Two unpriced silicon lines. The QCA7005-class HomePlug part has no open distributor price and is normally sold under a design-in agreement; the ST7540 lists at USD 15.19 at quantity one and is out of stock, at which price the discrete route loses to the KQ-130F module outright.',
    note:
      "Paper 13 prints no figure for this phase on purpose, because an invented number would propagate into every later total. The lines below are this page's own estimates, flagged unquoted, so an investor can see the shape of the round. Each one is replaced by a written quotation before it is spent.",
    lines: [
      {
        id: 'pcb-design',
        group: 'pcb',
        label: 'Schematic capture, layout and design for manufacture, one board with four populations',
        low: 300000,
        high: 600000,
        confidence: 'unquoted',
        note: 'n9',
      },
      {
        id: 'pcb-fab',
        group: 'pcb',
        label: 'Bare boards and stencil, 30 pieces, four layers with a controlled-impedance radio section',
        low: 60000,
        high: 150000,
        confidence: 'unquoted',
        note: 'n10',
      },
      {
        id: 'pcb-parts',
        group: 'pcb',
        label: 'Components for 30 Node and 30 Satellite populations at engineering-run pricing',
        usd: [4400, 7700],
        confidence: 'derived',
        note: 'n11',
      },
      {
        id: 'pcb-assembly',
        group: 'pcb',
        label: 'Assembly setup and surface-mount run for 60 populations',
        low: 80000,
        high: 200000,
        confidence: 'unquoted',
        note: 'n10',
      },
      {
        id: 'pcb-spin',
        group: 'pcb',
        label: 'One design spin allowance',
        low: 150000,
        high: 400000,
        confidence: 'estimate',
        note: 'n12',
      },
      {
        id: 'pcb-instruments',
        group: 'hardware',
        label: 'Bench instruments: logic analyser, bench supply, spectrum analyser access',
        low: 40000,
        high: 120000,
        confidence: 'estimate',
        note: 'n13',
      },
      {
        id: 'pcb-silicon',
        group: 'pcb',
        label: 'QCA7005-class HomePlug silicon and the ST7540 narrowband part',
        confidence: 'unpriced',
        note: 'n14',
      },
    ],
  },
  {
    key: 'manufacture',
    n: 4,
    name: 'Manufacturing',
    short: 'Manufacturing',
    status: 'planned',
    paper: 'Paper 13, phase 5',
    plan: '2028 Q1 onward',
    months: [4, 8],
    tranche: 'c',
    entry:
      'Phase 3 exit met, the device gates in phase 6 cleared, and a written quotation against the manufacturing brief.',
    exit:
      'Units landed in Nairobi at a known landed cost, with the import classification settled rather than assumed.',
    backwards:
      'Kenyan duty classification is open and moves the landed Node cost by about USD 15, because a finished radio transceiver in an enclosure is a different tariff argument from a bare module.',
    note:
      'Local factory or outsourced assembly is a decision for this phase, not before it. Firmware and protocol resilience work is in house and runs through the phase rather than after it.',
    lines: [
      {
        id: 'mf-firmware',
        group: 'people',
        label: 'In-house firmware and protocol resilience, two engineer quarters',
        low: 900000,
        high: 1800000,
        confidence: 'unquoted',
        note: 'n9',
      },
      {
        id: 'mf-cert',
        group: 'certification',
        label: 'Certification: KEBS mains device approval and an ILAC-accredited laboratory test report',
        low: 250000,
        high: 900000,
        confidence: 'unquoted',
        note: 'n15',
      },
      {
        id: 'mf-brief',
        group: 'legal',
        label: 'Manufacturing brief, tariff classification opinion and a customs agent',
        low: 60000,
        high: 150000,
        confidence: 'unquoted',
        note: 'n16',
      },
      {
        id: 'mf-tooling',
        group: 'pcb',
        label: 'Tooling: enclosure mould or a CNC first article',
        low: 150000,
        high: 600000,
        confidence: 'unquoted',
        note: 'n10',
      },
      {
        id: 'mf-run',
        group: 'hardware',
        label: 'First run, 200 Nodes and 300 Satellites, ex-works',
        usd: [17900, 24165],
        confidence: 'derived',
        note: 'n17',
      },
      {
        id: 'mf-landing',
        group: 'hardware',
        label: 'Freight and Kenyan import charges on the first run',
        usd: [1790, 6041],
        confidence: 'estimate',
        note: 'n18',
      },
    ],
  },
  {
    key: 'pilot',
    n: 5,
    name: 'Pilot building',
    short: 'Pilot building',
    status: 'blocked',
    blockedOn: 'Martin, for a landlord who has said yes, and counsel, for the first written opinion.',
    paper: 'Paper 13, phase 2',
    paperNote:
      'Paper 13 orders this as its phase 2, ahead of the board, because the price decision it produces gates everything after it.',
    plan: '2027 Q2',
    months: [3, 5],
    tranche: 'a',
    entry:
      "Phase 2 exit met, plus four things that are not engineering: a company that exists, a landlord who has said yes, counsel's first written opinion, and the companion app in a state a tenant can install.",
    exit:
      'Thirty consecutive days with paying tenants, and five numbers that did not exist before: measured backhaul cost in KES per MB, the proxy cache hit rate, the real per-node capital and monthly operating cost against the design suite KES 29,050 and KES 3,850, the session credit limit that produced no underpaid operator, and a per-unit price derived from the floor formula rather than the 500 micro-KES placeholder.',
    backwards:
      'A price that cannot clear measured backhaul cost plus the Jenga and Daraja transaction charges. Those fiat charges are tens to hundreds of times the chain gas per operation, and chain gas is not the cost centre anyone expected it to be.',
    note:
      'One building. One Node in the meter room, three relays on the risers, about ten paying tenants. The landlord gives socket space, a mounting point, permission and one caretaker with a key, and in exchange becomes the node operator keeping 95 percent of every settled byte. Thirty days, no setup bill, no lock-in, either side ends it with thirty days notice.',
    lines: [
      {
        id: 'pl-field',
        group: 'hardware',
        label: 'Field hardware, one Node and three relays',
        low: 29050,
        high: 29050,
        confidence: 'derived',
        note: 'n19',
      },
      {
        id: 'pl-spare',
        group: 'hardware',
        label: 'One spare relay and consumables',
        low: 0,
        high: 15000,
        confidence: 'estimate',
        note: 'n20',
      },
      {
        id: 'pl-opex',
        group: 'pilot',
        label: 'Operating cost, backhaul and power, three months',
        low: 11550,
        high: 11550,
        confidence: 'derived',
        note: 'n19',
      },
      {
        id: 'pl-install',
        group: 'pilot',
        label: 'Site survey, installation, cabling and enclosures',
        low: 20000,
        high: 60000,
        confidence: 'estimate',
        note: 'n20',
      },
      {
        id: 'pl-incentive',
        group: 'pilot',
        label: 'Caretaker stipend and tenant onboarding incentives, thirty days',
        low: 15000,
        high: 45000,
        confidence: 'estimate',
        note: 'n21',
      },
      {
        id: 'pl-measure',
        group: 'pilot',
        label: 'Bulk bundles bought at retail so backhaul cost per MB can be measured',
        low: 9000,
        high: 18000,
        confidence: 'estimate',
        note: 'n22',
      },
      {
        id: 'pl-fiat',
        group: 'pilot',
        label: 'Mobile money charges on pilot volume',
        low: 3000,
        high: 12000,
        confidence: 'estimate',
        note: 'n23',
      },
      {
        id: 'pl-gas',
        group: 'cloud',
        label: 'Chain gas at pilot volume, three months',
        low: 720,
        high: 720,
        confidence: 'derived',
        note: 'n24',
      },
      {
        id: 'pl-vps',
        group: 'cloud',
        label: 'gateway-api virtual private server, domain and backups, three months',
        usd: [36, 90],
        confidence: 'estimate',
        note: 'n25',
      },
    ],
  },
  {
    key: 'gates',
    n: 6,
    name: 'Regulatory and corporate gates',
    short: 'Regulatory gates',
    status: 'progress',
    blockedOn: 'Counsel, then the Communications Authority, KEBS and the Central Bank of Kenya.',
    paper: 'Paper 13, phase 3',
    paperNote:
      'Paper 13 calls these gates rather than a phase that waits its turn. Each one blocks a specific later action and the work on it starts now.',
    plan: 'runs alongside phases 2 to 5',
    months: [3, 9],
    tranche: 'a',
    entry:
      'None. The standing brief in docs/ops/regulatory-brief.md carries fifteen numbered questions in the form a lawyer can answer. Sending it is the cheapest item on the roadmap and it gates the three most expensive ones.',
    exit:
      'Ten gates answered in writing: 868 MHz short-range-device rules, type-approval exemption evidence, power-line carrier at 120 to 135 kHz, KEBS mains device certification, transit resale licensing, the legal character of XKN, anti-money-laundering and know-your-customer, tax treatment, company and merchant agreements, and a 2-of-3 Safe owning the contracts.',
    backwards:
      'A licence category whose fee or obligations make a community network uneconomic, or a Central Bank answer that needs an authorisation rather than a partner bank holding the float.',
    note:
      'Three of the ten gates carry no number in this repository, because no fee has been published or quoted. They are listed as unpriced rather than guessed, and they are the reason the top of this phase is open-ended.',
    lines: [
      {
        id: 'gt-counsel',
        group: 'legal',
        label: "Counsel's first written opinion against the fifteen numbered questions",
        low: 150000,
        high: 400000,
        confidence: 'unquoted',
        note: 'n26',
      },
      {
        id: 'gt-company',
        group: 'legal',
        label: 'Company incorporation, CR12 and director documents for Jenga live onboarding',
        low: 25000,
        high: 60000,
        confidence: 'estimate',
        note: 'n27',
      },
      {
        id: 'gt-accounting',
        group: 'legal',
        label: 'Accounting, tax registration and statutory filings, first year',
        low: 30000,
        high: 90000,
        confidence: 'estimate',
        note: 'n28',
      },
      {
        id: 'gt-safe',
        group: 'cloud',
        label: 'Mainnet deployment and a 2-of-3 Safe as contract owner',
        low: 10,
        high: 30,
        confidence: 'derived',
        note: 'n29',
      },
      {
        id: 'gt-licence',
        group: 'certification',
        label: 'Communications Authority licence category application and first-year fee',
        confidence: 'unpriced',
        note: 'n30',
      },
      {
        id: 'gt-kebs',
        group: 'certification',
        label: 'KEBS certification of a device that couples to 230 V in customer premises',
        confidence: 'unpriced',
        note: 'n31',
      },
      {
        id: 'gt-typeapproval',
        group: 'certification',
        label: 'Type-approval exemption evidence: a test report from an ILAC-accredited laboratory',
        confidence: 'unpriced',
        note: 'n32',
      },
    ],
  },
  {
    key: 'app',
    n: 7,
    name: 'Companion app MVP',
    short: 'Companion app',
    status: 'planned',
    paper: 'Paper 13, phase 2 entry',
    plan: '2027 Q1 to Q2',
    months: [3, 4],
    tranche: 'a',
    entry:
      'Phase 1 exit met. The scope is already fixed: one seed in the Android Keystore, two derived keys, balance, buy, auto-sign, send, withdraw. Kotlin, Android first.',
    exit:
      'A tenant can install it, buy with M-Pesa or Equitel, browse, and withdraw an unspent deposit. Journeys J2, J3, J5 and J10 demonstrated end to end.',
    backwards:
      'Key handling. The seed is the balance, so a restore path that loses it loses the user money. That makes the security review a gate rather than a nicety.',
    note:
      'Paper 13 section 8 names one developer quarter for this app as one of three unpriced lines that dominate the pilot funding range and make its top nearly four times its bottom. It is the largest single item in the first tranche.',
    lines: [
      {
        id: 'ap-dev',
        group: 'people',
        label: 'Android engineer, Kotlin, one quarter',
        low: 600000,
        high: 1200000,
        confidence: 'unquoted',
        note: 'n9',
      },
      {
        id: 'ap-devices',
        group: 'hardware',
        label: 'Test fleet, three Android handsets across the range tenants actually carry',
        low: 45000,
        high: 90000,
        confidence: 'estimate',
        note: 'n33',
      },
      {
        id: 'ap-store',
        group: 'cloud',
        label: 'Play Store developer account, one off',
        usd: [25, 25],
        confidence: 'verified',
        note: 'n34',
      },
      {
        id: 'ap-review',
        group: 'certification',
        label: 'Third-party review of key handling and the restore path before mainnet fiat',
        low: 0,
        high: 250000,
        confidence: 'unquoted',
        note: 'n35',
      },
    ],
  },
  {
    key: 'kiosk',
    n: 8,
    name: 'Kiosk network',
    short: 'Kiosk network',
    status: 'blocked',
    blockedOn: 'Martin. xkoinkiosk.com is scoped in the next session.',
    paper: 'Not yet in the paper set',
    plan: 'after the pilot',
    months: null,
    tranche: null,
    entry: 'A scoping session for xkoinkiosk.com. It has not happened, so this phase carries no lines and no figure.',
    exit: 'Not scoped. Writing an exit condition before the scope exists would be a guess dressed as a plan.',
    backwards: 'Not scoped.',
    note:
      'The kiosk is the fiat on-ramp that already exists as a gateway-api route. Turning it into a network of retail points is a business question rather than a protocol one, and it is the next thing to be written down.',
    lines: [],
  },
  {
    key: 'scale',
    n: 9,
    name: 'Scale',
    short: 'Scale',
    status: 'planned',
    paper: 'Beyond paper 13',
    plan: 'after manufacturing',
    months: null,
    tranche: null,
    entry: 'Manufacturing exit met, units landed at a known cost, and the protocol break-even building count in sight.',
    exit:
      'The treasury 5 percent share covers the cost of running the protocol without a raise. The building count that reaches it is computed on this page from the current price placeholder and moves with the price decision.',
    backwards:
      'The per-unit price. Every building added multiplies the same margin, so a price that does not clear its costs does not get better with scale, it gets worse faster.',
    note:
      'Funded from revenue and from a later round. No lines are priced here, because the inputs that would price them are exactly what the pilot measures.',
    lines: [],
  },
];

/* ----------------------------------------------------------------- footnotes */

export const NOTES = [
  {
    id: 'n1',
    text:
      'Founder time is not costed in cash anywhere on this page. It is stated so that a reader does not mistake a zero for free work.',
  },
  {
    id: 'n2',
    text:
      'The test runs settle on a local anvil chain, which costs nothing. Paper 04 section 9 measured the same work against public Base gas on 2026-09-09: 191,698 gas to settle a one-ticket batch, which was 0.35 KES, and 4,207,312 gas to deploy all three contracts plus setBridge, which was 7.7 KES.',
  },
  {
    id: 'n3',
    text:
      'hardware/shopping/mvp-kit.json and mvp-sourcing.md. Every line was read on its listing on 2026-09-14 with the variant selected and ship-to set to Kenya. The same figures drive /shop, so the two pages cannot disagree. Excludes import charges, which are the next line.',
  },
  {
    id: 'n4',
    text:
      'Estimate. The AliExpress half of the parcel is about KES 16,500 of declared value; Kenyan charges are duty at a classification that has not been ruled on, VAT, the 2.25 percent import declaration fee and the 1.5 percent railway development levy. Paper 13 section 8 puts the same charges at the top of its range A rather than pricing them, and no customs entry has been filed.',
  },
  {
    id: 'n5',
    text:
      'Derived: 16 percent of the KES 9,000 TL-WPA4220KIT bought in Nairobi. Whether VAT is charged separately or already in the shelf price was not confirmed on the day, so the low column carries zero.',
  },
  {
    id: 'n6',
    text:
      'Derived from the verified listing prices: one E22-900M22S at 556, one KQ-130F at 2,608 and one ESP32-S3-DevKitC at 749. Paper 13 section 8 says what the top of range A buys over the bottom is spares of the radio and the narrowband module, which are the two parts most likely to fail on a bench.',
  },
  {
    id: 'n7',
    text:
      'Estimate. hardware/bom.md lists the bench safety items as non-negotiable for mains work and paper 11 section 6 makes the residual current device a bench rule, but no listing was scouted for any of them.',
  },
  {
    id: 'n8',
    text:
      'Estimate from the stage_two block in hardware/shopping/mvp-kit.json: a third ESP32-S3, a second SX1262 module, a third KQ-130F, the plain HomePlug pair and the mains blocking filter. Demo D3 is the only demo the bare minimum kit cannot run.',
  },
  {
    id: 'n9',
    text:
      'Unquoted. The repository holds no rate card, no engagement letter and no offer. The band is a placeholder for scoping the round and is replaced by a written quotation before anything is spent. It reads as roughly KES 200,000 to KES 400,000 a month for a mid-level engineer in Nairobi, which is an assumption, not a market survey.',
  },
  {
    id: 'n10',
    text:
      'Unquoted. Paper 13 section 6 gives unit costs at 1,000 units and deliberately prints no non-recurring engineering, tooling or certification figure, because none has been quoted. These lines exist so the round has a shape; the manufacturing brief in docs/x-koin-beta/ is the document that turns them into quotations.',
  },
  {
    id: 'n11',
    text:
      'Derived from paper 13 section 6: the beta concept paper derives USD 50.24 for a Node and USD 23.31 for a Satellite at 1,000 units ex-works China. Thirty of each is USD 2,206 at that pricing; an engineering run of twenty to fifty boards is taken here at two to three and a half times unit pricing, which is the assumption in this line and not a quotation.',
  },
  {
    id: 'n12',
    text:
      'Estimate. One board spin between first article and a board that passes the six demos is normal rather than pessimistic. The allowance is a fraction of the design and fabrication lines above it.',
  },
  {
    id: 'n13',
    text:
      'Estimate. A logic analyser and a bench supply are bought; spectrum analyser access is more likely hired or borrowed than bought, which is why the band is wide.',
  },
  {
    id: 'n14',
    text:
      'Unpriced on purpose. Paper 13 section 6: the QCA7005 has no open distributor price and Qualcomm networking silicon of that class is normally sold under a design-in agreement; the ST7540 is listed at USD 15.19 at quantity one and out of stock, at which price the discrete route loses to the KQ-130F module outright. A written quotation for both is the first procurement action after the hardware proof of concept closes.',
  },
  {
    id: 'n15',
    text:
      'Unquoted. Paper 11 section 2 records that the Communications Authority 2022 guidelines require a test report from an ILAC-accredited laboratory on request, and paper 13 section 5 lists KEBS certification as a gate on field use of any device that couples to 230 V. No fee for either is published in this repository and neither has been asked for.',
  },
  {
    id: 'n16',
    text:
      'Unquoted. Paper 13 section 7: Kenyan duty classification is open and moves the landed Node cost by about USD 15, because a finished radio transceiver in an enclosure is a different tariff argument from a bare module. This line buys the opinion that settles it.',
  },
  {
    id: 'n17',
    text:
      'Derived from paper 13 section 6 cost targets of USD 52 for a Node and USD 25 for a Satellite at 1,000 units, ex-works China, board and enclosure included, before freight and Kenyan import charges. A first run of 200 Nodes and 300 Satellites is USD 17,900 at target pricing; the high column applies a factor of 1.35 because a 500-unit run does not reach 1,000-unit pricing.',
  },
  {
    id: 'n18',
    text:
      'Estimate at 10 to 25 percent of the ex-works value, the spread being exactly the open tariff classification in paper 13 section 7. At 200 Nodes an unfavourable ruling is about USD 3,000 on its own.',
  },
  {
    id: 'n19',
    text:
      "Paper 13 section 8 and paper 01 section 5, quoting the design suite urban model: KES 29,050 of capital cost for one Node and three relays, and KES 3,850 a month of operating cost. Both are conditional on that model's component lines, and replacing both with measured figures is one of the five things the pilot exists to produce. Paper 01 section 5 also flags that the field-kit total in hardware/bom.md is on a different basis and needs reconciling before either number is used in a pitch.",
  },
  {
    id: 'n20',
    text:
      'Estimate. No installation has been done and no quotation exists. The band covers a walk-up block of the size the design suite models.',
  },
  {
    id: 'n21',
    text:
      'Estimate. Paper 13 section 4: the landlord gives socket space, a mounting point, permission and one caretaker who holds a key, and pays no setup bill. This line is what that caretaker and the first tenants are worth paying for thirty days.',
  },
  {
    id: 'n22',
    text:
      'Estimate. The pilot exit requires a measured backhaul cost in KES per MB, which means buying the bulk bundle at retail for three months and metering what it delivers against the proxy cache hit rate.',
  },
  {
    id: 'n23',
    text:
      'Estimate. Paper 04 section 9: every shilling entering through Jenga carries a Finserve charge and every payout carries another, and the documented sample shows 1 KES on a 2 KES payment. These charges are tens to hundreds of times the chain gas per operation. The exact tariff is not in this repository, so the band is wide.',
  },
  {
    id: 'n24',
    text:
      'Derived from paper 13 section 8: chain gas is negligible and measured, at about 8 KES a day at pilot volume, which is about KES 720 over three months. Paper 04 section 9 has the per-operation figures behind it.',
  },
  {
    id: 'n25',
    text:
      'Estimate. gateway-api needs one small virtual private server with a domain and backups. No invoice exists; the band is a modest box at the bottom and a larger one with off-site backups at the top.',
  },
  {
    id: 'n26',
    text:
      "Unquoted. Paper 13 section 8 lists counsel's first written opinion as one of three unpriced lines that dominate the pilot range, and section 9 notes it gates three separate rows while being the cheapest item on the roadmap. docs/ops/regulatory-brief.md holds the fifteen questions; no firm has quoted against them.",
  },
  {
    id: 'n27',
    text:
      'Estimate. Paper 13 section 5: Jenga live onboarding needs a certificate of incorporation, a current CR12 and director identity documents, and the company must exist before that step.',
  },
  {
    id: 'n28',
    text:
      'Estimate. A company that holds customer float files statutory returns from day one. No accountant has quoted.',
  },
  {
    id: 'n29',
    text:
      'Derived from paper 04 section 9: 4,207,312 gas deployed all three contracts plus setBridge for 7.7 KES on 2026-09-09 Base pricing. A 2-of-3 Safe is a small multiple of one of those deploys. The whole on-chain corporate structure costs less than a matatu fare, which is the point: the expensive parts of this phase are lawyers and regulators, not the chain.',
  },
  {
    id: 'n30',
    text:
      'Unpriced. Paper 11 section 4: the licence category is not chosen. The candidates are Network Facilities Provider Tier 3, Application Service Provider and the community networks framework the Authority has discussed since 2021, and each carries a different fee, obligations and timeline. Counsel questions 6 and 7 decide it.',
  },
  {
    id: 'n31',
    text:
      'Unpriced. Paper 11 section 3, counsel question 5, asks whether a device that couples to 230 V mains needs KEBS certification before field use in customer homes, independent of any radio question. Until that is answered there is nothing to price.',
  },
  {
    id: 'n32',
    text:
      'Unpriced. Paper 11 section 2, counsel question 3, asks whether a test report from the module manufacturer suffices under section 4.1 of the 2022 guidelines, or whether the assembled xKoin device must be tested. The two answers differ by an order of magnitude and the repository will not guess which applies.',
  },
  {
    id: 'n33',
    text:
      'Estimate. Three handsets across the price range tenants actually carry, because the app has to work on the cheap one.',
  },
  {
    id: 'n34',
    text:
      'Verified: the Google Play developer registration fee is a one-off USD 25.',
  },
  {
    id: 'n35',
    text:
      'Unquoted. Paper 10 sets out the key blast radii and the contracts already hold the founder-safety properties, but no third-party review has been commissioned or quoted. The low column is zero because the review is a decision, not a commitment.',
  },
  {
    id: 'n36',
    text:
      'Contingency is computed at 15 percent of the other priced lines in the same phase, not typed in. It covers the parts of a phase nobody listed, which on a hardware project is most often a part that arrives dead and a week that arrives late.',
  },
];

/* -------------------------------------------------------- budget line groups */

export const GROUPS = [
  { key: 'hardware', label: 'Hardware kits and spares' },
  { key: 'pcb', label: 'PCB, tooling and prototype runs' },
  { key: 'certification', label: 'Certification and registration' },
  { key: 'legal', label: 'Legal and corporate' },
  { key: 'pilot', label: 'Pilot building and field costs' },
  { key: 'cloud', label: 'Cloud, VPS and chain gas' },
  { key: 'people', label: 'Salaries and contractor time' },
  { key: 'contingency', label: 'Contingency' },
];

/* -------------------------------------------------------------- computations */

/** A line resolved into shillings, keeping its foreign amount if it had one. */
export function resolveLine(line) {
  if (line.confidence === 'unpriced') {
    return { ...line, low: null, high: null, priced: false };
  }
  if (line.usd) {
    return {
      ...line,
      low: usdToKes(line.usd[0]),
      high: usdToKes(line.usd[1]),
      priced: true,
    };
  }
  return { ...line, priced: true };
}

/**
 * A phase budget: every line resolved into shillings, a computed contingency
 * line appended when anything is priced, and low and high summed from the
 * lines. No total anywhere in this file is written by hand.
 */
export function phaseBudget(phase) {
  const resolved = phase.lines.map(resolveLine);
  const priced = resolved.filter((line) => line.priced);
  const subtotalLow = priced.reduce((sum, line) => sum + line.low, 0);
  const subtotalHigh = priced.reduce((sum, line) => sum + line.high, 0);
  const lines = [...resolved];

  if (subtotalHigh > 0) {
    lines.push({
      id: `${phase.key}-contingency`,
      group: 'contingency',
      label: `Contingency at ${Math.round(CONTINGENCY_PCT * 100)} percent of the lines above`,
      low: Math.round(subtotalLow * CONTINGENCY_PCT),
      high: Math.round(subtotalHigh * CONTINGENCY_PCT),
      confidence: 'derived',
      note: 'n36',
      priced: true,
    });
  }

  const all = lines.filter((line) => line.priced);
  return {
    lines,
    low: all.reduce((sum, line) => sum + line.low, 0),
    high: all.reduce((sum, line) => sum + line.high, 0),
    unpricedCount: resolved.filter((line) => !line.priced).length,
  };
}

/** Group subtotals for one phase, in GROUPS order, skipping empty groups. */
export function phaseByGroup(phase) {
  const { lines } = phaseBudget(phase);
  return GROUPS.map((group) => {
    const members = lines.filter((line) => line.priced && line.group === group.key);
    return {
      ...group,
      low: members.reduce((sum, line) => sum + line.low, 0),
      high: members.reduce((sum, line) => sum + line.high, 0),
    };
  }).filter((group) => group.high > 0);
}

/** Every phase with a priced budget, in page order. */
export function pricedPhases() {
  return PHASES.map((phase) => ({ phase, budget: phaseBudget(phase) })).filter(
    (row) => row.budget.high > 0,
  );
}

/** A tranche total, summed from the phases it funds. */
export function trancheTotal(tranche) {
  const phases = PHASES.filter((phase) => tranche.phases.includes(phase.key));
  return phases.reduce(
    (acc, phase) => {
      const budget = phaseBudget(phase);
      return {
        low: acc.low + budget.low,
        high: acc.high + budget.high,
        unpricedCount: acc.unpricedCount + budget.unpricedCount,
        phases: [...acc.phases, phase],
      };
    },
    { low: 0, high: 0, unpricedCount: 0, phases: [] },
  );
}

/** Every tranche summed, which is the whole path to a first production run. */
export function wholePathTotal() {
  return TRANCHES.reduce(
    (acc, tranche) => {
      const total = trancheTotal(tranche);
      return {
        low: acc.low + total.low,
        high: acc.high + total.high,
        unpricedCount: acc.unpricedCount + total.unpricedCount,
      };
    },
    { low: 0, high: 0, unpricedCount: 0 },
  );
}

/* --------------------------------------------------------- the revenue model */

/**
 * One building, stated as assumptions rather than as a forecast. Each field
 * names where it came from; the two that decide everything are the price, which
 * is a placeholder, and the tenant spend, which is what a daily-pass buyer
 * already pays today rather than what we would like them to pay.
 */
export const REVENUE = {
  tenantsPerBuilding: 10,
  nodesPerBuilding: 4,
  tenantSpendKes: 600,
  capexKes: 29050,
  opexKes: 3850,
  feePct: 0.05,
  protocolFixedLow: 60000,
  protocolFixedHigh: 120000,
};

export const REVENUE_ASSUMPTIONS = [
  {
    label: 'Price',
    value: `${PRICE_UKES_PER_UNIT} micro-KES per 10 KB unit, which is ${KES_PER_MB} KES per MB or ${fmtKes(KES_PER_MB * 1000)} per GB`,
    basis:
      'The placeholder in paper 04 section 10, deferred until it clears measured backhaul cost through the spec section 8 floor formula. Every figure in the table below is conditional on it.',
  },
  {
    label: 'Paying tenants per building',
    value: `${REVENUE.tenantsPerBuilding}`,
    basis: 'The design suite urban model in paper 13 section 4: one Node in the meter room, three relays on the risers, about ten paying tenants.',
  },
  {
    label: 'Tenant spend',
    value: `${fmtKes(REVENUE.tenantSpendKes)} a month`,
    basis:
      'Deliberately conservative. Paper 01 section 2 records a Safaricom Tunukiwa daily pass at KES 20 for 250 MB, so KES 600 a month is what a daily-pass buyer already spends. The design suite assumes KES 1,000, which this page does not use.',
  },
  {
    label: 'Operator share',
    value: `${Math.round((1 - REVENUE.feePct) * 100)} percent of every settled byte`,
    basis: 'A contract constant with the fee hard-capped at 10 percent on chain, proven by test_revert_feeAboveCeiling.',
  },
  {
    label: 'Operator capital and running cost',
    value: `${fmtKes(REVENUE.capexKes)} once, ${fmtKes(REVENUE.opexKes)} a month`,
    basis: "The design suite urban model quoted in paper 13 section 8 and paper 01 section 5, conditional on that model's component lines.",
  },
];

/** One building for one month, every figure computed from REVENUE. */
export function buildingMonth() {
  const gross = REVENUE.tenantsPerBuilding * REVENUE.tenantSpendKes;
  const mb = gross / KES_PER_MB;
  const treasury = gross * REVENUE.feePct;
  const operator = gross - treasury;
  const operatorNet = operator - REVENUE.opexKes;
  return {
    gross,
    mb,
    treasury,
    operator,
    operatorNet,
    breakEvenMonth: operatorNet > 0 ? Math.ceil(REVENUE.capexKes / operatorNet) : null,
  };
}

/** The 1, 10 and 100 building scenarios, multiplied out from one building. */
export function scenarios(counts = [1, 10, 100]) {
  const one = buildingMonth();
  return counts.map((buildings) => ({
    buildings,
    nodes: buildings * REVENUE.nodesPerBuilding,
    tenants: buildings * REVENUE.tenantsPerBuilding,
    mb: one.mb * buildings,
    gross: one.gross * buildings,
    operator: one.operator * buildings,
    treasury: one.treasury * buildings,
    operatorNet: one.operatorNet * buildings,
    capex: REVENUE.capexKes * buildings,
    breakEvenMonth: one.breakEvenMonth,
  }));
}

/**
 * How many buildings the treasury 5 percent share has to carry before it covers
 * a lean Nairobi operation. Computed, not asserted, and it moves with the price.
 */
export function protocolBreakEven() {
  const one = buildingMonth();
  return {
    low: Math.ceil(REVENUE.protocolFixedLow / one.treasury),
    high: Math.ceil(REVENUE.protocolFixedHigh / one.treasury),
    perBuilding: one.treasury,
    fixedLow: REVENUE.protocolFixedLow,
    fixedHigh: REVENUE.protocolFixedHigh,
  };
}

/* ------------------------------------------------------------------- risks */

export const RISKS = [
  {
    kind: 'Regulatory',
    risk: 'Type approval. The firmware ships at +22 dBm, about 158 mW, roughly six times the 25 mW ceiling for the 868.0 to 868.6 MHz sub-band, and a gateway carrying paid traffic all day cannot live inside a 1 percent duty cycle.',
    mitigation:
      'Both are firmware settings, not hardware limits. Three options are already written down: cap transmit power and keep 868.1 MHz, implement listen-before-talk with adaptive frequency agility, or move bulk traffic to 869.4 to 869.65 MHz where 500 mW and 10 percent apply.',
    doc: '/docs/papers/11-regulatory-and-safety',
    docLabel: 'Paper 11, section 2',
  },
  {
    kind: 'Regulatory',
    risk: 'Payments licensing. Whether XKN is e-money under the National Payment System Act, a prepaid service credit, or a virtual asset under the Virtual Asset Service Providers Act 2025 is unanswered, and the answer decides whether an authorisation or a partner bank is needed for the float.',
    mitigation:
      'The partner route is the default rather than the fallback: a bank or a mobile money partner holds the float while the question is settled, which is why the on-ramp already runs through Daraja and Jenga rather than a wallet of our own. Counsel questions 8 to 11 are drafted and waiting to be sent.',
    doc: '/docs/papers/11-regulatory-and-safety',
    docLabel: 'Paper 11, section 5',
  },
  {
    kind: 'Regulatory',
    risk: 'Transit resale. Selling connectivity to third parties may need a licence whose category, fee and obligations are not chosen, and the mobile operator terms may not permit onward resale at all.',
    mitigation:
      'Nothing is offered to a customer before the answer. The pilot is structured so the landlord is the node operator keeping 95 percent, not a reseller of their own bandwidth, because the regulatory position of the two is different and the pitch says so.',
    doc: '/docs/papers/11-regulatory-and-safety',
    docLabel: 'Paper 11, section 4',
  },
  {
    kind: 'Technical',
    risk: 'Mains power-line carrier on real risers. The 9.768 Mbps figure is against a 10 Mbps HomePlug model in simulation. No xKoin frame has crossed a real mains riser, and demo D5 is where that claim meets a building.',
    mitigation:
      'D5 is the gate rather than a hope, and it runs on a bench before it runs in a building. If it fails the product changes rather than the schedule: the free local plane and the LoRa survival plane still work, and the narrowband receipt plane is independent of the bulk plane by design.',
    doc: '/docs/papers/12-proof-of-concept-plan',
    docLabel: 'Paper 12, demo D5',
  },
  {
    kind: 'Technical',
    risk: 'LoRa duty cycle. Every pages-per-hour figure in the protocol paper is computed at 1 percent and is unverified for Kenya until counsel confirms which instrument is operative.',
    mitigation:
      'Listen-before-talk with adaptive frequency agility removes the duty-cycle ceiling and the SX1262 is capable of it. Failing that, the bulk traffic moves sub-band. Demo D2 through two 30 dB attenuators is what tells us how much link budget there is to spend on the choice.',
    doc: '/docs/papers/11-regulatory-and-safety',
    docLabel: 'Paper 11, section 2',
  },
  {
    kind: 'Market',
    risk: "Landlord adoption. One landlord saying yes is a hard entry condition on the pilot, and a landlord who fears for their wiring or their tenants' equipment says no.",
    mitigation:
      'The ask is deliberately small: socket space, a mounting point, permission and one caretaker with a key. Thirty days, no setup bill, no lock-in, either side ends it with thirty days notice. The mains coupling is done through certified commodity adapters rather than a custom mains circuit, which is the specific thing a landlord is worried about.',
    doc: '/docs/potential/02-apartment-estates',
    docLabel: 'Apartment estates',
  },
  {
    kind: 'Market',
    risk: 'The price. At the placeholder of KES 50 per GB the network is barely cheaper than an Airtel daily pack at KES 40 per GB, and five times the KES 10 target the design suite models.',
    mitigation:
      'The pilot exists to replace the placeholder with a price derived from measured backhaul cost and the measured proxy cache hit rate through the floor formula. It is the single most consequential open decision in the project and this page does not pretend it is settled.',
    doc: '/docs/papers/04-settlement-and-economics',
    docLabel: 'Paper 04, section 10',
  },
  {
    kind: 'Founder',
    risk: 'Key management. One person holds the kiosk root key, the bridge hot key and the contract owner key, and a founder who loses or leaks any of them is a single point of failure.',
    mitigation:
      'The contracts are written so that the founder cannot hurt the users and a thief cannot hurt the founder. Treasury claim takes no destination parameter, so a stolen owner key cannot redirect a single micro-KES. Changing the beneficiary takes a seven-day public timelock the current beneficiary can veto. Bridge burn is self-only and mint is capped per rolling day. A 2-of-3 Safe owns the contracts before any mainnet deployment.',
    doc: '/docs/papers/10-security-and-trust',
    docLabel: 'Paper 10',
  },
];

/* --------------------------------------------------------------- team, asks */

export const TEAM = {
  founder: {
    name: 'Martin Thuku',
    role: 'Founder. Protocol, contracts, gateway, firmware and hardware sourcing.',
    evidence:
      'Everything in the proof matrix was built and proven by one person: three contracts with 28 forge tests, a gateway with its external calls mocked, a protocol reference with six passing scenarios, a portable firmware core with 75 host checks, and a full loop settled on a real chain.',
  },
  hires: [
    {
      role: 'Android engineer, Kotlin',
      when: 'Tranche A, first hire',
      monthly: [200000, 400000],
      months: [3, 3],
      duration: '3 months',
      why: 'The companion app is the largest single item in the first tranche and a hard entry condition on the pilot. Journeys J2, J3, J5 and J10 cannot be demonstrated without it.',
      note: 'n9',
    },
    {
      role: 'Embedded hardware engineer, PCB and RF',
      when: 'Tranche B',
      monthly: [200000, 350000],
      months: [2, 3],
      duration: '2 to 3 months',
      why: 'Schematic, layout and design for manufacture on one board with four populations, then the bring-up that re-runs the six demos on it.',
      note: 'n9',
    },
    {
      role: 'Field operations and landlord relations',
      when: 'Tranche A, during the pilot',
      monthly: [60000, 120000],
      months: [4, 4],
      duration: '4 months, part time',
      why: 'One building, one landlord, ten tenants and a caretaker, for thirty consecutive days. This is the role that produces the five numbers the pilot exists for.',
      note: 'n9',
    },
    {
      role: 'Counsel, fixed fee',
      when: 'Tranche A, immediately',
      oneOff: [150000, 400000],
      duration: 'one opinion',
      why: 'The fifteen numbered questions in the standing brief. The cheapest item on the roadmap and it gates the three most expensive ones.',
      note: 'n26',
    },
  ],
  asks: [
    {
      ask: 'A pilot building',
      detail:
        'A walk-up block of roughly 12 to 40 flats in Roysambu, Kasarani, Westlands or Ruaka, with mains wiring to every unit, a meter room, and at least one existing fibre or fixed line the node can buy backhaul from. The landlord becomes the node operator and keeps 95 percent of every settled byte.',
    },
    {
      ask: 'A hardware lab bench',
      detail:
        'Bench space with a residual current device on the mains strip, and access to a logic analyser and a spectrum analyser. Ten working days of it, not a permanent lease. This removes a line from the budget and a week from the schedule.',
    },
    {
      ask: 'An introduction to a payments partner',
      detail:
        'A bank or a mobile money partner who can hold the customer float and answer the Central Bank question alongside us rather than after us. This is the gate between a working protocol and mainnet fiat at scale.',
    },
  ],
};

/* -------------------------------------------------------------- formatting */

/** Compact shillings for chart labels and tiles. Not in lib/money.js. */
export function shortKes(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 'n/a';
  }
  if (Math.abs(n) >= 1e6) {
    return `KES ${(n / 1e6).toFixed(Math.abs(n) >= 1e7 ? 0 : 1)}M`;
  }
  if (Math.abs(n) >= 1e3) {
    return `KES ${(n / 1e3).toFixed(Math.abs(n) >= 1e5 ? 0 : 1)}k`;
  }
  return fmtKes(n);
}

/** 'KES 32,055 to KES 51,408', collapsing to one figure when the range is flat. */
export function fmtRange(low, high, { short = false } = {}) {
  const f = short ? shortKes : fmtKes;
  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    return 'not priced';
  }
  return low === high ? f(low) : `${f(low)} to ${f(high)}`;
}

/** Bytes as a label a reader can hold: 120,000 MB reads as 120 GB. */
export function fmtMb(mb) {
  if (mb >= 1e6) {
    return `${(mb / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 })} TB`;
  }
  if (mb >= 1e3) {
    return `${(mb / 1e3).toLocaleString('en-US', { maximumFractionDigits: 0 })} GB`;
  }
  return `${mb.toLocaleString('en-US')} MB`;
}
