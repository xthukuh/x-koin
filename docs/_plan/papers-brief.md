# Brief for the whitepaper set (docs/papers, docs/potential, docs/x-koin-beta)

Read this before writing any paper. It fixes voice, structure, figures and sources so the set reads as one document written by one hand.

## Sources of truth, in precedence order

1. Martin's change request of 2026-09-12 (device names, demo goals).
2. docs/_plan/revamp-plan.md (device lineup, demo matrix, parts, tree).
3. docs/how-it-works.md (primitives, decisions, journeys, MVP proposal).
4. protocol/spec.md (frames, phases, Laws, trusted parties).
5. docs/_drive/*.md (the original patent draft, plan, BOM, tokenomics, architecture decisions). Verbatim exports; quote numbers from them only when the repo has nothing more recent.
6. hardware/pinmap.md, hardware/bom.md, firmware/xkoin-gateway/lib/*.h (pins, registers, the exact parts).
7. docs/ops/critical-accounts/* and docs/ops/regulatory-brief.md for accounts, budget, regulation.
8. docs/_plan/research/*.md for page patterns, Meshtastic facts, video style.

Numbers that carry a condition keep the condition in the same sentence: the per-unit price is a placeholder until it clears measured backhaul cost; payback figures from the Drive tokenomics doc are conditional on that price; Kenyan 868 MHz duty-cycle rules are unverified until counsel confirms. "Zero-trust" describes the peer layer only; the fiat boundary has named custodians (spec section 8).

## Voice

Scientific device whitepaper, the register of an IEEE or IOSR journal paper crossed with a hardware campaign page: precise, first-person plural where a decision is ours, third person for the system. Lead with the finding. Every claim that can be checked names its check (a test, a measurement, a datasheet table). Explain by construction: how the thing works, then what exists, then what changes. Name a wrong approach once, attached to the right one. Vary paragraph length. No hedging every sentence; state the condition instead.

Layout: one paragraph per line, never hard-wrapped. The papers are read through the site's HTML renderer, so a wrapped source line only wastes the reading column. `node scripts/reflow-markdown.mjs` unwraps a file that arrived wrapped; `--check` flags one that still is.

Punctuation: plain ASCII only. No em dashes, en dashes, curly quotes, curly apostrophes or ellipsis characters anywhere in a file. Hyphens and straight quotes. Banned words: delve, leverage (verb), seamless, robust, elevate, unlock, harness, tapestry, landscape, game-changer, cutting-edge. No "not just X but Y". No rule-of-three flourishes. No emoji.

## Paper skeleton

    # <Number>. <Title>

    Abstract: one paragraph, 120 to 180 words, the finding first.
    Keywords: five to eight, comma separated.

    ## 1. Introduction (or Scope)
    ## 2. ...numbered sections...
    ## N. References

Figures: `![Figure 3. Caption in one sentence.](assets/<paper>-fig03-<slug>.svg)` with a numbered caption in the alt text and the same caption repeated as an italic line under the image. Tables for anything with three or more parallel rows. Code and wire formats in fenced blocks. Every figure or photo is referenced from the text before it appears.

Cross-references are relative links to the sibling file and section, for example `[03-protocol-xkp.md, section 4](03-protocol-xkp.md#4-proof-layer)`.

## Figures and photos

Diagrams are SVG in docs/papers/assets, hand-written, 1200 by 800 or 1200 by 600 viewBox, two styles:

1. Blueprint: copy docs/papers/assets/_template-blueprint.svg (blue ground, grid, white lines, monospace labels, title block). Use for hardware drawings, wiring, board layouts, exploded views, enclosure sketches.
2. Schematic: white ground, #14213d ink, #0b3d91 accent, #b8741a for money flows, same monospace labels, no title block. Use for topologies, protocol sequences, money flows, state diagrams.

Product photos are the AliExpress gallery images recorded by the sourcing scouts in hardware/shopping/parts/*.json (first image of the chosen candidate). Reference them by URL inside a photo strip table:

    | ![ESP32-S3-DevKitC-1](https://...jpg) | ![SX1262](https://...jpg) |
    |---|---|
    | ESP32-S3-DevKitC-1 N16R8 | E22-900M22S SX1262 |

Do not download or commit product images. Do not invent URLs; if a part has no scouted photo yet, leave a `<!-- photo: <part id> -->` marker.

## Hardware paper checklist (05 to 09)

Each hardware paper carries, in this order: role in the network; photo strip of the real parts; block diagram (schematic style); blueprint wiring drawing with a title block; pin map table (from hardware/pinmap.md, mark doc02 versus proposed); BOM slice with quantities and the scouted KES price; power budget (mA at 5 V or 3.3 V per module, sleep and active, daily Wh); enclosure and mounting note; bench safety note where mains is involved; bring-up procedure (flash, first boot, what the log shows); the acceptance test from the demo matrix that this device must pass.

## Potential use cases (docs/potential)

One file per case, `NN-slug.md`, 900 to 1600 words. Sections: the situation (a concrete Kenyan place and a named kind of person); what breaks today; the xKoin composition for that case (which devices, how many, which planes carry what); internals (which primitives do the work: voucher, receipt, ticket, escrow, free LAN plane); a day in the life (a timeline); economics with conditions; what could go wrong and the Law or mechanism that answers it; what would have to be true to pilot it. Cases: 00 last network standing (disaster and outage backbone), 01 large-scale farm IoT, 02 apartment estates, 03 rural market hubs, 04 schools and clinics, 05 disaster relief corridors, 06 community chat and local media, 07 utility and smart metering, 08 transport and matatu stages.

## Beta (docs/x-koin-beta)

The compact merged-board version for contract manufacture: 00 concept and constraints, 01 merged schematic (block level, blueprint), 02 PCB blueprint (outline, keep-outs, mains isolation slot, antenna placement), 03 manufacturing brief for a Shenzhen contract manufacturer (files they expect, certifications, MOQ, DFM points), 04 cost model at 100, 1,000 and 10,000 units with the assumptions listed. Candidate integrated parts must be real and named (for example ESP32-S3-WROOM-1 module, SX1262 module or bare IC with matching network, a HomePlug AV chipset such as Qualcomm QCA7005 or MaxLinear MxL G.hn parts, KQ-130F as a module or a discrete ST7540 style narrowband PLC transceiver, Hi-Link AC-DC module), with the tradeoff each one won stated in a sentence.
