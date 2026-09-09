# xKoin demo pages

One stack for every page: build into `demo/dist`, serve that directory on
port 8090, publish those same files. Nothing is viewed from `file://` and no
page has a second way of being built.

| Page | Source | Audience |
|---|---|---|
| `/` | `demo/index.html` | investors: what powers xKoin, with real proof figures |
| `/landlord.html` | `demo/landlord.html` | building owners: the incentive, no internals |
| `/replay.html` | `protocol/viz/replay.html` | founder: protocol replay, chain, kiosk, journeys |

Build: `python demo/build.py` inlines `protocol/out/{trace,chain,kiosk}.json`
into the pages that use them and writes `demo/dist/` (git-ignored). Regenerate
the JSON first when the code changed: `python protocol/trace_sim.py`,
`python protocol/trace_chain.py`, `cd gateway-api && python trace_kiosk.py`.

Serve: `python demo/serve.py` (or `scripts/demo.sh`) builds, then serves
`http://127.0.0.1:8090/`. Ctrl-C stops it.

Publish: the files in `demo/dist/` are what gets published as artifacts; each
is self-contained apart from the Google Fonts stylesheet.
