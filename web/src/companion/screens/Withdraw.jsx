import { registerScreen } from '../Phone.jsx';
import { hl } from './hl.js';
import '../screens.css';

/**
 * Withdraw to M-Pesa screen, ported from ../wireframes/Withdraw.dc.html.
 *
 * Highlight keys:
 *   amount    the 200 KES amount field
 *   short     the "short by 37.40" line under the amount
 *   payout    the M-Pesa number the payout goes to
 *   steps     the three signed steps
 *   charges   the payout charge summary
 *   withdraw  the Withdraw button, disabled until the amount fits
 *
 * This screen has nothing to animate, so it ignores `t`.
 */
export default function Withdraw({ highlight = null }) {
  return (
    <div className="xk-app xk-app--withdraw">
      <div className="xk-app-eyebrow">Withdraw to M-Pesa</div>

      <div className="xk-app-stack">
        <div className="xk-app-label">Amount</div>
        <div className={`xk-app-box xk-app-amount${hl(highlight, 'amount')}`}>
          <span>200</span>
          <span className="xk-app-amount-unit">KES</span>
        </div>
        <div className={`xk-app-row xk-app-note${hl(highlight, 'short')}`}>
          <span>available 142.60 meter + 20.00 wallet</span>
          <span className="xk-app-short">short by 37.40</span>
        </div>
      </div>

      <div className="xk-app-stack">
        <div className="xk-app-label">Pay out to</div>
        <div className={`xk-app-box xk-app-field${hl(highlight, 'payout')}`}>
          <span>0712 345 678</span>
          <span className="xk-app-field-action">M-Pesa</span>
        </div>
      </div>

      <div className={`xk-app-box xk-app-box--dashed xk-app-steps xk-app-steps--sm${hl(highlight, 'steps')}`}>
        <div className="xk-app-label">Steps, all signed by you</div>
        <div className="xk-app-step">
          <div className="xk-app-step-n">1</div>
          <div>Unlock from the meter to your wallet (unspent deposit only, the kiosk pays gas).</div>
        </div>
        <div className="xk-app-step">
          <div className="xk-app-step-n">2</div>
          <div>Transfer to the bridge with your number in the memo.</div>
        </div>
        <div className="xk-app-step">
          <div className="xk-app-step-n">3</div>
          <div>The bridge pays M-Pesa, then burns exactly what it paid.</div>
        </div>
      </div>

      <div className={`xk-app-box xk-app-summary${hl(highlight, 'charges')}`}>
        <div className="xk-app-row">
          <span className="xk-app-muted">Payout charge</span>
          <span className="xk-app-mono">[BANK FEE]</span>
        </div>
        <div className="xk-app-row">
          <span className="xk-app-muted">You receive</span>
          <span className="xk-app-mono">200.00 less charge</span>
        </div>
        <div className="xk-app-row">
          <span className="xk-app-muted">Usually lands in</span>
          <span className="xk-app-mono">under a minute</span>
        </div>
      </div>

      <div className="xk-app-spacer" />

      <div className="xk-app-choices">
        <div className={`xk-app-btn xk-app-btn--off${hl(highlight, 'withdraw')}`}>Withdraw 200 KES</div>
        <div className="xk-app-foot">
          Disabled until the amount fits. User off-ramp is MVP+1 (journey J6); the founder and operator path is
          built.
        </div>
      </div>
    </div>
  );
}

registerScreen('withdraw', Withdraw);
