/**
 * The shopping list, compiled at build time.
 *
 * hardware/shopping/parts/*.json is imported with import.meta.glob so a scout
 * that drops a new part file in that folder appears on the next build with no
 * code change here. `eager` plus `import: 'default'` gives the parsed object,
 * so nothing is fetched or parsed at runtime and the page cannot show a
 * loading state or a network error.
 *
 * The MVP kit (hardware/shopping/mvp-kit.json) and its verified checkout lines
 * (mvp-checkout.json) are imported the same way. Schemas are documented in
 * hardware/shopping/README.md.
 */

import KIT from '../../../hardware/shopping/mvp-kit.json';
import CHECKOUT from '../../../hardware/shopping/mvp-checkout.json';

const MODULES = import.meta.glob('../../../hardware/shopping/parts/*.json', {
  eager: true,
  import: 'default',
});

/**
 * Device roles in the order the revamp plan lists them (docs/_plan section 1).
 * `match` reads the free-text `role` field of a part file, which is prose and
 * not an enum. A part may match several roles and is then listed under each.
 */
const ROLES = [
  { key: 'node', title: 'xKoin-Node', why: 'Gateway: backhaul in, mains and radio out, meters every WAN byte.', match: (role) => /xkoin-node(?!-satellite)/.test(role) },
  { key: 'node-satellite', title: 'xKoin-Node-Satellite', why: 'Mains relay: pulls PLC off the wall, regenerates Wi-Fi, enforces admission.', match: (role) => /xkoin-node-satellite/.test(role) },
  { key: 'satellite', title: 'xKoin-Satellite', why: 'Off-grid LoRa remote on solar and a cell.', match: (role) => /xkoin-satellite/.test(role) },
  { key: 'client', title: 'xKoin-Client', why: 'The phone over Wi-Fi, or the OTG dongle for direct LoRa reach.', match: (role) => /xkoin-client/.test(role) },
  { key: 'lora-ecosystem', title: 'LoRa ecosystem devices', why: 'Third-party style nodes on the free LAN plane.', match: (role) => /lora ecosystem|farm/.test(role) },
  { key: 'bench', title: 'Bench', why: 'Test gear: console lead, attenuators, strips.', match: (role) => /\bbench\b/.test(role) },
  { key: 'shared', title: 'Shared across roles', why: 'Boards that belong to whichever device carries them.', match: () => false },
];

const FALLBACK_ROLE = 'shared';

function rolesOf(roleText) {
  const role = String(roleText ?? '').toLowerCase();
  const keys = ROLES.filter((entry) => entry.match(role)).map((entry) => entry.key);
  return keys.length > 0 ? keys : [FALLBACK_ROLE];
}

/**
 * The candidate the scout settled on: the one whose url is the file's `chosen`,
 * falling back to the one carrying the `chosen` verdict. A file with
 * `chosen: null` is a deliberate "buy this locally" line and gets no candidate.
 */
function chosenOf(part) {
  const candidates = Array.isArray(part.candidates) ? part.candidates : [];
  if (part.chosen === null) {
    return null;
  }
  if (typeof part.chosen === 'string') {
    const byUrl = candidates.find((candidate) => candidate.url === part.chosen);
    if (byUrl) {
      return byUrl;
    }
  }
  return candidates.find((candidate) => candidate.verdict === 'chosen') ?? null;
}

function normalise(modulePath, raw) {
  const part = raw && typeof raw === 'object' ? raw : {};
  const id = typeof part.id === 'string' ? part.id : modulePath;
  const candidates = Array.isArray(part.candidates) ? part.candidates : [];
  const chosen = chosenOf(part);
  const qty = Number.isFinite(part.qty) ? part.qty : 1;
  const unit = chosen && Number.isFinite(chosen.price_kes) ? chosen.price_kes : null;
  return {
    id,
    line: typeof part.line === 'string' ? part.line : id,
    roleText: typeof part.role === 'string' ? part.role : '',
    roles: rolesOf(part.role),
    spec: typeof part.spec === 'string' ? part.spec : '',
    why: typeof part.why === 'string' ? part.why : '',
    recorded: typeof part.recorded === 'string' ? part.recorded : '',
    qty,
    chosen,
    image: chosen && Array.isArray(chosen.images) && chosen.images.length > 0 ? chosen.images[0] : null,
    unitKes: unit,
    lineKes: unit === null ? null : unit * qty,
    others: candidates.filter((candidate) => candidate !== chosen),
    local: part.chosen === null,
  };
}

/** Every part line, sorted by name so the order does not depend on the glob. */
export const PARTS = Object.entries(MODULES)
  .map(([modulePath, raw]) => normalise(modulePath, raw))
  .sort((a, b) => a.line.localeCompare(b.line));

const PART_BY_ID = new Map(PARTS.map((part) => [part.id, part]));

/** Names for kit lines that have no part file (they cannot ship, so they were never scouted). */
const EXTRA_LINES = { '18650-cell': '18650 cell' };

/**
 * The parts of each role, in the plan's role order. A part in several roles is
 * listed in each of them, so the role subtotals deliberately do not add up to
 * the kit total.
 */
export function groups() {
  return ROLES.map((role) => ({
    key: role.key,
    title: role.title,
    why: role.why,
    parts: PARTS.filter((part) => part.roles.includes(role.key)),
  }))
    .filter((group) => group.parts.length > 0)
    .map((group) => ({
      ...group,
      subtotalKes: group.parts.reduce((sum, part) => sum + (part.lineKes ?? 0), 0),
    }));
}

/** The header figures for the scouted list. Only a scouted line carries money. */
export function summary() {
  const scouted = PARTS.filter((part) => part.lineKes !== null);
  const local = PARTS.filter((part) => part.local);
  return {
    lines: PARTS.length,
    scouted: scouted.length,
    local: local.length,
    pending: PARTS.length - scouted.length - local.length,
    totalKes: scouted.reduce((sum, part) => sum + part.lineKes, 0),
    recorded: PARTS.map((part) => part.recorded)
      .filter(Boolean)
      .sort()
      .pop() ?? null,
  };
}

const CHECKOUT_BY_ID = new Map(CHECKOUT.lines.map((line) => [line.id, line]));

/**
 * The bare minimum investor kit, one unit per device, priced from the verified
 * checkout lines. A pack that serves several devices (Heltec 2-pack, pigtail
 * 5-pack, antenna 2-pack) is split by its `pack` size so each device carries
 * its share.
 */
export function mvpDevices() {
  return KIT.devices.map((device) => {
    const lines = device.parts.map((entry) => {
      const line = CHECKOUT_BY_ID.get(entry.id);
      const part = PART_BY_ID.get(entry.id);
      const pack = line && Number.isFinite(line.pack) ? line.pack : 1;
      const unit = line && Number.isFinite(line.price_kes) ? Math.round(line.price_kes / pack) : null;
      return {
        id: entry.id,
        name: part ? part.line : EXTRA_LINES[entry.id] ?? entry.id,
        qty: entry.qty,
        pack,
        variant: line?.variant ?? '',
        unitKes: unit,
        costKes: unit === null ? null : unit * entry.qty,
        buy: line?.buy ?? 'local',
        seller: line?.seller ?? entry.store ?? '',
        arrives: line?.delivery ?? '',
        shipping: line?.shipping ?? '',
        url: line?.url ?? null,
        note: entry.note ?? line?.note ?? '',
        image: part?.image ?? null,
      };
    });
    const sum = (buy) => lines.filter((l) => l.buy === buy).reduce((s, l) => s + (l.costKes ?? 0), 0);
    return {
      key: device.key,
      name: device.name,
      journey: device.journey,
      owned: device.owned ?? [],
      lines,
      aliKes: sum('ali'),
      localKes: sum('local'),
      totalKes: sum('ali') + sum('local'),
    };
  });
}

/** Kit-wide figures: line totals, the AliExpress shipping lines, the stage two count. */
export function mvpSummary() {
  const devices = mvpDevices();
  const ali = devices.reduce((s, d) => s + d.aliKes, 0);
  const local = devices.reduce((s, d) => s + d.localKes, 0);
  const shipping = CHECKOUT.lines
    .filter((line) => line.buy === 'ali' && /KSh/.test(line.shipping ?? ''))
    .reduce((s, line) => s + Number(String(line.shipping).replace(/[^\d.]/g, '')), 0);
  return {
    recorded: CHECKOUT.recorded,
    ali,
    local,
    shipping: Math.round(shipping),
    total: ali + local,
    stageTwo: KIT.stage_two ?? [],
  };
}

/** KES the way the listings show it, for example KSh 1,144. */
export function kes(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  return `KSh ${Math.round(value).toLocaleString('en-US')}`;
}
