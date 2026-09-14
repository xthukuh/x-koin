import { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { neighbours } from '../lib/docs.js';
import { renderMermaid } from '../lib/markdown.js';
import { AnimationFrame } from '../player/index.js';
import { REPO_URL } from '../shell/nav.js';

import { findExplainer } from './explainers/index.js';
import { renderDoc } from './render.js';

/**
 * One rendered paper.
 *
 * The markdown becomes a list of segments so an `xk-anim` block can be a real
 * React animation between two runs of prose rather than a picture of one. Every
 * other DOM job the article needs lives here too: mermaid, the heading anchors
 * that copy their own link, cross-references that navigate without a page load,
 * and the IntersectionObserver that tells the sidebar which section is in view.
 */
export default function DocsArticle({ doc, docTitles, onOutline, onActive }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { segments, headings } = useMemo(() => renderDoc(doc, docTitles), [doc, docTitles]);
  const { previous, next } = neighbours(doc.slug);

  useEffect(() => {
    onOutline(headings);
  }, [headings, onOutline]);

  // Mermaid draws after the HTML is in the document, and only when a diagram
  // is actually present; the loader is a no-op otherwise.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    renderMermaid(container).catch((cause) => console.error(cause));
  }, [segments]);

  // Arriving on a URL that carries a fragment: the heading does not exist
  // until the segments are in the document, so the shell cannot scroll to it
  // and the article does it here instead.
  useEffect(() => {
    const container = containerRef.current;
    const hash = window.location.hash.slice(1);
    if (!container || !hash) {
      return;
    }
    const id = decodeURIComponent(hash);
    const jump = () => {
      const target = container.querySelector(`#${CSS.escape(id)}`);
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    };
    jump();
    // Figures have no intrinsic size until they load, so the first jump can
    // land short. One more pass once the images have taken their space.
    const again = window.setTimeout(jump, 320);
    return () => window.clearTimeout(again);
  }, [segments]);

  // The live outline. The observer only supplies the trigger; the active
  // heading is the last one whose top has passed under the topbar, which is
  // what a reader means by "the section I am in".
  useEffect(() => {
    const container = containerRef.current;
    if (!container || headings.length === 0) {
      return undefined;
    }
    const elements = headings
      .map((heading) => container.querySelector(`#${CSS.escape(heading.id)}`))
      .filter(Boolean);
    if (elements.length === 0) {
      return undefined;
    }
    const topbar = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--xk-topbar-h'),
      10,
    );
    const line = (Number.isFinite(topbar) ? topbar : 56) + 24;

    const pick = () => {
      let current = elements[0];
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= line) {
          current = element;
        }
      }
      onActive(current.id);
    };

    const observer = new IntersectionObserver(pick, {
      rootMargin: `-${line}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    for (const element of elements) {
      observer.observe(element);
    }
    pick();
    return () => observer.disconnect();
  }, [headings, onActive]);

  // One delegated handler for three kinds of link: a heading anchor that
  // copies its own URL, an in-page jump, and a cross-reference to another
  // paper, which stays inside the app.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    const onClick = (event) => {
      const anchor = event.target.closest('a');
      if (!anchor || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }
      const copyId = anchor.getAttribute('data-anchor');
      if (copyId) {
        event.preventDefault();
        const url = `${window.location.origin}${window.location.pathname}#${copyId}`;
        try {
          navigator.clipboard.writeText(url).catch(() => {});
        } catch (cause) {
          console.warn('docs: clipboard unavailable', cause);
        }
        anchor.classList.add('is-copied');
        window.setTimeout(() => anchor.classList.remove('is-copied'), 1200);
        window.history.replaceState(null, '', `#${copyId}`);
        scrollToId(copyId, container);
        return;
      }
      const href = anchor.getAttribute('href') ?? '';
      if (href.startsWith('#')) {
        event.preventDefault();
        window.history.replaceState(null, '', href);
        scrollToId(href.slice(1), container);
        return;
      }
      if (href.startsWith('/')) {
        event.preventDefault();
        navigate(href);
      }
    };
    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [navigate, segments]);

  const source = `${REPO_URL}/blob/main/${doc.sourcePath}`;

  return (
    <article className="xk-docs__article xk-markdown" ref={containerRef}>
      <header className="xk-docs__header">
        {doc.label ? <p className="xk-eyebrow">{`${doc.folder} / ${doc.label}`}</p> : null}
        <h1>{doc.title}</h1>
        <p className="xk-docs__meta xk-mono">
          <span>{doc.minutes} min read</span>
          <span aria-hidden="true">/</span>
          <span>{doc.words.toLocaleString('en-KE')} words</span>
          <span aria-hidden="true">/</span>
          <a href={source} target="_blank" rel="noreferrer">
            {doc.sourcePath}
          </a>
        </p>
      </header>

      {segments.map((segment, index) => {
        if (segment.kind === 'anim') {
          const explainer = findExplainer(segment.name);
          if (!explainer) {
            return null;
          }
          const Scene = explainer.Scene;
          return (
            <AnimationFrame
              key={`anim-${segment.name}-${index}`}
              title={explainer.title}
              duration={explainer.duration}
              caption={explainer.caption}
            >
              {({ t }) => <Scene t={t} />}
            </AnimationFrame>
          );
        }
        return (
          <div
            key={`html-${index}`}
            className="xk-docs__run"
            // The corpus is this repository's own markdown, rendered as
            // authored, exactly as the viewer has always done.
            dangerouslySetInnerHTML={{ __html: segment.html }}
          />
        );
      })}

      <nav className="xk-docs__ends" aria-label="Nearby documents">
        {previous ? (
          <Link className="xk-docs__end" to={`/docs/${previous.slug}`} rel="prev">
            <span className="xk-docs__end-dir xk-mono">previous</span>
            <span className="xk-docs__end-title">
              {previous.label ? <span className="xk-mono">{previous.label}</span> : null} {previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="xk-docs__end xk-docs__end--next" to={`/docs/${next.slug}`} rel="next">
            <span className="xk-docs__end-dir xk-mono">next</span>
            <span className="xk-docs__end-title">
              {next.label ? <span className="xk-mono">{next.label}</span> : null} {next.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}

/** Scroll a heading under the sticky topbar rather than behind it. */
function scrollToId(id, container) {
  const target = container.querySelector(`#${CSS.escape(id)}`);
  if (!target) {
    return;
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
