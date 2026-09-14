/**
 * Capture the founder deck to stills and a narration script.
 *
 *   npm run build && npm run preview          # in one terminal
 *   node scripts/capture-slides.mjs           # in another
 *
 * Writes, into web/dist/slides/:
 *   NN.png          one 1280x720 still per scene, numbered from 01
 *   narration.txt   one paragraph per scene, in order, for the voice recording
 *   concat.txt      an ffmpeg concat list whose durations are the scene
 *                   durations the player actually runs
 *
 * How a still is taken, and why this way. Each scene is a pure function of `t`,
 * so a still is one render at a chosen `t` rather than a lucky frame. The
 * script therefore:
 *
 *   1. loads /slides#<scene id> and reloads, because the player reads its
 *      starting scene from the hash when it mounts;
 *   2. checks the player's own counter against the deck's running order, so a
 *      renamed scene fails loudly instead of capturing the wrong picture;
 *   3. pauses the clock with the player's own pause button;
 *   4. drives the scrubber to its maximum with a React-compatible input event,
 *      which lands the clock exactly on the scene's end;
 *   5. screenshots the `.xk-player__stage` element, pinned to 1280x720 by an
 *      injected stylesheet so the frame renders at its natural scale and the
 *      capture is 1:1 rather than resampled.
 *
 * The overlays the player draws over the stage (the next hint, the paused
 * badge, the key list) are hidden for the capture. Nothing else about the page
 * is touched, and nothing is rasterised into the deck: the PNGs are an output
 * of the deck and never an input to it.
 *
 * Uses the locally installed Google Chrome or Edge through playwright-core, so
 * no browser is downloaded.
 *
 * With `--dist <dir>` no server is needed at all: the built files are read off
 * disk and handed to the page through request interception, with any unknown
 * path falling back to index.html the way a static host would. That is the mode
 * to use on a machine where nothing is serving the site, and it is also what
 * makes the capture usable as a check in its own right, since every scene has
 * to mount, render at t = 0 and render at its end or the run fails.
 *
 * Options:
 *   --url <origin>   default http://localhost:4173
 *   --dist <dir>     serve a built directory off disk instead of using --url
 *   --out <dir>      default web/dist/slides
 *   --only <n>       capture just the first n scenes, for a smoke test
 *   --scene <id>     capture just one scene by its id
 *   --headed         show the browser, for debugging a scene that will not settle
 */

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

import { CHAPTERS, SCENE_META, deckDuration } from '../src/decks/slides/manifest.js';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIDTH = 1280;
const HEIGHT = 720;

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 || index === process.argv.length - 1 ? fallback : process.argv[index + 1];
}

const DIST = arg('--dist', '');
const DIST_DIR = DIST ? path.resolve(WEB, DIST) : '';
/** The origin the page is loaded from; in --dist mode nothing listens on it. */
const ORIGIN = DIST ? 'http://xkoin.invalid' : arg('--url', 'http://localhost:4173').replace(/\/+$/, '');
const OUT = path.resolve(WEB, arg('--out', path.join('dist', 'slides')));
const HEADED = process.argv.includes('--headed');
const ONLY = Number(arg('--only', '0')) || 0;
const SCENE_ID = arg('--scene', '');

const MEDIA = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

/**
 * Answer every request from the built directory, with index.html as the
 * fallback, which is how a static host serves a single-page app. Nothing binds
 * a port and nothing outlives the browser.
 */
async function serveFromDist(page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) {
      // The page pulls its two typefaces from Google Fonts. Let anything
      // off-origin go to the real network, so a still carries the same
      // typography as the site rather than a fallback stack.
      await route.continue();
      return;
    }
    const wanted = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const candidates = [wanted, path.posix.join(wanted, 'index.html'), 'index.html'].filter(Boolean);
    for (const candidate of candidates) {
      const file = path.resolve(DIST_DIR, candidate);
      if (!file.startsWith(DIST_DIR)) {
        continue;
      }
      try {
        const body = await readFile(file);
        await route.fulfill({
          status: 200,
          body,
          contentType: MEDIA[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
        });
        return;
      } catch {
        /* try the next candidate */
      }
    }
    await route.fulfill({ status: 404, body: 'not found', contentType: 'text/plain' });
  });
}

/** The stage, pinned to its design size, with the player's overlays hidden. */
const CAPTURE_CSS = `
  .xk-player__stage {
    width: ${WIDTH}px !important;
    height: ${HEIGHT}px !important;
    max-height: none !important;
    aspect-ratio: auto !important;
    margin: 0 !important;
  }
  .xk-player__hint,
  .xk-player__paused,
  .xk-player__help { display: none !important; }
`;

async function launch() {
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel, headless: !HEADED, timeout: 30000 });
    } catch {
      /* try the next channel */
    }
  }
  throw new Error('no Chrome or Edge channel available');
}

/** Which scenes this run captures, keeping the deck's numbering intact. */
function selection() {
  const numbered = SCENE_META.map((scene, index) => ({ ...scene, index }));
  if (SCENE_ID) {
    const one = numbered.filter((scene) => scene.id === SCENE_ID);
    if (one.length === 0) {
      throw new Error(`no scene with id "${SCENE_ID}"`);
    }
    return one;
  }
  return ONLY > 0 ? numbered.slice(0, ONLY) : numbered;
}

/**
 * Load one scene, pause it and put its clock on the last frame.
 *
 * The hash is the scene's public address, and the player reads it on mount, so
 * a reload is what actually moves the deck. Returns the duration the page
 * believes the scene has, which is asserted against the deck module by the
 * caller.
 */
async function showScene(page, scene) {
  await page.goto(`${ORIGIN}/slides#/${encodeURIComponent(scene.id)}`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.xk-player__frame', { timeout: 20000 });
  await page.addStyleTag({ content: CAPTURE_CSS });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });

  const counter = (await page.textContent('.xk-player__counter')) ?? '';
  const shown = Number(counter.split('/')[0].trim());
  if (shown !== scene.index + 1) {
    throw new Error(`#/${scene.id} opened scene ${shown}, the deck has it at ${scene.index + 1}`);
  }

  const pause = await page.$('button[aria-label="Pause"]');
  if (pause) {
    await pause.click();
  }

  // The opening frame has to draw something. A scene whose first beat starts
  // late is still a rectangle and some text, so an empty frame here means the
  // component threw or rendered nothing, and that must fail the run rather than
  // become a blank PNG.
  const atStart = await page.evaluate(() => document.querySelector('.xk-player__frame')?.childElementCount ?? 0);
  if (atStart === 0) {
    throw new Error(`${scene.id}: the frame is empty at t = 0`);
  }

  // React listens for the native input event, so setting .value directly is not
  // enough: the value has to go through the prototype setter first, or React's
  // own value tracker swallows the event as a no-op.
  const duration = await page.evaluate(() => {
    const input = document.querySelector('.xk-player__scrub input[type=range]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, input.max);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return Number(input.max);
  });

  // One paint at the new clock value, plus a beat for any transition the theme
  // applies to the surrounding page.
  await page.waitForTimeout(250);

  const atEnd = await page.evaluate(() => document.querySelector('.xk-player__frame')?.childElementCount ?? 0);
  if (atEnd === 0) {
    throw new Error(`${scene.id}: the frame is empty at t = ${duration}`);
  }
  return duration;
}

function seconds(msValue) {
  return (msValue / 1000).toFixed(2);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const scenes = selection();

  const browser = await launch();
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  if (DIST) {
    await serveFromDist(page);
  }

  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      problems.push(message.text());
    }
  });
  page.on('pageerror', (error) => problems.push(String(error)));

  const written = [];
  for (const scene of scenes) {
    const duration = await showScene(page, scene);
    if (duration !== scene.duration) {
      throw new Error(`${scene.id}: the page runs ${duration} ms, the deck module says ${scene.duration} ms`);
    }
    const stage = await page.$('.xk-player__stage');
    if (!stage) {
      throw new Error(`${scene.id}: no stage to capture`);
    }
    const box = await stage.boundingBox();
    if (!box || Math.round(box.width) !== WIDTH || Math.round(box.height) !== HEIGHT) {
      throw new Error(`${scene.id}: stage measured ${box ? `${box.width}x${box.height}` : 'nothing'}, wanted ${WIDTH}x${HEIGHT}`);
    }
    const name = `${String(scene.index + 1).padStart(2, '0')}.png`;
    await stage.screenshot({ path: path.join(OUT, name) });
    written.push(name);
    process.stdout.write(`${name}  ${scene.id}  ${seconds(scene.duration)} s\n`);
  }

  await context.close();
  await browser.close();

  if (problems.length > 0) {
    process.stderr.write(`\n${problems.length} console errors during the capture:\n${problems.join('\n')}\n`);
    process.exitCode = 1;
  }

  // The narration and the concat list always describe the whole deck, not the
  // subset a smoke test captured, because both are inputs to the voice
  // recording rather than to this run.
  const total = deckDuration();
  const header = [
    'xKoin founder deck narration.',
    `${SCENE_META.length} scenes in ${CHAPTERS.length} chapters, ${(total / 60000).toFixed(2)} minutes of motion.`,
    'Read one paragraph per scene, in order. Nothing here points at the screen, so the',
    'track can be recorded before the stills are final.',
    'A scene holds at its end, so the paragraph may run longer than the scene duration',
    'below; the duration is the motion, not the pacing.',
    '',
    '',
  ].join('\n');
  const narration = SCENE_META.map((scene, index) => {
    const head = `[${String(index + 1).padStart(2, '0')}] ${scene.id}  (${scene.chapterTitle}, ${seconds(scene.duration)} s)`;
    return `${head}\n${scene.caption}\n`;
  }).join('\n');
  await writeFile(path.join(OUT, 'narration.txt'), header + narration, 'utf8');

  // ffmpeg concat demuxer: every file needs a duration, and the last file is
  // repeated without one or the demuxer drops the final scene.
  const concat = [
    '# ffmpeg concat list for the xKoin founder deck.',
    '# Durations are the scene durations from src/decks/slides/manifest.js.',
    '# See src/decks/slides/README.md for the two ffmpeg commands.',
    ...SCENE_META.flatMap((scene, index) => [
      `file '${String(index + 1).padStart(2, '0')}.png'`,
      `duration ${seconds(scene.duration)}`,
    ]),
    `file '${String(SCENE_META.length).padStart(2, '0')}.png'`,
    '',
  ].join('\n');
  await writeFile(path.join(OUT, 'concat.txt'), concat, 'utf8');

  process.stdout.write(
    `\nsource: ${DIST ? `${DIST_DIR} (no server)` : ORIGIN}\n` +
      `${written.length} of ${SCENE_META.length} stills at ${WIDTH}x${HEIGHT} in ${OUT}\n` +
      `narration.txt: ${SCENE_META.length} paragraphs\n` +
      `concat.txt: ${(total / 60000).toFixed(2)} minutes of motion at the deck's own durations\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
  process.exitCode = 1;
});
