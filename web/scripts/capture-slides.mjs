/**
 * Capture the explainer deck to stills and a narration script.
 *
 *   npm run build && npm run preview          # in one terminal
 *   node scripts/capture-slides.mjs           # in another
 *
 * Writes, into web/dist/slides/:
 *   NN.png          one 1280x720 still per card, numbered from 01
 *   narration.txt   one paragraph per card, in order, for the voice recording
 *   concat.txt      an ffmpeg concat list whose durations come from the word
 *                   counts at the deck's words-per-minute
 *
 * Uses the locally installed Google Chrome (or Edge) through playwright-core,
 * the same launch pattern as scripts/scout/ali.mjs, so no browser download is
 * needed. Nothing is rasterised into the deck itself: the PNGs are an output of
 * the deck, never an input to it.
 *
 * Options:
 *   --url <origin>   default http://localhost:4173
 *   --out <dir>      default web/dist/slides
 *   --headed         show the browser, for debugging a card that will not settle
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

import { DECK, WORDS_PER_MINUTE, cardSeconds, wordCount } from '../src/slides/deck.js';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIDTH = 1280;
const HEIGHT = 720;

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 || index === process.argv.length - 1 ? fallback : process.argv[index + 1];
}

const ORIGIN = arg('--url', 'http://localhost:4173').replace(/\/+$/, '');
const OUT = path.resolve(WEB, arg('--out', path.join('dist', 'slides')));
const HEADED = process.argv.includes('--headed');

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

/** Reveal reports its own card count, which must agree with deck.js. */
async function slideCount(page) {
  return page.evaluate(() => document.querySelectorAll('.reveal .slides > section').length);
}

/**
 * Move to one card and wait for the Auto-Animate transition to end.
 *
 * Navigation goes through the URL hash rather than through reveal's instance,
 * because the hash is the deck's public address for a card: every section
 * carries the card's `id`, and the deck is configured with `hash: true` and
 * `respondToHashChanges: true`.
 */
async function showSlide(page, index, id) {
  await page.evaluate((slug) => {
    window.location.hash = `#/${slug}`;
  }, id);
  await page.waitForFunction(
    (i) => {
      const sections = Array.from(document.querySelectorAll('.reveal .slides > section'));
      return sections[i] && sections[i].classList.contains('present');
    },
    index,
    { timeout: 10000 },
  );
  // Auto-Animate runs for 0.55 s in the deck config; give it margin and let
  // web fonts settle so every still has the same metrics.
  await page.waitForTimeout(900);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const target = `${ORIGIN}/slides`;
  const response = await page.goto(target, { waitUntil: 'networkidle' });
  if (!response || !response.ok()) {
    throw new Error(`${target} returned ${response ? response.status() : 'no response'}`);
  }

  await page.waitForSelector('.reveal .slides > section.present', { timeout: 20000 });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });

  const onPage = await slideCount(page);
  if (onPage !== DECK.length) {
    throw new Error(`deck.js has ${DECK.length} cards, the page rendered ${onPage}`);
  }

  const written = [];
  for (let index = 0; index < DECK.length; index += 1) {
    await showSlide(page, index, DECK[index].id);
    const name = `${String(index + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    written.push(name);
    process.stdout.write(`${name}  ${DECK[index].id}\n`);
  }

  await context.close();
  await browser.close();

  const total = DECK.reduce((sum, card) => sum + wordCount(card.narration), 0);
  const narration = DECK.map((card, index) => {
    const head = `[${String(index + 1).padStart(2, '0')}] ${card.id}  (${wordCount(card.narration)} words, ${cardSeconds(card).toFixed(1)} s)`;
    return `${head}\n${card.narration}\n`;
  }).join('\n');
  const header = [
    'xKoin explainer narration.',
    `${DECK.length} cards, ${total} words, ${(total / WORDS_PER_MINUTE).toFixed(2)} minutes at ${WORDS_PER_MINUTE} words per minute.`,
    'Read one paragraph per card, straight through, with no pause longer than a breath.',
    'Nothing here points at the screen, so the track can be recorded before the stills are final.',
    '',
    '',
  ].join('\n');
  await writeFile(path.join(OUT, 'narration.txt'), header + narration, 'utf8');

  // ffmpeg concat demuxer: every file needs a duration, and the last file is
  // repeated without one so the final card is not dropped.
  const concat = [
    '# ffmpeg concat list, durations from narration word counts',
    `# at ${WORDS_PER_MINUTE} words per minute. See src/slides/README.md.`,
    ...DECK.flatMap((card, index) => [
      `file '${String(index + 1).padStart(2, '0')}.png'`,
      `duration ${cardSeconds(card).toFixed(2)}`,
    ]),
    `file '${String(DECK.length).padStart(2, '0')}.png'`,
    '',
  ].join('\n');
  await writeFile(path.join(OUT, 'concat.txt'), concat, 'utf8');

  process.stdout.write(
    `\n${written.length} stills at ${WIDTH}x${HEIGHT} in ${OUT}\n` +
      `narration.txt: ${DECK.length} paragraphs, ${total} words, ` +
      `${(total / WORDS_PER_MINUTE).toFixed(2)} minutes at ${WORDS_PER_MINUTE} wpm\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
  process.exitCode = 1;
});
