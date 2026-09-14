# Test plan: five phases, each with an exit

Each phase ends with a receipt: a transaction hash, a log line, a signed message. Receipts go into [registry.md](registry.md) under the phase, so the proof is a list of links anyone can open, not a claim.

Phases 0 to 4 cost nothing. Phase 5 spends about 0.09 USD of ETH.

## Phase 0: local chain (done, kept green)

`scripts/bootstrap.sh` deploys on anvil and settles simulated tickets against the real escrow. It is the regression net for everything below; run it before and after each phase.

Exit: bootstrap green. Already true on Windows and in Docker.

## Phase 1: Base Sepolia, the contracts and the gas receipts

Needs: faucet account, Alchemy account, Basescan key, the stand-in seed in Rabby, `cast wallet new` for deployer, bridge, relayer, client, node admin.

1. Faucet ETH to the deployer; forward a slice each to bridge, relayer and client with `cast send`.
2. Deploy with `BENEFICIARY_ADDRESS` set to the stand-in beneficiary and `BRIDGE_ADDRESS` to the bridge. The script writes `contracts/deployments/84532.json`; commit it.
3. Verify all three on Sepolia Basescan with `forge verify-contract`.
4. Owner (still the deployer in this phase) sets the bridge daily cap to 5,000 KES.
5. Fill `gateway-api/.env` from `.env.sepolia.example`, `XKOIN_DRY_RUN=false`, run the gateway locally, and drive one full cycle by hand: `bridgeMint` 100 KES to the client, `depositWithPermit` 100 KES, settle a one-ticket batch, settle a five-ticket batch, `claimEarnings` from the node admin, `claim` on the treasury to the beneficiary.
6. Record the gas used from every receipt into the budget doc's table, replacing the estimates.
7. Write the relayer's settle-threshold rule (fee at least twice the estimated gas, or the maximum interval reached) with a mocked test.

Exit: six transaction hashes on Sepolia Basescan; solvency holds (`balanceOf(escrow) == sum(deposits) + sum(earnings)`); the budget table has no estimates left in it.

## Phase 2: the webhook proof, fiat to contract

Needs: `xkoin.thuku.dev` up ([06-vps-xkoin.thuku.dev.md](06-vps-xkoin.thuku.dev.md)), Jenga sandbox credentials, the RSA public key registered on the Finserve portal.

1. Gateway on the VPS, `.env` pointing at Sepolia, `XKOIN_CALLBACK_BASE_URL=https://xkoin.thuku.dev`.
2. From the laptop, call `/buy-gas` for 50 KES with a UAT test MSISDN. The gateway sends the M-Pesa STK push init to Jenga UAT with our callback URL.
3. Complete the sandbox prompt. Jenga posts the IPN to `/jenga/mpesa-callback`. The handler keys on `customer.reference`, finds the order, and calls `bridgeMint(client, 50 KES, keccak(transactionReference))`.
4. On Sepolia Basescan, the `BridgeMint` event shows the client, the amount, and a `fiatRef` equal to `keccak256` of the Jenga reference in the IPN. That equality is the link between the bank's confirmation and the chain.
5. Repeat with an Equitel merchant payment (the other on-ramp), then a deliberately wrong signature to see the gateway reject it and mint nothing.

Exit: two `BridgeMint` transactions whose `fiatRef` matches the IPN reference by hash, one rejected callback in the log, no mint for it. This is the "fiat bridge webhooks to the smart contract" proof Martin asked for.

## Phase 3: ownership rehearsal, the Safe and the timelock

Needs: the Safe on Sepolia with three stand-in signers, threshold 2.

1. Deployer calls `transferOwnership(safe)` on token, treasury, escrow.
2. From the Safe, `acceptOwnership()` on each (three Safe transactions, two signatures each). Confirm `owner()` returns the Safe on all three.
3. Prove the deployer is powerless: `setFeeBps(600)` from the deployer reverts with `OwnableUnauthorizedAccount`.
4. From the Safe, `setFeeBps(600)` succeeds; set it back to 500.
5. From the Safe, `queueBeneficiary(attacker)`. From the stand-in beneficiary key, `cancelBeneficiaryChange()`. Confirm `pendingBeneficiary` is zero. This is the founder veto working against the owner.
6. From the Safe, `queueBeneficiary(newCold)`, warp is impossible on a real chain, so wait seven days, then anyone calls `activateBeneficiary()`. Start this step early in the phase so the wait overlaps phase 4.
7. From the Safe, `setBridge(oldBridge, false, 0)` then `setBridge(newBridge, true, cap)`, with the gateway `.env` switched in between. A mint from the new bridge succeeds; one from the old reverts with `NotBridge`.

Exit: transaction hashes for every step, including the two reverts, and a written note of how long each Safe action took Martin to sign. That note sizes the operational burden of the multisig honestly.

## Phase 4: the payout leg, fees to KES

Needs: phase 2 infrastructure, the payout MSISDN pin signed by the stand-in beneficiary key (`app/payout/pin.py`).

1. Beneficiary transfers claimed XKN to the bridge address.
2. The payout worker sees `Transfer(beneficiary -> bridge)`, checks the pinned MSISDN against the treasury's beneficiary, fires Jenga send to mobile (UAT) for the amount, and on confirmation calls `bridgeBurn`.
3. Tamper test: change `XKOIN_PAYOUT_MSISDN` in `.env` without re-signing; the worker refuses to pay and logs why.

Exit: one `BridgeBurn` with a `fiatRef` matching the Jenga send reference, one refused payout in the log. Circulating XKN equals minted minus burned.

## Phase 5: Base mainnet rehearsal (spends cents)

Needs: the hardware wallet in hand and initialised, the mainnet Safe created with the real signers, about 2 USDT of ETH withdrawn from Binance to the gas reserve ([01-registrations.md](01-registrations.md) section 1).

1. Reserve funds a fresh mainnet deployer and a fresh mainnet relayer and bridge key. None of the Sepolia keys are reused.
2. Deploy with `BENEFICIARY_ADDRESS` set to the hardware wallet's first address (checked on the device screen) and the bridge daily cap at 100 KES. Verify on Basescan. Commit `contracts/deployments/8453.json`.
3. Transfer ownership to the mainnet Safe and accept from it. Discard the deployer key.
4. One capped mint of 10 KES to a test client, one deposit, one settlement, one treasury claim. Every one of these is a real transaction that costs real gas and proves the same code runs on the real chain.
5. From the Safe, `setBridge(bridge, true, 0)`: mint capacity zero until Equity's live onboarding completes. The contracts are live, owned, and inert.
6. Sign the ownership statement from [docs/ops/key-management.md](../key-management.md) section 6 on the device and hand it to counsel.

Exit: contracts on Base, verified, owned by the Safe, beneficiary the hardware wallet, bridge cap zero, gas reserve balance and runway recorded. With this in hand the Equity production integration is an onboarding task, not an engineering risk.

## What each phase proves for the wider objective

| Martin's question | Proven in |
|---|---|
| Webhooks from the fiat bridge reach the contract with a verifiable link | Phase 2 |
| We can own and manage a contract, and only we can | Phase 3, again on mainnet in phase 5 |
| Fee and gas economics are feasible and self-sustaining | Phase 1 receipts plus the budget doc; the settle threshold makes it structural |
| Funds are isolated to designated wallets and nobody can drain them | Phase 1 solvency check, phase 3 veto, the contract tests already in the repo |
| Addresses are transferable and easy to reconfigure | Phase 3 step 7, and the deployments file plus `.env` pattern |
| The budget is not blown on tests | Phases 0 to 4 spend zero; phase 5 spends about 0.09 USD |
