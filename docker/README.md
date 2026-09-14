# docker

Four compose files, four jobs. None of them is required to work on the code; each exists so one job behaves the same on any host.

| File | Job | Where it runs |
|---|---|---|
| `compose.yml` | The proof matrix and the firmware build, against the bind-mounted working tree | anywhere with Docker |
| `compose.site.yml` | The presentation site behind the pass-wall | locally on 127.0.0.1:8090, and on the VPS behind Traefik |
| `compose.velxio.yml` | The self-hosted velxio simulator | locally on 127.0.0.1:3080, and on the VPS behind Traefik |
| `compose.gateway.yml` | The fiat bridge API and its payout worker | the VPS only |

Supporting files: `Dockerfile` (the `proofs` and `firmware` stages), `site.Dockerfile` with its own `site.Dockerfile.dockerignore`, `site.nginx.conf`, `gateway.Dockerfile`, and `gate/` (the pass-wall service).

## Prerequisites

Docker with Compose v2. Verified on this host: Docker 29.2.1.

Every file below was validated on 2026-09-14 with `docker compose -f <file> config -q`: `compose.yml`, `compose.site.yml` and `compose.velxio.yml` exit 0. `compose.gateway.yml` exits 1 off the VPS because its `env_file` points at `/srv/xkoin/.env`, which lives only there. That is the expected result, not a syntax error.

## Proofs

    docker compose -f docker/compose.yml build proofs
    docker compose -f docker/compose.yml run --rm proofs
    docker compose -f docker/compose.yml run --rm firmware

The first builds an Ubuntu 24.04 image carrying Python, gcc, make, git and Foundry. The second runs `scripts/bootstrap.sh` inside it; `scripts/docker-proofs.sh` wraps the pair as one command and returns bootstrap's exit code. The third builds the ESP32-S3 firmware with PlatformIO, with the espressif32 platform cached in a named volume so only the first run pays for the download.

The repository is never copied into the image. Both services bind-mount the working tree at `/work`, so a proof run tests what is on disk.

## The site

    XKOIN_GATE_SECURE=false docker compose -f docker/compose.site.yml up --build
    # http://127.0.0.1:8090/

Two containers. `site` is nginx serving the built SPA; `gate` is the pass-wall, a single-file Node service with no dependencies. Every request except `/healthz`, `/robots.txt`, `/favicon.svg` and `/gate` runs an `auth_request` against the gate, so no byte of the bundle or the docs corpus leaves the container without a valid signed cookie.

`XKOIN_GATE_SECURE=false` is needed only for the local test, which is plain http: with the Secure flag set the browser drops the cookie and the password page loops. Everywhere else it stays true.

Settings live in an env file next to the compose file. `gate/.env.example` lists every key: the site hostname, the shared password, optional named passwords, the HMAC secret (`scripts/gate-secret.sh` prints one), the cookie lifetime, the Secure flag and the proxy trust flag. Deleting a named password and restarting the gate revokes that name's live cookies and nobody else's.

The build stage copies `docs/` and `hardware/` alongside `web/`, because the markdown viewer imports the corpus at build time and the landing page reads the board photos, both outside the Vite root. The retired `demo/` and `protocol/viz/` trees are no longer copied.

Deploying is `scripts/deploy-site.sh`; see `scripts/README.md`.

Verify after merge: the pass-wall (`gate/`, the nginx config and the compose changes) was being written by another agent while this file was drafted. The operating notes above come from those files as they stand on disk. The full runbook is `docs/ops/critical-accounts/07-pass-wall.md`.

## The simulator

    docker compose -f docker/compose.velxio.yml up -d
    # http://127.0.0.1:3080

    VELXIO_TRAEFIK=true VELXIO_HOST=velxio.thuku.dev docker compose -f docker/compose.velxio.yml up -d

`VELXIO_IMAGE` selects the image: upstream master by default, or the build of Martin's fork that carries the ESP32 chip-net patch offered upstream as PR 324. Five named volumes keep the arduino-cli cores, the libraries, ccache and the ESP-IDF build directory, so a compile after a restart takes seconds. First boot installs the Arduino, RP2040 and ESP32 cores before `/health` answers, which is why the healthcheck has a 30-minute start period.

## The gateway API

    docker compose -f docker/compose.gateway.yml --env-file /srv/xkoin/.env up -d --build

Two services from one base: the API behind Traefik on `api.xkoin.thuku.dev`, and the payout worker on the internal network only. Secrets stay on the host: `/srv/xkoin/.env` and `/srv/xkoin/jenga_private.pem`, mounted read-only. Nothing sensitive is in the image.

## Traefik, in one paragraph

Two patterns are in play and they are not interchangeable. `compose.gateway.yml` joins an external network named `proxy` and sets `traefik.docker.network=proxy`. `compose.site.yml` and `compose.velxio.yml` do not, because the Traefik on that VPS runs on the host network and reaches containers on their own compose network. Entrypoint `websecure` and certresolver `letsencrypt` are the same in all three. If a host names its network or resolver differently, those are the only labels to change.
