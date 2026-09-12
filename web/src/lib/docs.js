/**
 * The markdown corpus, imported at build time.
 *
 * import.meta.glob needs literal patterns, so the three folders are listed one
 * by one rather than generated. A folder that is empty contributes nothing and
 * is simply absent from the sidebar.
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

function buildIndex() {
  const docs = [];
  for (const folder of FOLDERS) {
    const entries = Object.entries(MODULES[folder] ?? {});
    for (const [modulePath, source] of entries) {
      const slug = toSlug(modulePath);
      const segments = slug.split('/');
      const fileName = `${segments[segments.length - 1]}.md`;
      docs.push({
        slug,
        folder,
        fileName,
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
  return FOLDERS.map((folder) => ({
    folder,
    docs: DOCS.filter((doc) => doc.folder === folder),
  }));
}
