# The explainer deck

A reveal.js deck at `/slides` inside the Vite SPA. Sixteen cards, about five
minutes of narration, built to the format in
`docs/_plan/research/03-explainer-video-study.md`: one idea per card, narration
that never points at the screen, named-object cards for the four devices, one
chain diagram, one node graph, one price card.

## Files

| File | What it holds |
|---|---|
| `deck.js` | Every card: id, kind, title, body, narration, figure, notes. Edit words and numbers here. |
| `Slides.jsx` | The route. One template per card kind, reveal mounted on a ref and destroyed on unmount. |
| `theme.css` | The theme, on the same tokens as the landing page. Not a stock reveal theme. |
| `../../scripts/capture-slides.mjs` | Screenshots every card and writes the narration script. |

Nothing in `src/landing/` is touched by any of this; `theme.css` repeats the
token block rather than importing `landing.css`.

## Editing

Open `deck.js`. A card is:

    {
      id: 'chain',
      kind: 'chain',
      title: '...',
      body: '...',
      items: [...],        // list and demo kinds
      stats: [...],        // title, card and component kinds
      figure: SVG_STRING,  // chain and graph kinds
      narration: '...',    // 20 to 60 spoken words, no deictic references
      notes: '...',        // production note, not spoken
    }

Two rules the deck is written to and the capture script assumes:

1. Each `narration` is 20 to 60 words. A card changes every 8 to 20 seconds at
   179 words per minute, which is the rate the study measured.
2. No narration refers to the slide. No "as shown here", no "this diagram".
   The voice track can then be recorded before the stills are final, and a
   re-cut of the visuals does not invalidate the audio.

The price card carries no total. `Slides.jsx` reads it from `src/shop/data.js`,
which compiles `hardware/shopping/parts/*.json` at build time, so the figure on
the slide and the figure on `/shop` cannot disagree. Re-scouting a part moves
the slide, and the price card's narration then has to be re-recorded.

Check the word budget at any time:

    node -e "import('./src/slides/deck.js').then(m=>console.log(m.DECK.length,'cards',m.deckWordCount(),'words'))"

## Presenting

`/slides` keeps reveal's keyboard, touch and URL hash. Arrow keys or swipe move
between cards; `#/chain` addresses one card by its `deck.js` id; `s` opens the
speaker view, where the notes pane shows that card's narration. The progress bar
is off on purpose: the deck is paced by the voice track, not by a bar.

## Capturing the stills

    npm run build            # from web/
    npm run preview          # serves web/dist on http://localhost:4173
    node scripts/capture-slides.mjs

The script drives the locally installed Chrome (or Edge) through
`playwright-core`, so no browser is downloaded. It writes into `web/dist/slides/`:

- `01.png` through `16.png`, each exactly 1280x720
- `narration.txt`, one paragraph per card with its word count and its duration
- `concat.txt`, an ffmpeg concat list with a duration per card

Options: `--url http://localhost:5173` to capture the dev server instead,
`--out <dir>` to write somewhere else, `--headed` to watch it work.

`web/dist` is a build output, so a capture is discarded by the next
`npm run build`. Copy anything worth keeping out of it.

## Turning the stills into an mp4

`ffmpeg` is on this host. Three steps.

**1. Record the voice track** against `narration.txt`, one paragraph per card,
straight through. Save it as `voice.wav` next to the PNGs. The track should land
near five minutes; `narration.txt` prints the predicted length at 179 words per
minute in its header.

**2. Build the silent video from the concat list.** `concat.txt` already holds a
duration per card, derived from that card's word count:

    duration_seconds = narration_word_count / 179 * 60

So a 57 word card holds for 19.11 seconds. The list looks like:

    file '01.png'
    duration 18.10
    file '02.png'
    duration 17.77
    ...
    file '16.png'

The last file is repeated with no duration, which is what the concat demuxer
needs or it drops the final card.

    cd web/dist/slides
    ffmpeg -y -f concat -safe 0 -i concat.txt \
      -vf "fps=30,format=yuv420p,scale=1280:720" \
      -c:v libx264 -preset slow -crf 18 -movflags +faststart slides.mp4

**3. Mux the voice track in.**

    ffmpeg -y -i slides.mp4 -i voice.wav \
      -c:v copy -c:a aac -b:a 192k -shortest xkoin-explainer.mp4

If the recorded track runs longer than the predicted length, the cards drift
ahead of the voice. Two fixes, in order of preference:

- Re-time the concat list from the real audio. Note the timestamp at which each
  card's paragraph starts in `voice.wav`, and replace each `duration` with the
  gap to the next timestamp. This is the honest fix and takes about ten minutes.
- Scale every duration by one factor: multiply each `duration` by
  `actual_audio_seconds / predicted_seconds`. This is good enough when the
  reader's pace was steady and only the overall rate was off.

To check the drift before recording anything, compare the predicted total in
`narration.txt` with the duration of a trial read:

    ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav

## Why reveal.js

The study rejected Remotion on licensing and Manim as not HTML, and ranked
Motion Canvas first for motion-heavy diagrams. reveal.js won for this deck
because the slides stay editable HTML inside the SPA that already exists,
Auto-Animate handles the card-to-card morphs with no animation code, and the
missing piece, video export, is one Playwright script and one ffmpeg command.
Motion Canvas stays the option if the chain diagram or the node graph ever needs
real motion.
