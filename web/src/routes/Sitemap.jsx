import { Link } from 'react-router-dom';

import { NAV } from '../shell/nav.js';

/**
 * The human sitemap. Every route from shell/nav.js grouped by audience, with
 * the machine sitemap (/sitemap.xml, written at build time from the same list
 * by scripts/build-sitemap.mjs) linked beside it.
 */
export default function Sitemap() {
  const groups = new Map();
  for (const route of NAV) {
    const key = route.audience;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(route);
  }

  return (
    <div className="xk-wrap xk-wrap--narrow" style={{ paddingBlock: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
      <p className="xk-eyebrow">sitemap</p>
      <h1>Every page on this site</h1>
      <p className="xk-lede">
        Grouped by who each page is written for. The same list is published as{' '}
        <a href="/sitemap.xml">sitemap.xml</a> in the standard sitemaps.org format.
      </p>

      {[...groups.entries()].map(([audience, routes]) => (
        <section key={audience} style={{ marginTop: '2.5rem' }}>
          <h3>For {audience}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--xk-line)' }}>
            {routes.map((route) => (
              <li key={route.path} style={{ padding: '0.8rem 0', borderBottom: '1px solid var(--xk-line-soft)' }}>
                <Link className="xk-mono" to={route.path} style={{ fontWeight: 600 }}>
                  {route.path}
                </Link>
                <span style={{ marginLeft: '0.75rem', color: 'var(--xk-ink)' }}>{route.title}</span>
                <p className="xk-note" style={{ margin: '0.25rem 0 0' }}>
                  {route.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
