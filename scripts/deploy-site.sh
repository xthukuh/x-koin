#!/usr/bin/env bash
# Build the presentation site image locally, ship it to the VPS and start it
# behind Traefik. No registry, no build on the 2-core VPS.
#
#   scripts/deploy-site.sh            # host alias my-n8n, dir /docker/xkoin-site
#   HOST=my-n8n scripts/deploy-site.sh
#
# Proven 2026-09-13: image 64 MB, transfer gzip over ssh, docker compose up
# --no-build on the VPS, Traefik routes xkoin.thuku.dev to it.
set -euo pipefail
HOST="${HOST:-my-n8n}"
DIR="${DIR:-/docker/xkoin-site}"
SITE_HOST="${XKOIN_SITE_HOST:-xkoin.thuku.dev}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

docker compose -f "$ROOT/docker/compose.site.yml" build -q
docker save xkoin-site:local | gzip | ssh -o BatchMode=yes "$HOST" 'gunzip | docker load' | tail -1
scp -q -o BatchMode=yes "$ROOT/docker/compose.site.yml" "$HOST:/tmp/compose.site.yml"
ssh -o BatchMode=yes "$HOST" "set -e; mkdir -p $DIR && mv /tmp/compose.site.yml $DIR/docker-compose.yml && cd $DIR && printf 'XKOIN_SITE_HOST=%s\n' '$SITE_HOST' > .env && docker compose up -d --no-build | tail -1 && sleep 3 && curl -s -o /dev/null -w 'site %{http_code}\n' http://127.0.0.1:8090/ && curl -sk -o /dev/null -w 'traefik %{http_code}\n' --resolve $SITE_HOST:443:127.0.0.1 https://$SITE_HOST/"
