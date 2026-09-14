#!/usr/bin/env node
/**
 * Unwrap hard-wrapped paragraphs in markdown so the HTML renderer uses the
 * full width. One paragraph becomes one line. Nothing else changes.
 *
 *   node scripts/reflow-markdown.mjs            # every tracked .md except docs/_drive
 *   node scripts/reflow-markdown.mjs --check    # exit 1 if any file would change
 *   node scripts/reflow-markdown.mjs path.md    # one or more files
 *
 * Left alone: fenced code, indented code, front matter, headings, tables,
 * horizontal rules, HTML blocks, list markers and blockquote markers, and any
 * line that ends a hard break on purpose (two trailing spaces or a backslash).
 * A wrapped continuation of a list item or a blockquote is joined onto it.
 * docs/_drive holds verbatim exports and is never touched.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const explicit = args.filter((arg) => !arg.startsWith('--'));

const files = explicit.length
  ? explicit.map((file) => path.resolve(file))
  : execSync('git ls-files "*.md"', { cwd: ROOT, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('docs/_drive/') && !line.startsWith('contracts/lib/'))
      .map((line) => path.join(ROOT, line));

const FENCE = /^(\s*)(```|~~~)/;
const HEADING = /^\s{0,3}#{1,6}(\s|$)/;
const LIST = /^(\s*)([-*+]|\d+[.)])\s+/;
const QUOTE = /^\s{0,3}>/;
const TABLE = /^\s*\|/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const HTML = /^\s{0,3}<[A-Za-z!/]/;
const INDENTED_CODE = /^( {4,}|\t)/;
const HARD_BREAK = /( {2,}|\\)$/;
const SETEXT = /^\s{0,3}(=+|-+)\s*$/;

/** True for a line that can be joined onto a running paragraph. */
function isText(line) {
  return (
    line.trim() !== '' &&
    !HEADING.test(line) &&
    !LIST.test(line) &&
    !QUOTE.test(line) &&
    !TABLE.test(line) &&
    !RULE.test(line) &&
    !HTML.test(line) &&
    !FENCE.test(line) &&
    !SETEXT.test(line)
  );
}

export function reflow(source) {
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = source.split(/\r?\n/);
  const out = [];
  let inFence = null;
  let inFront = false;
  let i = 0;

  if (lines[0] === '---') {
    inFront = true;
  }

  while (i < lines.length) {
    const line = lines[i];

    if (inFront) {
      out.push(line);
      if (i > 0 && line === '---') {
        inFront = false;
      }
      i += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (inFence) {
      out.push(line);
      if (fence && fence[2] === inFence) {
        inFence = null;
      }
      i += 1;
      continue;
    }
    if (fence) {
      inFence = fence[2];
      out.push(line);
      i += 1;
      continue;
    }

    // Indented code only counts when it does not continue a list item.
    const prev = out.length ? out[out.length - 1] : '';
    if (INDENTED_CODE.test(line) && (prev.trim() === '' || INDENTED_CODE.test(prev))) {
      out.push(line);
      i += 1;
      continue;
    }

    // A paragraph, list item or blockquote line: absorb its wrapped continuation lines.
    const startsList = LIST.test(line);
    const startsQuote = QUOTE.test(line);
    if (isText(line) || startsList || startsQuote) {
      let joined = line.replace(/\s+$/, (tail) => (HARD_BREAK.test(line) ? tail : ''));
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (HARD_BREAK.test(joined)) {
          break;
        }
        if (next.trim() === '') {
          break;
        }
        if (startsQuote) {
          // Continuation of a quote: another `>` line that is plain text.
          if (!QUOTE.test(next)) {
            break;
          }
          const body = next.replace(/^\s{0,3}>\s?/, '');
          if (!isText(body) || LIST.test(body)) {
            break;
          }
          joined = `${joined} ${body.trim()}`;
          j += 1;
          continue;
        }
        if (!isText(next)) {
          break;
        }
        // Setext heading underline directly below: leave the pair alone.
        if (SETEXT.test(lines[j + 1] ?? '')) {
          break;
        }
        if (startsList && !/^\s+/.test(next)) {
          // A lazy continuation without indent still belongs to the item.
        }
        joined = `${joined} ${next.trim()}`;
        j += 1;
      }
      out.push(joined);
      i = j;
      continue;
    }

    out.push(line);
    i += 1;
  }

  return out.join(eol);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
let changed = 0;
for (const file of isMain ? files : []) {
  const before = readFileSync(file, 'utf8');
  const after = reflow(before);
  if (after !== before) {
    changed += 1;
    if (check) {
      console.log(`would reflow ${path.relative(ROOT, file)}`);
    } else {
      writeFileSync(file, after);
      const linesBefore = before.split(/\r?\n/).length;
      const linesAfter = after.split(/\r?\n/).length;
      console.log(`reflowed ${path.relative(ROOT, file)}: ${linesBefore} -> ${linesAfter} lines`);
    }
  }
}
if (isMain) {
  console.log(`${changed} of ${files.length} files ${check ? 'need reflow' : 'reflowed'}`);
  if (check && changed > 0) {
    process.exit(1);
  }
}
