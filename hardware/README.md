# hardware

Pin maps, schematics, the sourcing lists, the simulator chip models and the Wokwi harness. Nothing here is built by CI: the drawings and the pin map are generated from one Python source of truth, and everything else is data the site and the bench read.

| Path | What it is |
|---|---|
| `gen_schematics.py` | The one source of truth for pins. Writes `pinmap.md`, `xkoin-gateway.svg` and `xkoin-satellite.svg`. |
| `pinmap.md` | Generated. `doc02` pins are fixed by the MVP plan; `proposed` pins wait for Martin's sign-off. |
| `bom.md` | The bill of materials per device. |
| `xkoin-gateway.svg`, `xkoin-satellite.svg` | Generated wiring drawings, bus-coloured. |
| `shopping/` | The sourcing tree: one JSON per part line, the MVP kit, the verified checkout list and the Nairobi vendor verdicts. The `/shop` page compiles these. |
| `velxio/` | The self-hosted simulator: custom chip models for SX1262 and KQ-130F, their compiled WASM, the self test and the importable `.vlx` projects. |
| `wokwi/` | The older Wokwi harness. Superseded by `velxio/`; kept because the diagram is a second, independent statement of the same pinout. |

## Prerequisites

The generator needs nothing but Python. The simulator work needs Docker.

## Regenerate the pin map and the schematics

    .venv/Scripts/python.exe hardware/gen_schematics.py

Writes `xkoin-gateway.svg`, `xkoin-satellite.svg` and `pinmap.md` in place. Edit the dictionaries at the top of the script, never the outputs: a hand edit to `pinmap.md` is lost on the next run and puts the drawing and the table out of step.

Safety rule that the generated pages repeat and the bench must follow: the KQ-130F couples to 230 V mains. Prove it on a 12 V DC line first, which the module supports, and only then on a mains strip behind an RCD. Keep the mains coupling network isolated from the logic side.

## The sourcing tree

    hardware/shopping/parts/<id>.json     one line, with candidates and the chosen listing
    hardware/shopping/mvp-kit.json        which lines each device needs
    hardware/shopping/mvp-checkout.json   one verified link per line, price, shipping, window
    hardware/shopping/local-vendors.json  every Nairobi candidate examined, with a verdict
    hardware/shopping/mvp-sourcing.md     the plan, the per-device budgets and the shop-count options

`hardware/shopping/README.md` carries the schema for a part file. The scouts that produce them live in `scripts/scout/`; see `scripts/README.md`.

## The simulator

Local instance for authoring:

    docker compose -f docker/compose.velxio.yml up -d
    # http://127.0.0.1:3080

Import a project with the Import button and one of the `.vlx` files in `velxio/proof/`. Those carry both chips with their source and compiled WASM already embedded, which a bare `diagram.json` cannot do.

The chip self test runs inside the container, against the same runtime class the ESP32 worker uses:

    docker cp hardware/velxio/proof/chip_selftest.py velxio:/tmp/
    docker cp hardware/velxio/chips/sx1262/chip.wasm velxio:/tmp/sx1262.wasm
    docker cp hardware/velxio/chips/kq130f/chip.wasm velxio:/tmp/kq130f.wasm
    docker exec velxio python3 /tmp/chip_selftest.py

Expect 15 cases and `All cases passed`. `hardware/velxio/README.md` holds the pin tables, the Manchester framing on the synthetic `ANT` and `LINE` nets, the attribute list, what is proven and, most importantly, the limits: the fidelity these models do not claim, and what the upstream simulator does and does not do with chip-to-chip nets on ESP32 boards. Read that limits section before planning a demo on them.
