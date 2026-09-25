import { registerScreen } from '../Phone.jsx';
import { hl } from './hl.js';
import '../screens.css';

/**
 * Unlock screen: meter back to wallet with no gas on the phone.
 *
 * The wallet signs an EIP-712 Withdraw(client, to, amount, nonce, deadline);
 * the kiosk posts it to gateway-api POST /escrow/withdraw, which checks the
 * signature and relays xKoinEscrow.withdrawWithSig. The destination is inside
 * the signature, so the kiosk cannot send the money anywhere else.
 *
 * Highlight keys:
 *   amount   the 40 KES amount field
 *   to       the destination, this phone's own wallet
 *   signed   the "what you sign" box
 *   gas      the "who pays" line
 *   unlock   the fingerprint button
 *
 * Static: it ignores `t`.
 */
export default function Unlock({ highlight = null }) {
  return (
    <div className="xk-app xk-app--unlock">
      <div className="xk-app-eyebrow">Unlock from meter</div>

      <div className="xk-app-stack">
        <div className="xk-app-label">Amount</div>
        <div className={`xk-app-box xk-app-amount${hl(highlight, 'amount')}`}>
          <span>40</span>
          <span className="xk-app-amount-unit">KES</span>
        </div>
        <div className="xk-app-row xk-app-note">
          <span>meter 142.60</span>
          <span>after 102.60</span>
        </div>
      </div>

      <div className="xk-app-stack">
        <div className="xk-app-label">To</div>
        <div className={`xk-app-box xk-app-field${hl(highlight, 'to')}`}>
          <span>My wallet 0x0405...CdDA</span>
          <span className="xk-app-field-action">signed</span>
        </div>
      </div>

      <div className={`xk-app-box xk-app-box--dashed xk-app-explain${hl(highlight, 'signed')}`}>
        <div className="xk-app-label">What you sign</div>
        <div>Unlock 40 KES from my meter to my wallet, once, within one hour. Nobody can change where it goes.</div>
      </div>

      <div className={`xk-app-box xk-app-summary${hl(highlight, 'gas')}`}>
        <div className="xk-app-row">
          <span className="xk-app-muted">Network fee</span>
          <span className="xk-app-mono">paid by the kiosk</span>
        </div>
        <div className="xk-app-row">
          <span className="xk-app-muted">You pay</span>
          <span className="xk-app-mono">0</span>
        </div>
      </div>

      <div className="xk-app-spacer" />

      <div className="xk-app-choices">
        <div className={`xk-app-btn xk-app-btn--primary${hl(highlight, 'unlock')}`}>Confirm with fingerprint</div>
        <div className="xk-app-foot">withdrawWithSig, relayed by gateway-api POST /escrow/withdraw.</div>
      </div>
    </div>
  );
}

registerScreen('unlock', Unlock);
