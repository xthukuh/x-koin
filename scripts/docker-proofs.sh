#!/usr/bin/env sh
# One command: build the "proofs" image and run scripts/bootstrap.sh inside
# it, against the working tree bind-mounted at /work. Same output on any
# host with Docker; no local Python/Foundry/gcc setup required.
#
#   scripts/docker-proofs.sh
#
# Windows: run from Git Bash. Exit code is bootstrap.sh's exit code.
set -eu
cd "$(dirname "$0")/.."

docker compose -f docker/compose.yml build --progress=plain proofs
exec docker compose -f docker/compose.yml run --rm proofs
