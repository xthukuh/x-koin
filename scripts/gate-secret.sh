#!/usr/bin/env bash
# Print one XKOIN_GATE_SECRET line to paste into the pass-wall env file.
#
#   scripts/gate-secret.sh
#   scripts/gate-secret.sh >> /docker/xkoin-site/.env     # on the VPS
#
# The value is 32 random bytes as hex. It is the HMAC key that signs the xkgate
# cookie, so changing it logs every visitor out. See
# docs/ops/critical-accounts/07-pass-wall.md.
set -euo pipefail

if command -v openssl >/dev/null 2>&1; then
  secret="$(openssl rand -hex 32)"
elif command -v node >/dev/null 2>&1; then
  secret="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')"
else
  secret="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
fi

printf 'XKOIN_GATE_SECRET=%s\n' "$secret"
