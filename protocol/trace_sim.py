"""Export a compact JSON event trace of scenarios S1, S2, S3 for a web animation.

    python3 trace_sim.py [output.json]

Reuses run_sim.py's scenario builders with tracing enabled (Sim(seed, trace=[...])).
Frame-level tx/rx hooks are aggregated into per-medium byte bins here; only the
discrete events (join, receipt, quarantine, cut, recovered, done) are kept in
each scenario's "events" list. Tracing is entirely opt-in on the simulator side,
so this script has zero effect on the numbers `run_sim.py` prints.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from xkp.frames import FrameType
from xkp.sim import GFSK150, HOMEPLUG, KQ130F, LORA_SF7, Medium

from run_sim import s1_speed, s2_blackout, s3_relay

DEFAULT_OUT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "out", "trace.json"
)

DISCRETE_KINDS = {"join", "receipt", "quarantine", "cut", "recovered", "done"}

MEDIUM_FACTORIES = {
    "homeplug": HOMEPLUG,
    "kq130f": KQ130F,
    "lora-sf7": LORA_SF7,
    "gfsk-150k": GFSK150,
}

# Candidate "tidy" bin widths: {1, 2, 5} x 10^k across a wide exponent range.
_BIN_CANDIDATES = sorted(m * (10**exp) for exp in range(-3, 6) for m in (1, 2, 5))


def _medium_spec(m: Medium) -> dict[str, float | int]:
    return {"bps": m.bps, "loss": m.loss, "latency": m.latency, "mtu": m.mtu}


def _tidy_bin_s(
    duration_s: float, target_bins: int = 400, lo_bins: int = 200, hi_bins: int = 600
) -> float:
    """Pick a round bin width so duration_s / bin_s lands in [lo_bins, hi_bins]."""
    if duration_s <= 0:
        return 1.0
    in_range = [c for c in _BIN_CANDIDATES if lo_bins <= duration_s / c <= hi_bins]
    pool = in_range or _BIN_CANDIDATES
    return min(pool, key=lambda c: abs(duration_s / c - target_bins))


def _bin_events(
    trace: list[tuple[Any, ...]],
    duration_s: float,
    bin_s: float,
    medium_names: list[str],
) -> tuple[dict[str, list[int]], dict[str, list[int]], list[list[Any]]]:
    n_bins = max(1, int(duration_s / bin_s) + 1)
    bins = {name: [0] * n_bins for name in medium_names}
    tx_bins = {name: [0] * n_bins for name in medium_names}
    events: list[list[Any]] = []
    for ev in trace:
        t, kind = ev[0], ev[1]
        idx = min(n_bins - 1, max(0, int(t / bin_s)))
        if kind == "tx":
            _, _, _sender, _dest, medium, _ftype, wire_bytes, _tries, _lost = ev
            if medium in tx_bins:
                tx_bins[medium][idx] += wire_bytes
        elif kind == "rx":
            _, _, _receiver, medium, ftype, payload_len = ev
            if ftype == int(FrameType.DATA) and medium in bins:
                bins[medium][idx] += payload_len
        elif kind in DISCRETE_KINDS:
            events.append(list(ev))
    events.sort(key=lambda e: e[0])
    return bins, tx_bins, events


def _stringify_bytes_keys(summary: dict) -> dict:
    """JSON object keys must be strings; some summary dicts key by raw bytes."""
    out: dict[str, Any] = {}
    for k, v in summary.items():
        if isinstance(v, dict):
            out[k] = {str(kk): vv for kk, vv in v.items()}
        else:
            out[k] = v
    return out


def _run_scenario(
    scenario_fn,
    title: str,
    nodes: list[str],
    links: list[list[Any]],
    medium_names: list[str],
) -> dict[str, Any]:
    trace: list[tuple[Any, ...]] = []
    summary = scenario_fn(trace=trace)
    duration_s = max((ev[0] for ev in trace), default=0.0)
    bin_s = _tidy_bin_s(duration_s)
    bins, tx_bins, events = _bin_events(trace, duration_s, bin_s, medium_names)
    mediums = {name: _medium_spec(MEDIUM_FACTORIES[name]()) for name in medium_names}
    return {
        "title": title,
        "nodes": nodes,
        "links": links,
        "mediums": mediums,
        "duration_s": duration_s,
        "bin_s": bin_s,
        "bins": bins,
        "tx_bins": tx_bins,
        "events": events,
        "summary": _stringify_bytes_keys(summary),
    }


def build() -> dict[str, Any]:
    scenarios = {
        "s1": _run_scenario(
            s1_speed,
            "S1 speed (25 MB, homeplug+kq130f+lora)",
            ["client", "gateway"],
            [["client", "gateway", ["homeplug", "kq130f", "lora-sf7"]]],
            ["homeplug", "kq130f", "lora-sf7"],
        ),
        "s2": _run_scenario(
            s2_blackout,
            "S2 blackout survival (grid cut at t=2 s)",
            ["client", "gateway"],
            [["client", "gateway", ["homeplug", "kq130f", "lora-sf7"]]],
            ["homeplug", "kq130f", "lora-sf7"],
        ),
        "s3": _run_scenario(
            s3_relay,
            "S3 satellite relay (LoRa ingress, HomePlug backhaul)",
            ["client", "satellite", "gateway"],
            [
                ["client", "satellite", ["lora-sf7"]],
                ["satellite", "gateway", ["homeplug"]],
            ],
            ["lora-sf7", "homeplug"],
        ),
    }
    return {
        "generated": datetime.now(timezone.utc).isoformat(),
        "scenarios": scenarios,
    }


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    out_dir = os.path.dirname(os.path.abspath(out_path))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    data = build()
    with open(out_path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, separators=(",", ":"))
    size = os.path.getsize(out_path)
    print(f"wrote {out_path} ({size} bytes)")
    for key, sc in data["scenarios"].items():
        n_bins = len(next(iter(sc["bins"].values()))) if sc["bins"] else 0
        print(f"  {key}: bin_s={sc['bin_s']} bins={n_bins} events={len(sc['events'])}")


if __name__ == "__main__":
    main()
