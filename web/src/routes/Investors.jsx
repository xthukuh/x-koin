import { Link } from 'react-router-dom';

import { INVESTOR_SCENES } from '../decks/investors/index.js';
import { ScenePlayer } from '../player/index.js';

/**
 * The investor page: the whole story as a scene player, in plain words, with
 * every figure carrying the file it came from. The deck lives in
 * src/decks/investors/ so this route stays a page and nothing else.
 */

const DETAIL = [
  { to: '/startup', label: 'Startup plan', text: 'The goals, the phases and the budget in shillings.' },
  {
    to: '/docs/papers/04-settlement-and-economics',
    label: 'Settlement and economics',
    text: 'The token, the bridge, the escrow and every unit-economics condition in full.',
  },
  { to: '/replay', label: 'Protocol replay', text: 'The proof runs opened up, payload by payload.' },
  { to: '/shop', label: 'Parts', text: 'The proof-of-concept kit, with a scouted listing per line.' },
];

export default function Investors() {
  return (
    <div className="xk-wrap xk-wrap--wide" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
      <p className="xk-eyebrow">for investors</p>
      <h1>What xKoin is, in twenty scenes</h1>
      <p className="xk-lede" style={{ marginBottom: '1.5rem', maxWidth: '68ch' }}>
        No jargon and no projections dressed as facts. Click the right of the picture or press the
        right arrow key to move on; a scene plays to its end and then waits for you. Space pauses,
        the left arrow replays the scene before, and C turns the spoken words underneath on and off.
      </p>

      <ScenePlayer scenes={INVESTOR_SCENES} title="Investor presentation" />

      <section style={{ marginTop: 'clamp(2rem, 4vw, 3rem)', borderTop: '1px solid var(--xk-line)', paddingTop: '1.5rem' }}>
        <p className="xk-eyebrow">read the detail</p>
        <div className="xk-cards" style={{ marginTop: '1rem' }}>
          {DETAIL.map((entry) => (
            <div className="xk-card" key={entry.to}>
              <h3 style={{ fontFamily: 'var(--xk-font-mono)', fontSize: '1.02rem', margin: '0 0 0.4rem' }}>
                <Link to={entry.to}>{entry.label}</Link>
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--xk-muted)' }}>{entry.text}</p>
            </div>
          ))}
        </div>
        <p className="xk-note" style={{ marginTop: '1rem' }}>
          xKoin is a proof of concept with a test suite, not a service anyone can buy. Three
          regulatory questions are open with counsel and nothing here is an offer.
        </p>
      </section>
    </div>
  );
}
