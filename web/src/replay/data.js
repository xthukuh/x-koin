/*
 * Adapters over the three proof files. Nothing on /replay invents a number:
 * every figure the page shows is read from one of these imports, from a
 * contract source file, or from a paper, and the panel that shows it names
 * the file it came from.
 *
 *   web/src/proof/chain.json  end-to-end run against a local chain (id 31337)
 *   web/src/proof/kiosk.json  gateway-api dry run, HTTP mocked
 *   web/src/proof/trace.json  discrete-event simulation, three scenarios
 */

import chain from '../proof/chain.json';
import kiosk from '../proof/kiosk.json';
import trace from '../proof/trace.json';

export const CHAIN = chain;
export const KIOSK = kiosk;
export const TRACE = trace;

export const SRC = {
  chain: 'web/src/proof/chain.json',
  kiosk: 'web/src/proof/kiosk.json',
  trace: 'web/src/proof/trace.json',
  escrow: 'contracts/src/xKoinEscrow.sol',
  token: 'contracts/src/xKoinToken.sol',
  treasury: 'contracts/src/xKoinTreasury.sol',
  tests: 'contracts/test/xKoin.t.sol',
  frames: 'protocol/xkp/frames.py',
  proofs: 'protocol/xkp/proofs.py',
  settle: 'protocol/xkp/settle.py',
  sim: 'protocol/xkp/sim.py',
  runSim: 'protocol/run_sim.py',
  protoTests: 'protocol/tests/test_xkp.py',
  spec: 'protocol/spec.md',
  classifier: 'firmware/xkoin-gateway/lib/router/classifier.c',
  vouchers: 'gateway-api/app/vouchers.py',
  bridge: 'gateway-api/app/settlement/chain.py',
  payout: 'gateway-api/app/payout/worker.py',
  paperProtocol: 'docs/papers/03-protocol-xkp.md',
  paperMoney: 'docs/papers/04-settlement-and-economics.md',
  paperSecurity: 'docs/papers/10-security-and-trust.md',
  paperArch: 'docs/papers/02-system-architecture.md',
  decisions: 'docs/_drive/05-architecture-decisions-and-tradeoffs.md',
};

/* ----------------------------------------------------------- formatting */

const KES_FMT = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 6 });

/** Micro-KES (the XKN base unit, 6 decimals) rendered as shillings. */
export function kes(ukes) {
  const value = Number(ukes) / 1e6;
  return `${KES_FMT.format(value)} KES`;
}

export function num(value) {
  return new Intl.NumberFormat('en-KE').format(Number(value));
}

export function shortHex(value, head = 6, tail = 4) {
  const text = String(value ?? '');
  if (text.length <= head + tail + 2) {
    return text;
  }
  return `${text.slice(0, head)}..${text.slice(-tail)}`;
}

export function bytes(value) {
  const n = Number(value);
  if (n >= 1e6) {
    return `${(n / 1e6).toFixed(2)} MB`;
  }
  if (n >= 1e3) {
    return `${(n / 1e3).toFixed(1)} kB`;
  }
  return `${num(n)} B`;
}

export function rate(bps) {
  const n = Number(bps);
  if (n >= 1e6) {
    return `${(n / 1e6).toFixed(2)} Mbps`;
  }
  return `${(n / 1e3).toFixed(2)} kbps`;
}

export function seconds(value) {
  const n = Number(value);
  if (n >= 60) {
    const m = Math.floor(n / 60);
    return `${m} min ${Math.round(n - m * 60)} s`;
  }
  return `${n.toFixed(2)} s`;
}

export function unixTime(value) {
  return new Date(Number(value) * 1000).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}

/* --------------------------------------------------------- chain adapters */

/** Address to the role names that share it, from chain.json actors. */
export const ROLE_BY_ADDRESS = (() => {
  const map = new Map();
  Object.entries(CHAIN.actors).forEach(([role, address]) => {
    const key = address.toLowerCase();
    map.set(key, [...(map.get(key) ?? []), role]);
  });
  Object.entries(CHAIN.contracts).forEach(([role, address]) => {
    const key = address.toLowerCase();
    map.set(key, [...(map.get(key) ?? []), role]);
  });
  return map;
})();

export function roleOf(address) {
  return (ROLE_BY_ADDRESS.get(String(address ?? '').toLowerCase()) ?? []).join(' = ');
}

/** One row per distinct address: contracts first, then accounts. */
export const ADDRESS_BOOK = (() => {
  const rows = [];
  const seen = new Set();
  const push = (kind, role, address) => {
    const key = address.toLowerCase();
    if (seen.has(key)) {
      const row = rows.find((r) => r.address.toLowerCase() === key);
      row.roles.push(role);
      return;
    }
    seen.add(key);
    rows.push({ kind, roles: [role], address });
  };
  Object.entries(CHAIN.contracts).forEach(([role, address]) => push('contract', role, address));
  Object.entries(CHAIN.actors).forEach(([role, address]) => push('account', role, address));
  return rows;
})();

export const CONTRACT_PURPOSE = {
  token: 'ERC-20 XKN with EIP-2612 permit. Minted against confirmed KES, burned on payout.',
  escrow: 'Holds client deposits, verifies EIP-712 tickets, pays node admins, forwards the fee.',
  treasury: 'Receives the fee. claim() pays the beneficiary and nobody else.',
};

export const ACCOUNT_PURPOSE = {
  deployer: 'Deploys the three contracts, then is discarded.',
  owner: 'Price inside the band, fee under the cap, bridge allowlist. No access to deposits.',
  bridge: 'Mints against confirmed fiat up to a rolling daily cap; burns only its own balance.',
  client: 'Buys gas with KES, deposits XKN, signs tickets for the bytes it received.',
  gateway: 'Node admin that served the session and holds the receipts.',
  satellite: 'Node admin that served a client over LoRa and used the gateway as backhaul.',
  relayer: 'Submits ticket batches. Holds no privilege; a stolen relayer key costs its gas.',
  beneficiary: 'The only address treasury.claim() can pay.',
};

/** Accounts that ever hold XKN in the run, in display order. */
export const BALANCE_ACCOUNTS = (() => {
  const names = Object.keys(CHAIN.balances[0].xkn);
  const moved = names.filter((name) => CHAIN.balances.some((row) => row.xkn[name] > 0));
  // deployer, owner and beneficiary are one address in this run; show it once.
  const byAddress = new Map();
  const out = [];
  moved.forEach((name) => {
    const address = CHAIN.actors[name] ?? CHAIN.contracts[name];
    const key = String(address ?? name).toLowerCase();
    if (byAddress.has(key)) {
      byAddress.get(key).alias.push(name);
      return;
    }
    const row = { name, alias: [], address };
    byAddress.set(key, row);
    out.push(row);
  });
  return out;
})();

export const MAX_BALANCE = CHAIN.balances.reduce(
  (max, row) => Math.max(max, ...Object.values(row.xkn)),
  0,
);

/** The settlement batch transaction, which every money figure hangs off. */
export const SETTLE_TX = CHAIN.txs.find((tx) => tx.fn === 'settleTicketBatch');
export const CLAIM_TX = CHAIN.txs.find((tx) => tx.fn === 'claim');
export const MINT_TX = CHAIN.txs.find((tx) => tx.fn === 'bridgeMint');
export const DEPOSIT_TX = CHAIN.txs.find((tx) => tx.fn === 'deposit');
export const APPROVE_TX = CHAIN.txs.find((tx) => tx.fn === 'approve');
export const SET_BRIDGE_TX = CHAIN.txs.find((tx) => tx.fn === 'setBridge');
export const DEPLOY_TXS = CHAIN.txs.filter((tx) => tx.fn.startsWith('create:'));
export const GAS_TXS = CHAIN.txs.filter((tx) => tx.fn === 'eth transfer');

export const BATCH_SETTLED = SETTLE_TX.logs.find((log) => log.event === 'BatchSettled').args;
export const TICKET_SETTLED = SETTLE_TX.logs
  .filter((log) => log.event === 'TicketSettled')
  .map((log) => log.args);

export const DEPLOY_GAS = [...DEPLOY_TXS, SET_BRIDGE_TX].reduce((sum, tx) => sum + tx.gas_used, 0);

/* --------------------------------------------------------- trace adapters */

export const MEDIUM_LABEL = {
  homeplug: 'HomePlug AV (broadband PLC)',
  kq130f: 'KQ-130F (narrowband PLC)',
  'lora-sf7': 'LoRa SF7',
  'gfsk-150k': 'GFSK 150k',
};

export const MEDIUM_TOKEN = {
  homeplug: 'var(--xk-plc)',
  kq130f: 'var(--xk-nbplc)',
  'lora-sf7': 'var(--xk-lora)',
  'gfsk-150k': 'var(--xk-lora)',
};

export const SCENARIO_IDS = Object.keys(TRACE.scenarios);

/** Per-medium totals for one scenario: application bytes and wire bytes. */
export function scenarioTotals(scenario) {
  return Object.keys(scenario.mediums).map((medium) => {
    const app = (scenario.bins[medium] ?? []).reduce((a, b) => a + b, 0);
    const wire = (scenario.tx_bins[medium] ?? []).reduce((a, b) => a + b, 0);
    return { medium, app, wire, model: scenario.mediums[medium] };
  });
}

/* ------------------------------------------------------- derived figures */

export const UNIT_BYTES = CHAIN.params.unit_bytes;
export const PRICE_PER_UNIT = CHAIN.params.price_per_unit_ukes;
export const FEE_BPS = CHAIN.params.fee_bps;

/** The S1 scenario is the browsing journey: 25 MB relayed, 2,500 units. */
export const S1 = TRACE.scenarios.s1;
export const S1_RECEIPTS = S1.events.filter((event) => event[1] === 'receipt');
export const S1_UNITS = S1.summary.proven_bytes / UNIT_BYTES;
