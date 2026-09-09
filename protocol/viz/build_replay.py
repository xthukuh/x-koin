"""Inject a trace JSON and the board schematics into the replay page.

    python protocol/viz/build_replay.py [trace.json] [out.html]

Defaults: protocol/out/trace.json -> protocol/out/replay.html. The template
protocol/viz/replay.html carries three markers: /*__TRACE_JSON__*/null and
two HTML comments for the gateway and satellite SVGs from hardware/.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "protocol" / "viz" / "replay.html"
GATEWAY_SVG = ROOT / "hardware" / "xkoin-gateway.svg"
SATELLITE_SVG = ROOT / "hardware" / "xkoin-satellite.svg"


def inline_svg(path: Path) -> str:
    svg = path.read_text(encoding="utf-8")
    # Drop fixed pixel size so the CSS width rule scales it; keep the viewBox.
    m = re.search(r'width="(\d+)"\s+height="(\d+)"', svg)
    if m and "viewBox" not in svg:
        svg = svg.replace(m.group(0), f'viewBox="0 0 {m.group(1)} {m.group(2)}"', 1)
    return svg.replace('<?xml version="1.0"?>', "")


def build(trace_path: Path, out_path: Path) -> int:
    trace = json.loads(trace_path.read_text(encoding="utf-8"))
    html = TEMPLATE.read_text(encoding="utf-8")
    marker = "/*__TRACE_JSON__*/null"
    if marker not in html:
        raise SystemExit("template marker missing")
    payload = json.dumps(trace, separators=(",", ":")).replace("</", "<\\/")
    html = html.replace(marker, payload, 1)
    for name, extra in (("CHAIN", "chain.json"), ("KIOSK", "kiosk.json")):
        extra_path = trace_path.parent / extra
        extra_marker = f"/*__{name}_JSON__*/null"
        if extra_path.exists() and extra_marker in html:
            data = json.loads(extra_path.read_text(encoding="utf-8"))
            html = html.replace(
                extra_marker,
                json.dumps(data, separators=(",", ":")).replace("</", "<\\/"),
                1,
            )
    html = html.replace("<!--GATEWAY_SVG-->", inline_svg(GATEWAY_SVG), 1)
    html = html.replace("<!--SATELLITE_SVG-->", inline_svg(SATELLITE_SVG), 1)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8", newline="\n")
    return out_path.stat().st_size


def main(argv: list[str]) -> None:
    trace_path = Path(argv[1]) if len(argv) > 1 else ROOT / "protocol" / "out" / "trace.json"
    out_path = Path(argv[2]) if len(argv) > 2 else ROOT / "protocol" / "out" / "replay.html"
    size = build(trace_path, out_path)
    print(f"wrote {out_path} ({size:,} bytes)")


if __name__ == "__main__":
    main(sys.argv)
