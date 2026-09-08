# x-koin

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

## Layout

    contracts/     Solidity (Foundry): xKoinToken, xKoinEscrow, xKoinTreasury
    gateway-api/   FastAPI fiat bridge: Daraja (M-Pesa), Jenga (Equitel), L2 relayer
    firmware/      ESP32-S3 gateway + satellite (phase 1, pending)
    kiosk-web/     Next.js kiosk (phase 3 UI, pending)
    cloud-proxy/   WireGuard + Squid backhaul (phase 4, pending)

## Contracts

    cd contracts
    forge test          # 25 tests incl. fuzz solvency invariant

Deploy (Base Sepolia): see script/Deploy.s.sol header. Fee 5% via treasury,
tickets are EIP-712 ECDSA over the plan's exact Ticket struct, cumulative-unit
delta settlement so lost intermediate tickets cost nothing.

## gateway-api

    cd gateway-api
    pip install -r requirements.txt -r requirements-dev.txt
    pytest              # 9 tests, all external calls mocked
    uvicorn app.main:app

XKOIN_DRY_RUN=true (default) makes every chain call return the transaction it
would send instead of broadcasting. Copy .env.example to .env for credentials.
