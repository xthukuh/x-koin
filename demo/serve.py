"""Build every page into demo/dist, then serve it on http://127.0.0.1:8090/.

Pages: /  (investor demo)   /landlord.html  (landlord pilot)   /replay.html  (protocol replay)

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
    demo_build.build_all(DIST)
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"serving {DIST} at http://127.0.0.1:{PORT}/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")


if __name__ == "__main__":
    main()
