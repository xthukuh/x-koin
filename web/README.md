# web: the xKoin presentation site

One Vite SPA (React 19, React Router 7, Tailwind 4) is the only page stack. There is no second build, no static page path and no `file://` preview.

    npm ci
    npm run dev          # http://localhost:5173, strict port
    npm run build        # web/dist/

From the repository root the same three are `npm --prefix web ci`, `npm run dev:web` and `npm run build:web`.

## Layout

| Path | What it is |
|---|---|
| `src/theme.css` | The one theme. Every colour, font and primitive (`.xk-wrap`, `.xk-section`, `.xk-eyebrow`, `.xk-lede`, `.xk-stats`, `.xk-tablewrap`, `.xk-cards`, `.xk-btn`) lives here. No route declares a palette. |
| `src/shell/` | `Shell.jsx` is the frame every route renders inside: `Topbar.jsx`, the route, `Footer.jsx`, plus the document title and scroll reset. `nav.js` is the single route list. |
| `src/player/` | The animation layer. `ScenePlayer` plays a deck of scenes; `AnimationFrame` wraps one animation inside a page; `stage.js` holds the timing helpers; `useClock.js` is the controlled clock. |
| `src/decks/example/` | `ExampleDeck.jsx`, the shape every deck copies: staggered reveals, a counting number, a self-drawing path, a looping pulse, each a pure function of `t`. |
| `src/companion/` | The phone frame and its screen registry, used by any page that shows the companion app. |
| `src/proof/` | `chain.json`, `kiosk.json`, `trace.json`: the tracked snapshot of a real proof run, imported by pages that print a figure. |
| `src/lib/docs.js` | The markdown corpus, globbed from `docs/papers`, `docs/potential` and `docs/x-koin-beta` at build time and indexed by title, headings, word count and reading time. |
| `src/lib/markdown.js` | The renderer: GitHub-flavoured markdown, mermaid fences, and the hooks the docs route uses for diagrams and explainers. |
| `src/lib/money.js` | The one set of conversion rates, so two pages never disagree about a shilling figure. |
| `src/routes/` | One file per route, each named after its path. Pages with more than a screenful of parts keep those parts in their own folder. |
| `src/landing/` | The landing page at `/` and its sections. It mounts its own Shell so it can add section anchors to the topbar. |
| `src/docs/`, `src/replay/`, `src/blueprints/`, `src/manufacturing/`, `src/startup/`, `src/shop/` | The parts of the page of the same name. |
| `public/` | Served as-is: the favicon, `robots.txt` and `sitemap.xml` (both generated, see the scripts). |
| `scripts/` | Build-time helpers, listed below. |

Verify after merge: `src/docs/`, `src/replay/`, `src/blueprints/`, `src/manufacturing/`, `src/startup/` and `src/decks/` were being written by other agents while this file was drafted. The layout above is what their briefs describe.

## Adding a page

Three edits, in this order.

1. `src/shell/nav.js`: add a `NAV` entry with `path`, `label`, `title`, `text`, `topbar`, `footer`, `audience`, `priority` and `changefreq`. This one entry feeds the topbar, the footer, the `/map` page and `sitemap.xml`, so a page cannot be reachable from one menu and missing from another.
2. `src/routes/<Name>.jsx`: the page. Open with `<div className="xk-page">` and build from the theme primitives. Page-only styles go in a sibling `<name>.css` imported from the page, using theme tokens only.
3. `src/App.jsx`: one `<Route path="..." element={<Name />} />` inside the `<Shell />` route.

Then `npm run sitemap` to refresh `public/sitemap.xml`.

## Adding a deck scene

A deck is an array of `{ id, title, duration, caption, Scene }`. `Scene` is a component of `{ t }` where `t` is milliseconds since the scene started, so it renders the same picture for the same `t` every time: that is what makes pause, scrub and screen capture work.

1. Write the scene in the deck's folder under `src/decks/`, in the 1280x720 frame the player scales, using the `xk-scene*` classes from `player.css`.
2. Compute every animated value from `t` with the helpers in `player/stage.js` (`stage`, `item`, `lerp`, `countUp`, `draw`, `pulse`, `loop`, `shown`, `ease`, `ms`). Never start a timer of your own.
3. Add it to the deck's `index.js` array in the position it should play.

`src/decks/example/ExampleDeck.jsx` is the worked example. For a single picture inside an ordinary page, use `AnimationFrame` instead of a whole deck:

    <AnimationFrame title="A month, day by day" duration={ms(8)} aspect="8 / 3" caption="...">
      {({ t }) => <MonthScene t={t} />}
    </AnimationFrame>

`/landlord` is the smallest page that does this end to end.

## Adding an explainer to a paper

Papers are plain markdown in `docs/`, so anything added has to still read correctly on GitHub, which knows none of these fences.

- A static diagram: use an `xk-flow`, `xk-timeline`, `xk-stack` or `xk-compare` fence and write the body as plain lines. `src/docs/blocks.js` carries the line grammar for each. GitHub prints the body; the site draws the picture.
- A moving explainer: use an `xk-anim <name>` fence, where `<name>` is a key in `src/docs/explainers/index.js`. Each entry gives the title, the duration and the caption, so the paper names a picture and never a duration. Add the scene component beside the registry and register it there. An unknown name leaves the fence exactly as written.

Verify after merge: the two mechanisms above live in `src/docs/`, which another agent was writing while this file was drafted.

## Scripts

| Script | Command | What it does |
|---|---|---|
| `scripts/build-sitemap.mjs` | `npm run sitemap` | Writes `public/sitemap.xml` and `public/robots.txt` from `src/shell/nav.js`. Runs automatically as `predev` and `prebuild`. Origin from `XKOIN_SITE_ORIGIN`, default `https://xkoin.thuku.dev`. |
| `scripts/sync-proof.mjs` | `npm run proof:sync` | Copies `protocol/out/*.json` into `src/proof/`. Run it after a protocol or chain proof run; a missing file leaves the tracked snapshot alone. |
| `scripts/capture-slides.mjs` | `node scripts/capture-slides.mjs` | Captures the slide deck to images with playwright-core against the running dev server. |

## Verification checklist

Before handing over a page change:

1. Build clean: `npx vite build --outDir ../.tmp-build-<name> --emptyOutDir`, then delete that folder. Use this rather than `npm run build` so `web/dist/` is never half-written while a deploy might read it.
2. Click every route the change touches, and `/map` to confirm the new page is listed: `/`, `/docs`, `/investors`, `/startup`, `/replay`, `/blueprints`, `/manufacturing`, `/shop`, `/slides`, `/landlord`, `/map`.
3. Narrow the window to about 400 px. No horizontal scroll on the page body; wide tables scroll inside their own `.xk-tablewrap`.
4. Switch the theme both ways and confirm nothing disappears. Colours come from theme tokens, so a hard-coded hex is the usual cause.
5. Console clean: no errors, no React key warnings, no 404 for an asset.
6. Play, pause, scrub and replay every animation the change touches, and check it still renders at `t = 0`.
