# xKoin legacy page sources

`index.html` and `landlord.html` stay here as the sources of two of the three
legacy static pages. They are not built from this directory any more:
`web/scripts/inline-data.mjs` reads them, inlines `protocol/out/*.json` into the
markers, and writes `web/public/legacy/`. The third page comes from
`protocol/viz/replay.html` the same way.

| Legacy page | Source | Audience |
|---|---|---|
| `/investors` | `demo/index.html` | investors: what powers xKoin, with real proof figures |
| `/landlord` | `demo/landlord.html` | building owners: the incentive, no internals |
| `/replay` | `protocol/viz/replay.html` | founder: protocol replay, chain, kiosk, journeys |

The inliner runs automatically as the `predev` and `prebuild` step, so there is
nothing to run by hand. Regenerate the proof JSON first when the code changed:
`python protocol/trace_sim.py`, `python protocol/trace_chain.py`,
`cd gateway-api && python trace_kiosk.py`. `protocol/out/` is not tracked; when
a file is missing the inliner leaves that marker as null and warns.

One stack, two commands.

    npm run dev:web                                      # http://localhost:5173
    docker compose -f docker/compose.site.yml up --build  # http://127.0.0.1:8090
