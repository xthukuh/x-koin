import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Footer from './Footer.jsx';
import Topbar from './Topbar.jsx';
import { routeFor } from './nav.js';
import './shell.css';

/**
 * The page frame every route renders inside: topbar, the route, footer. The
 * document title follows the route. Routes that need their own section links in
 * the topbar (the landing page) render `<Topbar extra={...} />` themselves and
 * are mounted outside this shell; see App.jsx.
 */
export default function Shell({ children = null }) {
  const location = useLocation();

  useEffect(() => {
    const route = routeFor(location.pathname);
    document.title = route && route.path !== '/' ? `${route.title} | xKoin` : 'xKoin';
  }, [location.pathname]);

  // A route change scrolls to the top unless the URL addresses a fragment.
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="xk-shell xk-page">
      <Topbar />
      <main className="xk-shell__main" id="top">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
