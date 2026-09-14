import { Link } from 'react-router-dom';

/**
 * The file tree.
 *
 * Three levels: the folder, the documents inside it, and, inside the document
 * being read, its h2 and h3 headings as a live outline. A document is named by
 * the title in its first h1, with the numeric prefix from the file name kept
 * apart as a small mono label, because that prefix is the reading order and
 * nothing else.
 *
 * The same component is the desktop sidebar and the contents of the mobile
 * drawer; only the frame around it differs.
 */
export default function DocsSidebar({
  groups,
  currentSlug,
  headings,
  activeId,
  open,
  onToggle,
  onNavigate,
}) {
  return (
    <nav className="xk-tree" aria-label="Documents">
      <Link
        className={`xk-tree__home${currentSlug ? '' : ' is-current'}`}
        to="/docs"
        onClick={onNavigate}
      >
        All documents
      </Link>

      {groups.map((group) => {
        const expanded = open.includes(group.folder);
        return (
          <section className="xk-tree__group" key={group.folder}>
            <h2 className="xk-tree__folder-head">
              <button
                type="button"
                className="xk-tree__folder"
                aria-expanded={expanded}
                onClick={() => onToggle(group.folder)}
              >
                <span className="xk-tree__caret" data-open={expanded} aria-hidden="true">
                  <svg viewBox="0 0 12 12" width="10" height="10">
                    <path d="M3 1l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <span className="xk-tree__folder-name xk-mono">{group.folder}</span>
                <span className="xk-tree__count xk-mono">{group.docs.length}</span>
              </button>
            </h2>

            {expanded ? (
              <ul className="xk-tree__docs">
                {group.docs.map((doc) => {
                  const current = doc.slug === currentSlug;
                  return (
                    <li key={doc.slug} className="xk-tree__item">
                      <Link
                        className={`xk-tree__doc${current ? ' is-current' : ''}`}
                        to={`/docs/${doc.slug}`}
                        onClick={onNavigate}
                        aria-current={current ? 'page' : undefined}
                      >
                        {doc.label ? <span className="xk-tree__label xk-mono">{doc.label}</span> : null}
                        <span className="xk-tree__title">{doc.title}</span>
                      </Link>

                      {current && headings.length > 0 ? (
                        <ul className="xk-tree__outline">
                          {headings.map((heading) => (
                            <li key={heading.id}>
                              <a
                                className={`xk-tree__head-link${activeId === heading.id ? ' is-active' : ''}`}
                                data-level={heading.level}
                                href={`#${heading.id}`}
                                onClick={(event) => {
                                  event.preventDefault();
                                  const target = document.getElementById(heading.id);
                                  if (target) {
                                    window.history.replaceState(null, '', `#${heading.id}`);
                                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                  if (onNavigate) {
                                    onNavigate();
                                  }
                                }}
                              >
                                {heading.text}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
    </nav>
  );
}
