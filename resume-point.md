# x-koin resume point

Updated 2026-09-09. Board: https://claude.ai/code/artifact/ac423197-641a-4994-8c9f-6144aeb3fa4b

## State

Cloud handover (HANDOVER.md) merged into `xthukuh/x-koin` main on top of the
GitHub initial commit. Every proof in the HANDOVER matrix is green on the
Windows host: 28 forge tests, 9 gateway-api and 11 protocol pytest, S1-S6
sim, 75 C host checks, chain e2e with settle gas 191,698, one-command
bootstrap in 87 s.

## Windows host setup that works

    python -m venv .venv                       # Python 3.14, deps from gateway-api/requirements*.txt
    export PATH="$HOME/.foundry/bin:$PATH"     # Foundry 1.5.1 stable, Windows zip; also on user PATH
    PYTHON=.venv/Scripts/python.exe MAKE=mingw32-make scripts/bootstrap.sh   # Git Bash

WSL Ubuntu-20.04 is unusable for this: DNS resolution times out and sudo
needs a password. gcc is mingw-w64 at C:\mingw64\bin, make is mingw32-make.

## Next, in handover order

1. B2C payout worker in gateway-api (HANDOVER s4 item 2). Mocked tests like
   the rest; server compromise may delay, never redirect.
2. `pio run` the ESP-IDF glue in firmware/xkoin-gateway; verify Wokwi stubs.
3. SX1262 VERIFY-tagged registers against DS.SX1261-2.
4. Sandbox credentials into gateway-api/.env (Martin), then XKOIN_DRY_RUN=false.
5. Satellite firmware, kiosk web, pricing, regulatory gates, Gnosis Safe,
   Drive doc 06 refresh (HANDOVER s4 items 6-11).

## Waiting on Martin

- README byline says "zero-trust"; handover reserves that for the peer layer.
- Pins marked `proposed` in hardware/pinmap.md.
- Sandbox credentials and the per-unit price.
