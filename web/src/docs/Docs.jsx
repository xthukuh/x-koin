import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { DOCS, FOLDERS, docsByFolder, findDoc } from '../lib/docs.js';

import DocsArticle from './DocsArticle.jsx';
import DocsHome from './DocsHome.jsx';
import DocsSidebar from './DocsSidebar.jsx';
import './docs.css';

const STORE = 'xk-docs-tree';
const NARROW = '(max-width: 899px)';

/** Which folders are expanded, remembered between visits. */
function readOpen() {
  try {
    const raw = window.localStorage.getItem(STORE);
    if (raw) {
      const value = JSON.parse(raw);
      if (Array.isArray(value)) {
        return value.filter((folder) => FOLDERS.includes(folder));
      }
    }
  } catch (cause) {
    console.warn('docs: could not read the saved tree state', cause);
  }
  return [...FOLDERS];
}

function writeOpen(folders) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(folders));
  } catch (cause) {
    console.warn('docs: could not save the tree state', cause);
  }
}

export default function Docs() {
  const params = useParams();
  const location = useLocation();
  const slug = params['*'] ?? '';
  const doc = slug ? findDoc(slug) : null;

  const groups = useMemo(() => docsByFolder(), []);
  const docTitles = useMemo(
    () => new Map(DOCS.map((entry) => [entry.slug, entry.label ? `${entry.label}. ${entry.title}` : entry.title])),
    [],
  );

  const [open, setOpen] = useState(readOpen);
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [drawer, setDrawer] = useState(false);

  // Moving to a document in another folder opens that folder, so the tree
  // always shows where the reader is. The folder the session started in is
  // left alone: whatever the reader last collapsed is what they meant.
  const lastFolder = useRef(doc ? doc.folder : null);
  useEffect(() => {
    if (!doc || lastFolder.current === doc.folder) {
      return;
    }
    lastFolder.current = doc.folder;
    setOpen((current) => (current.includes(doc.folder) ? current : [...current, doc.folder]));
  }, [doc]);

  useEffect(() => {
    writeOpen(open);
  }, [open]);

  // The outline is reported by the article itself and is replaced whenever the
  // article renders a different document. It is deliberately not cleared here:
  // a child effect runs before its parent's, so clearing on slug would wipe the
  // outline the article had just handed up.

  // A route change closes the drawer, and so does Escape or the scrim.
  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawer) {
      return undefined;
    }
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setDrawer(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  // Widening the window past the drawer breakpoint leaves the sidebar visible
  // anyway, so the drawer closes itself rather than covering it.
  useEffect(() => {
    const query = window.matchMedia(NARROW);
    const onChange = (event) => {
      if (!event.matches) {
        setDrawer(false);
      }
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggleFolder = useCallback((folder) => {
    setOpen((current) =>
      current.includes(folder) ? current.filter((name) => name !== folder) : [...current, folder],
    );
  }, []);

  const closeDrawer = useCallback(() => setDrawer(false), []);

  const tree = (inDrawer) => (
    <DocsSidebar
      groups={groups}
      currentSlug={slug}
      headings={headings}
      activeId={activeId}
      open={open}
      onToggle={toggleFolder}
      onNavigate={inDrawer ? closeDrawer : undefined}
    />
  );

  return (
    <div className="xk-docs">
      <aside className="xk-docs__aside">
        <div className="xk-docs__aside-inner">{tree(false)}</div>
      </aside>

      <div className="xk-docs__main">
        {doc ? (
          <DocsArticle doc={doc} docTitles={docTitles} onOutline={setHeadings} onActive={setActiveId} />
        ) : slug ? (
          <div className="xk-docs__article">
            <p className="xk-eyebrow">not found</p>
            <h1>No document at docs/{slug}.md</h1>
            <p className="xk-lede">
              The corpus is built from docs/papers, docs/potential and docs/x-koin-beta at build time.
              If the file is new, the page needs a rebuild.
            </p>
            <p>
              <Link className="xk-btn" to="/docs">
                All documents
              </Link>
            </p>
          </div>
        ) : (
          <DocsHome groups={groups} />
        )}
      </div>

      <button type="button" className="xk-docs__fab" onClick={() => setDrawer(true)}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M1 3h14M1 8h14M1 13h9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        Contents
      </button>

      {drawer ? (
        <div className="xk-docs__drawer" role="dialog" aria-modal="true" aria-label="Documents">
          <button type="button" className="xk-docs__scrim" onClick={closeDrawer} aria-label="Close" />
          <div className="xk-docs__panel">
            <div className="xk-docs__panel-head">
              <span className="xk-eyebrow" style={{ margin: 0 }}>
                contents
              </span>
              <button type="button" className="xk-btn xk-btn--small" onClick={closeDrawer}>
                Close
              </button>
            </div>
            {tree(true)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
