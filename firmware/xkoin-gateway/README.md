# xkoin-gateway firmware

Status split, honestly stated:

| Layer | Files | Status |
|---|---|---|
| Portable core | lib/xkp, lib/crypto, lib/router, lib/kq130f, lib/sx1262 logic | PROVEN on host: test/host, 75 checks incl. Ed25519 receipts signed by the Python reference |
| ESP-IDF glue | src/main.c, lib/wifi_ap | Written to doc 02 pinout, COMPILE-UNTESTED (Espressif hosts unreachable from build sandbox); first `pio run` on a dev machine gates it |
| Vendored | lib/ed25519 (orlp, zlib license) | Standard RFC 8032 Ed25519 |

Host proof: `cd test/host && make run`
Vectors regenerate via `python3 protocol/gen_vectors.py` after any codec change.
