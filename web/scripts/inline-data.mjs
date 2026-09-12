/**
 * Build the three legacy static pages into web/public/legacy/.
 *
 *   node scripts/inline-data.mjs
 *
 * This is the Node replacement for demo/build.py and protocol/viz/build_replay.py.
 * It keeps their marker convention exactly: /*__TRACE_JSON__*\/null,
 * /*__CHAIN_JSON__*\/null and /*__KIOSK_JSON__*\/null are replaced, once each,
 * with the compact JSON from protocol/out/, with "</" escaped as "<\/" so a
 * payload can never close the surrounding script tag. Output is newline
 * normalised to LF.
 *
 * protocol/out/ is a run artefact and is not tracked by git. When a JSON file
 * is missing the marker is left as null and a warning is printed, which is what
 * demo/build.py did.
 *
 * Sources:
 *   demo/index.html            -> web/public/legacy/investors.html
 *   demo/landlord.html         -> web/public/legacy/landlord.html
 *   protocol/viz/replay.html   -> web/public/legacy/replay.html
 *
 * replay.html additionally carries two HTML comment markers for the board
 * schematics in hardware/, inlined here the same way build_replay.py did.
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(HERE, '..');
const ROOT = path.resolve(WEB, '..');
const OUT_DIR = path.join(WEB, 'public', 'legacy');

const TRACE_JSON = path.join(ROOT, 'protocol', 'out', 'trace.json');
const CHAIN_JSON = path.join(ROOT, 'protocol', 'out', 'chain.json');
const KIOSK_JSON = path.join(ROOT, 'protocol', 'out', 'kiosk.json');
const GATEWAY_SVG = path.join(ROOT, 'hardware', 'xkoin-gateway.svg');
const SATELLITE_SVG = path.join(ROOT, 'hardware', 'xkoin-satellite.svg');

const MARKERS = [
  ['/*__TRACE_JSON__*/null', TRACE_JSON],
  ['/*__CHAIN_JSON__*/null', CHAIN_JSON],
  ['/*__KIOSK_JSON__*/null', KIOSK_JSON],
];

/**
 * Strip the insignificant whitespace from a JSON document while copying every
 * literal through untouched.
 *
 * JSON.parse plus JSON.stringify would also compact the document, but it loses
 * the distinction between `2` and `2.0`, so the output would drift from what
 * demo/build.py produced. Copying the literals verbatim keeps the payload byte
 * for byte what Python wrote.
 */
function minifyJson(text) {
  const chunks = [];
  const length = text.length;
  let index = 0;
  while (index < length) {
    const char = text[index];
    if (char === '"') {
      const start = index;
      index += 1;
      while (index < length) {
        if (text[index] === '\\') {
          index += 2;
          continue;
        }
        if (text[index] === '"') {
          index += 1;
          break;
        }
        index += 1;
      }
      chunks.push(text.slice(start, index));
      continue;
    }
    if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
      index += 1;
      continue;
    }
    chunks.push(char);
    index += 1;
  }
  return chunks.join('');
}

/** Replace the first occurrence of `marker` with the compact JSON at `jsonPath`. */
async function inject(html, marker, jsonPath, { required = true } = {}) {
  if (!html.includes(marker)) {
    if (required) {
      throw new Error(`template marker missing: ${marker}`);
    }
    return html;
  }
  if (!existsSync(jsonPath)) {
    console.warn(`warning: ${jsonPath} not found, leaving ${marker} as null`);
    return html;
  }
  const raw = await readFile(jsonPath, 'utf8');
  // Parse only to reject a corrupt file early; the payload is the minified text.
  JSON.parse(raw);
  const payload = minifyJson(raw).replaceAll('</', '<\\/');
  return html.replace(marker, () => payload);
}

/**
 * Drop the fixed pixel size when the SVG has no viewBox, so the page CSS width
 * rule can scale it. Same rule as build_replay.py.
 */
function inlineSvg(svg) {
  let out = svg;
  const m = /width="(\d+)"\s+height="(\d+)"/.exec(out);
  if (m && !out.includes('viewBox')) {
    out = out.replace(m[0], `viewBox="0 0 ${m[1]} ${m[2]}"`);
  }
  return out.replace('<?xml version="1.0"?>', '');
}

/** Normalise every line ending to LF, matching Python's newline="\n" write. */
function normaliseNewlines(text) {
  return text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

async function writeOut(name, html) {
  const target = path.join(OUT_DIR, name);
  await writeFile(target, normaliseNewlines(html), 'utf8');
  const { size } = await stat(target);
  console.log(`wrote ${target} (${size.toLocaleString('en-US')} bytes)`);
}

async function buildInvestors() {
  let html = await readFile(path.join(ROOT, 'demo', 'index.html'), 'utf8');
  for (const [marker, jsonPath] of MARKERS) {
    html = await inject(html, marker, jsonPath);
  }
  await writeOut('investors.html', html);
}

async function buildLandlord() {
  // No markers and no proof data: copied through so it stays byte-for-byte what
  // a landlord sees, independent of what protocol/out/ contains.
  const html = await readFile(path.join(ROOT, 'demo', 'landlord.html'), 'utf8');
  await writeOut('landlord.html', html);
}

async function buildReplay() {
  let html = await readFile(path.join(ROOT, 'protocol', 'viz', 'replay.html'), 'utf8');
  html = await inject(html, MARKERS[0][0], MARKERS[0][1]);
  for (const [marker, jsonPath] of MARKERS.slice(1)) {
    html = await inject(html, marker, jsonPath, { required: false });
  }
  for (const [marker, svgPath] of [
    ['<!--GATEWAY_SVG-->', GATEWAY_SVG],
    ['<!--SATELLITE_SVG-->', SATELLITE_SVG],
  ]) {
    if (!html.includes(marker) || !existsSync(svgPath)) {
      if (!existsSync(svgPath)) {
        console.warn(`warning: ${svgPath} not found, leaving ${marker} in place`);
      }
      continue;
    }
    const svg = inlineSvg(await readFile(svgPath, 'utf8'));
    html = html.replace(marker, () => svg);
  }
  await writeOut('replay.html', html);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await buildInvestors();
  await buildLandlord();
  await buildReplay();
}

await main();
