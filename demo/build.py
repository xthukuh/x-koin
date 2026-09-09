"""Inject the trace, chain and kiosk JSON into demo/index.html's markers, and
build the standalone demo/landlord.html alongside it.

    python demo/build.py [out.html]

Defaults: demo/index.html -> demo/dist/index.html, and
demo/landlord.html -> demo/dist/landlord.html. Same marker convention as
protocol/viz/build_replay.py: /*__TRACE_JSON__*/null, /*__CHAIN_JSON__*/null,
/*__KIOSK_JSON__*/null. landlord.html carries no markers and no proof data;
it is copied through as-is (newline-normalised) so it stays byte-for-byte
what a landlord will see, independent of what protocol/out/ contains.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "demo" / "index.html"
LANDLORD_TEMPLATE = ROOT / "demo" / "landlord.html"
TRACE_JSON = ROOT / "protocol" / "out" / "trace.json"
CHAIN_JSON = ROOT / "protocol" / "out" / "chain.json"
KIOSK_JSON = ROOT / "protocol" / "out" / "kiosk.json"


def _inject(html: str, marker: str, path: Path) -> str:
    if marker not in html:
        raise SystemExit(f"template marker missing: {marker}")
    if not path.exists():
        print(f"warning: {path} not found, leaving {marker} as null")
        return html
    data = json.loads(path.read_text(encoding="utf-8"))
    payload = json.dumps(data, separators=(",", ":")).replace("</", "<\\/")
    return html.replace(marker, payload, 1)


def build(out_path: Path) -> int:
    html = TEMPLATE.read_text(encoding="utf-8")
    html = _inject(html, "/*__TRACE_JSON__*/null", TRACE_JSON)
    html = _inject(html, "/*__CHAIN_JSON__*/null", CHAIN_JSON)
    html = _inject(html, "/*__KIOSK_JSON__*/null", KIOSK_JSON)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8", newline="\n")
    return out_path.stat().st_size


def build_landlord(out_path: Path) -> int:
    html = LANDLORD_TEMPLATE.read_text(encoding="utf-8")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8", newline="\n")
    return out_path.stat().st_size


def main(argv: list[str]) -> None:
    out_path = Path(argv[1]) if len(argv) > 1 else ROOT / "demo" / "dist" / "index.html"
    landlord_out = out_path.parent / "landlord.html"
    size = build(out_path)
    print(f"wrote {out_path} ({size:,} bytes)")
    lsize = build_landlord(landlord_out)
    print(f"wrote {landlord_out} ({lsize:,} bytes)")


if __name__ == "__main__":
    main(sys.argv)
