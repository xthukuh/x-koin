import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { TOPBAR } from './nav.js';

/**
 * The shared topbar. Sticky, and it slides out of the way while the reader
 * scrolls down and back in the moment they scroll up, so a long page keeps the
 * full viewport and the menu is always one flick away. On narrow screens the
 * links move into a drawer.
 *
 * The brand mark always goes to `/`. A page may add its own section links
 * (the landing page's hash anchors, for example) through `extra`; they render
 * after the site links, separated by a rule.
 */
export default function Topbar({ extra = null }) {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const location = useLocation();

  useEffect(() => {
    lastY.current = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) {
        return;
      }
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (y < 80) {
          setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6) {
          setHidden(false);
        }
        lastY.current = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
    };
  }, []);

  // Route change closes the drawer and shows the bar.
  useEffect(() => {
    setOpen(false);
    setHidden(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className={`xk-topbar${hidden && !open ? ' xk-topbar--hidden' : ''}`}>
      <div className="xk-wrap xk-topbar__inner">
        <Link className="xk-brand" to="/" aria-label="xKoin home">
          <BrandMark />
          <span>xKoin</span>
        </Link>

        <nav className="xk-topnav" aria-label="Site">
          {TOPBAR.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) => (isActive ? 'xk-topnav__link is-active' : 'xk-topnav__link')}
            >
              {route.label}
            </NavLink>
          ))}
          {extra ? <span className="xk-topnav__rule" aria-hidden="true" /> : null}
          {extra}
        </nav>

        <button
          type="button"
          className="xk-topbar__toggle"
          aria-expanded={open}
          aria-controls="xk-drawer"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="xk-burger" data-open={open ? 'true' : 'false'}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <div
        className={`xk-drawer${open ? ' is-open' : ''}`}
        id="xk-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
      >
        <button type="button" className="xk-drawer__scrim" aria-label="Close menu" onClick={() => setOpen(false)} />
        <nav className="xk-drawer__panel" aria-label="Site pages">
          <p className="xk-eyebrow">Pages</p>
          {[{ path: '/', label: 'Home' }, ...TOPBAR].map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.path === '/'}
              className={({ isActive }) => (isActive ? 'xk-drawer__link is-active' : 'xk-drawer__link')}
            >
              {route.label}
            </NavLink>
          ))}
          {extra ? (
            <>
              <p className="xk-eyebrow" style={{ marginTop: '1.25rem' }}>
                On this page
              </p>
              <div className="xk-drawer__extra" onClick={() => setOpen(false)}>
                {extra}
              </div>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <svg className="xk-brand__mark" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6 L18 18 M18 6 L12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <circle cx="7" cy="17" r="1.6" fill="var(--xk-money)" />
    </svg>
  );
}
