import { useLocation } from 'react-router-dom';

import { routeFor } from '../shell/nav.js';

/**
 * A page that exists in the navigation but whose content is still being
 * written in this session. It shows what the page will hold so a reviewer who
 * lands here knows the scope, and it renders on the shared theme so the frame
 * is already right when the content arrives.
 */
export default function Placeholder({ outline = [] }) {
  const { pathname } = useLocation();
  const route = routeFor(pathname);
  return (
    <div className="xk-wrap xk-wrap--narrow" style={{ paddingBlock: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
      <p className="xk-eyebrow">in progress</p>
      <h1>{route?.title ?? 'Page'}</h1>
      <p className="xk-lede">{route?.text}</p>
      {outline.length > 0 ? (
        <>
          <h3 style={{ marginTop: '2rem' }}>This page will hold</h3>
          <ul>
            {outline.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
