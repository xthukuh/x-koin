"""Export every real on-chain transaction from the xKoin e2e chain proof as JSON.

    python3 trace_chain.py [output.json]

Starts anvil itself, deploys the contracts exactly as e2e_chain_proof.sh does
(same env vars and deployer key), then calls run_sim.chain_settle() with the
same billing units run_sim.py's --chain path derives from scenarios S1 and S3.
After settlement, every mined block is walked with web3 and every transaction
and log is decoded against the token/escrow/treasury ABIs.

This script has zero effect on run_sim.py's printed scenario output or on
chain_settle()'s behaviour and return value: it only reads two small
module-level registries (LAST_CHAIN_ACTORS, LAST_CHAIN_TICKETS) that
chain_settle() populates as a side channel.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Any

PROTOCOL_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(PROTOCOL_DIR)
CONTRACTS_DIR = os.path.join(REPO_ROOT, "contracts")
sys.path.insert(0, PROTOCOL_DIR)

from hexbytes import HexBytes  # noqa: E402

from xkp.settle import ESCROW_ABI, TOKEN_ABI, TREASURY_ABI  # noqa: E402

DEFAULT_OUT = os.path.join(PROTOCOL_DIR, "out", "chain.json")
RPC_URL = "http://127.0.0.1:8545"

# Same fixed anvil dev key/address the shell proof (e2e_chain_proof.sh) and
# run_sim.chain_settle() use, copied verbatim so the two stay byte-identical.
DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BRIDGE_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"  # anvil account 1

ANVIL_START_TIMEOUT_S = 15.0
DEPLOY_TIMEOUT_S = 90.0
RPC_REQUEST_TIMEOUT_S = 30

UNIT_BYTES = 10_000
DECIMALS = 6
JSON_SAFE_INT_BOUND = 2**53

ADDR_RE = re.compile(r"0x[a-fA-F0-9]{40}")

# --- ABI extensions -------------------------------------------------------
# xkp/settle.py's ABIs cover exactly the functions run_sim.chain_settle() (and
# the deploy script) call, but carry no event definitions and are missing
# xKoinToken.setBridge (called once by Deploy.s.sol, not by chain_settle).
# These fragments are additive and local to this script; xkp/settle.py itself
# is not touched.
TOKEN_EXTRA = [
    {
        "type": "function",
        "name": "setBridge",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "bridge", "type": "address"},
            {"name": "allowed", "type": "bool"},
            {"name": "dailyMintCap", "type": "uint128"},
        ],
        "outputs": [],
    },
    {
        "type": "event",
        "name": "Transfer",
        "anonymous": False,
        "inputs": [
            {"name": "from", "type": "address", "indexed": True},
            {"name": "to", "type": "address", "indexed": True},
            {"name": "value", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "Approval",
        "anonymous": False,
        "inputs": [
            {"name": "owner", "type": "address", "indexed": True},
            {"name": "spender", "type": "address", "indexed": True},
            {"name": "value", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "BridgeSet",
        "anonymous": False,
        "inputs": [
            {"name": "bridge", "type": "address", "indexed": True},
            {"name": "allowed", "type": "bool", "indexed": False},
            {"name": "dailyMintCap", "type": "uint128", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "BridgeMint",
        "anonymous": False,
        "inputs": [
            {"name": "to", "type": "address", "indexed": True},
            {"name": "amount", "type": "uint256", "indexed": False},
            {"name": "fiatRef", "type": "bytes32", "indexed": True},
        ],
    },
    {
        "type": "event",
        "name": "BridgeBurn",
        "anonymous": False,
        "inputs": [
            {"name": "from", "type": "address", "indexed": True},
            {"name": "amount", "type": "uint256", "indexed": False},
            {"name": "fiatRef", "type": "bytes32", "indexed": True},
        ],
    },
    {
        "type": "event",
        "name": "OwnershipTransferStarted",
        "anonymous": False,
        "inputs": [
            {"name": "previousOwner", "type": "address", "indexed": True},
            {"name": "newOwner", "type": "address", "indexed": True},
        ],
    },
    {
        "type": "event",
        "name": "OwnershipTransferred",
        "anonymous": False,
        "inputs": [
            {"name": "previousOwner", "type": "address", "indexed": True},
            {"name": "newOwner", "type": "address", "indexed": True},
        ],
    },
]

ESCROW_EXTRA = [
    {
        "type": "event",
        "name": "Deposited",
        "anonymous": False,
        "inputs": [
            {"name": "client", "type": "address", "indexed": True},
            {"name": "amount", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "DepositWithdrawn",
        "anonymous": False,
        "inputs": [
            {"name": "client", "type": "address", "indexed": True},
            {"name": "amount", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "TicketSettled",
        "anonymous": False,
        "inputs": [
            {"name": "client", "type": "address", "indexed": True},
            {"name": "nodeAdmin", "type": "address", "indexed": True},
            {"name": "sequenceNumber", "type": "uint64", "indexed": False},
            {"name": "deltaUnits", "type": "uint128", "indexed": False},
            {"name": "paidAmount", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "BatchSettled",
        "anonymous": False,
        "inputs": [
            {"name": "relayer", "type": "address", "indexed": True},
            {"name": "gross", "type": "uint256", "indexed": False},
            {"name": "fee", "type": "uint256", "indexed": False},
            {"name": "net", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "EarningsClaimed",
        "anonymous": False,
        "inputs": [
            {"name": "nodeAdmin", "type": "address", "indexed": True},
            {"name": "to", "type": "address", "indexed": True},
            {"name": "amount", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "PricePerUnitSet",
        "anonymous": False,
        "inputs": [{"name": "pricePerUnit", "type": "uint256", "indexed": False}],
    },
    {
        "type": "event",
        "name": "OwnershipTransferStarted",
        "anonymous": False,
        "inputs": [
            {"name": "previousOwner", "type": "address", "indexed": True},
            {"name": "newOwner", "type": "address", "indexed": True},
        ],
    },
    {
        "type": "event",
        "name": "OwnershipTransferred",
        "anonymous": False,
        "inputs": [
            {"name": "previousOwner", "type": "address", "indexed": True},
            {"name": "newOwner", "type": "address", "indexed": True},
        ],
    },
]

TREASURY_EXTRA = [
    {
        "type": "function",
        "name": "feeBps",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint16"}],
    },
    {
        "type": "event",
        "name": "FeeBpsSet",
        "anonymous": False,
        "inputs": [{"name": "feeBps", "type": "uint16", "indexed": False}],
    },
    {
        "type": "event",
        "name": "Claimed",
        "anonymous": False,
        "inputs": [
            {"name": "token", "type": "address", "indexed": True},
            {"name": "beneficiary", "type": "address", "indexed": True},
            {"name": "amount", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "BeneficiaryChangeQueued",
        "anonymous": False,
        "inputs": [
            {"name": "pending", "type": "address", "indexed": True},
            {"name": "activation", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "BeneficiaryChanged",
        "anonymous": False,
        "inputs": [{"name": "beneficiary", "type": "address", "indexed": True}],
    },
    {
        "type": "event",
        "name": "BeneficiaryChangeCancelled",
        "anonymous": False,
        "inputs": [{"name": "cancelledBy", "type": "address", "indexed": True}],
    },
    {
        "type": "event",
        "name": "OwnershipTransferStarted",
        "anonymous": False,
        "inputs": [
            {"name": "previousOwner", "type": "address", "indexed": True},
            {"name": "newOwner", "type": "address", "indexed": True},
        ],
    },
    {
        "type": "event",
        "name": "OwnershipTransferred",
        "anonymous": False,
        "inputs": [
            {"name": "previousOwner", "type": "address", "indexed": True},
            {"name": "newOwner", "type": "address", "indexed": True},
        ],
    },
]

FULL_TOKEN_ABI = TOKEN_ABI + TOKEN_EXTRA
FULL_ESCROW_ABI = ESCROW_ABI + ESCROW_EXTRA
FULL_TREASURY_ABI = TREASURY_ABI + TREASURY_EXTRA


# --- JSON safety -----------------------------------------------------------


def to_jsonable(value: Any) -> Any:
    """Recursively convert web3/bytes/big-int values into plain JSON types.

    Bytes and HexBytes become 0x-prefixed hex strings. Ints stay ints unless
    their magnitude exceeds 2**53, in which case they become strings so no
    downstream JSON consumer silently loses precision on a bigint.
    """
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        if -JSON_SAFE_INT_BOUND < value < JSON_SAFE_INT_BOUND:
            return value
        return str(value)
    if isinstance(value, HexBytes):
        return "0x" + value.hex()
    if isinstance(value, (bytes, bytearray)):
        return "0x" + bytes(value).hex()
    if isinstance(value, str):
        return value
    if isinstance(value, Mapping):
        return {str(k): to_jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_jsonable(v) for v in value]
    return value


# --- anvil lifecycle ---------------------------------------------------


def start_anvil() -> subprocess.Popen:
    return subprocess.Popen(
        ["anvil", "--silent"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def wait_for_rpc(w3: Any, timeout_s: float) -> None:
    deadline = time.monotonic() + timeout_s
    last_err: Exception | None = None
    while time.monotonic() < deadline:
        try:
            if w3.is_connected():
                w3.eth.chain_id
                return
        except Exception as exc:  # noqa: BLE001 - keep polling, report the last error
            last_err = exc
        time.sleep(0.25)
    raise RuntimeError(f"anvil RPC did not come up within {timeout_s}s: {last_err}")


def stop_anvil(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=5)


# --- deploy ------------------------------------------------------------


def run_deploy() -> str:
    env = dict(os.environ)
    env["DEPLOYER_KEY"] = DEPLOYER_KEY
    env["BRIDGE_ADDRESS"] = BRIDGE_ADDRESS
    result = subprocess.run(
        ["forge", "script", "script/Deploy.s.sol", "--rpc-url", RPC_URL, "--broadcast"],
        cwd=CONTRACTS_DIR,
        env=env,
        capture_output=True,
        text=True,
        timeout=DEPLOY_TIMEOUT_S,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"forge deploy failed (rc={result.returncode}):\n{result.stdout}\n{result.stderr}"
        )
    return result.stdout + "\n" + result.stderr


def parse_deploy_addresses(deploy_log: str) -> dict[str, str]:
    found: dict[str, str] = {}
    for line in deploy_log.splitlines():
        for name in ("xKoinToken", "xKoinTreasury", "xKoinEscrow"):
            if name in line and name not in found:
                m = ADDR_RE.search(line)
                if m:
                    found[name] = m.group(0)
    missing = [
        n for n in ("xKoinToken", "xKoinTreasury", "xKoinEscrow") if n not in found
    ]
    if missing:
        raise RuntimeError(f"deploy log missing addresses for {missing}:\n{deploy_log}")
    return found


# --- trace building ------------------------------------------------------


def label(addr: str, name_by_addr: dict[str, list[str]]) -> dict[str, Any]:
    names = name_by_addr.get(addr.lower())
    return {"address": addr, "name": "/".join(names) if names else None}


def decode_log(contract: Any, event_names: list[str], log: Any) -> dict[str, Any]:
    for name in event_names:
        try:
            event = getattr(contract.events, name)()
            decoded = event.process_log(log)
            return {"event": name, "args": dict(decoded["args"])}
        except Exception:  # noqa: BLE001 - topic0 just did not match this event
            continue
    topics = log["topics"]
    return {"event": None, "topic0": topics[0] if topics else None}


def decode_tx(
    w3: Any,
    tx: Any,
    receipt: Any,
    contracts_by_key: dict[str, Any],
    contract_key_by_addr: dict[str, str],
    sol_name_by_addr: dict[str, str],
) -> tuple[str, dict[str, Any]]:
    """Return (fn_name, args) for one transaction."""
    if tx["to"] is None:
        created = receipt["contractAddress"]
        sol_name = sol_name_by_addr.get(created.lower(), "unknown")
        return f"create:{sol_name}", {}

    contract_key = contract_key_by_addr.get(tx["to"].lower())
    if contract_key is not None:
        contract = contracts_by_key[contract_key]
        try:
            fn, args = contract.decode_function_input(tx["input"])
            return fn.fn_name, dict(args)
        except Exception:  # noqa: BLE001 - selector not in our extended ABI
            selector = "0x" + bytes(tx["input"][:4]).hex()
            return f"unknown:{selector}", {}

    if len(tx["input"]) == 0:
        return "eth transfer", {}

    return "unknown", {"input": tx["input"]}


def build() -> dict[str, Any]:
    from web3 import Web3

    proc = start_anvil()
    try:
        w3 = Web3(
            Web3.HTTPProvider(
                RPC_URL, request_kwargs={"timeout": RPC_REQUEST_TIMEOUT_S}
            )
        )
        wait_for_rpc(w3, ANVIL_START_TIMEOUT_S)

        deploy_log = run_deploy()
        addrs = parse_deploy_addresses(deploy_log)
        os.environ["XKOIN_TOKEN"] = addrs["xKoinToken"]
        os.environ["XKOIN_TREASURY"] = addrs["xKoinTreasury"]
        os.environ["XKOIN_ESCROW"] = addrs["xKoinEscrow"]
        os.environ.setdefault("XKOIN_RPC", RPC_URL)

        import run_sim  # local import: only meaningful once XKOIN_* env vars exist

        UNIT = 10_000  # matches run_sim.py's own "1 billing unit = 10 KB" constant
        s1 = run_sim.s1_speed()
        s3 = run_sim.s3_relay()
        gw_units = s1["proven_bytes"] // UNIT
        sat_units = s3["satellite_proven_bytes"] // UNIT
        summary = run_sim.chain_settle(gw_units, sat_units)

        actors = dict(run_sim.LAST_CHAIN_ACTORS)
        chain_tickets = list(run_sim.LAST_CHAIN_TICKETS)

        token_addr = w3.to_checksum_address(addrs["xKoinToken"])
        treasury_addr = w3.to_checksum_address(addrs["xKoinTreasury"])
        escrow_addr = w3.to_checksum_address(addrs["xKoinEscrow"])
        contracts = {
            "token": token_addr,
            "escrow": escrow_addr,
            "treasury": treasury_addr,
        }

        token = w3.eth.contract(address=token_addr, abi=FULL_TOKEN_ABI)
        escrow = w3.eth.contract(address=escrow_addr, abi=FULL_ESCROW_ABI)
        treasury = w3.eth.contract(address=treasury_addr, abi=FULL_TREASURY_ABI)
        contracts_by_key = {"token": token, "escrow": escrow, "treasury": treasury}

        contract_key_by_addr = {addr.lower(): key for key, addr in contracts.items()}
        sol_name_by_addr = {
            token_addr.lower(): "xKoinToken",
            treasury_addr.lower(): "xKoinTreasury",
            escrow_addr.lower(): "xKoinEscrow",
        }
        # Some roles collide on one address here (deployer == owner ==
        # beneficiary, since BENEFICIARY_ADDRESS is unset): keep every
        # matching name rather than letting one silently win.
        name_by_addr: dict[str, list[str]] = {}
        for name, addr in actors.items():
            name_by_addr.setdefault(addr.lower(), []).append(name)
        for key, addr in contracts.items():
            name_by_addr.setdefault(addr.lower(), []).append(key)

        event_names_by_key = {
            key: [e["name"] for e in abi if e.get("type") == "event"]
            for key, abi in (
                ("token", FULL_TOKEN_ABI),
                ("escrow", FULL_ESCROW_ABI),
                ("treasury", FULL_TREASURY_ABI),
            )
        }

        balance_targets = dict(actors)
        balance_targets.update(contracts)

        latest = w3.eth.block_number
        txs: list[dict[str, Any]] = []
        balances: list[dict[str, Any]] = []
        ticket_paid: dict[tuple[str, str, int], int] = {}
        settle_block: int | None = None

        for bn in range(0, latest + 1):
            block = w3.eth.get_block(bn, full_transactions=True)
            block_txs = block["transactions"]
            for tx in block_txs:
                receipt = w3.eth.get_transaction_receipt(tx["hash"])
                fn_name, args = decode_tx(
                    w3,
                    tx,
                    receipt,
                    contracts_by_key,
                    contract_key_by_addr,
                    sol_name_by_addr,
                )
                if fn_name == "settleTicketBatch":
                    settle_block = bn

                to_field: Any
                if tx["to"] is None:
                    to_field = "create"
                else:
                    to_field = label(tx["to"], name_by_addr)

                logs: list[dict[str, Any]] = []
                for log in receipt["logs"]:
                    key = contract_key_by_addr.get(log["address"].lower())
                    if key is None:
                        continue
                    decoded = decode_log(
                        contracts_by_key[key], event_names_by_key[key], log
                    )
                    decoded["address"] = log["address"]
                    decoded["contract"] = key
                    logs.append(decoded)
                    if decoded.get("event") == "TicketSettled":
                        a = decoded["args"]
                        tk = (
                            a["client"].lower(),
                            a["nodeAdmin"].lower(),
                            a["sequenceNumber"],
                        )
                        ticket_paid[tk] = a["paidAmount"]

                txs.append(
                    {
                        "block": bn,
                        "index": tx["transactionIndex"],
                        "hash": tx["hash"],
                        "from": label(tx["from"], name_by_addr),
                        "to": to_field,
                        "value_wei": tx["value"],
                        "gas_used": receipt["gasUsed"],
                        "status": receipt["status"],
                        "fn": fn_name,
                        "args": args,
                        "logs": logs,
                    }
                )
            if block_txs:
                xkn = {
                    name: token.functions.balanceOf(w3.to_checksum_address(addr)).call(
                        block_identifier=bn
                    )
                    for name, addr in balance_targets.items()
                }
                balances.append({"block": bn, "xkn": xkn})

        fee_bps = treasury.functions.feeBps().call()

        escrow_state: dict[str, Any] | None = None
        if settle_block is not None:
            escrow_state = {
                "block": settle_block,
                "price_per_unit_ukes": escrow.functions.pricePerUnit().call(
                    block_identifier=settle_block
                ),
                "deposits": {
                    "client": escrow.functions.deposits(
                        w3.to_checksum_address(actors["client"])
                    ).call(block_identifier=settle_block)
                },
                "earnings": {
                    "gateway": escrow.functions.earnings(
                        w3.to_checksum_address(actors["gateway"])
                    ).call(block_identifier=settle_block),
                    "satellite": escrow.functions.earnings(
                        w3.to_checksum_address(actors["satellite"])
                    ).call(block_identifier=settle_block),
                },
            }

        tickets_out = []
        for row in chain_tickets:
            t = row["ticket"]
            tk = (t.client.lower(), t.nodeAdmin.lower(), t.sequenceNumber)
            paid = ticket_paid.get(tk)
            fee = (paid * fee_bps) // 10_000 if paid is not None else None
            net = (paid - fee) if paid is not None else None
            digest_local = row["digest_local"]
            digest_onchain = row["digest_onchain"]
            tickets_out.append(
                {
                    "holder": row["holder"],
                    "client": label(t.client, name_by_addr),
                    "node_admin": label(t.nodeAdmin, name_by_addr),
                    "sequence_number": t.sequenceNumber,
                    "units": t.cumulativeUnits,
                    "epoch_expiry": t.epochExpiry,
                    "gross_ukes": paid,
                    "fee_ukes": fee,
                    "net_ukes": net,
                    "digest_local": digest_local,
                    "digest_onchain": digest_onchain,
                    "digest_match": digest_local == digest_onchain,
                }
            )

        return {
            "generated": datetime.now(timezone.utc).isoformat(),
            "chain_id": w3.eth.chain_id,
            "contracts": contracts,
            "actors": actors,
            "params": {
                "price_per_unit_ukes": summary["price_per_unit_ukes"],
                "fee_bps": fee_bps,
                "unit_bytes": UNIT_BYTES,
                "decimals": DECIMALS,
            },
            "txs": txs,
            "balances": balances,
            "escrow_state": escrow_state,
            "tickets": tickets_out,
            "summary": summary,
        }
    finally:
        stop_anvil(proc)


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    out_dir = os.path.dirname(os.path.abspath(out_path))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    data = to_jsonable(build())

    with open(out_path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, separators=(",", ":"))

    size = os.path.getsize(out_path)
    tx_count = len(data["txs"])
    settle_gas = data["summary"].get("settle_gas")
    print(f"wrote {out_path} ({size} bytes): {tx_count} txs, settle_gas={settle_gas}")


if __name__ == "__main__":
    main()
