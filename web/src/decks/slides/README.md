# The founder deck

The full invention deck at `/slides`: 45 scenes in 10 chapters, about ten minutes of motion. It replaces the sixteen card reveal.js deck that used to live in `web/src/slides/`; that folder and its `deck.js` are gone, and everything in them that was worth keeping is in the scenes here.

Scenes run on the shared scene player in `web/src/player/`. A scene is a pure function of `t`, the milliseconds since it started, so pause, replay, scrub and a still capture are all the same operation: render once at a chosen `t`.

## Files

| File | What it holds |
|---|---|
| `manifest.js` | The running order: id, title, duration, caption and glossary terms for every scene, grouped into chapters. No JSX, so plain Node can import it. |
| `index.js` | Joins the manifest to the pictures and exports `SLIDE_SCENES` and `CHAPTERS`. It throws at import time if a scene has no picture or a picture has no scene. |
| `ch01.jsx` to `ch10.jsx` | One file per chapter. Each exports `SCENES`, a map of scene id to component. |
| `parts.jsx` | The shared furniture: `Slide`, `Stage`, `Grid`, `Panel`, `Rows`, `Stat`, `Verdict`, `AttackSlide` and the drawing primitives. |
| `facts.js` | Every figure the deck is not allowed to invent, read from the recorded proofs and the compiled parts list. |
| `terms.js` | The one-line gloss and docs link for each abbreviation the deck uses. |
| `slides.css` | The chapter strip and the terms strip. Page furniture only; nothing here reaches inside the 1280x720 frame. |
| `../../routes/Slides.jsx` | The route: header, chapter strip, player, terms strip. |
| `../../../scripts/capture-slides.mjs` | Screenshots every scene and writes the narration script. |

## Chapters

| # | Chapter | Scenes |
|---|---|---|
| 1 | The invention in one picture | 2 |
| 2 | Devices and mediums | 6 |
| 3 | The protocol, XKP | 6 |
| 4 | User journeys, end to end | 8 |
| 5 | Operating modes | 6 |
| 6 | Attack vectors and defences | 10 |
| 7 | Economics | 4 |
| 8 | The proof matrix | 1 |
| 9 | Roadmap | 1 |
| 10 | Closing | 1 |

## Editing

**Words, durations and terms** are in `manifest.js`. Nothing else has to be touched to re-time a scene or rewrite a caption.

**Pictures** are in the chapter file the manifest names in `module`. A scene component takes `{ t }` and returns a `Slide`. The shape is:

```jsx
function MyScene({ t }) {
  return (
    <Slide t={t} kicker="..." title="..." lede="..." foot={['left', 'right']}>
      <Stage h={H.both}>
        <Box t={t} at={ms(1.0)} x={0} y={40} label="Node" sub="meters the byte" />
      </Stage>
    </Slide>
  );
}
```

Four rules the deck is written to, all of them enforceable by reading:

1. A scene runs 6 to 15 seconds and then holds. The caption is read at the reader's pace, not the clock's.
2. A caption never points at the screen, so the voice track can be recorded before the pictures are final.
3. Short sentences, plain words. A caption is heard once, not re-read.
4. A number that carries a condition keeps the condition in the same sentence. Simulation results say simulation. The per-unit price says placeholder every single time.

**Numbers** come from `facts.js`, which reads `src/proof/chain.json`, `src/proof/kiosk.json` and the compiled parts list in `src/shop/data.js`. A figure that is not in one of those artifacts is written out in the scene with its condition beside it. Re-running a proof or re-scouting a part moves the slide, and no two slides can disagree about the same number.

**Terms.** A scene lists term ids in `manifest.js`, and the route renders them as footnote links under the player. Definitions are in `terms.js`, one line each, with the docs slug they link to. The canonical, longer set is `src/docs/glossary.js`; `terms.js` keeps its own shorter wording on purpose, because a footnote under a slide is not a reference entry. `glossaryDrift()` in `terms.js` reports any word the two files send to different papers, and should return an empty list.

The layout checks itself in two places: `index.js` refuses to build a deck whose two halves disagree, and `Stage` scales its drawing into whatever height the slide body actually has, so a title that wraps to two lines shrinks the picture a few percent rather than pushing it out of the frame.

## Presenting

The player keeps its keyboard and its URL hash. Click the right two thirds of the picture for next and the left third for previous; arrow keys do the same. Space pauses, `R` replays the scene, `C` toggles captions, `F` is fullscreen, `Home` and `End` jump to the ends, `?` lists the keys. `#/xkp-frame` addresses one scene by its manifest id, and the chapter strip above the player jumps to the first scene of a chapter.

## Capturing the stills

Two ways, and the second needs no server at all.

```
# from web/
npm run build
npm run preview                                   # serves web/dist on :4173
node scripts/capture-slides.mjs
```

```
# no server: read the built files straight off disk
npm run build
node scripts/capture-slides.mjs --dist dist
```

The script drives the locally installed Chrome or Edge through `playwright-core`, so no browser is downloaded. For each scene it loads `/slides#/<scene id>`, reloads so the player mounts on that scene, checks the player's own counter against the running order in `manifest.js`, pauses the clock with the player's pause button, drives the scrubber to its maximum with a React-compatible input event, and screenshots the `.xk-player__stage` element. An injected stylesheet pins the stage to 1280x720 for the capture, so the frame renders at its natural scale and the still is 1:1 rather than resampled, and hides the player's own overlays. It asserts that the frame has content both at `t = 0` and at the end, so an empty scene fails the run instead of producing a blank PNG.

It writes into `web/dist/slides/`:

- `01.png` through `45.png`, each exactly 1280x720
- `narration.txt`, one paragraph per scene with its chapter and its duration
- `concat.txt`, an ffmpeg concat list with a duration per scene

Options: `--url http://localhost:5173` to capture a dev server instead, `--dist <dir>` to serve a built directory off disk with no server running, `--out <dir>` to write somewhere else, `--only <n>` for a smoke test of the first n scenes, `--scene <id>` for one scene, `--headed` to watch it work.

`web/dist` is a build output, so a capture is discarded by the next build. Copy anything worth keeping out of it.

## Turning the stills into an mp4

`ffmpeg` is on this host. Three steps.

**1. Record the voice track** against `narration.txt`, one paragraph per scene, straight through. Save it as `voice.wav` next to the PNGs.

**2. Build the silent video from the concat list.** `concat.txt` already holds a duration per scene, taken from the scene durations the player actually runs:

```
file '01.png'
duration 9.00
file '02.png'
duration 15.00
...
file '45.png'
```

The last file is repeated with no duration, which is what the concat demuxer needs or it drops the final scene.

```
cd web/dist/slides
ffmpeg -y -f concat -safe 0 -i concat.txt \
  -vf "fps=30,format=yuv420p,scale=1280:720" \
  -c:v libx264 -preset slow -crf 18 -movflags +faststart slides.mp4
```

**3. Mux the voice track in.**

```
ffmpeg -y -i slides.mp4 -i voice.wav \
  -c:v copy -c:a aac -b:a 192k -shortest xkoin-invention.mp4
```

A scene holds at its end until the reader moves on, so its duration is the length of the motion rather than the pacing of the talk. If the recorded track runs longer than the concat list, the pictures drift ahead of the voice. Two fixes, in order of preference:

- Re-time the concat list from the real audio. Note the timestamp at which each scene's paragraph starts in `voice.wav` and replace each `duration` with the gap to the next timestamp. This is the honest fix and takes about ten minutes.
- Scale every duration by one factor: multiply each `duration` by `actual_audio_seconds / concat_total_seconds`. Good enough when the reader's pace was steady and only the overall rate was off.

Check the drift before recording anything:

```
ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav
```

## Why the player rather than reveal.js

reveal.js carried the sixteen card deck because the cards were editable HTML inside the app that already existed, and Auto-Animate handled the card to card morphs with no animation code. This deck needs motion inside a scene rather than between scenes: a frame diagram that fills in field by field, a medium score that collapses when the grid cuts, a counter that survives four lost receipts. The scene player gives that with one clock, one hold-at-the-end rule and one capture path, and the same player runs the other decks on the site.
