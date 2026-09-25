# contracts

The on-chain layer: an ERC-20 for metered value, an escrow that settles state-channel tickets, and a treasury that pays the founder without letting anyone redirect the payment. Foundry project, Solidity 0.8.26, target chain Base Sepolia (84532) now and Base later.

| File | What it is |
|---|---|
| `src/xKoinToken.sol` | XKN, 6 decimals so one base unit is one micro-KES. Bridge mint with a per-bridge rolling-day cap; `bridgeBurn` is self-only, so no key can burn a user balance. |
| `src/xKoinEscrow.sol` | Deposits, EIP-712 ticket settlement (domain `xKoinEscrow` version `1`), cumulative-unit delta accounting, the owner price band and cooldown. Relayed `withdrawWithSig` (gasless exit) and `transferDeposit` (escrow-to-escrow credit move): EIP-712 authorisations with the destination signed, sharing one per-client `authNonces` counter. |
| `src/xKoinTreasury.sol` | The fee sink. `claim()` is callable by anyone and pays only the beneficiary; the beneficiary change carries a 7-day timelock with a cold-key veto. |
| `script/Deploy.s.sol` | Deploys all three and writes `deployments/<chainId>.json`. Read its header before deploying. |
| `test/xKoin.t.sol` | 35 tests across three suites, including 256-run solvency fuzz invariants for settlement and `transferDeposit` and a stolen-owner-key drill. |
| `foundry.toml` | Remappings, optimizer 2000 runs, cancun, and the `sandbox` profile that pins a pre-fetched solc for hosts that cannot reach `binaries.soliditylang.org`. |

## Prerequisites

Foundry. On this Windows host it lives in `~/.foundry/bin`, which is not on the default PATH:

    export PATH="$HOME/.foundry/bin:$PATH"
    forge --version        # forge Version: 1.5.1-stable, exit 0

The vendored dependencies in `lib/` (forge-std, openzeppelin-contracts) are in git objects. If `lib/` is empty after extracting a tarball:

    git checkout -- contracts/lib

`scripts/bootstrap.sh` does this for you.

## Test

    cd contracts
    forge test

Verified on 2026-09-26: exit 0, 35 tests passed across 3 suites. Add `-vvv` for traces, `--gas-report` for the gas table.

## Deploy

Read the header of `script/Deploy.s.sol` first: it names every environment variable and the order the three contracts have to go up in. The local proof run is the shortest working example:

    protocol/e2e_chain_proof.sh

That starts anvil, deploys with `DEPLOYER_KEY` and `BRIDGE_ADDRESS`, then settles simulator-derived EIP-712 tickets against the real escrow. Expect `digest parity`, the solvency assertion and the founder payout property to all pass; settle gas for a two-ticket batch measured 191,686 on the last run.

Base Sepolia and Base RPC endpoints are declared in `foundry.toml`, so `--rpc-url base_sepolia` resolves without a URL on the command line. Never deploy to mainnet from a single key: `HANDOVER.md` item 10 requires a Gnosis Safe multisig owner first.

## Invariants that must not drift

- Escrow solvency: `token.balanceOf(escrow) == sum(deposits) + sum(earnings)`. Fee transfers are the exact sum of per-ticket floors, never `feeOn(gross)`.
- The `Ticket` struct field order is fixed by the MVP plan and baked into `TICKET_TYPEHASH`. Changing it changes every signature ever produced.
- Tickets on chain are EIP-712 secp256k1. Ed25519 stays at the edge for receipts and vouchers. Both are proven across implementations.
- `vm.expectRevert` binds to the next external call. Hoist view calls such as `escrow.PRICE_MAX()` into locals before it, or the revert matches the wrong call. This has bitten once already.
- `setUp` mints count against the current rolling day, so warp before testing the mint cap.
