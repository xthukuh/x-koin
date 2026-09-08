#!/usr/bin/env bash
# End-to-end sandbox proof: local EVM chain + real xKoinEscrow settlement of
# tickets produced by the XKP simulation. Run from repo root or protocol/.
set -euo pipefail
cd "$(dirname "$0")"

ANVIL0=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BRIDGE_ADDR=0x70997970C51812dc3A010C7d01b50e0d17dc79C8   # anvil account 1

anvil --silent &
ANVIL_PID=$!
trap "kill $ANVIL_PID 2>/dev/null || true" EXIT
for i in $(seq 1 40); do
    cast chain-id --rpc-url http://127.0.0.1:8545 >/dev/null 2>&1 && break
    sleep 0.25
done

pushd ../contracts >/dev/null
DEPLOY_LOG=$(DEPLOYER_KEY=$ANVIL0 BRIDGE_ADDRESS=$BRIDGE_ADDR \
    forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast 2>&1)
popd >/dev/null

export XKOIN_TOKEN=$(echo "$DEPLOY_LOG"    | grep 'xKoinToken'    | grep -oE '0x[a-fA-F0-9]{40}')
export XKOIN_TREASURY=$(echo "$DEPLOY_LOG" | grep 'xKoinTreasury' | grep -oE '0x[a-fA-F0-9]{40}')
export XKOIN_ESCROW=$(echo "$DEPLOY_LOG"   | grep 'xKoinEscrow'   | grep -oE '0x[a-fA-F0-9]{40}')
echo "token=$XKOIN_TOKEN treasury=$XKOIN_TREASURY escrow=$XKOIN_ESCROW"

python3 run_sim.py --chain
