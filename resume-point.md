# x-koin resume point

Updated 2026-09-09, end of the evening session. Pages:
- Bring-up board: https://claude.ai/code/artifact/ac423197-641a-4994-8c9f-6144aeb3fa4b
- Mesh replay (protocol, chain and kiosk, journeys): https://claude.ai/code/artifact/f351573e-d847-4ce5-96fb-56924ce3a242
- Investor demo: https://claude.ai/code/artifact/2360a9fa-beab-45bd-9f98-f976804601eb
- Landlord pilot page: https://claude.ai/code/artifact/7de94e3f-acf4-4d4a-b343-2a9051b87589

One stack for pages (Martin's rule): `python demo/build.py` writes
demo/dist/{index,landlord,replay}.html; `python demo/serve.py` serves them on
http://127.0.0.1:8090/; the artifacts above are those files. No file://
previews, no other ports.

## State

Commit 4ab960b on main plus the demo unification. Proof matrix green on the
Windows host and inside Docker (docker-proofs image, Forge 1.8.1): 28 forge
tests, 31 gateway-api and 11 protocol pytest, S1-S6 sim, 75 C host checks,
chain e2e settle gas 191,698. Gateway firmware builds: `pio run -e esp32-s3`
SUCCESS, RAM 11.7%, flash 81.9% of the default 1 MB app partition.

Martin's decisions this session: lawyer engaged; Equitel Jenga first
(covers M-Pesa on-ramp via STK push and off-ramp via Mobile Wallets, both
verified against developer.jengahq.io); hardware purchase being expedited by
a helper; Docker requested so proofs behave the same on every host.

## Windows host setup that works

    python -m venv .venv                       # Python 3.14, deps from gateway-api/requirements*.txt
    export PATH="$HOME/.foundry/bin:$PATH"     # Foundry 1.5.1 stable, Windows zip; also on user PATH
    PYTHON=.venv/Scripts/python.exe MAKE=mingw32-make scripts/bootstrap.sh   # Git Bash
    export PATH="/d/x-koin/.venv/Scripts:$PATH"; cd firmware/xkoin-gateway && pio run -e esp32-s3
                                               # PlatformIO 6.2.0 in the venv; use /d/... paths in Git Bash

WSL Ubuntu-20.04 is unusable (no DNS, sudo needs a password). Docker Desktop
29.2.1 works and containers resolve DNS.

## Done this session

- docs/regulatory-brief.md: 15 numbered questions for counsel with the CA
  2022 SRD table (868.0-868.6 MHz: 25 mW ERP, 1% duty or LBT+AFA;
  869.4-869.65 MHz: 500 mW, 10%), CED licence (July 2026), PVoC, CBK.
- docs/jenga-onboarding.md: sandbox steps, RSA key, live KYC list.
- hardware/bom.md: procurement BOM, Kenya import notes, ask-before-ordering.
- gateway-api: JengaClient.mpesa_stk_push, wallet param on send_to_mobile,
  /jenga/mpesa-callback keyed on customer.reference (our orderReference).
- protocol: Sim(trace=...) opt-in hooks, trace_sim.py, viz/replay.html and
  viz/build_replay.py. Rebuild the page with:
      .venv/Scripts/python.exe protocol/trace_sim.py
      .venv/Scripts/python.exe protocol/viz/build_replay.py
- firmware: SX1262 GFSK RX bandwidth 0x0B (117 kHz) corrected to 0x0A
  (234 kHz) per DS.SX1261-2 table 13-45; BR, BT 0.5 and Fdev formulas
  verified against tables 13-43, 13-44, 13-46. LoRa params match 13-47.

## In flight when this snapshot was written

- Native `pio run -e esp32-s3` (first run, downloading toolchains) in the
  background; result goes into the bring-up board log.
- Docker proof runner (docker/Dockerfile stages proofs and firmware,
  docker/compose.yml, scripts/docker-proofs.sh) being built and proven by a
  subagent; commit separately when its report is reviewed.

## Next, in order

1. Read the firmware build result; fix ESP-IDF glue compile errors if any.
2. Firmware regulatory settings (Martin decides): cap TX power to the
   sub-band limit; LBT+AFA or move bulk traffic to 869.4-869.65 MHz.
3. Jenga sandbox: sign up at v3.jengahq.io, RSA keypair, .env, first UAT
   call by hand, then XKOIN_DRY_RUN=false for the UAT round trip.
4. Wokwi: load hardware/wokwi with the built firmware.bin, verify the two
   custom chip stubs.
5. HANDOVER s4 items 6-11 (satellite firmware, kiosk web, pricing,
   regulatory gates, Gnosis Safe, Drive doc 06).

## Waiting on Martin

- Pins marked `proposed` in hardware/pinmap.md.
- Sandbox credentials, per-unit price, payout MSISDN pin signature.
- TX power and sub-band decision (see docs/regulatory-brief.md section 2).
- BOM "Ask before ordering" list in hardware/bom.md.
