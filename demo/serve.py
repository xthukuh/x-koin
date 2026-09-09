"""Build demo/dist/index.html, then serve demo/dist on http://127.0.0.1:8090/.

    python demo/serve.py

Trivial local server: stdlib http.server, no build tools. Ctrl-C to stop.
"""

from __future__ import annotations

import functools
import http.server
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "demo" / "dist"
PORT = 8090

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build as demo_build  # noqa: E402


def main() -> None:
    demo_build.build(DIST / "index.html")
    demo_build.build_landlord(DIST / "landlord.html")
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"serving {DIST} at http://127.0.0.1:{PORT}/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")


if __name__ == "__main__":
    main()
