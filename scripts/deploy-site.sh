#!/usr/bin/env bash
# Build the presentation site and its pass-wall locally, ship both images to the
# VPS and start them behind Traefik. No registry, no build on the 2-core VPS.
#
#   scripts/deploy-site.sh            # host alias my-n8n, dir /docker/xkoin-site
#   HOST=my-n8n scripts/deploy-site.sh
#
# Nothing in the site is public: every request is checked against the gate
# container before nginx reads a file. See
# docs/ops/critical-accounts/07-pass-wall.md.
#
# The env file on the VPS is the source of truth for the passwords and the
# cookie secret. This script preserves whatever is already there and only fills
# in what is missing, so a named password added by hand on the VPS survives a
# deploy. To change a value from here, export it before running:
#
#   XKOIN_GATE_PASSWORD='new one' scripts/deploy-site.sh
#   XKOIN_GATE_NAMED='legal:abc123,investor-a:def456' scripts/deploy-site.sh
#
# Proven 2026-09-13: image transfer gzip over ssh, docker compose up -d
# --no-build on the VPS, Traefik routes xkoin.thuku.dev to it.
set -euo pipefail
HOST="${HOST:-my-n8n}"
DIR="${DIR:-/docker/xkoin-site}"
SITE_HOST="${XKOIN_SITE_HOST:-xkoin.thuku.dev}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "build"
docker compose -f "$ROOT/docker/compose.site.yml" build -q

echo "ship xkoin-site:local and xkoin-gate:local"
docker save xkoin-site:local xkoin-gate:local \
  | gzip \
  | ssh -o BatchMode=yes "$HOST" 'gunzip | docker load' \
  | tail -2

echo "ship the compose file and the gate sources"
ssh -o BatchMode=yes "$HOST" "mkdir -p '$DIR/gate'"
scp -q -o BatchMode=yes "$ROOT/docker/compose.site.yml" "$HOST:$DIR/docker-compose.yml"
scp -q -o BatchMode=yes "$ROOT/docker/gate/Dockerfile" "$ROOT/docker/gate/server.mjs" "$HOST:$DIR/gate/"

# The remote half runs from a quoted heredoc, so nothing below is expanded by
# the local shell. Every value it needs arrives as a positional argument.
ssh -o BatchMode=yes "$HOST" bash -s -- \
  "$DIR" \
  "$SITE_HOST" \
  "${XKOIN_GATE_PASSWORD:-}" \
  "${XKOIN_GATE_NAMED:-}" \
  "${XKOIN_GATE_SECRET:-}" \
  "${XKOIN_GATE_TTL_HOURS:-}" <<'REMOTE'
set -eu
DIR="$1"; SITE_HOST="$2"; IN_PASSWORD="$3"; IN_NAMED="$4"; IN_SECRET="$5"; IN_TTL="$6"
ENVFILE="$DIR/.env"

# Read one key out of the existing env file, if it is there.
old() {
  [ -f "$ENVFILE" ] || return 0
  sed -n "s/^$1=//p" "$ENVFILE" | tail -1
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

PASSWORD="${IN_PASSWORD:-$(old XKOIN_GATE_PASSWORD)}"
PASSWORD="${PASSWORD:-xkoin#2030}"
NAMED="${IN_NAMED:-$(old XKOIN_GATE_NAMED)}"
TTL="${IN_TTL:-$(old XKOIN_GATE_TTL_HOURS)}"
TTL="${TTL:-72}"
SECRET="${IN_SECRET:-$(old XKOIN_GATE_SECRET)}"
if [ -z "$SECRET" ]; then
  SECRET="$(random_secret)"
  echo "gate secret: generated a new one, every existing cookie is now void"
else
  echo "gate secret: kept the one already on the host"
fi

umask 077
{
  printf 'XKOIN_SITE_HOST=%s\n' "$SITE_HOST"
  printf 'XKOIN_GATE_PASSWORD=%s\n' "$PASSWORD"
  printf 'XKOIN_GATE_NAMED=%s\n' "$NAMED"
  printf 'XKOIN_GATE_SECRET=%s\n' "$SECRET"
  printf 'XKOIN_GATE_TTL_HOURS=%s\n' "$TTL"
  printf 'XKOIN_GATE_SECURE=true\n'
  printf 'XKOIN_GATE_TRUST_PROXY=true\n'
} > "$ENVFILE"
chmod 600 "$ENVFILE"

cd "$DIR"
docker compose up -d --no-build --force-recreate | tail -2
sleep 4

B=http://127.0.0.1:8090
fail=0
check() { printf '%-42s %s\n' "$1" "$2"; }

# 1. The site itself, with no cookie.
head_root="$(curl -s -D - -o /dev/null "$B/")"
code="$(printf '%s' "$head_root" | sed -n '1s#HTTP/[0-9.]* \([0-9]*\).*#\1#p')"
loc="$(printf '%s' "$head_root" | sed -n 's/^[Ll]ocation: *//p' | tr -d '\r')"
check "GET / (no cookie)" "$code -> $loc"
[ "$code" = "302" ] || fail=1
case "$loc" in /gate*) ;; *) fail=1 ;; esac

# 2. The password page.
code="$(curl -s -o /dev/null -w '%{http_code}' "$B/gate")"
check "GET /gate" "$code"
[ "$code" = "200" ] || fail=1

# 3. The password itself. The cookie carries Secure, and this hop is plain
#    http on the loopback, so the token is lifted out by hand rather than
#    through curl's cookie jar.
post="$(curl -s -D - -o /dev/null -X POST "$B/gate" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "password=$PASSWORD" --data-urlencode 'next=/')"
code="$(printf '%s' "$post" | sed -n '1s#HTTP/[0-9.]* \([0-9]*\).*#\1#p')"
token="$(printf '%s' "$post" | sed -n 's/.*xkgate=\([^;]*\).*/\1/p' | tr -d '\r' | head -1)"
if [ -n "$token" ]; then cookie="set"; else cookie="MISSING"; fi
check "POST /gate with the default password" "$code, Set-Cookie $cookie"
[ "$code" = "303" ] || fail=1
[ -n "$token" ] || fail=1

# 4. The SPA, with that cookie.
body="$(curl -s -w '\n%{http_code}' -H "Cookie: xkgate=$token" "$B/")"
code="$(printf '%s' "$body" | tail -1)"
shape="no html"
case "$body" in *'<!doctype html'*|*'<!DOCTYPE html'*) shape="spa html" ;; esac
check "GET / with the cookie" "$code, $shape"
[ "$code" = "200" ] || fail=1
[ "$shape" = "spa html" ] || fail=1

# 5. Through Traefik, on the real hostname.
code="$(curl -sk -o /dev/null -w '%{http_code}' --resolve "$SITE_HOST:443:127.0.0.1" "https://$SITE_HOST/")"
check "GET https://$SITE_HOST/ via Traefik" "$code (302 = the wall, from the edge)"

if [ "$fail" -ne 0 ]; then
  echo "pass-wall checks FAILED"
  exit 1
fi
echo "pass-wall checks passed"
REMOTE
