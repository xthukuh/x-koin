# protocol

The XKP reference implementation in Python, its specification, the discrete-event simulator that proves the scenarios, and the chain end-to-end proof. This tree is the source of truth for every wire format: the C firmware and the Solidity side are checked against it, never the other way round.

| Path | What it is |
|---|---|
| `spec.md` | The protocol specification. Section 7 holds the eight Laws; section 8 holds the trust boundary and the price floor formula. |
| `xkp/frames.py` | The frame codec: 27-byte header plus CRC16-CCITT (poly 0x1021, init 0xFFFF), magic 0x4B58, version nibble 1. |
| `xkp/proofs.py` | Receipts and vouchers. Canonical receipt is `<8s8s16sQI`, 44 bytes plus a 64-byte Ed25519 signature, 108 bytes total, which fits the 128-byte KQ-130F MTU by design. |
| `xkp/settle.py` | Ticket construction and the EIP-712 digest, matched against the contract's `hashTicket`. |
| `xkp/sim.py` | The discrete-event simulator: media models, queues, retries, medium scoring and failover. |
| `run_sim.py` | Scenarios S1 to S6 with deterministic seeds, plus the crypto bench. `--chain` settles the derived tickets on a live RPC. |
| `tests/test_xkp.py` | 11 unit tests over the codec, the receipts and the settlement maths. |
| `gen_vectors.py` | Writes `firmware/xkoin-gateway/test/host/vectors.h` so the C core is proven byte-exact against this implementation. |
| `trace_sim.py`, `trace_chain.py` | Export the JSON the site reads: per-medium byte bins and events, and every decoded on-chain transaction. |
| `e2e_chain_proof.sh` | anvil, a real deploy, real settlement of simulator tickets, and the founder payout property. |
| `out/` | Run artefacts, not tracked. `web/scripts/sync-proof.mjs` copies them into the site's tracked snapshot. |

## Prerequisites

Python 3.12 or newer with the repository virtual environment. On this Windows host, always call the interpreter by path; the bare `python` alias with no script hangs and spins the CPU.

    python -m venv .venv
    .venv/Scripts/python.exe -m pip install -r gateway-api/requirements.txt -r gateway-api/requirements-dev.txt

Foundry is needed only for `e2e_chain_proof.sh` and `trace_chain.py`, which start anvil themselves.

## Test and prove

    cd protocol
    ../.venv/Scripts/python.exe -m pytest tests/ -q
    ../.venv/Scripts/python.exe run_sim.py

Verified on 2026-09-14: the unit tests exit 0 with 11 passed in 1.19 s; the scenario run exits 0 and ends with `ALL SCENARIOS PASSED`.

What the scenarios report, so a changed number is obvious:

| Scenario | What it measures |
|---|---|
| S1 | Speed: 25 MB over HomePlug, KQ-130F and LoRa SF7 together |
| S2 | Blackout survival: the grid is cut at t = 2 s and the radio plane takes over |
| S3 | Satellite relay: LoRa ingress with HomePlug backhaul, and who earns |
| S4 | Loss sweep: 100 KB over LoRa across a range of frame loss rates |
| S5 | Frame fuzz: 20,000 malformed frames, 0 accepted |
| S6 | Internet over LoRa: distilled pages, airtime and the duty-cycle ceiling |

The chain proof adds a real EVM to the same tickets:

    protocol/e2e_chain_proof.sh          # needs forge, anvil and cast on PATH

It asserts digest parity between the Python EIP-712 digest and the contract's `hashTicket`, escrow solvency, and that a stranger calling `claim()` can only move funds to the beneficiary.

## Regenerating artefacts

These overwrite files other things read. Run them deliberately, not as a habit.

    ../.venv/Scripts/python.exe gen_vectors.py     # firmware test vectors
    ../.venv/Scripts/python.exe trace_sim.py       # out/trace.json
    ../.venv/Scripts/python.exe trace_chain.py     # out/chain.json, starts anvil
    cd ../gateway-api && ../.venv/Scripts/python.exe trace_kiosk.py   # out/kiosk.json

Then `npm --prefix web run proof:sync` to move the three JSON files into the site's tracked snapshot at `web/src/proof/`.

Windows note, verified on 2026-09-14: `gen_vectors.py` writes `vectors.h` with CRLF line endings, and `.gitattributes` normalises the file to LF. The content is identical, but `git status` reports the file modified until git next touches it. `git checkout -- firmware/xkoin-gateway/test/host/vectors.h` clears it when the regenerated content matched.

## Changing a wire format

Order matters, because three implementations have to agree.

1. Edit `xkp/` here first.
2. `../.venv/Scripts/python.exe gen_vectors.py`.
3. Make the C suite pass again: `cd ../firmware/xkoin-gateway/test/host && mingw32-make -s run`.
4. Re-run `run_sim.py` and the contract tests.

Each of the eight Laws in `spec.md` section 7 maps to a named test. A change that weakens a Law's test is a design change, not a refactor.
