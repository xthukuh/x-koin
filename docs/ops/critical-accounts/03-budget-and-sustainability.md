# Budget and self-sustainability

Measured on 2026-09-09 with `cast gas-price` against the public Base RPC and the Binance ETHUSDT ticker; the KES rate is implied by Martin's own P2P trade (900 KES for 7.30001286 USDT).

| Input | Value | Source |
|---|---|---|
| Base L2 gas price | 0.006 gwei (6,000,000 wei) | `cast gas-price --rpc-url https://mainnet.base.org` |
| Ethereum L1 gas price | 0.062 gwei | `cast gas-price` on L1; sets the L1 data fee Base adds |
| ETH price | 2,468.58 USDT | Binance ticker |
| USDT to KES | 123.29 | 900 / 7.30001286 |
| ETH in KES | 304,350 | product of the two |
| Settle one ticket batch | 191,698 gas | measured in the chain e2e proof |

Re-run the calculator any time with today's numbers:

```bash
.venv/Scripts/python.exe scripts/gas_budget.py
```

```bash
.venv/Scripts/python.exe scripts/gas_budget.py --gas-gwei 0.006 --eth-usd 2468.58 --usd-kes 123.29
```

Add `--rpc <url> --address <0x...>` pairs and it also reports live ETH balances and the runway of each hot wallet.

## What one operation costs today

| Operation | Gas | ETH | USD | KES |
|---|---|---|---|---|
| Settle a batch, one ticket (measured) | 191,698 | 0.00000115 | 0.0028 | 0.35 |
| Each additional ticket in the batch (estimate, measured in phase 1) | ~65,000 | 0.00000039 | 0.0010 | 0.12 |
| `bridgeMint` for one top-up (estimate) | ~70,000 | 0.00000042 | 0.0010 | 0.13 |
| `depositWithPermit` relayed for the client (estimate) | ~95,000 | 0.00000057 | 0.0014 | 0.17 |
| `claim` on the treasury (estimate) | ~55,000 | 0.00000033 | 0.0008 | 0.10 |
| Deploy all three contracts plus `setBridge` (measured on anvil) | 4,207,312 | 0.000025 | 0.062 | 7.7 |
| Create a Safe (estimate) | ~300,000 | 0.0000018 | 0.0044 | 0.55 |

The L1 data fee that Base adds on top is under 5% of these at today's L1 price and is folded into the estimates. Phase 1 replaces every estimate with a receipt.

## The self-funding loop, honestly

The treasury earns XKN, which is KES. Gas is paid in ETH. Nothing on chain converts one into the other, and XKN has no liquidity pool, by design: it is a receipt for KES held at Equity, not a traded token. So "the contract funds itself" has a precise meaning:

1. Every settlement batch moves 5% of gross to the treasury. That fee is the operator's revenue and it is earned in the same transaction that costs gas.
2. The relayer only settles when the fee it will earn exceeds the gas it will spend by a margin. That rule makes every settlement net positive in KES terms. It is a threshold in the relayer, not a contract change.
3. The fee income is periodically claimed to the beneficiary, paid out to KES through Jenga (the payout worker already does this), and a fraction of it buys ETH that refills the gas reserve. This is the one step with a person in it, and at pilot volumes it is a few minutes a month.

The break-even for step 2, with the placeholder price and today's gas:

    fee per batch     = 5% x gross
    gas per batch     = 0.35 KES + 0.12 KES x (tickets - 1)
    break-even gross  = gas / 5%  = 7.0 KES for a one-ticket batch
    at 0.05 KES/MB    = 140 MB of relayed traffic per batch

The relayer therefore batches until the pending fee is at least two times the estimated gas (a 2x margin absorbs a gas spike between estimate and inclusion), and never more often than a cadence that keeps node operators paid promptly. Both numbers become `XKOIN_SETTLE_MIN_FEE_MULTIPLE` and `XKOIN_SETTLE_MAX_INTERVAL_S` in the gateway when the relayer loop is written (phase 1 exit criterion).

### Runway

A hot wallet's runway is its ETH balance divided by its daily gas spend. The calculator prints it from live balances. Operating thresholds:

| Wallet | Refill when below | Refill to | Why |
|---|---|---|---|
| Relayer | 7 days of runway | 30 days | Settlements are the revenue; never let them stall |
| Bridge | 7 days | 30 days | A stalled mint means a customer paid KES and got nothing |
| Gas reserve | 90 days of total spend | 180 days | The reserve is refilled from fee income by a person |

At pilot volume (say 20 top-ups and 5 batches a day) the daily spend is about 8 KES (20 x 0.30 for mint plus deposit, 5 x 0.35 for batches), so 30 days of runway is 240 KES of ETH, about 0.0008 ETH. The rehearsal itself has no users, so spend stays near zero until Equity goes live and the reserve is refilled from fees by then.

### What is not covered by gas, and matters more

Every KES that enters through Jenga carries a Finserve charge (the sample response in the docs shows 1 KES on a 2 KES payment; confirmed during onboarding), and every payout through send-to-mobile carries another. Those charges are tens to hundreds of times the chain gas per operation. The network's viability is decided by the per-unit price clearing backhaul cost plus those fiat charges, which is HANDOVER backlog item 8, and nothing in this folder changes that. What this folder removes is the worry that chain gas is a cost centre: it is not.

## Stretching 7.30 USDT

| Slice | USDT | Becomes | Spent on | When |
|---|---|---|---|---|
| Gas reserve | 2.00 | ~0.0008 ETH on Base | Mainnet deploy, Safe, ownership transfer, a handful of capped mints and settles, then about 30 days of pilot gas at 20 top-ups a day | Phase 5 |
| Untouched | 5.30 | Stays USDT on Binance | Second mainnet round if phase 5 finds a defect, or a further 80 days of pilot gas | Only if needed |

Phases 0 to 4 spend nothing. The phase 5 rehearsal as planned spends about 0.09 USD of gas and leaves the reserve at roughly 1.9 USD, which is over 600 one-ticket settlements at today's price.

The only number that can break this plan is Binance's minimum withdrawal on the Base network. If it is above 2 USDT worth of ETH on the day, withdraw the minimum; the difference stays in the reserve.

## Measures against anyone draining anything

Already enforced by the contracts and proven by the 28 forge tests:

- Client deposits leave the escrow only to the client or, through a signed ticket, to a node admin's earnings and the treasury. No owner function touches deposits.
- Treasury fees leave only to the beneficiary. `claim` takes no destination.
- Changing the beneficiary takes seven public days and the current beneficiary can veto.
- The bridge mints at most its daily cap and burns only its own balance.
- The fee is capped at 10% and the price at 500 KES/MB with a one-day cooldown, so the owner can hurt margins but cannot confiscate or halt.

Added by this plan on the key side:

- Owner is a 2-of-3 Safe, so one stolen signer changes nothing.
- The bridge's daily cap on Sepolia is set to 5,000 KES and on the mainnet rehearsal to 100 KES, then to 0 until Equity goes live. The cap is the budget of a compromise.
- Hot wallets hold days of gas, not the reserve.
- Binance withdrawals go only to the whitelisted reserve address, with a 24 hour hold on any new address.

## What "autonomous" means at each stage

| Stage | Person needed for | Frequency |
|---|---|---|
| Pilot | Buying ETH from fee income and sending it to the reserve; topping hot wallets from the reserve | Monthly, minutes |
| Growth | Same, plus rotating keys and reviewing the caps | Monthly |
| Later, if wanted | None for gas, if a treasury-owned keeper is allowed to swap a slice of fees for ETH through a liquidity pool. That makes XKN publicly tradable, which is a regulatory question for counsel before it is an engineering one | |

The pilot stage is the target of this plan. The last row is listed so the path is known, not so it is taken now.
