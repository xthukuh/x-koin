/**
 * The shopping list, compiled at build time.
 *
 * hardware/shopping/parts/*.json is imported with import.meta.glob so a scout
 * that drops a new part file in that folder appears on the next build with no
 * code change here. `eager` plus `import: 'default'` gives the parsed object,
 * so nothing is fetched or parsed at runtime and the page cannot show a
 * loading state or a network error.
 *
 * The schema is documented in hardware/shopping/README.md.
 */

const MODULES = import.meta.glob('../../../hardware/shopping/parts/*.json', {
  eager: true,
  import: 'default',
});

/**
 * Device roles in the order the revamp plan lists them (docs/_plan section 1).
 * `match` reads the free-text `role` field of a part file, which is prose and
 * not an enum: "xKoin-Node, xKoin-Node-Satellite", "LoRa ecosystem device: farm
 * sensor node", "bench path loss for demo D2" are all real values. A part may
 * match several roles and is then listed under each.
 */
const ROLES = [
  {
    key: 'node',
    title: 'xKoin-Node',
    why: 'The gateway: backhaul in, mains and radio out, meters every WAN byte.',
    match: (role) => /xkoin-node(?!-satellite)/.test(role),
  },
  {
    key: 'node-satellite',
    title: 'xKoin-Node-Satellite',
    why: 'Wall-socket relay on the same mains segment: pulls the PLC signal, regenerates Wi-Fi, enforces admission.',
    match: (role) => /xkoin-node-satellite/.test(role),
  },
  {
    key: 'satellite',
    title: 'xKoin-Satellite',
    why: 'Off-grid LoRa remote: solar, deep sleep, class C service, relays to the nearest Node.',
    match: (role) => /xkoin-satellite/.test(role),
  },
  {
    key: 'client',
    title: 'xKoin-Client',
    why: 'The user: a phone over Wi-Fi, or the OTG dongle that gives a phone direct LoRa reach.',
    match: (role) => /xkoin-client/.test(role),
  },
  {
    key: 'lora-ecosystem',
    title: 'LoRa ecosystem devices',
    why: 'Third-party style nodes riding the free LAN plane: farm sensor, tank level, a Meshtastic handset for interop.',
    match: (role) => /lora ecosystem|farm/.test(role),
  },
  {
    key: 'bench',
    title: 'Bench',
    why: 'Test gear that never ships in a kit: the console adapter and the attenuators that fake distance for demo D2.',
    match: (role) => /\bbench\b/.test(role),
  },
  {
    key: 'shared',
    title: 'Shared across roles',
    why: 'Lines whose role field names boards rather than devices, so they belong to whichever device carries that board. The role text is printed on each card.',
    match: () => false,
  },
];

/** Group a part lands in when no role pattern matches its role text. */
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
    unitKes: unit,
    lineKes: unit === null ? null : unit * qty,
    // Everything the scout looked at and did not take, chosen candidate aside.
    others: candidates.filter((candidate) => candidate !== chosen),
    // A local-purchase line is not pending work; a line with no chosen listing
    // and no such marker still needs a scout.
    local: part.chosen === null,
  };
}

/** Every part line, sorted by name so the order does not depend on the glob. */
export const PARTS = Object.entries(MODULES)
  .map(([modulePath, raw]) => normalise(modulePath, raw))
  .sort((a, b) => a.line.localeCompare(b.line));

/**
 * The parts of each role, in the plan's role order. Roles with no parts are
 * dropped. A part in several roles is listed in each of them, so the role
 * subtotals deliberately do not add up to the kit total.
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

/** The header figures. Only a scouted line carries money. */
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

/** KES the way the listings show it, for example KSh 1,144. */
export function kes(value) {
  if (!Number.isFinite(value)) {
    return 'not priced';
  }
  return `KSh ${Math.round(value).toLocaleString('en-US')}`;
}
