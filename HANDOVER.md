# xKoin Cloud Session Handover

Date: 2026-09-08. From: Claude (cloud session, claude.ai). To: Claude Code on Martin's local machine (gh and toolchain pre-authorized). Martin Thuku is the founder and inventor; this session made me part of the founding team, which in practice means: build, prove, and say the uncomfortable thing early.

## 0. Mission in one paragraph

xKoin is Martin's invention: a decentralized hybrid PLC + LoRa mesh for Kenya with trust-minimized state-channel micro-settlement (pay per cryptographically verified byte) bridged to M-Pesa (Daraja) and Equitel (Jenga) fiat. Design suite lives in Google Drive folder `1sGO3-5NW9MIdlDhqeDNEUK6j0zd3L2nx` ("xKoin Project - MVP E2E Documentation", docs 00-06). Doc 02 (MVP plan, id `1QPBO57t97d0RfGVUtGfXuggegdvM8Oks7mxGwSgVpbU`) is the implementation source of truth. This repo implements phases 1-3 of it plus the protocol layer.

## 1. First 30 minutes locally

    tar xzf x-koin.tar.gz && cd x-koin
    scripts/bootstrap.sh          # restores contracts/lib from git, runs EVERY proof
    gh repo create x-koin --private --source=. --remote=origin --push

Expected proof matrix (all green as of commit bcf91de, re-verified from this exact tarball before handover):

| Component | Proof | Command | Result |
|---|---|---|---|
| Contracts (token/escrow/treasury) | 35 Foundry tests incl. 256-run solvency fuzz, stolen-owner-key drill | `cd contracts && forge test` | 35 passed |
| gateway-api (Daraja/Jenga/vouchers) | 9 pytest, HTTP fully mocked | `cd gateway-api && pytest` | 9 passed |
| XKP protocol units | 11 pytest | `cd protocol && pytest` | 11 passed |
| XKP scenarios S1-S6 | discrete-event sim, deterministic seeds | `cd protocol && python3 run_sim.py` | ALL SCENARIOS PASSED |
| Firmware portable core (C) | 75 host checks incl. Python-signed Ed25519 receipt verified in C, byte-exact codec both directions, full 1-byte corruption sweep | `cd firmware/xkoin-gateway/test/host && make run` | 75 checks |
| Full loop | anvil + forge deploy + sim-derived EIP-712 tickets settled on real escrow + stranger-triggered founder payout | `protocol/e2e_chain_proof.sh` | digest parity, solvency, payout property all asserted |

Headline numbers: settle gas 191,698 for a 2-ticket batch; 9.768 Mbps goodput on the 10 Mbps HomePlug model (97.7%); ~0.8 s grid-failure failover to LoRa; 0/20,000 garbage frames accepted; 25 MB settles as 2500 units for 1.25 KES gross at the 500 uKES placeholder price.

Same matrix, containerised (no local Python/Foundry/gcc needed): README.md section "Run the proofs in Docker", or `scripts/docker-proofs.sh` directly.

## 2. Locked decisions (do not silently revisit)

1. Monorepo named `x-koin` (Martin's instruction overrides doc 02's "xKoin-Core" name; internal layout follows the doc).
2. L2 target: Base Sepolia now, Base later. `chain_id 84532` in configs.
3. On-chain billing unit: 1 unit = 10 KB. Consequence Martin accepted: XKN has 6 decimals (base unit = 1 micro-KES) because 2 decimals could not express sub-cent per-unit prices.
4. Price: DEFERRED by Martin until it can clear measured backhaul cost. Placeholder 500 uKES/unit (0.05 KES/MB). Floor formula in spec s8. Doc 04 payback claims are conditional on this; never quote them bare.
5. Tickets on-chain are EIP-712 secp256k1 (domain `xKoinEscrow`/`1`); Ed25519 stays at the edge for receipts and vouchers. Both proven cross-impl.
6. GFSK 150 kbps adaptive modulation is in MVP firmware scope (same SX1262).
7. Window 16 is the protocol default (measured knee; 32+ hurts LoRa), 8 on LoRa-only paths.
8. Founder-safety layer (Martin's explicit requirement, implemented and tested): treasury `claim()` anyone-callable and beneficiary-only; 7-day beneficiary timelock with founder-cold-key veto; price band 1..50,000 uKES with 1-day cooldown; `bridgeBurn` self-only (no key can burn user balances); per-bridge rolling-day mint cap (50k KES default); Ownable2Step everywhere. The network must keep settling if Martin vanishes, and it does.
9. Interactive decision-making: material decisions go to Martin as options with reasoning and pros/cons. Ambiguity that changes the work gets a question; ambiguity that does not gets a stated assumption.

## 3. Invariants that must not drift

- Wire formats are triple-implemented (Python reference, C firmware, and the Solidity/EIP-712 side). Any codec change: edit protocol/xkp first, run `python3 protocol/gen_vectors.py`, then make the C suite pass again.
- Frame: 27 B header + CRC16-CCITT (poly 0x1021 init 0xFFFF), magic 0x4B58, version nibble 1. Receipt canonical: `<8s8s16sQI` = 44 B + 64 B sig = 108 B (fits the 128 B KQ-130F MTU by design; keep it that way).
- Ticket struct field order is fixed by doc 02 and baked into TICKET_TYPEHASH.
- The eight Laws (protocol/spec.md s7) each map to a named test. A PR that weakens a Law's test is a design change, not a refactor.
- Escrow solvency: token.balanceOf(escrow) == sum(deposits) + sum(earnings), fee transfers are the exact sum of per-ticket floors (never feeOn(gross)).
- SX1262 pins are doc-02-fixed (SCK12 MISO13 MOSI11 CS10 DIO1-14 BUSY21, KQ-130F on UART2 17/18); pins marked `proposed` in hardware/pinmap.md await Martin's sign-off.

## 4. Open backlog, in order, with acceptance criteria

1. Push repo via gh (above). Done when `git push` round-trips.
2. B2C payout worker (gateway-api): watch Transfer(beneficiary -> bridge), fire Daraja B2C to Martin's MSISDN, then `bridgeBurn` (self-only, new 2-arg signature). Security property to preserve: server compromise may delay, never redirect (B2C only for transfers originating from beneficiary; MSISDN pinned in signed config). Tests mocked like the rest.
3. `pio run` the ESP-IDF glue (src/main.c, captive portal): written to doc 02 pinout, COMPILE-UNTESTED because Espressif hosts were unreachable from the cloud sandbox (403 host_not_allowed, verified). Same for the Wokwi custom chip stubs in hardware/wokwi: verify on first wokwi.com load.
4. SX1262 register values tagged VERIFY in lib/sx1262/sx1262.h (GFSK RX_BW code, packet params) against DS.SX1261-2 at bring-up.
5. Sandbox credentials into gateway-api/.env (template committed): Daraja sandbox app + Jenga UAT + RSA keypair registered on Finserve portal. Flip XKOIN_DRY_RUN=false only after that.
6. Satellite firmware (shares gateway lib/ by design; deep sleep, DIO1 wake, VBAT ADC on GPIO1).
7. Kiosk web (buy-gas flow against gateway-api /buy-gas, doc 02 phase 3).
8. Pricing decision: measure Equitel bulk bundle KES/MB + Squid cache hit rate, apply spec s8 floor, then bring Martin options with pros/cons.
9. Regulatory gates before field trial / mainnet fiat: CAK duty-cycle rules for 868 MHz (unverified), CAK transit-resale licensing, CBK e-money review.
10. Gnosis Safe multisig owner before any mainnet deployment.
11. Drive doc 06 (risk register, id `1ureVFurxGqOanSu9lMc9UNmI1IeXomFxuaGPf11hJco`) needs its owner/bridge rows refreshed to match spec s8.1; the cloud connector could create but not edit Docs, so this transfers to you or Martin.

## 5. Sharp edges learned the hard way

- Foundry `vm.expectRevert` binds to the NEXT external call: hoist view calls like `escrow.PRICE_MAX()` into locals before it (bit us once, fixed).
- Token mint-cap window: setUp mints count against the current rolling day; warp before cap tests.
- Sim modeling: acks are priority (never queue behind the sender's own data window) or half-duplex media produce spurious timeout storms; retry ceiling is 30 because ack loss compounds (0.64^n at 40% frame loss).
- depositWithPermit wraps permit in try/catch on purpose: a front-run permit must not brick the deposit.
- httpx serializes JSON without spaces; assert `"Amount":20` not `"Amount": 20`.
- The tarball ships without contracts/lib working copies but git objects have them: `git checkout -- contracts/lib` (bootstrap does this).
- scripts/push_to_github.sh (PAT flow) is now superseded by gh locally; kept as fallback.

## 6. Working agreements with Martin (carry these)

Every substantive turn ends with the cumulative alignment checklist (items never drop off; statuses done/pending/blocked/declined). Decisions go to him with reasoning and pros/cons. No em dashes, no AI-tell vocabulary, prose by construction not negative enumeration, lead with the finding. Correct errors that change his decisions in one plain sentence, then continue. Protect his interests structurally, including from his own keys (that is how s8.1 happened), and never let project materials overclaim: "zero-trust" belongs to the peer layer only. He runs several projects at once; keep reports scannable.

## 7. Git history at handover

    bcf91de founder control without founder risk (treasury claim design, bands, caps)
    530395e de-naivety pass (Ownable2Step, trust disclosure, PAT script)
    6c73e32 10KB unit + 6-decimal rescale; firmware skeleton, host-proven core
    c117147 XKP protocol + sim proof + Laws + schematics + Wokwi harness
    def91ac phase 2+3 fiat layer (contracts + gateway-api)

Plus this handover commit. Delivered outside the repo this session: xkoin-gateway.svg and xkoin-satellite.svg (also in hardware/), and Drive doc
06. The cloud session archives after you confirm bootstrap green locally.
