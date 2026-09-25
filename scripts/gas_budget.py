#!/usr/bin/env python3
"""Gas budget and runway calculator for the xKoin chain layer.

Offline by default: prints what each operation costs in ETH, USD and KES at
the given gas price and exchange rates, the settlement break-even, and how
far a slice of USDT stretches. With ``--rpc`` and one or more ``--address``
values it also reads live ETH balances and reports runway in days.

Examples (repo root, Windows venv):

    .venv/Scripts/python.exe scripts/gas_budget.py
    .venv/Scripts/python.exe scripts/gas_budget.py --gas-gwei 0.006 --eth-usd 2468.58 --usd-kes 123.29
    .venv/Scripts/python.exe scripts/gas_budget.py --rpc https://sepolia.base.org \
        --address relayer=0x... --address bridge=0x...

Defaults are the values measured on 2026-09-09; pass today's numbers to
refresh. Gas figures marked "measured" come from receipts; the others are
estimates until phase 1 of docs/ops/critical-accounts/05-test-plan.md replaces
them.
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass

WEI_PER_ETH = 10**18
WEI_PER_GWEI = 10**9

# Gas per operation. "measured" entries come from forge: settle one fresh
# ticket 131,391 (probe, 2026-09-25); withdrawWithSig 93,358 and
# transferDeposit 83,050 first use, and deploy 4,518,529 (forge --gas-report,
# 2026-09-26, after withdrawWithSig and transferDeposit were added). The extra
# ticket figure is derived from a 3-ticket probe at 251,238. The chain e2e
# proof's 191,698 is a two-ticket batch. Updated from phase 1 receipts.
# main() reads entries 0, 1, 2, 3, 6 and 7 by index; append new rows at the end.
OPERATIONS: list[tuple[str, int, str]] = [
    ("settleTicketBatch, 1 ticket", 131_391, "measured"),
    ("each extra ticket in a batch", 59_924, "derived"),
    ("bridgeMint", 70_000, "estimate"),
    ("depositWithPermit (relayed)", 95_000, "estimate"),
    ("claim (treasury)", 55_000, "estimate"),
    ("claimEarnings (node admin)", 60_000, "estimate"),
    ("deploy token+treasury+escrow+setBridge", 4_518_529, "measured"),
    ("create Safe", 300_000, "estimate"),
    ("withdrawWithSig (relayed)", 93_358, "measured"),
    ("transferDeposit (relayed)", 83_050, "measured"),
]


@dataclass(frozen=True)
class Rates:
    gas_price_wei: int
    eth_usd: float
    usd_kes: float

    @property
    def eth_kes(self) -> float:
        return self.eth_usd * self.usd_kes

    def cost(self, gas: int) -> tuple[float, float, float]:
        eth = gas * self.gas_price_wei / WEI_PER_ETH
        return eth, eth * self.eth_usd, eth * self.eth_kes


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--gas-gwei", type=float, default=0.006, help="L2 gas price in gwei")
    p.add_argument("--eth-usd", type=float, default=2468.58, help="ETH price in USDT")
    p.add_argument("--usd-kes", type=float, default=123.29, help="USDT to KES rate")
    p.add_argument("--price-ukes-per-unit", type=int, default=500, help="escrow pricePerUnit")
    p.add_argument("--fee-bps", type=int, default=500, help="treasury feeBps")
    p.add_argument("--usdt-slice", type=float, default=2.0, help="USDT converted to ETH for gas")
    p.add_argument("--topups-per-day", type=int, default=20, help="pilot mints plus deposits per day")
    p.add_argument("--batches-per-day", type=int, default=5, help="pilot settlement batches per day")
    p.add_argument("--rpc", help="JSON-RPC URL; enables live balances")
    p.add_argument(
        "--address",
        action="append",
        default=[],
        metavar="ROLE=0x...",
        help="wallet to read; repeatable",
    )
    return p.parse_args(argv)


def fmt_row(cols: list[str], widths: list[int]) -> str:
    return "  ".join(c.ljust(w) for c, w in zip(cols, widths))


def main(argv: list[str]) -> int:
    a = parse_args(argv)
    rates = Rates(int(a.gas_gwei * WEI_PER_GWEI), a.eth_usd, a.usd_kes)

    print(f"gas price {a.gas_gwei} gwei, ETH {a.eth_usd:.2f} USD, 1 USD = {a.usd_kes:.2f} KES, "
          f"1 ETH = {rates.eth_kes:,.0f} KES")
    print()

    widths = [34, 10, 12, 10, 10, 9]
    print(fmt_row(["operation", "gas", "ETH", "USD", "KES", "source"], widths))
    for name, gas, source in OPERATIONS:
        eth, usd, kes = rates.cost(gas)
        print(fmt_row([name, f"{gas:,}", f"{eth:.8f}", f"{usd:.4f}", f"{kes:.3f}", source], widths))
    print()

    settle_gas = OPERATIONS[0][1]
    extra_gas = OPERATIONS[1][1]
    _, _, settle_kes = rates.cost(settle_gas)
    _, _, extra_kes = rates.cost(extra_gas)
    fee_frac = a.fee_bps / 10_000
    kes_per_mb = a.price_ukes_per_unit * 100 / 1_000_000  # 100 units of 10 KB per MB
    for tickets in (1, 5, 20):
        gas_kes = settle_kes + extra_kes * (tickets - 1)
        gross = gas_kes / fee_frac
        print(f"break-even batch of {tickets:>2} tickets: gas {gas_kes:.3f} KES, "
              f"needs gross >= {gross:.2f} KES = {gross / kes_per_mb:.0f} MB at {kes_per_mb:.3f} KES/MB")
    print()

    mint_kes = rates.cost(OPERATIONS[2][1])[2]
    dep_kes = rates.cost(OPERATIONS[3][1])[2]
    daily_kes = a.topups_per_day * (mint_kes + dep_kes) + a.batches_per_day * settle_kes
    daily_eth = daily_kes / rates.eth_kes
    slice_eth = a.usdt_slice / a.eth_usd
    deploy_eth = rates.cost(OPERATIONS[6][1])[0] + rates.cost(OPERATIONS[7][1])[0]
    print(f"pilot spend: {a.topups_per_day} top-ups + {a.batches_per_day} batches/day = "
          f"{daily_kes:.2f} KES/day = {daily_eth:.8f} ETH/day")
    print(f"USDT slice {a.usdt_slice:.2f} = {slice_eth:.6f} ETH; after deploy+Safe "
          f"({deploy_eth:.6f} ETH) runway = {(slice_eth - deploy_eth) / daily_eth:.0f} days at pilot volume")
    print()

    if a.rpc:
        try:
            from web3 import Web3
        except ImportError:
            print("web3 is not installed in this interpreter; live balances skipped", file=sys.stderr)
            return 1
        w3 = Web3(Web3.HTTPProvider(a.rpc, request_kwargs={"timeout": 20}))
        live_gwei = w3.eth.gas_price / WEI_PER_GWEI
        print(f"live: chain id {w3.eth.chain_id}, gas price {live_gwei:.6f} gwei")
        for item in a.address:
            role, _, addr = item.partition("=")
            bal = w3.eth.get_balance(Web3.to_checksum_address(addr)) / WEI_PER_ETH
            runway = bal / daily_eth if daily_eth else float("inf")
            print(f"  {role:<12} {addr}  {bal:.6f} ETH  runway {runway:.0f} days at pilot volume")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
