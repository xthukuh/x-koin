/*
 * Threat scenarios as cards: the attack, the payload, the Law that catches it,
 * what the system does, and where the evidence is. A card whose evidence does
 * not exist in the repository says so.
 */

import { useState } from 'react';

import { THREATS, VERDICTS } from './threats.js';
import { JsonBlock } from './Proof.jsx';

function ThreatCard({ threat }) {
  const [open, setOpen] = useState(true);
  const verdict = VERDICTS[threat.verdict];
  return (
    <article className="xk-rp-threat">
      <header className="xk-rp-threat__head">
        <h3>{threat.title}</h3>
        <span className={`xk-status xk-status--${verdict.tone}`}>{verdict.label}</span>
      </header>
      <p className="xk-rp-threat__attack">{threat.attack}</p>

      <dl className="xk-rp-dl">
        <div className="xk-rp-dl__row">
          <dt className="xk-mono">law</dt>
          <dd>{threat.law}</dd>
        </div>
        <div className="xk-rp-dl__row">
          <dt className="xk-mono">mechanism</dt>
          <dd>{threat.mechanism}</dd>
        </div>
        <div className="xk-rp-dl__row">
          <dt className="xk-mono">outcome</dt>
          <dd>{threat.response}</dd>
        </div>
      </dl>

      <details
        className="xk-rp-proof"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="xk-rp-proof__summary">
          <span className="xk-mono">what the attacker sends, and the evidence</span>
        </summary>
        <div className="xk-rp-proof__body">
          <JsonBlock value={threat.payload} label="attacker payload" />
          <h5 className="xk-rp-h5">Evidence</h5>
          <ul className="xk-rp-evidence">
            {threat.evidence.map((line) => (
              <li className="xk-mono" key={line}>
                {line}
              </li>
            ))}
          </ul>
          {threat.gap ? (
            <p className="xk-rp-gap">
              <strong className="xk-mono">gap</strong> {threat.gap}
            </p>
          ) : null}
        </div>
      </details>
    </article>
  );
}

export default function Threats() {
  return (
    <section className="xk-section xk-section--tinted" id="threats">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Threat actors</p>
        <h2>What happens when someone tries</h2>
        <p className="xk-lede">
          Twelve attempts, each answered by a mechanism with a name rather than a policy. The
          economic summary is one sentence: an attacker must break Ed25519 or secp256k1 to mint
          value, and everything cheaper earns exactly zero, because pay is per verified signed byte
          and never for presence.
        </p>
        <div className="xk-rp-threats">
          {THREATS.map((threat) => (
            <ThreatCard key={threat.id} threat={threat} />
          ))}
        </div>
      </div>
    </section>
  );
}
