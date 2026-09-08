#!/usr/bin/env bash
# Reconstitute and re-prove the entire project after cloning/extracting.
# The delivery tarball ships without contracts/lib working copies (they are in
# git objects); this restores them, installs Python deps, and runs every proof.
#   scripts/bootstrap.sh            # local machine
#   PIP_FLAGS=--break-system-packages FOUNDRY_PROFILE=sandbox scripts/bootstrap.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f contracts/lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol ]; then
    echo "== restoring vendored solidity deps from git objects"
    git checkout -- contracts/lib
fi
echo "== python deps"
python3 -m pip install -q ${PIP_FLAGS:-} -r gateway-api/requirements.txt \
    -r gateway-api/requirements-dev.txt
command -v forge >/dev/null || { echo "Foundry missing: https://getfoundry.sh"; exit 1; }

echo "== contracts (expect 28 passed)"
(cd contracts && forge test)
echo "== gateway-api (expect 9 passed)"
(cd gateway-api && python3 -m pytest tests/ -q)
echo "== protocol unit tests (expect 11 passed)"
(cd protocol && python3 -m pytest tests/ -q)
echo "== protocol scenarios S1-S6"
(cd protocol && python3 run_sim.py)
echo "== firmware portable core (expect 75 checks)"
(cd firmware/xkoin-gateway/test/host && make -s run)
echo "== chain e2e: anvil + real escrow + founder payout property"
protocol/e2e_chain_proof.sh
echo
echo "BOOTSTRAP COMPLETE: every proof green. Read HANDOVER.md next."
