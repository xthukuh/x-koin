import { Marked } from 'marked';

const MERMAID_URL = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.15.0/mermaid.min.js';

/**
 * GitHub-flavoured markdown: tables and fenced code blocks are on by default in
 * marked's gfm mode. A ```mermaid fence becomes <pre class="mermaid"> so the
 * same renderer handles both the fence and a hand-written <pre class="mermaid">
 * block in raw HTML.
 *
 * The corpus is this repository's own docs, not third-party input, so the HTML
 * is rendered as authored rather than sanitised.
 */
const marked = new Marked({ gfm: true, breaks: false });

marked.use({
  renderer: {
    code({ text, lang }) {
      const language = (lang ?? '').trim().split(/\s+/)[0];
      if (language === 'mermaid') {
        return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
      }
      const className = language ? ` class="language-${escapeHtml(language)}"` : '';
      return `<pre><code${className}>${escapeHtml(text)}</code></pre>\n`;
    },
  },
});

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function isAbsolute(url) {
  return (
    url.startsWith('/') ||
    url.startsWith('#') ||
    url.startsWith('data:') ||
    /^[a-z][a-z0-9+.-]*:/i.test(url)
  );
}

/**
 * Rewrite a relative src/href so it points at the copied asset tree. The build
 * copies docs/<folder>/assets into /docs/<folder>/assets, so resolving the link
 * against the document's own directory URL lands on the right file.
 */
function resolveRelative(url, baseUrl) {
  if (!url || isAbsolute(url)) {
    return url;
  }
  return new URL(url, `http://local${baseUrl}`).pathname;
}

/** True when the rendered HTML has at least one mermaid block to draw. */
export function hasMermaid(html) {
  return html.includes('class="mermaid"');
}

export function renderMarkdown(source, baseUrl) {
  const raw = marked.parse(source);
  const doc = new DOMParser().parseFromString(`<body>${raw}</body>`, 'text/html');
  for (const element of doc.querySelectorAll('[src]')) {
    element.setAttribute('src', resolveRelative(element.getAttribute('src'), baseUrl));
  }
  for (const element of doc.querySelectorAll('[href]')) {
    const href = element.getAttribute('href');
    // Leave links to other markdown documents alone; only assets move.
    if (href && !href.endsWith('.md')) {
      element.setAttribute('href', resolveRelative(href, baseUrl));
    }
  }
  return doc.body.innerHTML;
}

let mermaidLoader = null;

/** Load mermaid from cdnjs once, and only for pages that contain a diagram. */
async function loadMermaid() {
  if (window.mermaid) {
    return window.mermaid;
  }
  if (!mermaidLoader) {
    mermaidLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = MERMAID_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.addEventListener('load', () => resolve(window.mermaid));
      script.addEventListener('error', () => reject(new Error('mermaid failed to load')));
      document.head.append(script);
    });
  }
  return mermaidLoader;
}

export async function renderMermaid(container) {
  const blocks = container.querySelectorAll('pre.mermaid');
  if (blocks.length === 0) {
    return;
  }
  const mermaid = await loadMermaid();
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
  await mermaid.run({ nodes: blocks });
}
