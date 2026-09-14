/**
 * Every number on /manufacturing, with the source or the basis of each one
 * written beside it.
 *
 * Rules this file keeps, so that nothing on the page can drift:
 *
 * 1. Money is computed, never typed twice. Dollar figures from the beta cost
 *    model are stored in dollars and converted once through lib/money.js, so
 *    changing the rate there changes the page.
 * 2. Every figure carries `basis`, and an estimate says so in the same string
 *    that carries the number. Nothing here is a quotation; where a quotation
 *    would exist, the field says none is held.
 * 3. The crossover volume in section 4 is solved from the same table the page
 *    prints, not asserted. See `crossover` at the bottom.
 *
 * Sources, all in this repository:
 *   docs/papers/13-roadmap.md                  phases, exit criteria, funding
 *   docs/x-koin-beta/00-compact-board-concept.md   populations, proof points
 *   docs/x-koin-beta/03-manufacturing-brief.md file package, schedule, certs
 *   docs/x-koin-beta/04-cost-model.md          BOM, factory and landed cost
 *   docs/papers/11-regulatory-and-safety.md    CA, KEBS, spectrum, import
 *   hardware/shopping/mvp-sourcing.md          the kit price per device today
 *   hardware/pinmap.md                         the hand-made connections
 */

import { RATES, cnyToKes, fmtKes, kes, usdToKes } from '../lib/money.js';

/* ------------------------------------------------------------------ header */

export const HEADER = {
  eyebrow: 'revision 0 to revision 2',
  title: 'From a kit of modules to one board',
  lede:
    'The proof of concept wires six bought modules together on a bench. This page answers one question: at what point does it pay to merge those modules onto a single printed circuit board, and who should build it. Every figure is in Kenyan shillings, converted once at the rates below, and every estimate says that it is one.',
  rates: `Rates used on this page, the same ones /startup uses: 1 USD = ${RATES.usdKes} KES, 1 CNY = ${RATES.cnyKes} KES. The source papers are written in dollars against a 130 KES benchmark, so a converted total here sits under one percent from the dollar total printed there.`,
};

/* ------------------------------------------------- 2. the merge animation */

/**
 * Blocks for the merge animation. `from` is where the block starts in the
 * scattered kit, `to` is its footprint on the 108 by 58 mm board outline, both
 * in the 1200 by 520 frame the scene draws in. Board geometry from
 * docs/x-koin-beta/02-pcb-blueprint.md by way of the concept paper.
 */
export const MERGE = {
  board: { label: 'One board, 108 by 58 mm, four layers', x: 300, y: 118, w: 470, h: 262 },
  onBoard: [
    {
      id: 'mcu',
      kit: 'ESP32-S3-DevKitC-1 N16R8',
      becomes: 'ESP32-S3-WROOM-1 N16R8',
      tone: 'ink',
      from: { x: 40, y: 60, w: 210, h: 66 },
      to: { x: 330, y: 150, w: 180, h: 66 },
    },
    {
      id: 'lora',
      kit: 'E22-900M22S module',
      becomes: 'bare SX1262 and a pi match',
      tone: 'lora',
      from: { x: 40, y: 150, w: 210, h: 58 },
      to: { x: 530, y: 150, w: 150, h: 58 },
    },
    {
      id: 'nbplc',
      kit: 'KQ-130F module',
      becomes: 'KQ-130F footprint, ST7540 pads beside it',
      tone: 'nbplc',
      from: { x: 40, y: 236, w: 210, h: 58 },
      to: { x: 330, y: 240, w: 180, h: 58 },
    },
    {
      id: 'w5500',
      kit: 'W5500 Ethernet bridge',
      becomes: 'deleted: the HomePlug modem is native SPI',
      tone: 'faint',
      deleted: true,
      from: { x: 40, y: 322, w: 210, h: 58 },
      to: { x: 530, y: 240, w: 150, h: 58 },
    },
    {
      id: 'power',
      kit: 'USB 5 V charger and wall wart',
      becomes: 'HLK-5M12 behind an 8.0 mm isolation slot',
      tone: 'plc',
      from: { x: 40, y: 408, w: 210, h: 58 },
      to: { x: 330, y: 318, w: 350, h: 50 },
    },
  ],
  offBoard: [
    {
      id: 'homeplug',
      label: 'HomePlug AV adapter pair',
      why: 'The QCA7005 that would replace it has no open distributor price and is normally sold under a design-in agreement. It stays a bridged commodity adapter until a written quotation exists.',
      from: { x: 40, y: 494, w: 210, h: 58 },
      to: { x: 830, y: 140, w: 250, h: 74 },
    },
    {
      id: 'antenna',
      label: '868 MHz antenna and SMA bulkhead',
      why: 'Physics. The module needs a 15.00 mm no-copper keep-out and the whip has to be outside the case.',
      from: { x: 830, y: 240, w: 250, h: 62 },
      to: { x: 830, y: 240, w: 250, h: 62 },
    },
    {
      id: 'case',
      label: 'BS 1363 plug-top enclosure',
      why: 'The pins, the fuse and the case carry their own approval, and the safety assessment is on the assembled product.',
      from: { x: 830, y: 328, w: 250, h: 62 },
      to: { x: 830, y: 328, w: 250, h: 62 },
    },
    {
      id: 'cell',
      label: '18650 cell and solar panel',
      why: 'Loose cells ship under UN3480 and most couriers refuse them into Kenya, so they are bought in Nairobi.',
      from: { x: 830, y: 416, w: 250, h: 62 },
      to: { x: 830, y: 416, w: 250, h: 62 },
    },
  ],
};

/* ------------------------------------------- 3. feasibility, per population */

export const FEASIBILITY = {
  intro:
    'The beta papers lay the board out once with every footprint present and build a device by which parts are fitted. Revision 1 is proposed as a staged merge: the silicon that is priced and in stock goes down on copper, and the two lines that are neither stay as modules until a quotation comes back.',
  rows: [
    {
      device: 'xKoin-Node',
      merges:
        'ESP32-S3-WROOM-1 N16R8, bare SX1262 with a 32 MHz TCXO and a pi match, the KQ-130F narrowband footprint with ST7540 pads beside it, the HLK-5M12 mains supply, the buck tree, USB-C.',
      stays:
        'HomePlug modem as a bridged commodity adapter on the SPI header; SMA bulkhead and whip; BS 1363 plug case.',
      why:
        'Supply risk. The QCA7005 has no open distributor price and Qualcomm networking silicon of that class is sold under a design-in agreement, so merging it at revision 1 would commit a layout against an unpriced part.',
      verdict: 'merges, minus the broadband modem',
    },
    {
      device: 'xKoin-Node-Satellite',
      merges: 'The same population as the Node. The only silicon difference is an IPEX connector in place of the SMA bulkhead.',
      stays: 'Same as the Node, plus the internal antenna lead.',
      why:
        'Building the Node and the Node-Satellite as one stock-keeping unit halves the inventory the factory carries. Their difference is firmware role and where they sit in the building, not silicon.',
      verdict: 'merges, same board as the Node',
    },
    {
      device: 'xKoin-Satellite',
      merges:
        'ESP32-S3-WROOM-1, bare SX1262, CN3065 solar charger, cell connector, protection, USB-C. The whole mains half of the board is left unpopulated.',
      stays: 'The 18650 cell, the 6 V panel and an IP54 outdoor box with a gland.',
      why:
        'Mains isolation. Nothing on this population crosses the barrier, so the isolation slot costs it board area and nothing else. The cell and panel are bought in Nairobi because loose cells ship under UN3480.',
      verdict: 'merges cleanly, cheapest population',
    },
    {
      device: 'xKoin-Client dongle',
      merges:
        'ESP32-S3-WROOM-1, bare SX1262, USB-C on the native USB pins, IPEX antenna. The board is snapped along a V-score down the isolation slot, which leaves the SELV half as a stick.',
      stays: 'The IPEX whip and the stick shell.',
      why:
        'RF certification. The ESP32-S3-WROOM-1 module carries its own 2.4 GHz approval, which is the reason the design pays about USD 1.20 over a bare ESP32-S3 chip and removes the hardest radio layout problem on the board.',
      verdict: 'merges, derived from the same Gerber set',
    },
  ],
  note:
    'What disappears rather than merges: the W5500 Ethernet bridge. It exists in the kit only to get the ESP32-S3 onto a HomePlug adapter, and it is deleted the moment the modem sits on the same SPI bus. The beta schematic audit also found that its proposed pins on GPIO35 to GPIO37 are consumed by the octal PSRAM on any R8 module, so those three assignments would not have worked on the hardware already bought.',
};

/* ------------------------------ 4. trade-offs: the two paths, side by side */

const TAX_MULTIPLIER = 1.4875;

export const VOLUMES = [10, 100, 1000, 10000];

/**
 * Path A, the kit of modules. Module prices are the verified 2026-09-14 Node
 * checkout at 10 units, then wholesale discount tiers as estimates; the hand
 * work does not fall much with volume, which is the whole point of the
 * comparison.
 */
export const KIT_PATH = {
  key: 'kit',
  name: 'Kit of modules',
  sub: 'Revision 0, as the bench builds it today',
  lines: [
    {
      label: 'Modules per Node',
      values: [13165, 11850, 10530, 9880],
      basis:
        'KES 13,165 at 10 units is the verified Node checkout of 2026-09-14 in hardware/shopping/mvp-sourcing.md, delivered and retail. The three volume figures are estimates at 10, 20 and 25 percent below that retail line, on the basis that a module carries a second PCB, a second test and a second margin that no quantity removes. No wholesale quotation is held.',
    },
    {
      label: 'Hand assembly, harness, case, test',
      values: [3600, 3000, 2700, 2600],
      basis:
        'Estimate. Four hours of bench work at 10 units falling to about two and a half at volume, costed at KES 600 an hour, plus KES 1,200 for a generic case and harness. The hour rate and the times are assumptions, not a quotation, and the flat shape is the finding rather than the figures: hand wiring does not scale.',
    },
  ],
};

/**
 * Path B, the merged board, built by a contract manufacturer and landed in
 * Nairobi. Factory and freight figures are the beta cost model in dollars;
 * the tax stack and the non-recurring engineering are that paper's too.
 */
export const BOARD_PATH = {
  key: 'board',
  name: 'Merged board',
  sub: 'Revision 1 and after, landed in Nairobi',
  factoryUsd: [138.0, 78.43, 50.17, 34.05],
  freightUsd: [2.9, 2.45, 1.93, 0.37],
  nreUsd: [33250, 33250, 33250, 42250],
  factoryBasis:
    'USD 78.43, 50.17 and 34.05 ex-works China are the Node factory-cost totals in docs/x-koin-beta/04-cost-model.md section 7, every line of which carries an s for sourced or an e for estimate there. USD 138.00 at 10 units is this page\'s estimate: the 100-unit column with components moved to quantity-ten price breaks and the assembly setup spread over ten boards instead of a hundred. No factory has quoted any of these.',
  landedBasis:
    'Landed cost multiplies CIF by 1.4875, which is the conservative reading in docs/x-koin-beta/04-cost-model.md section 8: 25 percent duty, 16 percent VAT on duty-paid value, the 2.25 percent Import Declaration Fee and the 1.5 percent Railway Development Levy. The same paper prints the 0 percent duty reading at 1.1975, which at 1,000 units makes the Node USD 62.39 rather than USD 77.50. That single classification question is worth more per unit than any component substitution in the model.',
  nreBasis:
    'USD 33,250 of one-off engineering and certification, from docs/x-koin-beta/04-cost-model.md section 9: layout 12,000, CE assessment 12,000, test fixtures 3,500, first article and pre-compliance 3,000, CA type approval 2,500, stencil and setup 250. Every line is an estimate; none is quoted. The 10,000 column adds USD 9,000 of enclosure tooling, which is why that tier also drops the case from USD 11.00 to USD 2.80.',
  taxMultiplier: TAX_MULTIPLIER,
};

/** Kit unit cost in shillings at each tier. */
export const KIT_UNIT_KES = VOLUMES.map((_, i) =>
  kes(KIT_PATH.lines.reduce((sum, line) => sum + line.values[i], 0)),
);

/** Merged board recurring landed cost in shillings, before one-off spend. */
export const BOARD_LANDED_KES = VOLUMES.map((_, i) =>
  usdToKes((BOARD_PATH.factoryUsd[i] + BOARD_PATH.freightUsd[i]) * TAX_MULTIPLIER),
);

/** The one-off spend carried per unit at each tier. */
export const BOARD_NRE_KES = VOLUMES.map((volume, i) => usdToKes(BOARD_PATH.nreUsd[i] / volume));

/** What a Node actually costs on the board path, one-off spend carried. */
export const BOARD_UNIT_KES = VOLUMES.map((_, i) => kes(BOARD_LANDED_KES[i] + BOARD_NRE_KES[i]));

/* The crossover is solved from the four columns above rather than asserted.
   Between two tiers both curves are interpolated on a log volume axis, which
   is how a price break behaves, and the crossing is bisected. */

function logFraction(volume, lo, hi) {
  return Math.log(volume / lo) / Math.log(hi / lo);
}

function interpolate(values, volume) {
  for (let i = 0; i < VOLUMES.length - 1; i += 1) {
    const lo = VOLUMES[i];
    const hi = VOLUMES[i + 1];
    if (volume >= lo && volume <= hi) {
      const f = logFraction(volume, lo, hi);
      return values[i] + (values[i + 1] - values[i]) * f;
    }
  }
  return volume < VOLUMES[0] ? values[0] : values[values.length - 1];
}

/** Kit unit cost at any volume inside the plotted range. */
export function kitCostAt(volume) {
  return interpolate(KIT_UNIT_KES, volume);
}

/** Board unit cost at any volume, with the one-off spend carried per unit. */
export function boardCostAt(volume) {
  const landed = interpolate(BOARD_LANDED_KES, volume);
  const nreTotal = interpolate(BOARD_PATH.nreUsd, volume);
  return landed + usdToKes(nreTotal) / volume;
}

function solveCrossover() {
  let lo = VOLUMES[0];
  let hi = VOLUMES[VOLUMES.length - 1];
  const sign = (v) => Math.sign(boardCostAt(v) - kitCostAt(v));
  if (sign(lo) === sign(hi)) {
    return null;
  }
  for (let i = 0; i < 80; i += 1) {
    const mid = Math.sqrt(lo * hi);
    if (sign(mid) === sign(lo)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return Math.sqrt(lo * hi);
}

const CROSSOVER_UNITS = solveCrossover();

export const CROSSOVER = {
  units: CROSSOVER_UNITS,
  rounded: CROSSOVER_UNITS ? Math.round(CROSSOVER_UNITS / 10) * 10 : null,
  kesAtCrossing: CROSSOVER_UNITS ? kes(kitCostAt(CROSSOVER_UNITS)) : null,
  basis:
    'Solved from the four columns of the table above, interpolating both curves on a log volume axis between the 1,000 and 10,000 tiers and bisecting the crossing. It is an arithmetic consequence of the figures printed here, and every one of those is an estimate, so read it as an order of magnitude: the merged board pays for itself somewhere in the low thousands of units, not in the hundreds and not in the tens of thousands.',
};

/** The qualitative half of the comparison. */
export const TRADEOFFS = [
  {
    attribute: 'Assembly time per unit',
    kit: 'Two to four hours of bench work by someone who can read a pin map.',
    board: 'Minutes. Pick and place, reflow, a two-stage test, then a case.',
    basis:
      'Estimate on the kit side, timed against the build the proof of concept plan describes; no measured figure exists yet. On the board side the time is the factory cycle, and the beta cost model prices it as USD 2.40 of SMT at 1,000 units rather than as hours.',
  },
  {
    attribute: 'Failure points',
    kit: 'Twelve hand-made connections per Node, plus six module-to-module interfaces and their connectors.',
    board: 'Solder joints under an automated optical inspection pass, and two connectors that a human still fits.',
    basis:
      'Counted from the gateway table in hardware/pinmap.md, less the W5500 and LTE rows that the kit does not build: eight SX1262 lines and four KQ-130F lines. The HomePlug half is a plug-in appliance rather than wiring.',
  },
  {
    attribute: 'Repairability',
    kit: 'A dead module is unplugged and replaced for its own price, with no soldering and no test fixture.',
    board: 'A dead SX1262 is a QFN rework under hot air, and a board that has seen mains is scrapped rather than reworked blind.',
    basis:
      'The scrap-rather-than-rework rule is question 11 of the factory questionnaire in docs/x-koin-beta/03-manufacturing-brief.md section 8.',
  },
  {
    attribute: 'Certification burden',
    kit: 'Carried by the modules. The radio module ships with its own FCC identifier on the label and the HomePlug adapter is already a certified appliance. The bench rig is not a product for sale, so nothing is assessed.',
    board: 'Carried by us. The assessment is on the assembled product: CE under the Radio Equipment Directive, EN 62368-1 for the mains section, EN 50561-1 and EN 50065 for the two power-line paths, CA type approval and a KEBS Certificate of Conformity.',
    basis:
      'docs/x-koin-beta/03-manufacturing-brief.md section 7, and docs/papers/11-regulatory-and-safety.md sections 7 and 8. The module route buys the 2.4 GHz part of that work outright, which is why the design keeps the ESP32-S3-WROOM-1 module instead of a bare chip.',
  },
  {
    attribute: 'Time to first unit',
    kit: 'Days. The parcel for the current kit is due between 21 and 30 September 2026 and the Nairobi lines are same-day.',
    board: 'Seven to fourteen weeks to a working board, then four to eight weeks each for CE and CA before it can be sold.',
    basis:
      'Kit dates are the verified checkout windows in hardware/shopping/mvp-sourcing.md. The board figure sums the conditional schedule in docs/x-koin-beta/03-manufacturing-brief.md section 4: one week to quote, two to eight weeks of component procurement driven by the QCA7005, one to two weeks of fab and assembly, one week of first article and bring-up, two weeks of pre-compliance.',
  },
  {
    attribute: 'What a mistake costs',
    kit: 'The price of one module, swapped the same afternoon.',
    board: 'A respin. New Gerbers, a new stencil, and on the mains side a new safety file.',
    basis:
      'docs/x-koin-beta/03-manufacturing-brief.md section 5: any assembler-side change to the barrier, a re-spun footprint or a moved fiducial, is a change to the safety file and comes back before it is cut.',
  },
];

/* ------------------------------------------------------ 5. factory options */

const LOCAL_LINE_CNY = [
  { item: 'Semi-automatic stencil printer', cny: 25000 },
  { item: 'Desktop pick and place, four head, about 5,000 components an hour', cny: 120000 },
  { item: 'Eight-zone lead-free reflow oven', cny: 60000 },
  { item: 'Desktop automated optical inspection', cny: 70000 },
];

const LOCAL_LINE_KES = LOCAL_LINE_CNY.reduce((sum, row) => sum + cnyToKes(row.cny), 0);
const LOCAL_FITOUT_KES = 1200000;

export const LINE_CAPEX = {
  rows: LOCAL_LINE_CNY,
  machinesKes: LOCAL_LINE_KES,
  fitoutKes: LOCAL_FITOUT_KES,
  totalKes: kes(LOCAL_LINE_KES + LOCAL_FITOUT_KES),
  basis:
    'Estimate. The four machine figures are entry-level Chinese list prices for a small surface-mount cell, converted at the page rate; no quotation is held and no supplier has been approached. The Nairobi fit-out line covers ESD benches, extraction, a hipot tester, residual-current-protected mains stations, two test fixtures and a battery backup, and is an estimate with no quotation behind it either.',
};

export const FACTORY_OPTIONS = [
  {
    key: 'shenzhen',
    name: 'Outsource to a Shenzhen contract manufacturer',
    tag: 'Option A',
    summary:
      'One factory near the people who make the silicon builds the board, cases it, tests it and ships it boxed. We send a file package and receive units.',
    capex: 'KES 451,500 (USD 3,500) for two test fixtures, plus the one-off engineering every option pays.',
    capexBasis: 'The test fixture line in docs/x-koin-beta/04-cost-model.md section 9, an estimate with no quotation behind it.',
    opexKes: BOARD_LANDED_KES[2],
    opexLabel: `${fmtKes(BOARD_LANDED_KES[2])} (USD 77.50) per Node at 1,000 units, landed Nairobi`,
    opexBasis: `docs/x-koin-beta/04-cost-model.md section 8, the 25 percent duty reading. Under the 0 percent reading it is ${fmtKes(usdToKes(62.39))} (USD 62.39).`,
    lead: 'Seven to fourteen weeks to the first article, then two to four weeks a repeat run. Component procurement, not assembly, is the driver.',
    quality:
      'A factory that already builds mains-isolated boards, with first article inspection measuring the Y2 capacitor placement to plus or minus 0.2 mm and a hipot on every unit after casing. Verified by asking the three questions the brief singles out rather than by price.',
    ip: 'Leaves the building: Gerbers, drill files, the centroid, the BOM with its do-not-substitute lines, the assembly drawing, the test procedure, the enclosure STEP and a signed firmware binary. One factory holds all of it.',
    ipRisk: 'highest',
    note:
      'The factory can clone the board from what it holds. It cannot sign an image, mint a node identity or join the network, because none of that travels.',
  },
  {
    key: 'hybrid',
    name: 'Fabricated and populated abroad, finished in Nairobi',
    tag: 'Option B',
    summary:
      'The bare board comes back populated from China. Nairobi fits the case, flashes the firmware, runs the hipot and the functional test, records the public key against the serial and packs it.',
    capex: 'KES 900,000 for two final-assembly and test stations, the mains bench and the jigs.',
    capexBasis:
      'Estimate: two stations at KES 250,000, benches with ESD and residual current protection at KES 200,000, jigs and fixtures at KES 200,000. No quotation held.',
    opexKes: kes(usdToKes((33.34 + 2.4 + 0.85) * TAX_MULTIPLIER) + usdToKes(11.8 * TAX_MULTIPLIER) + 1200),
    opexLabel: `${fmtKes(
      kes(usdToKes((33.34 + 2.4 + 0.85) * TAX_MULTIPLIER) + usdToKes(11.8 * TAX_MULTIPLIER) + 1200),
    )} per Node at 1,000 units, an estimate`,
    opexBasis: `Built from the same cost model: BOM USD 33.34 and surface-mount assembly USD 2.40 with USD 0.85 of freight, taxed at 1.4875, gives ${fmtKes(
      usdToKes((33.34 + 2.4 + 0.85) * TAX_MULTIPLIER),
    )}; the case landed separately at ${fmtKes(
      usdToKes(11.8 * TAX_MULTIPLIER),
    )}; local finish at KES 1,200 for three quarters of an hour of labour at KES 600 an hour, the hipot and functional test, and packaging. The labour rate and the times are assumptions, not a quotation.`,
    lead: 'The same seven to fourteen weeks for the first article, then boards arrive lighter and clear customs faster than finished goods. Two to four weeks a repeat run.',
    quality:
      'The two-stage test happens where the people who wrote the firmware are. A batch that fails is diagnosed rather than described over email.',
    ip: 'Leaves the building: Gerbers, drill files, the centroid and the BOM. The test procedure, the enclosure drawing and the firmware binary stay, because flashing and the serial-to-public-key record happen in Nairobi.',
    ipRisk: 'moderate',
    note:
      'This is the option where the provisioning file is made here rather than posted to us, which matters more as the network grows than it does at a hundred units.',
  },
  {
    key: 'local',
    name: 'Fully local: a Nairobi surface-mount line',
    tag: 'Option C',
    summary:
      'Bare boards from a fab, every component imported by us, and the whole build on our own line. Only copper artwork leaves the building.',
    capex: `${fmtKes(LINE_CAPEX.totalKes)} for the machines and the fit-out.`,
    capexBasis: LINE_CAPEX.basis,
    opexKes: kes(
      usdToKes(36.34 * TAX_MULTIPLIER) + usdToKes(2.5 * TAX_MULTIPLIER) + usdToKes(11.8 * TAX_MULTIPLIER) + 3632,
    ),
    opexLabel: `${fmtKes(
      kes(usdToKes(36.34 * TAX_MULTIPLIER) + usdToKes(2.5 * TAX_MULTIPLIER) + usdToKes(11.8 * TAX_MULTIPLIER) + 3632),
    )} per Node at 1,000 units a year, an estimate`,
    opexBasis: `BOM imported as individual reels, USD 33.34 plus USD 3.00 of parcel freight taxed at 1.4875, gives ${fmtKes(
      usdToKes(36.34 * TAX_MULTIPLIER),
    )}; the bare board ${fmtKes(usdToKes(2.5 * TAX_MULTIPLIER))}; the case ${fmtKes(
      usdToKes(11.8 * TAX_MULTIPLIER),
    )}; conversion KES 3,632, of which KES 2,032 is machine depreciation over three years at a thousand units a year, KES 900 is an hour and a half of labour at KES 600 and KES 700 is overhead and yield loss. At ten thousand units a year the depreciation falls to about KES 203 and the total to roughly KES 11,300. Every line is an estimate.`,
    lead: 'Two to eight weeks for components, then days. The schedule is ours, and so is every stockout.',
    quality:
      'Total control and no track record. Yield on a mains-isolated four-layer board with an RF island is learned, and learning it costs boards.',
    ip: 'Leaves the building: the Gerbers and the drill file, to a fab that sees copper and never sees a BOM. Everything else stays.',
    ipRisk: 'lowest',
    note:
      'The line only makes arithmetic sense above a few thousand units a year, because depreciation per unit is the largest single line below that.',
  },
];

export const IN_HOUSE = {
  title: 'What stays in house in every option',
  items: [
    {
      name: 'Firmware signing and over-the-air update',
      detail:
        'The factory flashes a signed image and cannot produce one. The signing key never leaves, and a device that will not verify a signature will not run the image.',
    },
    {
      name: 'The key ceremony',
      detail:
        'The per-device Ed25519 identity is generated on the device at first boot, not programmed at the factory, so no secret material travels to Shenzhen and a compromised flashing station cannot mint node identities. The factory reads a public key back and records it against the serial number, and that file comes home with the shipment.',
    },
    {
      name: 'Protocol and network resilience',
      detail:
        'Admission, metering, cumulative receipts, the failover to the radio when the grid drops and the settlement path are software. None of it is in the Gerbers, and a cloned board without them is a development kit.',
    },
  ],
  basis:
    'The on-device key generation rule is docs/x-koin-beta/03-manufacturing-brief.md section 6. The protocol properties are the tested ones in the repository rather than proposals.',
};

export const RECOMMENDATION = {
  pick: 'Option A for revision 1 and revision 2, then Option B at production.',
  reasons: [
    'Revision 1 is ten boards. Standing up a line in Nairobi to build ten boards costs several million shillings to learn a yield that a Shenzhen factory already has, and the one-off engineering is the same number under every option.',
    'The parts are there. The QCA7005 and the ST7540 are the two lines that set the schedule, and a factory next to the distributors that stock them will get an answer faster than we will from Nairobi.',
    'The exposure is a board, not the network. What travels is a layout. What does not travel is the signing key, the on-device identity and the protocol, so the worst realistic outcome of a leak is a competitor holding a development kit.',
    'Option B becomes right when volume makes the provisioning file worth holding here, and it is a migration rather than a rebuild: the same Gerbers, the same BOM, and a final-assembly bench that costs under a million shillings.',
  ],
  guard:
    'Two things make this recommendation conditional. Send the same package to three factories, because the beta brief records that the variance between three quotations on one file package is routinely 30 percent. And split the repeat order across two factories once revision 2 is proven, so that no single supplier holds both the schedule and the file set.',
};

/* --------------------------------------------- 6. certification and safety */

export const CERTIFICATION = {
  intro:
    'None of the approvals below apply to the kit on the bench, and all of them apply to a board sold in Kenya. Costs are ranges and every one is an estimate; the repository holds no quotation from any test house or authority.',
  rows: [
    {
      item: 'CA type approval, Kenya',
      what: 'The Communications Authority type approves radio equipment intended for use in Kenya, and equipment must be type approved before it is activated.',
      costUsd: 2500,
      costNote: 'estimate, fee schedule not fetched',
      time: '4 to 8 weeks, typical reported processing',
      cite: 'Paper 11 section 8; beta paper 03 section 7.4',
    },
    {
      item: 'The alternative: the short-range device exemption',
      what: 'Devices inside the 2022 short-range device table are exempt from type approval, at 25 mW e.r.p. in the 868.0 to 868.6 MHz sub-band, with an accredited laboratory test report producible on request. The firmware currently configures +22 dBm, about 158 mW, which is roughly six times that ceiling.',
      costUsd: 0,
      costNote: 'no fee, but an accredited test report is still needed',
      time: 'A firmware decision, not a schedule item',
      cite: 'Paper 11 section 2, and the same paper section 8',
    },
    {
      item: 'CE assessment: RED, EN 62368-1, EN 50561-1, EN 50065',
      what: 'Two radios and two power-line paths, plus the mains section, which is the long pole. The 2.4 GHz part is shortened by the ESP32-S3-WROOM-1 module carrying its own report, but not removed.',
      costUsd: 12000,
      costNote: 'estimate, test house quotation not obtained',
      time: '4 to 8 weeks, with notified body involvement on the mains and power-line parts',
      cite: 'Beta paper 04 section 9; beta paper 03 section 7.1 and 7.2',
    },
    {
      item: 'KEBS Certificate of Conformity under PVoC',
      what: 'China-origin shipments from 1 March 2026 need a certificate from Cotecna or Intertek, arranged before the goods leave Shenzhen.',
      costUsd: 265,
      costNote: 'estimate per shipment: the fee is a percentage of free-on-board value with a floor, and at 1,000 units the floor governs. No fee schedule fetched',
      time: 'Days, if arranged before shipping',
      cite: 'Paper 11 section 9; beta paper 03 section 7.4',
    },
    {
      item: 'The cost of getting PVoC wrong',
      what: 'A consignment without a certificate faces destination inspection at 5 percent of customs value.',
      costUsd: 2605,
      costNote: 'computed: 5 percent of the USD 52,100 CIF of a 1,000-unit Node run',
      time: 'Weeks at the port',
      cite: 'Beta paper 04 section 9',
    },
    {
      item: 'KEBS position on mains-coupled devices in homes',
      what: 'Whether a device that couples to 230 V mains needs Bureau certification before field use in customer premises, independent of any radio question. Open, and it is a precondition on the pilot.',
      costUsd: null,
      costNote: 'unpriced: this is counsel question 5 and no answer is held',
      time: 'Unknown until counsel answers',
      cite: 'Paper 11 section 3, counsel question 5; paper 13 section 5',
    },
    {
      item: 'Communications Equipment Distributor licence',
      what: 'Introduced July 2026 for importers and wholesalers of communications equipment. KES 5,000 to apply, KES 250,000 for the licence, then 0.4 percent of turnover annually with a KES 120,000 floor.',
      costKes: 255000,
      costNote: 'stated in shillings at source, first year, licence plus application, before the turnover element',
      time: 'Before a commercial import, not before a prototype parcel',
      cite: 'Paper 11 section 8',
    },
    {
      item: 'First article inspection and pre-compliance scans',
      what: 'Run before the tooling is cut, not after. The first article measures the Y2 capacitor placement against the drawing.',
      costUsd: 3000,
      costNote: 'estimate',
      time: '3 weeks, one for the article and two for the scans',
      cite: 'Beta paper 04 section 9; beta paper 03 sections 4 and 5',
    },
    {
      item: 'HomePlug interoperability',
      what: 'Nothing to buy. The HomePlug Alliance put its specifications into the public domain in October 2016, so the compatibility claim is substantiated on our own bench: the board against at least three commodity adapter families on a real building circuit, recording association time, rate and goodput in both directions.',
      costUsd: 0,
      costNote: 'bench time rather than a fee',
      time: 'A shipping deliverable, not a nice to have',
      cite: 'Beta paper 03 section 7.3',
    },
  ],
};

/* ------------------------------------------------------- 7. phased plan */

export const PHASES = [
  {
    key: 'rev0',
    tag: 'Revision 0',
    name: 'The kit, on a bench',
    when: 'Now',
    scale: '5 devices, one of each role',
    cost: 'KES 26,986 for the whole kit',
    costBasis:
      'The verified bare-minimum kit total of 2026-09-14, before AliExpress shipping of KES 569, before VAT on the HomePlug kit and before customs on the parcel. hardware/shopping/mvp-sourcing.md.',
    exit:
      'All six demos pass, recorded on video, and four repository claims are confirmed or corrected against a measurement: the Satellite average current against the 40 mA ceiling, the SX1262 register values, the KQ-130F on a real mains segment, and HomePlug goodput on real wiring against the 10 Mbps model.',
    exitCite: 'Paper 13 section 3',
    status: 'progress',
  },
  {
    key: 'rev1',
    tag: 'Revision 1',
    name: 'Merged board, prototype run of 10',
    when: 'After the bench closes',
    scale: '10 boards',
    cost: `${fmtKes(BOARD_UNIT_KES[0])} per unit at ten, one-off engineering carried`,
    costBasis:
      'The board column of the comparison table above. Almost all of it is the USD 33,250 of one-off engineering divided by ten, which is the reason a ten-board run is a programme cost and not a product price.',
    exit:
      'The seven proof points are answered on the bench first, then the board passes the same six demos the breadboard passed, with the schematic, the layout and the manufacturing brief in a state a Shenzhen factory can quote against. Written quotations for the QCA7005 and the ST7540 are the first procurement action.',
    exitCite: 'Paper 13 section 6; beta paper 00 section 5',
    status: 'planned',
  },
  {
    key: 'rev2',
    tag: 'Revision 2',
    name: 'Pilot run of 100',
    when: 'After revision 1 and the device gates',
    scale: '100 boards',
    cost: `${fmtKes(BOARD_UNIT_KES[1])} per unit at a hundred, one-off engineering carried`,
    costBasis: `The board column of the comparison table above. Recurring landed cost is ${fmtKes(BOARD_LANDED_KES[1])} of that; the rest is the one-off spend divided by a hundred.`,
    exit:
      'Thirty consecutive days in one building with paying tenants and five numbers that did not exist before: measured backhaul cost per MB, the proxy cache hit rate, real per-node capital and monthly operating cost, the session credit limit that underpaid nobody, and a per-unit price derived from the floor formula rather than the placeholder. First article inspection measures the Y2 placement.',
    exitCite: 'Paper 13 section 4; beta paper 03 section 5',
    status: 'planned',
  },
  {
    key: 'production',
    tag: 'Production',
    name: 'Contract manufacture',
    when: 'After the pilot and the certifications',
    scale: '1,000 and up',
    cost: `${fmtKes(BOARD_UNIT_KES[2])} per unit at a thousand, ${fmtKes(BOARD_UNIT_KES[3])} at ten thousand`,
    costBasis: 'The board column of the comparison table above, one-off engineering carried at each tier.',
    exit:
      'Units landed in Nairobi at a known landed cost, with the import classification settled by a written ruling rather than assumed. That ruling is worth more per unit than any component substitution in the cost model.',
    exitCite: 'Paper 13 section 7; beta paper 04 section 10',
    status: 'planned',
  },
];

export const LINKS = [
  { to: '/startup', label: 'Budget and phases in full', text: 'What each phase costs and where the money comes from.' },
  { to: '/blueprints', label: 'The drawings', text: 'Schematics and pin maps for every device role.' },
  { to: '/docs', label: 'The beta board papers', text: 'The five documents this page is derived from, in full.' },
];
