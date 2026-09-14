# firmware

ESP32-S3 firmware for the two devices that carry the mesh, plus the portable C core that both share. The core is proven on the host against the Python reference; the ESP-IDF glue is written to the fixed pin map and waits for a board.

| Path | What it is |
|---|---|
| `xkoin-gateway/` | The Node: backhaul in, mains and radio out, meters every WAN byte. |
| `xkoin-gateway/lib/xkp/` | The portable core: frame codec, medium abstraction, receipts. |
| `xkoin-gateway/lib/router/` | The classifier that decides free LAN from paid WAN. |
| `xkoin-gateway/lib/kq130f/`, `lib/sx1262/` | The two radio and power-line drivers. |
| `xkoin-gateway/lib/xkcrypto/`, `lib/ed25519/` | SHA-256, and vendored RFC 8032 Ed25519 (orlp, zlib licence). |
| `xkoin-gateway/lib/wifi_ap/` | The captive portal. |
| `xkoin-gateway/src/main.c` | The ESP-IDF application. |
| `xkoin-gateway/test/host/` | The host proof: 75 checks, no board needed. |
| `xkoin-satellite/` | The off-grid LoRa remote. Shares the gateway's `lib/` by design, so one driver serves both. Lands after gateway bring-up. |

## Status, stated honestly

| Layer | Status |
|---|---|
| Portable core | Proven on the host: 75 checks, including an Ed25519 receipt signed by the Python reference and verified in C, byte-exact codec both directions, and a full one-byte corruption sweep |
| ESP-IDF glue (`src/main.c`, `lib/wifi_ap`) | Written to the fixed pin map, compile-untested. The first `pio run` on a machine that can reach Espressif's hosts gates it |
| Satellite | Skeleton only: deep sleep, DIO1 wake and the VBAT ADC on GPIO1 are designed, not written |

## Prerequisites

The host proof needs gcc and make only. On this Windows host that is MinGW-w64 gcc 6.4.0 and GNU Make 4.2.1 invoked as `mingw32-make`.

The board build needs PlatformIO Core with the `espressif32` platform.

## Run the host proof

    cd firmware/xkoin-gateway/test/host
    mingw32-make -s run

Verified on 2026-09-14: exit 0, `HOST CORE PROOF: 75 checks passed`. On Linux or in the proof container the command is `make run`.

The test vectors in `vectors.h` are generated, never hand-edited. After any codec change:

    .venv/Scripts/python.exe protocol/gen_vectors.py
    cd firmware/xkoin-gateway/test/host && mingw32-make -s run

On Windows the generator writes CRLF and git normalises to LF, so `git status` shows `vectors.h` modified even when the content did not change. Check with `git diff --stat`; an empty stat means nothing moved.

## Build for the board

    cd firmware/xkoin-gateway
    pio run -e esp32-s3

Or in Docker, with the espressif32 platform cached in a named volume so only the first run pays for the download:

    docker compose -f docker/compose.yml run --rm firmware

Expect this to fail on a host that cannot reach Espressif's download servers; that is the recorded reason the glue is still compile-untested, not a defect in the source.

## Pins

The pin map is fixed by the MVP plan and must not drift:

| Signal | GPIO |
|---|---|
| SX1262 SCK | 12 |
| SX1262 MISO | 13 |
| SX1262 MOSI | 11 |
| SX1262 NSS | 10 |
| SX1262 DIO1 | 14 |
| SX1262 BUSY | 21 |
| KQ-130F on UART2 | 17 TX, 18 RX |

`hardware/pinmap.md` is generated from one source of truth by `hardware/gen_schematics.py`. Pins marked `proposed` there are this repository's allocation and wait for Martin's sign-off before any PCB or bench wiring.

Known issue carried from the simulator work, to check at bring-up: `lib/sx1262/sx1262.h` sets an IRQ mask of 0x0262 and a DIO1 mask of 0x0002. TX_DONE is bit 0 and is in neither, so a driver using those masks never sees TX_DONE even though the comment on that line says it does. Registers tagged `VERIFY` in the same header need checking against DS.SX1261-2.
