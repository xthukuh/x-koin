# Explainer video study (NODE, "Help Build An Off Grid Communications / Mesh Network Device")

Research agent report, 2026-09-12. Source video
https://www.youtube.com/watch?v=zXTEWFb_6w4 (N-O-D-E, 24 Nov 2017, 5:24,
124k views). The description is empty; the resources live on the creator's
article page https://n-o-d-e.net/meshdevice.html, which is the narration
script. A direct mp4 mirror for frame study:
https://archive.org/download/meshdevice/meshdevice.mp4 (47.7 MB). Caption
routes were all blocked; the script was validated against YouTube's five
auto key moments (2.9 to 3.0 words per second at every anchor, 322 s
predicted against 324 s actual).

## What makes the format work

- Rate about 179 words per minute, no dead air, every second carries a
  word.
- Zero deictic references: no "as you can see", no "this diagram shows". The
  audio stands alone, so script writing is decoupled from slide production.
- One idea, one card: the paragraph is the slide unit, 20 to 60 words, so a
  card changes every 8 to 20 seconds.
- Named-object cards for components: one part, a label, one or two numbers
  (30 km, 2000 to 3000 mAh, one dollar, 35 dollars).
- One chain diagram for the mechanism (phone to radio to LoRa to remote radio
  to remote phone), one node graph for the mesh escalation, one bulleted
  capability panel, one price card.
- First person, hedged, concrete nouns over adjectives, an escalation ladder
  (base capability, mesh, solar, internet bridge, anonymous social), each
  escalation grounded again in hardware.

## Narrative structure (12 segments)

1. 0:00 Hook: the abandoned build, in concrete hardware nouns.
2. 0:11 The reversal: months of work, wrong approach, competitor named.
3. 0:32 The ask, with an analogy the audience knows and an honest scope
   limit.
4. 0:51 The object: size, pairing, app.
5. 1:06 How it works: the send-to-receive chain.
6. 1:47 Mesh escalation.
7. 1:55 Beyond the competitor: solar plus powerbank.
8. 2:11 Second escalation: internet bridges, exit nodes.
9. 2:31 Use cases: wilderness, travel, festivals, disasters.
10. 2:50 Components, one card each, ending on total cost.
11. 4:40 Call to action.
12. 5:20 Sign off.

For xKoin the shape maps one to one: a chain diagram, then a node graph,
then an escalation ladder (link works, links relay, relays settle value).
Segment 11 becomes a demo rather than a request, because xKoin has working
pieces.

## Slide tooling verdicts

Rejected: Remotion (free only for individuals and companies up to three
people, https://www.remotion.dev/docs/licensing), Manim (Python, not HTML),
impress.js (3D camera moves, wrong instrument).

1. Motion Canvas (MIT, https://motioncanvas.io/docs/rendering/video/):
   native mp4 export with audio, TypeScript generator animations, browser
   preview with a scrubbable timeline. Best for the two diagram-heavy
   segments.
2. reveal.js (MIT) with anime.js (MIT) or GSAP (free Standard License):
   plain HTML sections, Auto-Animate morphs matching elements between
   slides with no animation code; no native video export, capture with a
   headless browser plus ffmpeg once.
3. Slidev (MIT): Markdown slides with Vue components, PDF/PPTX/PNG export,
   no video export.

Recommendation for xKoin: reveal.js inside the Vite SPA (one stack, slides
are editable HTML, Auto-Animate covers the card-to-card morphs), captured to
video with a Playwright plus ffmpeg script; Motion Canvas only if a diagram
needs real motion later. yt-dlp is installed locally if a caption file is
ever needed: `yt-dlp --write-auto-sub --sub-lang en --skip-download <url>`.
