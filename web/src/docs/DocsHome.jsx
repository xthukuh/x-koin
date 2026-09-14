import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { DOCS, START_HERE, search } from '../lib/docs.js';

/**
 * The docs landing: what is in the corpus, in what order to read it, and a
 * search box over every title and every heading. The search is client side
 * because the whole index is already in the bundle; there is nothing to ask a
 * server for.
 */
export default function DocsHome({ groups }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => search(query.trim()), [query]);
  const searching = query.trim().length > 0;
  const words = useMemo(() => DOCS.reduce((total, doc) => total + doc.words, 0), []);

  return (
    <div className="xk-docs__home">
      <p className="xk-eyebrow">documentation</p>
      <h1>Everything written down.</h1>
      <p className="xk-lede">
        The whitepaper set, the cases the same mesh serves, and the merged beta board: {DOCS.length}{' '}
        documents and about {Math.round(words / 1000)}k words, rendered straight from the markdown in
        the repository.
      </p>

      <div className="xk-docs__search">
        <label className="xk-sr" htmlFor="xk-docs-search">
          Search titles and headings
        </label>
        <input
          id="xk-docs-search"
          className="xk-docs__search-input"
          type="search"
          placeholder="Search titles and headings"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        {searching ? (
          <p className="xk-note xk-docs__search-count">
            {results.length === 0
              ? 'Nothing matches. Try a single word.'
              : `${results.length} document${results.length === 1 ? '' : 's'}`}
          </p>
        ) : null}
      </div>

      {searching ? (
        <ul className="xk-docs__results">
          {results.map(({ doc, headings }) => (
            <li className="xk-docs__result" key={doc.slug}>
              <Link className="xk-docs__result-title" to={`/docs/${doc.slug}`}>
                {doc.label ? <span className="xk-mono xk-docs__result-label">{doc.label}</span> : null}
                {doc.title}
              </Link>
              <span className="xk-note">{doc.folder}</span>
              {headings.length > 0 ? (
                <ul className="xk-docs__result-heads">
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <Link to={`/docs/${doc.slug}#${heading.id}`}>{heading.text}</Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <>
          {START_HERE ? (
            <Link className="xk-docs__start" to={`/docs/${START_HERE.slug}`}>
              <span className="xk-eyebrow">read this first</span>
              <span className="xk-docs__start-title">{START_HERE.title}</span>
              <span className="xk-docs__start-text">
                What every paper contains, the shortest path through the set for each kind of reader,
                and the glossary the rest of the set assumes you know.
              </span>
              <span className="xk-docs__start-go xk-mono">Start here</span>
            </Link>
          ) : null}

          <div className="xk-docs__folders">
            {groups.map((group) => (
              <section className="xk-docs__folder" key={group.folder}>
                <header className="xk-docs__folder-head">
                  <h2>{group.meta.label}</h2>
                  <span className="xk-status xk-status--planned">{group.docs.length} documents</span>
                </header>
                <p className="xk-docs__folder-blurb">{group.meta.blurb}</p>
                <p className="xk-note xk-docs__folder-order">{group.meta.order}</p>
                <ol className="xk-docs__folder-list">
                  {group.docs.map((doc) => (
                    <li key={doc.slug}>
                      <Link to={`/docs/${doc.slug}`}>
                        {doc.label ? <span className="xk-mono xk-docs__list-label">{doc.label}</span> : null}
                        <span className="xk-docs__list-title">{doc.title}</span>
                        <span className="xk-mono xk-docs__list-time">{doc.minutes} min</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
