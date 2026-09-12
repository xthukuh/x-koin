import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DOCS, docsByFolder, findDoc } from '../lib/docs.js';
import { renderMarkdown, renderMermaid } from '../lib/markdown.js';

function Sidebar({ current }) {
  const groups = docsByFolder();
  return (
    <nav className="w-full shrink-0 border-b border-neutral-300 p-4 text-sm md:w-64 md:border-b-0 md:border-r">
      <Link className="font-medium underline" to="/">
        xKoin index
      </Link>
      {DOCS.length === 0 ? (
        <p className="mt-4 text-neutral-600">
          No markdown yet. Add files under docs/papers, docs/potential or docs/x-koin-beta.
        </p>
      ) : null}
      {groups
        .filter((group) => group.docs.length > 0)
        .map((group) => (
          <div key={group.folder} className="mt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {group.folder}
            </h2>
            <ul className="mt-2 space-y-1">
              {group.docs.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    className={
                      doc.slug === current
                        ? 'font-medium underline'
                        : 'text-neutral-700 hover:underline'
                    }
                    to={`/docs/${doc.slug}`}
                  >
                    {doc.fileName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </nav>
  );
}

export default function Docs() {
  const params = useParams();
  const slug = params['*'] ?? '';
  const doc = slug ? findDoc(slug) : null;
  const containerRef = useRef(null);

  const html = useMemo(() => (doc ? renderMarkdown(doc.source, doc.baseUrl) : ''), [doc]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !html) {
      return;
    }
    async function draw() {
      try {
        await renderMermaid(container);
      } catch (cause) {
        console.error(cause);
      }
    }
    draw();
  }, [html]);

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <Sidebar current={slug} />
      <main className="min-w-0 grow p-6">
        {doc ? (
          <article
            ref={containerRef}
            className="xk-markdown max-w-3xl"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold">Docs</h1>
            <p className="mt-2 text-neutral-600">
              {slug
                ? `No document at docs/${slug}.md`
                : 'Pick a document from the list. Every markdown file under docs/papers, docs/potential and docs/x-koin-beta is included at build time.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
