import { Link } from 'react-router-dom';

import { FOOTER, INVENTOR, REPO_URL } from './nav.js';

/**
 * The shared footer: the one-line description, the copyright with the
 * inventor, and the sitemap link that is deliberately absent from the topbar.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="xk-footer">
      <div className="xk-wrap xk-footer__inner">
        <div className="xk-footer__about">
          <span className="xk-mono">xKoin</span>
          <span>
            Decentralized hybrid PLC and LoRa mesh with trust-minimized state-channel
            micro-settlement and M-Pesa or Equitel fiat bridging.
          </span>
        </div>
        <nav className="xk-footer__nav" aria-label="Footer">
          {FOOTER.map((route) => (
            <Link key={route.path} to={route.path}>
              {route.label}
            </Link>
          ))}
          <a href="/sitemap.xml">sitemap.xml</a>
          <a href={REPO_URL} rel="noreferrer noopener" target="_blank">
            GitHub
          </a>
        </nav>
        <p className="xk-footer__legal">
          &copy; {year}{' '}
          <a href={INVENTOR.url} rel="author noreferrer noopener" target="_blank">
            {INVENTOR.name}
          </a>
          . Invention disclosed in confidence; all rights reserved. Access to this site is by
          invitation and is logged.
        </p>
      </div>
    </footer>
  );
}
