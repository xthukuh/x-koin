import { registerScreen } from '../Phone.jsx';
import { hl } from './hl.js';
import { Reveal, countUp, lerp, ms, stage } from '../../player/index.js';
import '../screens.css';

/**
 * Send XKN screen, ported from ../wireframes/Send.dc.html.
 *
 * Highlight keys:
 *   to        the recipient field, Amina
 *   qr        the scan-a-QR button beside it
 *   amount    the 50 KES amount field
 *   settles   the "how it settles" explainer
 *   send      the fingerprint button (also answers to "confirm")
 *   confirm   same button
 *
 * With `t` greater than zero the screen plays a short transfer: the recipient
 * lands, the amount counts up, the button presses at 2.5 s and the settlement
 * sheet arrives at 3.5 s. Every value is a pure function of `t`. With `t` zero
 * or undefined it renders the static wireframe.
 */
const TO_AT = ms(0.4);
const AMOUNT_AT = ms(0.9);
const AMOUNT_FOR = ms(0.8);
const PRESS_AT = ms(2.5);
const SHEET_AT = ms(3.5);

export default function Send({ highlight = null, t = 0 }) {
  const live = t > 0;
  const toIn = live ? stage(t, TO_AT, 380) : 1;
  const amount = live ? countUp(t, AMOUNT_AT, AMOUNT_FOR, 50) : '50';
  const press = live ? stage(t, PRESS_AT, 140) * (1 - stage(t, PRESS_AT + 180, 240)) : 0;

  return (
    <div className="xk-app xk-app--send">
      <div className="xk-app-eyebrow">Send XKN</div>

      <div className="xk-app-stack">
        <div className="xk-app-label">To</div>
        <div className="xk-app-to">
          <div className={`xk-app-box xk-app-to-field${hl(highlight, 'to')}`}>
            <span style={{ opacity: toIn }}>0x9b12...44af (Amina)</span>
          </div>
          <div className={`xk-app-box xk-app-qr${hl(highlight, 'qr')}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <path d="M14 14h3v3h-3zM19 14h2M19 19h2M14 19h3" />
            </svg>
          </div>
        </div>
        <div className="xk-app-mini">Scan their QR or pick from people you have chatted with on this LAN.</div>
      </div>

      <div className="xk-app-stack">
        <div className="xk-app-label">Amount</div>
        <div className={`xk-app-box xk-app-amount${hl(highlight, 'amount')}`}>
          <span>{amount}</span>
          <span className="xk-app-amount-unit">KES</span>
        </div>
        <div className="xk-app-row xk-app-note">
          <span>from the network meter (142.60)</span>
          <span>fee 0</span>
        </div>
      </div>

      <div className={`xk-app-box xk-app-box--dashed xk-app-explain${hl(highlight, 'settles')}`}>
        <div className="xk-app-label">How it settles</div>
        <div>
          You sign an authorisation with your fingerprint. The kiosk relays it and pays the gas. The escrow moves
          50 KES from your meter to Amina&apos;s. She can spend it at any node at once.
        </div>
      </div>

      <div className="xk-app-spacer" />

      <div className="xk-app-choices">
        <div
          className={`xk-app-btn xk-app-btn--primary${hl(highlight, 'send', 'confirm')}`}
          style={press > 0 ? { transform: `scale(${lerp(1, 0.97, press)})` } : undefined}
        >
          Confirm with fingerprint
        </div>
        <div className="xk-app-foot">
          transferDeposit, relayed by gateway-api POST /escrow/transfer. Lands in seconds when the node has backhaul;
          queued otherwise.
        </div>
      </div>

      {live ? (
        <>
          <Reveal t={t} at={SHEET_AT} from="fade" duration={280} className="xk-app-scrim" />
          <Reveal t={t} at={SHEET_AT} from="up" duration={420} className="xk-app-sheet">
            <div className="xk-app-sheet-title">
              <span className="xk-app-sheet-tick">OK</span>
              <span>Signed and relayed</span>
            </div>
            <div className="xk-app-sheet-line">
              <span>To Amina 0x9b12...44af</span>
              <span>50.00 KES</span>
            </div>
            <div className="xk-app-sheet-line">
              <span>Your meter now</span>
              <span>92.60 KES</span>
            </div>
            <div className="xk-app-foot">The kiosk paid the gas. Amina can spend it at any node at once.</div>
          </Reveal>
        </>
      ) : null}
    </div>
  );
}

registerScreen('send', Send);
