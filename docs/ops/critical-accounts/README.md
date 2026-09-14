# Critical accounts: the crypto layer, tested for real

Prepared 2026-09-09 for Martin, who funded a Binance wallet with KES 900 (7.30001286 USDT) and wants to prove, with real infrastructure, that the fiat bridge webhooks reach the contracts, that he alone owns and administers the contracts, and that the fee and gas economics can run without a person topping them up. This folder is the operating manual for that proof and for the accounts it depends on. Nothing here is investment advice; it is the engineering plan for a test budget.

## The one-page answer

**The 7.30 USDT is more than enough, because almost nothing in this plan costs real money.** Four of the five phases run on fake money: a local chain, Base Sepolia (free faucet ETH), the Jenga UAT sandbox (fake KES) and a Safe on Sepolia. Only the last phase, a rehearsal on Base mainnet, spends real ETH, and at the gas price measured today the whole rehearsal costs cents. The plan converts about 2 USDT to ETH for that phase and leaves the rest on Binance untouched.

**USDT never enters the xKoin design.** XKN is backed 1:1 by the KES float the kiosk holds at Equity, and the bridge mints it against a confirmed fiat receipt. The only thing the chain needs from Martin's crypto holdings is ETH on Base to pay gas. So the Binance account has exactly one job: buy a little ETH and send it to the gas reserve wallet.

**The economics finding, measured today** (details and the calculator in [03-budget-and-sustainability.md](03-budget-and-sustainability.md)):

| Item | Gas | Cost today |
|---|---|---|
| Settle one ticket batch (measured 191,698 gas) | 191,698 | 0.35 KES |
| Mint XKN for one top-up (estimate, measured in phase 1) | ~70,000 | 0.13 KES |
| Deploy token, treasury, escrow on Base mainnet (measured on anvil) | 4,207,312 | 7.7 KES |

At the placeholder price of 0.05 KES/MB and a 5% fee, a settlement batch pays for its own gas once it covers about 140 MB of relayed traffic. Chain gas is not the binding cost of the network; Jenga and M-Pesa charges and backhaul bandwidth are, and the pricing decision (HANDOVER backlog item 8) has to clear those, not gas.

## Files in this folder

| File | What it settles |
|---|---|
| [01-registrations.md](01-registrations.md) | Every account to open, in order, where, what to collect, how to harden it, and how money moves between them |
| [02-wallet-roles.md](02-wallet-roles.md) | One wallet per job, what each may do, where its key lives, how to rotate or transfer it, and how addresses flow into `.env` |
| [03-budget-and-sustainability.md](03-budget-and-sustainability.md) | Gas model with measured numbers, the self-funding loop, the stretch plan for 7.30 USDT, what "autonomous" honestly means today |
| [04-security-dos-and-donts.md](04-security-dos-and-donts.md) | The vigilance list: exchange, wallets, server, repo, people |
| [05-test-plan.md](05-test-plan.md) | Five phases with exit criteria, including the webhook-to-contract proof and the ownership rehearsal |
| [06-vps-xkoin.thuku.dev.md](06-vps-xkoin.thuku.dev.md) | The public HTTPS endpoint Jenga needs, on Martin's VPS behind Traefik |
| [07-pass-wall.md](07-pass-wall.md) | The password in front of the presentation site: how it works, changing the default, adding and revoking a named password, rotating the secret, what is logged |
| [registry.md](registry.md) | The address register: public addresses and account handles only, never secrets, committed so every session and every device sees the same map |

Related, already in the repo: [docs/ops/key-management.md](../key-management.md) (the key inventory and the founder cold key procedure) and [docs/ops/jenga-onboarding.md](../jenga-onboarding.md) (sandbox and live steps). This folder does not repeat them; it points at them.

## What Martin does, what the session does

Martin does the things that need a human with the account in front of them: opening accounts, passing KYC, approving 2FA, buying a hardware wallet, withdrawing from Binance, signing on the Safe. Every one of those steps is written out below with what to enter and what to expect.

The session does the rest: key generation for server roles, deployments, verification, the gateway on the VPS, the monitoring, the proofs, and the register updates. Anything that moves real money or real credentials is done by Martin, on his own screen, after the session has laid out exactly what to do.

## Start here

1. Read [01-registrations.md](01-registrations.md) and harden Binance today (ten minutes, no money moves).
2. Add the DNS A record for `xkoin.thuku.dev` (the answer to "give me the word" is yes, see [06-vps-xkoin.thuku.dev.md](06-vps-xkoin.thuku.dev.md)).
3. Open the Coinbase Developer Platform faucet account and the Alchemy account. Both are free and both are needed before phase 1.
4. Order the hardware wallet. It is the long lead item and phase 5 waits on it.
5. Tell the session the faucet and RPC accounts exist. Phases 0 to 3 then run without any real money.
