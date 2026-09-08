#!/usr/bin/env bash
# Reconstitute and re-prove the entire project after cloning/extracting.
# The delivery tarball ships without contracts/lib working copies (they are in
# git objects); this restores them, installs Python deps, and runs every proof.
#   scripts/bootstrap.sh            # local machine
#   PIP_FLAGS=--break-system-packages FOUNDRY_PROFILE=sandbox scripts/bootstrap.sh
#   PYTHON=.venv/Scripts/python.exe MAKE=mingw32-make scripts/bootstrap.sh   # Windows Git Bash
set -euo pipefail
export PYTHON="${PYTHON:-python3}"   # e2e_chain_proof.sh honours the same variable
MAKE="${MAKE:-make}"
cd "$(dirname "$0")/.."
case "$PYTHON" in */*) PYTHON="$(cd "$(dirname "$PYTHON")" && pwd)/$(basename "$PYTHON")";; esac   # absolute, sub-scripts cd elsewhere

if [ ! -f contracts/lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol ]; then
    echo "== restoring vendored solidity deps from git objects"
    git checkout -- contracts/lib
fi
echo "== python deps"
"$PYTHON" -m pip install -q ${PIP_FLAGS:-} -r gateway-api/requirements.txt \
    -r gateway-api/requirements-dev.txt
command -v forge >/dev/null || { echo "Foundry missing: https://getfoundry.sh"; exit 1; }

echo "== contracts (expect 28 passed)"
(cd contracts && forge test)
echo "== gateway-api (expect 20 passed)"
(cd gateway-api && "$PYTHON" -m pytest tests/ -q)
echo "== protocol unit tests (expect 11 passed)"
(cd protocol && "$PYTHON" -m pytest tests/ -q)
echo "== protocol scenarios S1-S6"
(cd protocol && "$PYTHON" run_sim.py)
echo "== firmware portable core (expect 75 checks)"
(cd firmware/xkoin-gateway/test/host && "$MAKE" -s run)
echo "== chain e2e: anvil + real escrow + founder payout property"
protocol/e2e_chain_proof.sh
echo
echo "BOOTSTRAP COMPLETE: every proof green. Read HANDOVER.md next."
