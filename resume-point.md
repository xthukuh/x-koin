# x-koin resume point

Updated 2026-09-15, end of session six (one theme, eleven pages, pass-wall). Read this first on a fresh session, then the last addendum below, then README.md for the commands.

## Pages and boards

- Revamp progress board: https://claude.ai/code/artifact/e5d8bacb-6b8c-477a-ae0c-0161b91c51bf
- Companion app wireframes: https://claude.ai/code/artifact/d372548e-e24c-4524-997f-5e746c512a17
- Bring-up board (session two): https://claude.ai/code/artifact/ac423197-641a-4994-8c9f-6144aeb3fa4b
- Mesh replay: https://claude.ai/code/artifact/f351573e-d847-4ce5-96fb-56924ce3a242
- Investor demo: https://claude.ai/code/artifact/2360a9fa-beab-45bd-9f98-f976804601eb
- Landlord pilot page: https://claude.ai/code/artifact/7de94e3f-acf4-4d4a-b343-2a9051b87589

One stack for pages (Martin's rule), Node since session four: `web/` is a Vite SPA. `npm run dev:web` serves it on http://localhost:5173/ and `docker compose -f docker/compose.site.yml up --build` serves the built site on http://127.0.0.1:8090/. The legacy static build path is retired: `demo/`, `protocol/viz/` and `web/scripts/inline-data.mjs` are gone, and the investor, landlord and replay pages are React routes on the one theme. The predev and prebuild step is `scripts/build-sitemap.mjs` only. No file:// previews, no other ports. TaskStop does not kill vite; taskkill the listener.

## Session four (2026-09-12 to 13): the revamp

Martin's change request: replace Wokwi with self-hosted velxio at velxio.thuku.dev, redo the demos as importable simulator files, rewrite the docs as a scientific whitepaper set with Kickstarter-grade presentation, Node SPA in Docker instead of the Python demo build, an AliExpress shopping list page, companion app wireframes, explainer slides, a beta compact board set, and the use-case set under docs/potential.

Decisions taken with Martin (all as recommended):
1. Simulator: velxio, unmodified upstream image, demos as .vlx files in this private repo (no AGPL publication duty). Research in docs/_plan/research/01-velxio-feasibility.md.
2. LoRa boards: Heltec WiFi LoRa 32 V3 for Satellite, Client dongle and the farm node; DevKitC N16R8 plus E22-900M22S for Node and Node-Satellite on the doc 02 pins.
3. Names: Node-Satellite is the mains relay, Satellite the off-grid LoRa remote, Client the phone or OTG dongle.
4. Domains: site xkoin.thuku.dev, API api.xkoin.thuku.dev (gateway compose default changed), simulator velxio.thuku.dev.

Commits this session: 8957759 (SPA, Docker site, docs/ops move, plan, scout tooling), 5092967 and cf4f9d6 (velxio compose), 7d2541e (papers 00 to 04, 10, 11, nine potential cases, patent draft export, scouted parts).

Infrastructure state:
- VPS srv1837953 (ssh alias my-n8n, root): /docker/velxio/docker-compose.yml with .env (VELXIO_HOST, VELXIO_TRAEFIK=true, VELXIO_PORT=3080). Traefik there runs on the host network with the letsencrypt resolver; containers need no external network. The container installs Arduino, RP2040 and ESP32 cores on first boot (minutes); the healthcheck has a 30 minute start period for that. DNS record velxio.thuku.dev not yet created.
- Local: docker/compose.velxio.yml on 127.0.0.1:3080 for authoring.
- Chrome extension connected by Martin (Claude in Chrome).

Tooling: scripts/scout/ali.mjs (playwright-core on the installed Chrome, headless, warm-up visit, default UA) searches and reads AliExpress listings with KES prices and gallery images. Known gaps: sku variants and the shipping line are not extracted reliably; AliExpress serves anti-bot punish pages after many rapid calls; run at most three Chrome scouts at a time (Martin's machine lagged at six).

Written this session: docs/_plan (revamp plan, papers brief, three research reports), docs/_drive (five verbatim Drive exports), docs/papers 00 to 04, 10, 11 with seven figures, docs/potential 00 to 08, hardware/shopping/parts (9 lines of 19), the blueprint SVG template.

In flight when this snapshot was written (agents): landing page in web/src/landing (Kickstarter-style, replaces `/`), velxio chip models SX1262 and KQ-130F under hardware/velxio, docs/x-koin-beta (five files), papers 05, 06, 12 and 07, 08, 09, 13, 14, and the scout for the twelve remaining part lines.

## Next, in order

1. Review and commit the in-flight agent output (diff first).
2. Shopping list page in the SPA (/shop) compiled from hardware/shopping/parts/*.json with a gallery carousel per part; totals per device role; deploy the site to the VPS (compose.site.yml, host xkoin.thuku.dev) once Martin adds DNS.
3. Velxio demos: .vlx files per device under hardware/velxio, chips proven in the local instance, then live test through the Chrome extension against velxio.thuku.dev.
4. Explainer slides: reveal.js route in the SPA following the NODE format (docs/_plan/research/03-explainer-video-study.md), plus a capture script for video.
5. Reconcile the two figure conflicts the writers found (Node CapEx 15,500 versus about 26,000 KES; target 10 KES/GB versus the 50 KES/GB placeholder) with Martin; resolve TODO: verify markers.
6. Carried from session three: firmware TX power and sub-band decision, Jenga sandbox, phases 1 to 5 of docs/ops/critical-accounts/05-test-plan.md, HANDOVER section 4 items 6 to 11.

## Waiting on Martin

- Cloudflare A records: velxio, xkoin, api.xkoin to 31.97.105.173.
- Paper review: TODO: verify markers and the two figure conflicts.
- Carried: Binance hardening, Coinbase Developer Platform and Alchemy accounts, hardware wallet order, Jenga sandbox credentials, pins marked proposed in hardware/pinmap.md, TX power and sub-band, per-unit price.

## Windows host setup that works

    python -m venv .venv                       # Python 3.14, deps from gateway-api/requirements*.txt
    export PATH="$HOME/.foundry/bin:$PATH"     # Foundry 1.5.1 stable
    PYTHON=.venv/Scripts/python.exe MAKE=mingw32-make scripts/bootstrap.sh   # Git Bash, all proofs
    npm run dev:web                            # presentation site, port 5173
    docker compose -f docker/compose.velxio.yml up -d   # simulator on 127.0.0.1:3080

WSL Ubuntu-20.04 is unusable (no DNS, sudo needs a password). Docker Desktop 29.2.1 works. The Windows `python` alias without a script hangs and spins CPU; always call .venv/Scripts/python.exe with a script path.

## Addendum 2026-09-13 (later in session four)

Committed since the snapshot above: landing page (da1fef3), shop page (596a19c), papers 05 to 14 (252ea5d, 3b26fd7), beta set (1223a2e), W5500 pin move (f6b8600), slides (c6fd02d), chip models (364be1b), all 19 scout lines (ea1fc57). Martin's fifth decision: fork velxio to patch the ESP32 backend for chip-to-chip nets (fork https://github.com/xthukuh/velxio, working copy D:\velxio, branch feat/esp32-chip-nets, agent in flight; review before push). Scout caveats: no HomePlug Wi-Fi kit on AliExpress (buy in Nairobi), the KQ-130F listing photographs a KQ-330 (confirm the variant at checkout), most shipping figures unverified. The local velxio container holds a manual wasi-sdk install that the fork's Dockerfile must replace.

## Addendum 2026-09-13, end of session four

Fork patch proven: D:\velxio branch feat/esp32-chip-nets (9 commits, 23 files, 15 backend and 9 frontend tests added, suites green apart from pre-existing failures) makes chip-to-chip nets work on ESP32 boards and across two QEMU workers; two ESP32-S3 boards exchanged 11 of 12 "xkoin ping" frames at a 40 ms bit period (bridge latency 2.3 to 24 ms). Not pushed: Martin reviews, then push and open the upstream PR. The fork's Dockerfile.standalone ships wasi-sdk; build the image from the fork for the VPS (velxio-xkoin:dev locally) once pushed. Site deployed on the VPS (scripts/deploy-site.sh, /docker/xkoin-site, Traefik routes xkoin.thuku.dev; certificate waits for DNS). Board and wireframe URLs at the top of this file.

Next, in order: push the fork and rebuild the VPS simulator from it; per-device .vlx demos (Node, Node-Satellite, Satellite, Client dongle, farm node) under hardware/velxio/demos with the real firmware where it compiles in velxio; a frame-level net message in the fork so the bit period can drop from 40 ms; fix the KQ-130F decode over the bridge; live test through the Chrome extension against velxio.thuku.dev after DNS; reconcile the paper figure conflicts and TODO markers with Martin; the two pin sign-offs (W5500 move, Heltec per-board headers).

## Addendum 2026-09-13, after Martin's push approval

Fork branch pushed, fork master fast-forwarded to it, upstream PR opened: https://github.com/davidmonterocrespo24/velxio/pull/324. The forked image velxio-xkoin:dev (5.3 GB) now runs on the VPS (healthy, compile-chip available); compose.velxio.yml takes VELXIO_IMAGE and the VPS .env sets it to the fork image.

## Addendum 2026-09-14, session five (MVP sourcing)

Martin's asks this session: Nairobi vendors for the MVP parts with the fewest shops on a tight budget; exact matches only (product name and spec, no substitutes); direct checkout links with shipping to Nairobi confirmed; per device budgets for the bare minimum investor kit covering every medium and basic journey; HD YouTube through the HomePlug path is the D5 success bar.

Delivered, all under hardware/shopping: mvp-sourcing.md (the plan and ranked shop-count options), mvp-kit.json (parts per device, stage two list), mvp-checkout.json (one verified link per line, variant, price, shipping, delivery window, seller), local-vendors.json (every Nairobi candidate with a verdict), and scripts/scout/local.mjs (six-store scout). Three chosen links in parts/ were corrected (esp32-s3, antenna, kq-130f). Board: https://claude.ai/code/artifact/5aa42d77-8773-44c0-ad02-e46a2d6a44f8

Kit: 26,404 KES before AliExpress shipping (635), HomePlug VAT (1,440 if charged) and customs; AliExpress 14,604 across 12 lines in one checkout, Nairobi 11,800 across Brightsource (TL-WPA4220KIT 9,000 ex VAT, UK plug), K-Technics, ASK Electronics, Nerokas (cell) and a supermarket (strip). Main parcel lands Sep 21 to 30; only the Ra-01SH lands Nov 14.

Waiting on Martin: farm node radio (Ra-01SH as specified, or a second E22-900M22S that lands Sep 25, recommended); a restock call to Pixel Electric for the KQ-130F at 1,800; placing the orders. Pending: per-device budgets on the SPA /shop page. Known: `npm run build:web` fails on the clean tree with a missing @rollup/rollup-win32-x64-msvc optional dependency (npm issue 4828); reinstall web/node_modules before the next site build.

Tooling notes: AliExpress item pages render only in Martin's own Chrome session (Claude in Chrome); the headless scout and the in-app browser get the empty shell, and the /w/ search pages are shells everywhere. Node fetch on this host needs the resolver-backed lookup in local.mjs (KNOWNS.md item 9).

Later on 2026-09-14: Martin's layout rule, compact uniform product listings with brief text. The /shop page now opens with the MVP kit as one fixed-column table per device (from mvp-kit.json and mvp-checkout.json via data.js) and lists the scouted lines as same-height tiles, long text behind a More toggle; the carousel is gone. web/node_modules was reinstalled, so `npm run build:web` passes again. .claude/launch.json starts the dev server for the in-app browser. The board was redone in the same layout.

Decision 2026-09-14 (late): the farm node radio is a second E22-900M22S, not the Ra-01SH (all Ra-01SH listings shipped mid November). Kit is now 26,986 KES before shipping (569), VAT and customs; farm node 1,578. Only the Pixel Electric restock call and the orders remain with Martin.

Decision 2026-09-14 (last): KQ-130F source is the AliExpress KQ-130F+ listing now, no wait on a Pixel Electric restock; Pixel is the stage-two source. Every sourcing decision is closed; placing the orders is Martin's. Pushed to origin/main (45b0851 and this commit).

## Addendum 2026-09-14, session six: legacy retired, guides written

The legacy static page path is gone. Deleted: `demo/` (the old investor and landlord pages), `protocol/viz/` (the replay template and `build_replay.py`), `web/scripts/inline-data.mjs`, `web/public/legacy/`, `web/src/routes/Legacy.jsx` and the orphaned `web/src/routes/Home.jsx`. Nothing in `protocol/` imported `build_replay`, and nothing writes `protocol/out/replay.html` any more.

`/landlord` is now a React route (`web/src/routes/Landlord.jsx` plus `landlord.css`) on the one theme, with the same sections and the same plain voice as the old page. Its three animations run inside `AnimationFrame` as pure functions of `t`. The shilling figures under "what the building earns" are read from `web/src/proof/*.json` at build time and each names its source file, so a re-run of the proofs moves them and nobody retypes a number.

Developer guides written and verified by running every command: `README.md` (rewritten), `CONTRIBUTING.md`, `docs/README.md`, `web/README.md`, `docker/README.md`, `scripts/README.md`, `protocol/README.md`, `contracts/README.md`, `firmware/README.md`, `gateway-api/README.md`, `hardware/README.md`. Everything green on this host on 2026-09-14: bootstrap exit 0, contracts 28, gateway-api 32, protocol 11, scenarios S1 to S6 passed, firmware 75 checks, `npx vite build` exit 0.

Two things found while verifying. `scripts/bootstrap.sh` said "expect 31 passed" for gateway-api and the suite is 32; fixed. `protocol/gen_vectors.py` writes `vectors.h` with CRLF on Windows and `.gitattributes` normalises to LF, so `git status` reports the file modified when the content did not change.

## Addendum 2026-09-15, end of session six: the whole site on one theme, behind the wall

Board for this session: https://claude.ai/artifact/RySG2ggiZPuTGFgqSE3n3f. Commits 3349661 to 2ece312 on origin/main, no assistant attribution anywhere (the history was rewritten on 2026-09-14 to remove 45 trailers; local tag backup/pre-coauthor-purge-20260914 holds the old refs and is not pushed).

What landed. `web/src/theme.css` is the one theme; `web/src/shell` holds the sticky hide-on-scroll topbar with the mobile drawer, the footer, and `nav.js`, the single route list that also drives `/map` and `scripts/build-sitemap.mjs` (sitemap.xml and robots.txt). `web/src/player` is the deterministic scene player (every scene a pure function of `t` in ms; hold at end, replay on back, arrows, Space, R, F, C, `#/scene-id`) and `AnimationFrame`, the video-style wrapper every moving picture on the site sits in. Decks: `web/src/decks/investors` (20 scenes) and `web/src/decks/slides` (45 scenes, 10 chapters, terms strip, `web/scripts/capture-slides.mjs` rewritten for it). Pages: `/docs` (file tree, outline, drawer, explainers from fenced `xk-*` blocks, 110-term glossary as abbr tooltips), `/replay` (six journeys, proofs open by default, chain panels, twelve threat cards), `/blueprints` (data-driven schematic sheets, `devices.js` is the source of every pin), `/manufacturing`, `/startup` (totals computed from line items; KES via `web/src/lib/money.js`, 1 USD = 129, 1 CNY = 17.8), `/landlord` (React port), `/shop` unchanged but on the shell. `web/src/companion` has the six app screens in a phone frame. Paper 15 (hidden gems, 24 verify markers) plus the landing sections Beyond the MVP and App, and the roadmap as Martin's nine-phase checklist. Every markdown file is one paragraph per line (`scripts/reflow-markdown.mjs`, proven render-neutral).

Pass-wall, deployed 2026-09-15 to the VPS at /docker/xkoin-site: nginx `auth_request` to the `gate` container (docker/gate/server.mjs, Node built-ins only) guards every path including the bundle; default password from the VPS .env (XKOIN_GATE_PASSWORD), named passwords in XKOIN_GATE_NAMED revoke individually, secret in XKOIN_GATE_SECRET (generated on first deploy, preserved after). Remote checks passed: 302 to /gate, 200 form, 303 with cookie, 200 SPA with cookie, 302 from Traefik on the hostname. Deploy with `scripts/deploy-site.sh`; how-to in docs/ops/critical-accounts/07-pass-wall.md. Certificate issuance still waits on the xkoin.thuku.dev A record.

Data conflicts surfaced for Martin: settle gas 191,698 (handover run, papers, landing) versus 191,650 in web/src/proof/chain.json (local run; /replay states both); W5500 pins differ between paper 05, hardware/bom.md and hardware/pinmap.md (blueprints draw pinmap.md as authority, Martin has not signed the move off); no geologists' use case exists in the repo although Martin named geologists; the MVP kit has no cellular modem, so every SMS or voice idea in paper 15 is a purchase first.

Blockers cleared with Martin on 2026-09-15: the xkoin.thuku.dev A record exists and Traefik serves a Let's Encrypt certificate (`curl -I https://xkoin.thuku.dev/` gives 302 to /gate); the W5500 pins are signed off on the pinmap.md assignment (paper 05, bom.md and the blueprint data corrected); the gas headline stays 191,698 with /replay noting the 191,650 snapshot run; the velxio fork master was reset to upstream master (PR #324 was already merged, its body footer removed, feat/esp32-chip-nets deleted, backup tags local); a geology use case (docs/potential/09) was commissioned; the velxio documentation follow-up PR is its own future session, after reading the maintainer's new chip-net docs.

Next, in order: (1) hand the default password to the legal advisor and add named passwords with `XKOIN_GATE_NAMED=name:pw scripts/deploy-site.sh`; (3) the two pin sign-offs and the gas figure reconciliation; (4) a geologists' use case under docs/potential if it is to be claimed; (5) split the 1.9 MB bundle with manualChunks per route; (6) kiosk scope (xkoinkiosk.com) in its own session; (7) carried items from session four (velxio demos, TX power, Jenga, test plan phases).

## Addendum 2026-09-18, session seven (gate sessions, gloss popups)

Martin's asks: a password change in the VPS .env must log out every session opened with it; sessions end when the browser closes; glossary popups were clipped inside table rows.

Done and deployed (commit b9df37b, scripts/deploy-site.sh, pass-wall checks passed on the VPS, secret kept): the gate signs each cookie with HMAC(secret, sha256(password)), so a password change or removal voids that password's sessions alone and a secret rotation voids all; the cookie is a session cookie (no Max-Age) with XKOIN_GATE_TTL_HOURS as the ceiling for a browser left open; the runbook 07-pass-wall.md has a new "When a session ends" section. Verified with 20 end-to-end checks against the gate on Node (scratchpad script, not committed). sessionStorage was not used: the wall is an nginx auth_request on every asset, and the browser sends only cookies with those requests, so a session cookie is the mechanism that meets the ask.

Gloss popups: .xk-tablewrap has overflow-x: auto, which makes it a scroll container that clips absolutely positioned children whatever their z-index. The popup is now position: fixed, placed by DocsArticle on hover or focus (below the term, flipped above near the viewport bottom, clamped inside the viewport, re-placed on scroll). Verified in the browser pane on paper 02: a last-row term's popup extends past the wrapper's bottom and right edges and hit-tests as itself.

Host note: web/node_modules had POSIX-only bin shims, so `npm run dev:web` failed with "vite is not recognized"; `npm install` in web/ regenerated vite.cmd. The lockfile did not change.

Next, in order: unchanged from the session six addendum. web/public/sitemap.xml is regenerated by predev with the day's date and is left uncommitted.

## Addendum, session eight (2026-09-25): /demo contract simulator

Live at https://xkoin.thuku.dev/demo behind the pass-wall, merged as PR #1 (commit 0cee7e2). Engine in web/src/demo (engine.js ports xKoinToken, xKoinEscrow, xKoinTreasury rule for rule; crypto.js uses @noble/hashes and @noble/curves 2.4.0 for real keccak256, EIP-712, secp256k1, Ed25519; gas.js holds forge-measured gas with a source tag per figure). `npm run verify:demo` in web/ runs 60 checks, including an exact replay of web/src/proof/chain.json.

Gas probes run this session with a throwaway forge test (deleted): transferFrom 57,594; settle one fresh ticket 131,391; the same channel again 80,103; three fresh tickets 251,238; repeat deposit 43,966. Settle model: 71,467 + 59,924 per ticket, less 17,100 per warm slot (EIP-2200), within 0.17 percent of anvil.

Findings for Martin: paper 04 section 9 labels 191,698 gas as a one-ticket settle, but chain.json shows that transaction carried two tickets; one ticket measures 131,391 (0.24 KES). withdrawDeposit has no relayed form, so a client with no ETH cannot exit escrow without the kiosk sending gas. A 12 MB session grosses 0.60 KES against 0.24 KES to settle it alone; the relayer break-even at 2x gas is about 192 MB per batch at the placeholder price.

Next: decide whether to add withdrawWithSig and transferDeposit to xKoinEscrow; correct the paper 04 gas row; the progress board for this session was not published.

## Addendum, session eight continued (2026-09-26): relayed exit, playground

Merged as PR #2 and deployed. xKoinEscrow gained withdrawWithSig (gasless exit, destination signed) and transferDeposit (meter to meter, no token moves), sharing authNonces; 35 forge tests pass. Gas: first use 93,358 and 83,050, warm 76,246 and 65,950; escrow deploy 2,210,501; all three plus setBridge 4,518,529. A throwaway forge test deployed the escrow at the demo address on chain 31337 and accepted signatures made by web/src/demo/crypto.js. Docs now call 191,698 a two-ticket settle; one ticket is 131,391 (0.24 KES); break-even 96 MB at 1x gas, 192 MB at the relayer's 2x rule.

/demo is now a full-screen playground (web/src/demo/ui/Playground.jsx, steps in web/src/demo/steps.js): flow map, folding step wizard with closed-box in/does/out, toggle panels Money, Proof, Log, overlays Costs, Tools, Help. Play all runs with no timers. verify:demo 70 of 70.

Open: gateway route and app screen for the two new functions; paste the regenerated ~/.claude/cloud/setup.sh into the cloud environment (new efficiency rule); decide whether to replace @noble with native code (WebCrypto has no keccak-256 or secp256k1).
