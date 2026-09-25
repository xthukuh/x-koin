/*
 * Gas per contract call, and where each figure comes from. The /demo ledger
 * prints the source next to every cost so a number can be traced to its
 * measurement and re-run.
 *
 * measured  forge test --gas-report on contracts/test (35 tests, 2026-09-26),
 *           or the anvil chain proof in web/src/proof/chain.json
 * probe     a throwaway forge test run on 2026-09-25 for paths the suite does
 *           not exercise, then deleted (numbers recorded here)
 * model     derived from measured points by the EIP-2200 storage rule below
 * estimate  no measurement exists; the basis is stated
 *
 * EIP-2200: writing a zero slot to non-zero costs 20,000 gas, a non-zero slot
 * to non-zero 2,900. So a call whose storage is already warm costs 17,100 less
 * per slot. That one rule plus four probes predicts a warm single-ticket
 * settle at 80,091 gas against a measured 80,103.
 */

export const FRESH_SLOT_DELTA = 17_100;

export const GAS = {
  // xKoinToken
  setBridge: { gas: 48_407, src: 'measured', note: 'forge median, 30 calls' },
  bridgeMint: { gas: 95_816, src: 'measured', note: 'forge median, 33 calls' },
  bridgeBurn: { gas: 33_503, src: 'measured', note: 'forge, 1 call' },
  approve: { gas: 46_365, src: 'measured', note: 'forge median, 269 calls' },
  permit: { gas: 74_707, src: 'measured', note: 'forge, 1 call' },
  transfer: { gas: 51_567, src: 'measured', note: 'forge, 1 call' },
  transferFrom: { gas: 57_594, src: 'probe', note: 'approve then relayed transferFrom' },
  // xKoinEscrow
  deposit: { gas: 81_557, src: 'measured', note: 'forge median, 268 calls, first deposit' },
  depositRepeat: { gas: 43_966, src: 'probe', note: 'second deposit, slots already non-zero' },
  depositWithPermit: { gas: 110_693, src: 'measured', note: 'forge, first deposit with permit' },
  withdrawDeposit: { gas: 63_584, src: 'measured', note: 'forge, 1 call' },
  withdrawWithSig: { gas: 93_358, src: 'measured', note: 'forge max: first use, fresh nonce and recipient slot' },
  transferDeposit: { gas: 83_050, src: 'measured', note: 'forge max: first use, fresh nonce and recipient deposit' },
  claimEarnings: { gas: 59_631, src: 'measured', note: 'forge max, full claim' },
  setPricePerUnit: { gas: 34_861, src: 'measured', note: 'forge max of successful calls' },
  // settleTicketBatch is modelled, see settleGas()
  // xKoinTreasury
  claim: { gas: 54_990, src: 'measured', note: 'forge and chain proof agree' },
  setFeeBps: { gas: 29_788, src: 'measured', note: 'forge max' },
  queueBeneficiary: { gas: 69_752, src: 'measured', note: 'forge' },
  activateBeneficiary: { gas: 30_110, src: 'measured', note: 'forge max' },
  cancelBeneficiaryChange: { gas: 29_501, src: 'measured', note: 'forge max' },
  // Ownable2Step, identical on all three contracts
  transferOwnership: { gas: 47_000, src: 'estimate', note: 'one fresh slot plus base, not measured' },
  acceptOwnership: { gas: 30_000, src: 'estimate', note: 'two slot writes, not measured' },
  // native
  ethTransfer: { gas: 21_000, src: 'measured', note: 'protocol constant, chain proof' },
};

/** Gas a reverted call burns before it stops. forge min per function, which are its revert cases. */
export const REVERT_GAS = {
  settleTicketBatch: 27_400,
  bridgeMint: 24_353,
  setBridge: 24_428,
  claimEarnings: 29_267,
  setPricePerUnit: 23_697,
  setFeeBps: 23_723,
  claim: 27_298,
  activateBeneficiary: 25_546,
  cancelBeneficiaryChange: 25_605,
  default: 25_000,
};

/**
 * settleTicketBatch, fitted to four measurements:
 *   1 ticket, fresh channel, empty treasury   131,391 (probe) 131,415 (forge max)
 *   3 tickets, fresh channels                 251,238 (probe)
 *   2 tickets, fresh channels (anvil)         191,650 (chain.json)
 *   1 ticket, same channel settled before      80,103 (probe)
 * Batch overhead 71,467 plus 59,924 per fresh ticket, minus 17,100 for each
 * slot already non-zero: the treasury balance, and per ticket the channel
 * record and the node's earnings.
 */
export function settleGas(tickets, { treasuryWarm }) {
  let gas = 71_467 - (treasuryWarm ? FRESH_SLOT_DELTA : 0);
  for (const t of tickets) {
    gas += 59_924;
    if (t.channelWarm) gas -= FRESH_SLOT_DELTA;
    if (t.earningsWarm) gas -= FRESH_SLOT_DELTA;
  }
  return gas;
}

/** Economic inputs, paper 04 section 9, measured 2026-09-09. */
export const PRICES = {
  gasPriceGwei: 0.006,
  ethUsd: 2468.58,
  usdKes: 123.29,
  l1FeePct: 0,
};

export const gasToKes = (gas, p) => gas * p.gasPriceGwei * 1e-9 * p.ethUsd * p.usdKes * (1 + p.l1FeePct / 100);
export const gasToUsd = (gas, p) => gas * p.gasPriceGwei * 1e-9 * p.ethUsd * (1 + p.l1FeePct / 100);
export const gasToGwei = (gas, p) => gas * p.gasPriceGwei * (1 + p.l1FeePct / 100);
