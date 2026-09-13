# x-koin resume point

Updated 2026-09-13, during session four (the revamp). Read this first on a
fresh session, then docs/_plan/revamp-plan.md.

## Pages and boards

- Revamp progress board: https://claude.ai/code/artifact/e5d8bacb-6b8c-477a-ae0c-0161b91c51bf
- Companion app wireframes: https://claude.ai/code/artifact/d372548e-e24c-4524-997f-5e746c512a17
- Bring-up board (session two): https://claude.ai/code/artifact/ac423197-641a-4994-8c9f-6144aeb3fa4b
- Mesh replay: https://claude.ai/code/artifact/f351573e-d847-4ce5-96fb-56924ce3a242
- Investor demo: https://claude.ai/code/artifact/2360a9fa-beab-45bd-9f98-f976804601eb
- Landlord pilot page: https://claude.ai/code/artifact/7de94e3f-acf4-4d4a-b343-2a9051b87589

One stack for pages (Martin's rule), Node since session four: `web/` is a
Vite SPA. `npm run dev:web` serves it on http://localhost:5173/ and
`docker compose -f docker/compose.site.yml up --build` serves the built site
on http://127.0.0.1:8090/. `web/scripts/inline-data.mjs` rebuilds the three
legacy pages (investors, landlord, replay) as the predev and prebuild step,
byte for byte what demo/build.py used to write. No file:// previews, no
other ports. TaskStop does not kill vite; taskkill the listener.

## Session four (2026-09-12 to 13): the revamp

Martin's change request: replace Wokwi with self-hosted velxio at
velxio.thuku.dev, redo the demos as importable simulator files, rewrite the
docs as a scientific whitepaper set with Kickstarter-grade presentation,
Node SPA in Docker instead of the Python demo build, an AliExpress shopping
list page, companion app wireframes, explainer slides, a beta compact
board set, and the use-case set under docs/potential.

Decisions taken with Martin (all as recommended):
1. Simulator: velxio, unmodified upstream image, demos as .vlx files in
   this private repo (no AGPL publication duty). Research in
   docs/_plan/research/01-velxio-feasibility.md.
2. LoRa boards: Heltec WiFi LoRa 32 V3 for Satellite, Client dongle and
   the farm node; DevKitC N16R8 plus E22-900M22S for Node and
   Node-Satellite on the doc 02 pins.
3. Names: Node-Satellite is the mains relay, Satellite the off-grid LoRa
   remote, Client the phone or OTG dongle.
4. Domains: site xkoin.thuku.dev, API api.xkoin.thuku.dev (gateway compose
   default changed), simulator velxio.thuku.dev.

Commits this session: 8957759 (SPA, Docker site, docs/ops move, plan,
scout tooling), 5092967 and cf4f9d6 (velxio compose), 7d2541e (papers 00
to 04, 10, 11, nine potential cases, patent draft export, scouted parts).

Infrastructure state:
- VPS srv1837953 (ssh alias my-n8n, root): /docker/velxio/docker-compose.yml
  with .env (VELXIO_HOST, VELXIO_TRAEFIK=true, VELXIO_PORT=3080). Traefik
  there runs on the host network with the letsencrypt resolver; containers
  need no external network. The container installs Arduino, RP2040 and
  ESP32 cores on first boot (minutes); the healthcheck has a 30 minute
  start period for that. DNS record velxio.thuku.dev not yet created.
- Local: docker/compose.velxio.yml on 127.0.0.1:3080 for authoring.
- Chrome extension connected by Martin (Claude in Chrome).

Tooling: scripts/scout/ali.mjs (playwright-core on the installed Chrome,
headless, warm-up visit, default UA) searches and reads AliExpress
listings with KES prices and gallery images. Known gaps: sku variants and
the shipping line are not extracted reliably; AliExpress serves anti-bot
punish pages after many rapid calls; run at most three Chrome scouts at a
time (Martin's machine lagged at six).

Written this session: docs/_plan (revamp plan, papers brief, three
research reports), docs/_drive (five verbatim Drive exports), docs/papers
00 to 04, 10, 11 with seven figures, docs/potential 00 to 08,
hardware/shopping/parts (9 lines of 19), the blueprint SVG template.

In flight when this snapshot was written (agents): landing page in
web/src/landing (Kickstarter-style, replaces `/`), velxio chip models
SX1262 and KQ-130F under hardware/velxio, docs/x-koin-beta (five files),
papers 05, 06, 12 and 07, 08, 09, 13, 14, and the scout for the twelve
remaining part lines.

## Next, in order

1. Review and commit the in-flight agent output (diff first).
2. Shopping list page in the SPA (/shop) compiled from
   hardware/shopping/parts/*.json with a gallery carousel per part;
   totals per device role; deploy the site to the VPS (compose.site.yml,
   host xkoin.thuku.dev) once Martin adds DNS.
3. Velxio demos: .vlx files per device under hardware/velxio, chips
   proven in the local instance, then live test through the Chrome
   extension against velxio.thuku.dev.
4. Explainer slides: reveal.js route in the SPA following the NODE format
   (docs/_plan/research/03-explainer-video-study.md), plus a capture
   script for video.
5. Reconcile the two figure conflicts the writers found (Node CapEx
   15,500 versus about 26,000 KES; target 10 KES/GB versus the 50 KES/GB
   placeholder) with Martin; resolve TODO: verify markers.
6. Carried from session three: firmware TX power and sub-band decision,
   Jenga sandbox, phases 1 to 5 of docs/ops/critical-accounts/05-test-plan.md,
   HANDOVER section 4 items 6 to 11.

## Waiting on Martin

- Cloudflare A records: velxio, xkoin, api.xkoin to 31.97.105.173.
- Paper review: TODO: verify markers and the two figure conflicts.
- Carried: Binance hardening, Coinbase Developer Platform and Alchemy
  accounts, hardware wallet order, Jenga sandbox credentials, pins marked
  proposed in hardware/pinmap.md, TX power and sub-band, per-unit price.

## Windows host setup that works

    python -m venv .venv                       # Python 3.14, deps from gateway-api/requirements*.txt
    export PATH="$HOME/.foundry/bin:$PATH"     # Foundry 1.5.1 stable
    PYTHON=.venv/Scripts/python.exe MAKE=mingw32-make scripts/bootstrap.sh   # Git Bash, all proofs
    npm run dev:web                            # presentation site, port 5173
    docker compose -f docker/compose.velxio.yml up -d   # simulator on 127.0.0.1:3080

WSL Ubuntu-20.04 is unusable (no DNS, sudo needs a password). Docker
Desktop 29.2.1 works. The Windows `python` alias without a script hangs
and spins CPU; always call .venv/Scripts/python.exe with a script path.

## Addendum 2026-09-13 (later in session four)

Committed since the snapshot above: landing page (da1fef3), shop page
(596a19c), papers 05 to 14 (252ea5d, 3b26fd7), beta set (1223a2e), W5500
pin move (f6b8600), slides (c6fd02d), chip models (364be1b), all 19 scout
lines (ea1fc57). Martin's fifth decision: fork velxio to patch the ESP32
backend for chip-to-chip nets (fork https://github.com/xthukuh/velxio,
working copy D:\velxio, branch feat/esp32-chip-nets, agent in flight;
review before push). Scout caveats: no HomePlug Wi-Fi kit on AliExpress
(buy in Nairobi), the KQ-130F listing photographs a KQ-330 (confirm the
variant at checkout), most shipping figures unverified. The local velxio
container holds a manual wasi-sdk install that the fork's Dockerfile must
replace.

## Addendum 2026-09-13, end of session four

Fork patch proven: D:\velxio branch feat/esp32-chip-nets (9 commits, 23
files, 15 backend and 9 frontend tests added, suites green apart from
pre-existing failures) makes chip-to-chip nets work on ESP32 boards and
across two QEMU workers; two ESP32-S3 boards exchanged 11 of 12 "xkoin
ping" frames at a 40 ms bit period (bridge latency 2.3 to 24 ms). Not
pushed: Martin reviews, then push and open the upstream PR. The fork's
Dockerfile.standalone ships wasi-sdk; build the image from the fork for the
VPS (velxio-xkoin:dev locally) once pushed. Site deployed on the VPS
(scripts/deploy-site.sh, /docker/xkoin-site, Traefik routes
xkoin.thuku.dev; certificate waits for DNS). Board and wireframe URLs at
the top of this file.

Next, in order: push the fork and rebuild the VPS simulator from it;
per-device .vlx demos (Node, Node-Satellite, Satellite, Client dongle,
farm node) under hardware/velxio/demos with the real firmware where it
compiles in velxio; a frame-level net message in the fork so the bit
period can drop from 40 ms; fix the KQ-130F decode over the bridge;
live test through the Chrome extension against velxio.thuku.dev after
DNS; reconcile the paper figure conflicts and TODO markers with Martin;
the two pin sign-offs (W5500 move, Heltec per-board headers).

## Addendum 2026-09-13, after Martin's push approval

Fork branch pushed, fork master fast-forwarded to it, upstream PR opened:
https://github.com/davidmonterocrespo24/velxio/pull/324. The forked image
velxio-xkoin:dev (5.3 GB) is being shipped to the VPS; compose.velxio.yml
takes VELXIO_IMAGE and the VPS .env sets it to the fork image.
