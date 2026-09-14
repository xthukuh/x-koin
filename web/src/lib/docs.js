/**
 * The markdown corpus, imported at build time.
 *
 * import.meta.glob needs literal patterns, so the three folders are listed one
 * by one rather than generated. A folder that is empty contributes nothing and
 * is simply absent from the sidebar. docs/ops is never listed here: it holds
 * account material that must not reach the bundle.
 *
 * Every document is indexed with the title from its first h1, the numeric
 * prefix from its file name, its h2 and h3 headings with GitHub-compatible
 * slugs, a word count and a reading time. The docs route builds its file tree,
 * its outline and its client-side search from this index alone, so nothing has
 * to parse markdown before the reader asks for a document.
 */
const MODULES = {
  papers: import.meta.glob('../../../docs/papers/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  potential: import.meta.glob('../../../docs/potential/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  'x-koin-beta': import.meta.glob('../../../docs/x-koin-beta/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
};

export const FOLDERS = ['papers', 'potential', 'x-koin-beta'];

/** How each folder introduces itself on the docs landing. */
export const FOLDER_META = {
  papers: {
    label: 'Papers',
    blurb:
      'The whitepaper set, from the concept and the market through the protocol, the hardware and the roadmap.',
    order: 'Start with 00. It gives the shortest path through the set for an investor, an engineer, an operator, a regulator or a manufacturer.',
  },
  potential: {
    label: 'Potential',
    blurb:
      'What the same mesh is worth outside a Nairobi flat: farms, estates, market hubs, schools, relief corridors, matatu stages.',
    order: 'Any order. Each case stands alone, with its own hardware, its own money and its own open questions.',
  },
  'x-koin-beta': {
    label: 'Beta board',
    blurb: 'One board instead of a kit of modules: the schematic, the outline and what it costs to build.',
    order: 'Read 00 for the idea, 01 and 02 for the electronics, then 03 and 04 for the factory and the money.',
  },
};

/**
 * Turn `../../../docs/papers/a/b.md` into the slug `papers/a/b`, which is what
 * the /docs/* route carries and what the sidebar links to.
 */
function toSlug(modulePath) {
  const marker = '/docs/';
  const index = modulePath.indexOf(marker);
  const tail = index === -1 ? modulePath : modulePath.slice(index + marker.length);
  return tail.replace(/\.md$/, '');
}

/**
 * GitHub's heading slug, so a cross-reference written for GitHub
 * (`03-protocol-xkp.md#4-proof-layer`) resolves to the same id here.
 */
export function slugifyHeading(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s+/g, '-');
}

/** A counter that makes repeated headings unique the way GitHub does. */
export function makeSlugger() {
  const seen = new Map();
  return (text) => {
    const base = slugifyHeading(text) || 'section';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

/** Strip the inline markdown a heading may carry, so the outline reads clean. */
function plainText(markdown) {
  return markdown
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim();
}

/**
 * Walk the source once for everything the index needs: the first h1, the h2 and
 * h3 headings with their slugs, and the word count. Fenced blocks are skipped
 * so a `# comment` inside a code sample never becomes a heading.
 */
function scan(source) {
  const lines = source.split(/\r?\n/);
  const slug = makeSlugger();
  const headings = [];
  let title = '';
  let words = 0;
  let fenced = false;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) {
      continue;
    }
    const match = /^(#{1,3})\s+(.*)$/.exec(line);
    if (match) {
      const text = plainText(match[2]);
      if (match[1].length === 1) {
        if (!title) {
          title = text;
        }
        continue;
      }
      headings.push({ level: match[1].length, text, id: slug(text) });
      continue;
    }
    words += line.split(/\s+/).filter(Boolean).length;
  }

  return { title, headings, words };
}

/** `00-START-HERE` gives the label `00`; a file with no prefix gives none. */
function numericLabel(fileName) {
  const match = /^(\d+)[-.]/.exec(fileName);
  return match ? match[1] : '';
}

/** A title without its own numeric prefix, since the prefix is shown apart. */
function stripPrefix(title) {
  return title.replace(/^\d+\.\s*/, '').trim();
}

function buildIndex() {
  const docs = [];
  for (const folder of FOLDERS) {
    const entries = Object.entries(MODULES[folder] ?? {});
    for (const [modulePath, source] of entries) {
      const slug = toSlug(modulePath);
      const segments = slug.split('/');
      const stem = segments[segments.length - 1];
      const { title, headings, words } = scan(source);
      docs.push({
        slug,
        folder,
        stem,
        fileName: `${stem}.md`,
        sourcePath: `docs/${slug}.md`,
        label: numericLabel(stem),
        title: stripPrefix(title) || stem,
        fullTitle: title || stem,
        headings,
        words,
        minutes: Math.max(1, Math.round(words / 220)),
        // Directory the document lives in, as a site path, so relative image
        // links inside it can be resolved against something.
        baseUrl: `/docs/${segments.slice(0, -1).join('/')}/`,
        source,
      });
    }
  }
  docs.sort((a, b) => {
    if (a.folder !== b.folder) {
      return FOLDERS.indexOf(a.folder) - FOLDERS.indexOf(b.folder);
    }
    return a.fileName.localeCompare(b.fileName);
  });
  return docs;
}

export const DOCS = buildIndex();

export function findDoc(slug) {
  return DOCS.find((doc) => doc.slug === slug) ?? null;
}

export function docsByFolder() {
  return FOLDERS.filter((folder) => DOCS.some((doc) => doc.folder === folder)).map((folder) => ({
    folder,
    meta: FOLDER_META[folder] ?? { label: folder, blurb: '', order: '' },
    docs: DOCS.filter((doc) => doc.folder === folder),
  }));
}

/** The document before and after this one in corpus order, for the foot links. */
export function neighbours(slug) {
  const index = DOCS.findIndex((doc) => doc.slug === slug);
  if (index === -1) {
    return { previous: null, next: null };
  }
  return {
    previous: index > 0 ? DOCS[index - 1] : null,
    next: index < DOCS.length - 1 ? DOCS[index + 1] : null,
  };
}

/** The entry point the landing page points at, if it is present. */
export const START_HERE = findDoc('papers/00-START-HERE');

/**
 * Client-side search over titles and headings. Every query term must appear
 * somewhere in the document's title or in one of its headings, so a two-word
 * query narrows rather than widens.
 */
export function search(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return [];
  }
  const results = [];
  for (const doc of DOCS) {
    const titleText = `${doc.label} ${doc.title}`.toLowerCase();
    const hits = doc.headings.filter((heading) => {
      const text = heading.text.toLowerCase();
      return terms.every((term) => text.includes(term));
    });
    const titleHit = terms.every((term) => titleText.includes(term));
    if (!titleHit && hits.length === 0) {
      continue;
    }
    results.push({ doc, titleHit, headings: hits.slice(0, 5) });
  }
  return results;
}
