# xKoin investor demo

One self-contained page explaining xKoin to a lay investor, built from `demo/index.html`.

Build: `python demo/build.py` writes `demo/dist/index.html` (JSON data from `protocol/out/` is inlined at build time; `demo/dist/` is git-ignored).

Serve: `python demo/serve.py` builds first, then serves `demo/dist` on `http://127.0.0.1:8090/`. Or run `scripts/demo.sh`.

Publish: copy `demo/dist/index.html` anywhere; it needs no server beyond a plain static file, and its only external resource is the Google Fonts stylesheet.

There is a second page, `demo/landlord.html`, for pitching apartment landlords: same build, same server, deliberately vague about internals, published at `demo/dist/landlord.html`.
