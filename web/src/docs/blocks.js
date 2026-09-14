/**
 * Static visual explainers for the docs.
 *
 * A fenced block whose info string is `xk-flow`, `xk-timeline`, `xk-stack` or
 * `xk-compare` becomes a themed diagram here. The body of each block is written
 * as plain lines so that GitHub, which knows none of these info strings, simply
 * prints the body and the paper still reads correctly. Nothing here reaches
 * outside the docs renderer, and every colour is a theme token.
 *
 * Line grammar, shared by all four:
 *
 *   title: ...        the caption above the picture
 *   note: ...         a footnote under the picture
 *   blank lines       ignored
 *
 * xk-flow      `A -> B -> C`, `A -> B : label`, `A <- B : label` for a return
 * xk-timeline  `P1 ADMISSION | what happens in this phase`
 * xk-stack     `HomePlug AV | plc | about 10 Mbps, 1400 B payload`
 * xk-compare   first line `Left | Right`, then `row label | left | right`
 */

export const BLOCK_KINDS = ['xk-flow', 'xk-timeline', 'xk-stack', 'xk-compare'];

const TINTS = new Set(['plc', 'nbplc', 'lora', 'accent', 'money', 'good', 'warn', 'critical', 'ink', 'muted']);

/**
 * A node in a flow picture is tinted by what it is, so the same colours carry
 * across every diagram in the set without a paper having to name a colour.
 */
const NAME_TINTS = [
  [/node-satellite|relay/i, 'nbplc'],
  [/satellite|lora|sensor|farm/i, 'lora'],
  [/node|gateway|ap\b/i, 'plc'],
  [/internet|wan|upstream|cloud|proxy/i, 'muted'],
  [/kiosk|escrow|chain|treasury|bank|m-pesa|equitel|mpesa|bridge|settle/i, 'money'],
  [/receipt|ticket|voucher|signed/i, 'good'],
  [/client|phone|user|dongle/i, 'ink'],
];

function tintFor(name) {
  for (const [pattern, tint] of NAME_TINTS) {
    if (pattern.test(name)) {
      return tint;
    }
  }
  return 'accent';
}

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Pull the shared `title:` and `note:` lines out and hand back the rest. */
function readLines(body) {
  const lines = [];
  let title = '';
  const notes = [];
  for (const raw of String(body).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      continue;
    }
    const match = /^(title|note)\s*:\s*(.*)$/i.exec(line);
    if (match) {
      if (match[1].toLowerCase() === 'title') {
        title = match[2];
      } else {
        notes.push(match[2]);
      }
      continue;
    }
    lines.push(line);
  }
  return { title, notes, lines };
}

function cells(line) {
  return line.split('|').map((cell) => cell.trim());
}

function frame(kind, title, notes, inner) {
  const head = title
    ? `<figcaption class="xk-dg__title xk-mono">${escapeHtml(title)}</figcaption>`
    : '';
  const foot = notes.length
    ? `<p class="xk-dg__note">${notes.map((note) => escapeHtml(note)).join(' ')}</p>`
    : '';
  return `<figure class="xk-dg xk-dg--${kind}" role="group">${head}<div class="xk-dg__body">${inner}</div>${foot}</figure>`;
}

const ARROW_RIGHT =
  '<svg class="xk-dg__arrow" viewBox="0 0 48 16" aria-hidden="true" focusable="false"><path d="M0 8h38M31 2l7 6-7 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

const ARROW_LEFT =
  '<svg class="xk-dg__arrow" viewBox="0 0 48 16" aria-hidden="true" focusable="false"><path d="M48 8H10M17 2l-7 6 7 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

/* ------------------------------------------------------------------- flow */

function flow(body) {
  const { title, notes, lines } = readLines(body);
  const order = [];
  const edges = [];
  const returns = [];

  for (const line of lines) {
    const [path, ...rest] = line.split(':');
    const label = rest.join(':').trim();
    if (path.includes('<-')) {
      const parts = path.split('<-').map((part) => part.trim()).filter(Boolean);
      for (const part of parts) {
        if (!order.includes(part)) {
          order.push(part);
        }
      }
      returns.push({ from: parts[parts.length - 1], to: parts[0], label });
      continue;
    }
    const parts = path.split('->').map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) {
      continue;
    }
    for (const part of parts) {
      if (!order.includes(part)) {
        order.push(part);
      }
    }
    // A chain of three or more carries one label, and it belongs on the last
    // arrow, which is the one the sentence is about.
    for (let i = 0; i < parts.length - 1; i += 1) {
      edges.push({ from: parts[i], to: parts[i + 1], label: i === parts.length - 2 ? label : '' });
    }
  }

  if (order.length === 0) {
    return '';
  }

  const labelFor = (from, to) => {
    const edge = edges.find((candidate) => candidate.from === from && candidate.to === to);
    return edge ? edge.label : '';
  };

  const chain = order
    .map((name, index) => {
      const box = `<span class="xk-dg__node" data-tint="${tintFor(name)}">${escapeHtml(name)}</span>`;
      if (index === 0) {
        return box;
      }
      const label = labelFor(order[index - 1], name);
      const link = `<span class="xk-dg__link">${ARROW_RIGHT}${
        label ? `<span class="xk-dg__link-label xk-mono">${escapeHtml(label)}</span>` : ''
      }</span>`;
      // The arrow and the box it points at wrap together, so a long chain
      // never breaks with a dangling arrow at the end of a row.
      return `<span class="xk-dg__pair">${link}${box}</span>`;
    })
    .join('');

  const back = returns
    .map(
      (edge) =>
        `<div class="xk-dg__return">${ARROW_LEFT}<span class="xk-dg__return-label xk-mono">${escapeHtml(
          edge.label || `${edge.from} to ${edge.to}`,
        )}</span></div>`,
    )
    .join('');

  return frame('flow', title, notes, `<div class="xk-dg__chain">${chain}</div>${back}`);
}

/* --------------------------------------------------------------- timeline */

function timeline(body) {
  const { title, notes, lines } = readLines(body);
  const steps = lines
    .map((line) => {
      const parts = cells(line);
      return { key: parts[0] ?? '', text: parts.slice(1).join(' ') };
    })
    .filter((step) => step.key);
  if (steps.length === 0) {
    return '';
  }
  const items = steps
    .map(
      (step, index) =>
        `<li class="xk-dg__step"><span class="xk-dg__step-dot" aria-hidden="true">${index + 1}</span>` +
        `<span class="xk-dg__step-key xk-mono">${escapeHtml(step.key)}</span>` +
        `<span class="xk-dg__step-text">${escapeHtml(step.text)}</span></li>`,
    )
    .join('');
  return frame('timeline', title, notes, `<ol class="xk-dg__steps">${items}</ol>`);
}

/* ------------------------------------------------------------------ stack */

function stack(body) {
  const { title, notes, lines } = readLines(body);
  const layers = lines
    .map((line) => {
      const parts = cells(line);
      const name = parts[0] ?? '';
      let tint = '';
      let text = '';
      if (parts.length >= 3 && TINTS.has(parts[1].toLowerCase())) {
        tint = parts[1].toLowerCase();
        text = parts.slice(2).join(' ');
      } else {
        text = parts.slice(1).join(' ');
        tint = tintFor(name);
      }
      return { name, tint, text };
    })
    .filter((layer) => layer.name);
  if (layers.length === 0) {
    return '';
  }
  const items = layers
    .map(
      (layer) =>
        `<li class="xk-dg__layer" data-tint="${layer.tint}"><span class="xk-dg__layer-rule" aria-hidden="true"></span>` +
        `<span class="xk-dg__layer-name xk-mono">${escapeHtml(layer.name)}</span>` +
        `<span class="xk-dg__layer-text">${escapeHtml(layer.text)}</span></li>`,
    )
    .join('');
  return frame('stack', title, notes, `<ul class="xk-dg__layers">${items}</ul>`);
}

/* ---------------------------------------------------------------- compare */

function compare(body) {
  const { title, notes, lines } = readLines(body);
  if (lines.length === 0) {
    return '';
  }
  const head = cells(lines[0]);
  const left = head[0] ?? 'A';
  const right = head[1] ?? 'B';
  const rows = lines
    .slice(1)
    .map((line) => cells(line))
    .filter((row) => row.length >= 3);
  if (rows.length === 0) {
    return '';
  }
  const body_ = rows
    .map(
      (row) =>
        `<div class="xk-dg__cmp-row"><span class="xk-dg__cmp-key">${escapeHtml(row[0])}</span>` +
        `<span class="xk-dg__cmp-cell" data-side="left">${escapeHtml(row[1])}</span>` +
        `<span class="xk-dg__cmp-cell" data-side="right">${escapeHtml(row[2])}</span></div>`,
    )
    .join('');
  const header =
    `<div class="xk-dg__cmp-row xk-dg__cmp-row--head"><span class="xk-dg__cmp-key"></span>` +
    `<span class="xk-dg__cmp-head xk-mono" data-side="left">${escapeHtml(left)}</span>` +
    `<span class="xk-dg__cmp-head xk-mono" data-side="right">${escapeHtml(right)}</span></div>`;
  return frame('compare', title, notes, `<div class="xk-dg__cmp">${header}${body_}</div>`);
}

const RENDERERS = {
  'xk-flow': flow,
  'xk-timeline': timeline,
  'xk-stack': stack,
  'xk-compare': compare,
};

/**
 * Render one block. An unknown kind, or a body the parser cannot make anything
 * of, returns an empty string and the caller leaves the original code block in
 * place, so a malformed diagram degrades to its own source rather than to a
 * blank space.
 */
export function renderBlock(kind, body) {
  const renderer = RENDERERS[kind];
  if (!renderer) {
    return '';
  }
  try {
    return renderer(body);
  } catch (cause) {
    console.error(`docs: ${kind} block failed`, cause);
    return '';
  }
}
