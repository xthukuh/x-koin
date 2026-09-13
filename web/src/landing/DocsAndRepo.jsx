import { Link } from 'react-router-dom';

import { DOC_LINKS } from './data.js';

export default function DocsAndRepo() {
  return (
    <section className="xk-section" id="docs">
      <div className="xk-wrap">
        <p className="xk-eyebrow">13 / read the rest</p>
        <h2>Everything on this page comes from a file in the repository.</h2>
        <ul className="xk-linklist">
          {DOC_LINKS.map((link) => (
            <li key={link.href}>
              {link.internal ? (
                <Link to={link.href}>{link.label}</Link>
              ) : (
                <a href={link.href} rel="noreferrer noopener" target="_blank">
                  {link.label}
                </a>
              )}
              <p>{link.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
