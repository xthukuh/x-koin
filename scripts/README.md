# scripts

Every script here is run from the repository root and takes its settings from the environment, so the same file works on this Windows host, in the proof container and on the VPS.

| Script | What it does |
|---|---|
| `bootstrap.sh` | Restores `contracts/lib` from git objects if needed, installs the Python dependencies, then runs every proof in the tree. |
| `docker-proofs.sh` | The same thing inside a container, with no local Python, Foundry or gcc needed. |
| `deploy-site.sh` | Builds the site image locally, ships it to the VPS over ssh and starts it behind Traefik. |
| `gate-secret.sh` | Prints one `XKOIN_GATE_SECRET` line for the pass-wall env file. |
| `gas_budget.py` | What each chain operation costs in ETH, USD and KES, the settlement break-even, and runway in days from live balances. |
| `push_to_github.sh` | The PAT push path. Superseded by `gh` locally; kept as a fallback. |
| `scout/ali.mjs` | Reads AliExpress search results and product pages as JSON, through the locally installed Chrome. |
| `scout/local.mjs` | Searches six Nairobi electronics stores for the part lines, over plain HTTP. |

## Prove the whole tree

    PYTHON=.venv/Scripts/python.exe MAKE=mingw32-make scripts/bootstrap.sh

Verified on 2026-09-14 on this Windows host: exit 0, ending with `BOOTSTRAP COMPLETE: every proof green`. It runs, in order: the contract tests (28 passed), the gateway API tests (32 passed), the protocol unit tests (11 passed), scenarios S1 to S6, the firmware host core (75 checks) and the anvil chain end-to-end proof. Foundry must be on PATH first: `export PATH="$HOME/.foundry/bin:$PATH"`.

On Linux the variables are unnecessary: `scripts/bootstrap.sh` on its own uses `python3` and `make`. `PIP_FLAGS=--break-system-packages` helps on a distro that manages its Python packages, and `FOUNDRY_PROFILE=sandbox` pins a pre-fetched solc where `binaries.soliditylang.org` is unreachable.

The same matrix with no local toolchain at all:

    scripts/docker-proofs.sh

That builds the `proofs` image from `docker/Dockerfile` and runs `bootstrap.sh` inside it against the bind-mounted working tree, so it tests what is on disk rather than a stale copy. Exit code is bootstrap's own.

## Deploy the site

    scripts/deploy-site.sh
    HOST=my-n8n DIR=/docker/xkoin-site XKOIN_SITE_HOST=xkoin.thuku.dev scripts/deploy-site.sh

Documented from `scripts/deploy-site.sh`, not run in this session. It builds `xkoin-site:local` and `xkoin-gate:local` from `docker/compose.site.yml`, pipes `docker save` through gzip and ssh into `docker load` on the VPS, copies the compose file and the gate sources across, rewrites `$DIR/.env`, then runs `docker compose up -d --no-build --force-recreate` and walks the pass-wall end to end: a cookieless `GET /` must redirect to `/gate`, the password page must answer 200, a correct password must set the cookie, the SPA must come back with it, and Traefik must answer on the real hostname. A failed check exits 1. There is no registry and nothing is built on the two-core VPS.

The env file on the VPS is the source of truth for the passwords and the cookie secret. The deploy preserves what is already there and fills in only what is missing, so a named password added by hand survives. Override from here by exporting before the run:

    XKOIN_GATE_PASSWORD='new one' scripts/deploy-site.sh
    XKOIN_GATE_NAMED='legal:abc123,investor-a:def456' scripts/deploy-site.sh

To rotate the cookie secret by hand instead, which logs every visitor out:

    scripts/gate-secret.sh >> /docker/xkoin-site/.env     # on the VPS

Verify after merge: `deploy-site.sh`, `gate-secret.sh` and the pass-wall they serve were being written by another agent while this file was drafted.

## Gas budget

    .venv/Scripts/python.exe scripts/gas_budget.py
    .venv/Scripts/python.exe scripts/gas_budget.py --gas-gwei 0.006 --eth-usd 2468.58 --usd-kes 123.29
    .venv/Scripts/python.exe scripts/gas_budget.py --rpc https://sepolia.base.org --address relayer=0x... --address bridge=0x...

Offline by default. The defaults are the values measured on 2026-09-09; pass today's numbers to refresh. Figures marked `measured` come from receipts, the rest are estimates until phase 1 of `docs/ops/critical-accounts/05-test-plan.md` replaces them.

## The sourcing scouts

    npm --prefix scripts/scout install
    node scripts/scout/ali.mjs search "esp32-s3 devkitc-1 n16r8" --max 20
    node scripts/scout/ali.mjs item https://www.aliexpress.com/item/1005006240249067.html
    node scripts/scout/local.mjs probe esp32
    node scripts/scout/local.mjs parts --out hardware/shopping/parts --only esp32-s3-devkitc-n16r8

`ali.mjs` drives the locally installed Chrome or Edge through playwright-core, headless, one browser per process. Output is one JSON document on stdout and nothing is written to disk unless `--out` is given.

Known limits, learned the hard way and worth not rediscovering:

- Run at most three Chrome scouts at once. Six made the host unusable.
- AliExpress serves an anti-bot page after many rapid calls, and its `/w/` search pages are empty shells everywhere.
- AliExpress item pages render fully only in Martin's own signed-in Chrome session. The headless scout and the in-app browser get the shell.
- SKU variants and the shipping line are not extracted reliably; confirm both at checkout.
- `local.mjs` resolves hostnames through the DNS resolver itself, because on this host Node's default lookup takes about 12 seconds per name and undici's connect timeout fires first.
