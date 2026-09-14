# docs

Everything written about xKoin. Four of these folders are read by the site's markdown viewer at `/docs`; the rest are for people working on the project.

| Folder | What it holds | On the site |
|---|---|---|
| `papers/` | The whitepaper set: one document split across numbered files, from the concept and the market through the protocol, the hardware, security, regulation and the roadmap. Figures in `papers/assets/`. | yes |
| `potential/` | One use case per file, each traced down to the primitives that make it work: farms, estates, market hubs, schools, relief corridors, community media, metering, matatu stages. | yes |
| `x-koin-beta/` | The compact merged-board version for contract manufacture: concept, schematic, PCB blueprint, manufacturing brief and cost model. | yes |
| `ops/` | Operating manuals: the critical accounts runbook, the Jenga onboarding, key management and the regulatory brief. Account material, deliberately never imported into the site bundle. | no |
| `_drive/` | Verbatim exports of the Google Drive design suite (docs 00 to 05). The original source. Do not edit these; re-export instead. | no |
| `_plan/` | Session plans and research: the revamp plan, the papers brief, and three research reports under `_plan/research/`. | no |
| `how-it-works.md` | The primitives and the user journeys in one file. Read this before `HANDOVER.md` if you are new to the product rather than to the code. | no |

## Where to start

| You are | Read |
|---|---|
| New to the product | `how-it-works.md`, then `papers/00-START-HERE.md` |
| New to the code | `../HANDOVER.md`, then `../README.md`, then `../resume-point.md` |
| An investor | `papers/00-START-HERE.md` names the shortest path; then the `/investors` and `/startup` pages |
| An engineer | `papers/02-system-architecture.md`, `papers/03-protocol-xkp.md`, then `../protocol/spec.md` |
| A manufacturer | `papers/05` to `papers/09`, then the whole of `x-koin-beta/` |
| A regulator | `papers/11-regulatory-and-safety.md` and `ops/regulatory-brief.md` |
| Running the infrastructure | `ops/critical-accounts/README.md`, then its numbered files in order |

`papers/00-START-HERE.md` also carries the glossary, the conventions every paper follows, the mapping between the device names used in this repository and the names in the original patent draft, and the built / partial / proposed status legend that marks every claim in the set.

## Conventions

Papers are plain markdown and must read correctly on GitHub. Abstract and keywords at the top, numbered sections, numbered figure captions, a table for anything with three or more rows, a references section, and plain ASCII punctuation throughout. A number that depends on an unmade decision carries that condition in the same sentence.

The site adds pictures from fenced blocks GitHub does not know (`xk-flow`, `xk-timeline`, `xk-stack`, `xk-compare` for static diagrams, `xk-anim <name>` for an animation). The body of every such block is written as plain lines, so a reader on GitHub sees the content rather than an empty gap. `web/README.md` explains how to add one.

`ops/` is the exception to all of this: it is a runbook, not a paper, and it holds material that must not reach a public bundle. `web/src/lib/docs.js` lists the three folders it globs and `ops` is deliberately not among them.
