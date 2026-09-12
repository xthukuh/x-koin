# x-koin

The decentralized trust-minimized crypto network by [Martin Thuku](https://github.com/xthukuh) ~ [thuku.dev](https://thuku.dev).

Decentralized hybrid PLC + LoRa mesh with trust-minimized state-channel
micro-settlement and M-Pesa / Equitel fiat bridging. Source of truth for scope
and phases: Google Drive / "xKoin Project - MVP E2E Documentation" (docs 00-06).

## Trust model, honestly

Peer layer: zero-trust in the strict sense; no peer must trust any other peer
(protocol/spec.md s7, enforced in Python, Solidity, and C). Fiat boundary: has
named trusted parties for MVP (kiosk root key, bridge hot wallet, owner keys)
with an explicit removal roadmap in spec s8 and the risk register (Drive doc
06). Payback figures in the financial model are conditional on per-unit
pricing clearing measured backhaul cost; do not quote them without that check.

## Continuing this project

New machine or new session: read HANDOVER.md first, then `scripts/bootstrap.sh`
re-proves everything (contracts, gateway, protocol, firmware core, chain e2e).

Windows host (Git Bash, Foundry in `~/.foundry/bin`, mingw-w64 gcc):

    python -m venv .venv
    PYTHON=.venv/Scripts/python.exe MAKE=mingw32-make scripts/bootstrap.sh

Verified green on Windows 11 with Python 3.14 and Foundry 1.5.1 (2026-09-09).

## Layout

    contracts/     Solidity (Foundry): xKoinToken, xKoinEscrow, xKoinTreasury
    gateway-api/   FastAPI fiat bridge: Daraja (M-Pesa), Jenga (Equitel), L2 relayer
    firmware/      ESP32-S3 gateway + satellite (phase 1, pending)
    kiosk-web/     Next.js kiosk (phase 3 UI, pending)
    cloud-proxy/   WireGuard + Squid backhaul (phase 4, pending)

## How it works

`docs/how-it-works.md` explains the primitives (identity, token, bridge,
voucher, escrow, receipts and tickets, treasury, relayer, mesh), how they
interact, the reasoning behind each design decision, twelve user and
operator journeys, and the proposed first-MVP feature list. Read it before
HANDOVER.md if you are new to the product rather than to the code.

## Critical accounts and the real-chain test plan

`docs/ops/critical-accounts/` is the operating manual for the crypto layer:
which accounts to open and how to harden them, one wallet per role, the
gas budget with measured numbers (`scripts/gas_budget.py`), the security
list, the five-phase test plan from anvil to a Base mainnet rehearsal, and
the VPS endpoint at `xkoin.thuku.dev`. Public addresses live in its
`registry.md`; deployments are written to `contracts/deployments/<chainId>.json`
by the deploy script.

## Contracts

    cd contracts
    forge test          # 28 tests incl. fuzz solvency invariant

Deploy (Base Sepolia): see script/Deploy.s.sol header. Fee 5% via treasury,
tickets are EIP-712 ECDSA over the plan's exact Ticket struct, cumulative-unit
delta settlement so lost intermediate tickets cost nothing.

## gateway-api

    cd gateway-api
    pip install -r requirements.txt -r requirements-dev.txt
    pytest              # 20 tests, all external calls mocked
    uvicorn app.main:app

XKOIN_DRY_RUN=true (default) makes every chain call return the transaction it
would send instead of broadcasting. Copy .env.example to .env for credentials.

Fee payout worker (spec s8.1 fiat leg): `python -m app.payout.worker` watches
Transfer(beneficiary -> bridge) on xKoinToken, fires a Daraja B2C to the
founder MSISDN, and burns exactly the paid-out XKN once Daraja's result
callback confirms. The MSISDN is pinned by an EIP-191 signature from the
beneficiary key and verified against the treasury's on-chain beneficiary, so a
rewritten .env or a hostile event feed can delay a payout but never redirect
it. Sign the pin offline with `python -m app.payout.pin` (see its docstring).

## Run the proofs in Docker

No local Python, Foundry, or gcc setup needed; the repo is bind-mounted into
the container, nothing is baked into the image.

    docker compose -f docker/compose.yml build proofs
    docker compose -f docker/compose.yml run --rm proofs
    docker compose -f docker/compose.yml run --rm firmware

The first command builds the image (Python 3.12, gcc/make, Foundry). The
second runs `scripts/bootstrap.sh` inside it, which is the same command
`scripts/docker-proofs.sh` wraps as one step. The third builds the ESP32-S3
firmware with PlatformIO; its espressif32 platform download is cached in a
named volume so only the first run pays for it.

## Presentation site

`web/` is a Vite SPA (React 19, Tailwind 4, React Router 7): an index of the
routes, a markdown viewer over `docs/papers`, `docs/potential` and
`docs/x-koin-beta`, the three legacy static pages, and the hardware shopping
list. Node only; Python is left to firmware, the protocol simulation and
gateway-api.

    npm run dev:web                                      # http://localhost:5173
    docker compose -f docker/compose.site.yml up --build  # http://127.0.0.1:8090

The first is the dev server with hot reload. The second builds `web/dist` inside
`docker/site.Dockerfile` and serves it on nginx, which is what the VPS runs
behind Traefik. `web/scripts/inline-data.mjs` runs before both and rebuilds the
legacy pages from `demo/` and `protocol/viz/` with `protocol/out/*.json` inlined.
See `demo/README.md`.
