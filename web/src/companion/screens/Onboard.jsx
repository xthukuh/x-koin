import { registerScreen } from '../Phone.jsx';
import { hl } from './hl.js';
import '../screens.css';

/**
 * First run screen, ported from ../wireframes/Onboard.dc.html.
 *
 * Highlight keys:
 *   seed     the twelve word grid
 *   confirm  the "I wrote them down" acknowledgement
 *   create   the Create wallet button
 *   restore  the Restore from twelve words button
 *
 * This screen has nothing to animate, so it ignores `t`.
 */
const WORDS = [
  'river',
  'solar',
  'ticket',
  'socket',
  'valley',
  'meter',
  'signal',
  'harvest',
  'wire',
  'coin',
  'relay',
  'dawn',
];

export default function Onboard({ highlight = null }) {
  return (
    <div className="xk-app xk-app--onboard">
      <div className="xk-app-eyebrow">First run</div>
      <div className="xk-app-title">One seed. Your identity on every node.</div>
      <div className="xk-app-lede">
        The app derives your wallet address and your mesh key from twelve words kept in the phone&apos;s secure
        keystore. Write them down once.
      </div>

      <div className={`xk-app-box xk-app-seed${hl(highlight, 'seed')}`}>
        {WORDS.map((word, i) => (
          <div className="xk-app-seed-word" key={word}>
            {i + 1} {word}
          </div>
        ))}
      </div>

      <div className={`xk-app-box xk-app-box--dashed xk-app-check${hl(highlight, 'confirm')}`}>
        <div className="xk-app-checkbox" />
        <div className="xk-app-check-text">
          I wrote the twelve words down and I know they cannot be recovered by anyone else.
        </div>
      </div>

      <div className="xk-app-spacer" />

      <div className="xk-app-choices">
        <div className={`xk-app-btn xk-app-btn--primary${hl(highlight, 'create')}`}>Create wallet</div>
        <div className={`xk-app-btn${hl(highlight, 'restore')}`}>Restore from twelve words</div>
      </div>
      <div className="xk-app-foot">Fingerprint or PIN protects signing from then on.</div>
    </div>
  );
}

registerScreen('onboard', Onboard);
