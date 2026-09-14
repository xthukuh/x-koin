import { makeSlugger } from '../lib/docs.js';
import { renderMarkdown } from '../lib/markdown.js';

import { BLOCK_KINDS, renderBlock } from './blocks.js';
import { findExplainer } from './explainers/index.js';
import { glossaryMatches } from './glossary.js';

/**
 * The docs rendering pass.
 *
 * marked turns the markdown into HTML; everything after that happens on a
 * detached DOM, which is a great deal safer than running regular expressions
 * over a string of HTML. In order: cross-references between papers become
 * router paths, headings get slugs and a copy-link anchor, tables get a
 * scroll container, `xk-*` fenced blocks become diagrams, the first occurrence
 * of every glossary term gets a tooltip, and the result is cut into segments so
 * the React route can put a real animation component where an `xk-anim` block
 * stood.
 */

/** Tags whose text is never touched by the glossary pass. */
const GLOSS_SKIP = new Set([
  'CODE',
  'PRE',
  'A',
  'ABBR',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'SCRIPT',
  'STYLE',
  'SVG',
  'FIGCAPTION',
  'BUTTON',
]);

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

function escapeAttribute(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}

/**
 * A relative `04-settlement-and-economics.md#6-tickets` link becomes the route
 * path `/docs/papers/04-settlement-and-economics#6-tickets`, so a cross
 * reference written for GitHub works here without a page load.
 */
function rewriteDocLinks(root, folder) {
  for (const anchor of root.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href');
    if (!href || !href.includes('.md')) {
      continue;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      continue;
    }
    const [path, hash = ''] = href.split('#');
    if (!path.endsWith('.md')) {
      continue;
    }
    // Resolve against the document's own folder, so `../how-it-works.md`
    // leaves the corpus and is left alone rather than pointing at nothing.
    const resolved = new URL(path, `http://local/docs/${folder}/`).pathname.replace(/\.md$/, '');
    if (!resolved.startsWith('/docs/')) {
      continue;
    }
    anchor.setAttribute('href', hash ? `${resolved}#${hash}` : resolved);
    anchor.setAttribute('data-doc-link', '');
  }
}

function markHeadings(root) {
  const slug = makeSlugger();
  const headings = [];
  for (const heading of root.querySelectorAll('h2, h3')) {
    const text = heading.textContent.trim();
    const id = slug(text);
    heading.id = id;
    heading.classList.add('xk-docs__h');
    const anchor = root.ownerDocument.createElement('a');
    anchor.className = 'xk-docs__anchor';
    anchor.href = `#${id}`;
    anchor.setAttribute('data-anchor', id);
    anchor.setAttribute('aria-label', `Copy a link to "${text}"`);
    anchor.textContent = '#';
    heading.append(anchor);
    headings.push({ level: heading.tagName === 'H2' ? 2 : 3, text, id });
  }
  return headings;
}

function wrapTables(root) {
  for (const table of root.querySelectorAll('table')) {
    if (table.parentElement && table.parentElement.classList.contains('xk-docs__tablewrap')) {
      continue;
    }
    const wrap = root.ownerDocument.createElement('div');
    wrap.className = 'xk-tablewrap xk-docs__tablewrap';
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'region');
    table.replaceWith(wrap);
    wrap.append(table);
  }
}

function replaceWithHtml(node, html) {
  const template = node.ownerDocument.createElement('template');
  template.innerHTML = html;
  node.replaceWith(...template.content.childNodes);
}

/**
 * Turn the `xk-*` fenced blocks into pictures. A block whose kind or name is
 * unknown, or whose body the parser cannot use, is left exactly as written, so
 * a typo shows its own source instead of vanishing.
 */
function replaceBlocks(root) {
  for (const pre of [...root.querySelectorAll('pre[data-info]')]) {
    const info = pre.getAttribute('data-info') ?? '';
    const [kind, ...rest] = info.split(/\s+/);
    const body = pre.textContent ?? '';
    if (BLOCK_KINDS.includes(kind)) {
      const html = renderBlock(kind, body);
      if (html) {
        replaceWithHtml(pre, html);
      }
      continue;
    }
    if (kind === 'xk-anim') {
      const name = rest[0] ?? '';
      if (!findExplainer(name)) {
        console.warn(`docs: no explainer named "${name}"`);
        continue;
      }
      const holder = root.ownerDocument.createElement('div');
      holder.setAttribute('data-xk-anim', name);
      pre.replaceWith(holder);
    }
  }
}

/** One regular expression for every glossary spelling, longest first. */
let glossRegex = null;
let glossIndex = null;

function glossary() {
  if (!glossRegex) {
    const matches = glossaryMatches();
    glossIndex = new Map();
    for (const match of matches) {
      if (!glossIndex.has(match.text.toLowerCase())) {
        glossIndex.set(match.text.toLowerCase(), match);
      }
    }
    const alternation = matches.map((match) => escapeRegex(match.text)).join('|');
    glossRegex = new RegExp(`(?<![A-Za-z0-9-])(${alternation})(?![A-Za-z0-9-])`, 'gi');
  }
  return { regex: glossRegex, index: glossIndex };
}

function glossHtml(entry, shown, docTitles) {
  const paper = docTitles.get(entry.paper);
  const link = paper
    ? `<a class="xk-gloss__link" href="/docs/${entry.paper}" data-doc-link>explained in ${escapeAttribute(
        paper,
      )}</a>`
    : '';
  return (
    `<span class="xk-gloss" tabindex="0">` +
    `<abbr class="xk-gloss__term" title="${escapeAttribute(entry.term)}: ${escapeAttribute(entry.definition)}">${escapeAttribute(shown)}</abbr>` +
    `<span class="xk-gloss__pop" role="note">` +
    `<span class="xk-gloss__head xk-mono">${escapeAttribute(entry.term)}</span>` +
    `<span class="xk-gloss__def">${escapeAttribute(entry.definition)}</span>${link}</span></span>`
  );
}

/**
 * Wrap the first occurrence of each glossary term. Only the first: a paper that
 * says "receipt" forty times should not turn into a field of dotted
 * underlines.
 */
function annotateGlossary(root, docTitles) {
  const { regex, index } = glossary();
  const used = new Set();
  const nodes = [];

  const walk = (element) => {
    for (const child of [...element.childNodes]) {
      if (child.nodeType === 3) {
        nodes.push(child);
        continue;
      }
      if (child.nodeType !== 1) {
        continue;
      }
      if (GLOSS_SKIP.has(child.tagName) || child.classList.contains('xk-dg')) {
        continue;
      }
      walk(child);
    }
  };
  walk(root);

  for (const node of nodes) {
    const text = node.nodeValue ?? '';
    if (text.trim().length < 2) {
      continue;
    }
    regex.lastIndex = 0;
    let html = '';
    let cursor = 0;
    let match = regex.exec(text);
    while (match) {
      const found = match[1];
      const candidate = index.get(found.toLowerCase());
      const ok =
        candidate &&
        !used.has(candidate.entry.term) &&
        (!candidate.entry.exact || candidate.text === found);
      if (ok) {
        used.add(candidate.entry.term);
        html += escapeAttribute(text.slice(cursor, match.index));
        html += glossHtml(candidate.entry, found, docTitles);
        cursor = match.index + found.length;
      }
      match = regex.exec(text);
    }
    if (cursor === 0) {
      continue;
    }
    html += escapeAttribute(text.slice(cursor));
    const template = root.ownerDocument.createElement('template');
    template.innerHTML = html;
    node.replaceWith(...template.content.childNodes);
  }
}

/**
 * Cut the finished body into a list the route can render: runs of HTML, and
 * the animations that sat between them.
 */
function toSegments(body) {
  const segments = [];
  let html = '';
  for (const child of [...body.children]) {
    const anim = child.getAttribute ? child.getAttribute('data-xk-anim') : null;
    if (anim) {
      if (html) {
        segments.push({ kind: 'html', html });
        html = '';
      }
      segments.push({ kind: 'anim', name: anim });
      continue;
    }
    html += child.outerHTML;
  }
  if (html) {
    segments.push({ kind: 'html', html });
  }
  return segments;
}

/**
 * Render one document. `docTitles` maps a slug to the title shown in a
 * glossary tooltip's link, so the tooltip can say which paper explains a term.
 */
export function renderDoc(doc, docTitles = new Map()) {
  const raw = renderMarkdown(doc.source, doc.baseUrl);
  const parsed = new DOMParser().parseFromString(`<body>${raw}</body>`, 'text/html');
  const body = parsed.body;

  const h1 = body.querySelector('h1');
  if (h1 && h1.parentElement === body) {
    h1.remove();
  }

  rewriteDocLinks(body, doc.folder);
  const headings = markHeadings(body);
  wrapTables(body);
  replaceBlocks(body);
  annotateGlossary(body, docTitles);

  return { segments: toSegments(body), headings };
}
