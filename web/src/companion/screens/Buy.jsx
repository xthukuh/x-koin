import { registerScreen } from '../Phone.jsx';
import { hl } from './hl.js';
import { Reveal, countUp, lerp, ms, stage } from '../../player/index.js';
import '../screens.css';

/**
 * Buy XKN screen, ported from ../wireframes/Buy.dc.html.
 *
 * Highlight keys:
 *   amount    the 100 KES amount field
 *   presets   the 50 / 100 / 200 / 500 row
 *   method    the M-Pesa and Equitel choice
 *   phone     the number the PIN prompt goes to
 *   steps     the "what happens" explainer
 *   deposit   the deposit-into-the-meter option
 *   buy       the primary button (also answers to "confirm")
 *   confirm   same button
 *
 * With `t` greater than zero the screen plays a short purchase: the amount
 * counts up, the preset and the payment method select, the number appears, the
 * button presses at 2.5 s and the confirmation sheet arrives at 3.5 s. Every
 * value is a pure function of `t`, so a player can pause, scrub or replay it.
 * With `t` zero or undefined it renders the static wireframe.
 */
const AMOUNT_AT = ms(0.3);
const AMOUNT_FOR = ms(0.9);
const PRESET_AT = ms(1.2);
const METHOD_AT = ms(1.5);
const PHONE_AT = ms(1.8);
const DEPOSIT_AT = ms(2.1);
const PRESS_AT = ms(2.5);
const SHEET_AT = ms(3.5);

export default function Buy({ highlight = null, t = 0 }) {
  const live = t > 0;
  const amount = live ? countUp(t, AMOUNT_AT, AMOUNT_FOR, 100) : '100';
  const presetOn = !live || t >= PRESET_AT;
  const methodOn = !live || t >= METHOD_AT;
  const phoneIn = live ? stage(t, PHONE_AT, 350) : 1;
  const depositOn = !live || t >= DEPOSIT_AT;
  const press = live ? stage(t, PRESS_AT, 140) * (1 - stage(t, PRESS_AT + 180, 240)) : 0;

  return (
    <div className="xk-app xk-app--buy">
      <div className="xk-app-head">
        <div className="xk-app-eyebrow">Buy XKN</div>
        <div className="xk-app-note">1 XKN = 1 KES</div>
      </div>

      <div className="xk-app-stack">
        <div className="xk-app-label">Amount</div>
        <div className={`xk-app-box xk-app-amount${hl(highlight, 'amount')}`}>
          <span>{amount}</span>
          <span className="xk-app-amount-unit">KES</span>
        </div>
        <div className={`xk-app-grid xk-app-grid--4${hl(highlight, 'presets')}`}>
          <div className="xk-app-chip">50</div>
          <div className={`xk-app-chip${presetOn ? ' xk-app-chip--on' : ''}`}>100</div>
          <div className="xk-app-chip">200</div>
          <div className="xk-app-chip">500</div>
        </div>
      </div>

      <div className="xk-app-stack">
        <div className="xk-app-label">Pay with</div>
        <div className={`xk-app-grid xk-app-grid--2${hl(highlight, 'method')}`}>
          <div className={`xk-app-pay${methodOn ? ' xk-app-pay--on' : ''}`}>M-Pesa</div>
          <div className="xk-app-pay">Equitel</div>
        </div>
        <div className={`xk-app-box xk-app-field${hl(highlight, 'phone')}`}>
          <span style={{ opacity: phoneIn }}>0712 345 678</span>
          <span className="xk-app-field-action">change</span>
        </div>
      </div>

      <div className={`xk-app-box xk-app-box--dashed xk-app-steps${hl(highlight, 'steps')}`}>
        <div className="xk-app-label">What happens</div>
        <div className="xk-app-step">
          <div className="xk-app-step-n">1</div>
          <div>A PIN prompt reaches this phone. Enter your M-Pesa PIN.</div>
        </div>
        <div className="xk-app-step">
          <div className="xk-app-step-n">2</div>
          <div>The bank confirms; 100 XKN is minted to your address.</div>
        </div>
        <div className="xk-app-step">
          <div className="xk-app-step-n">3</div>
          <div>One tap moves it into the network meter. No gas, no ETH.</div>
        </div>
      </div>

      <div className={`xk-app-box xk-app-opt${hl(highlight, 'deposit')}`}>
        <div className={`xk-app-checkbox${depositOn ? ' xk-app-checkbox--on' : ''}`} />
        <div className="xk-app-check-text">Deposit into the network meter after minting</div>
      </div>

      <div className="xk-app-spacer" />

      <div
        className={`xk-app-btn xk-app-btn--primary${hl(highlight, 'buy', 'confirm')}`}
        style={press > 0 ? { transform: `scale(${lerp(1, 0.97, press)})` } : undefined}
      >
        Send PIN prompt for KES {amount}
      </div>
      <div className="xk-app-foot">Fee 0. The voucher is issued when the bank confirms.</div>

      {live ? (
        <>
          <Reveal t={t} at={SHEET_AT} from="fade" duration={280} className="xk-app-scrim" />
          <Reveal t={t} at={SHEET_AT} from="up" duration={420} className="xk-app-sheet">
            <div className="xk-app-sheet-title">
              <span className="xk-app-sheet-tick">OK</span>
              <span>Payment confirmed</span>
            </div>
            <div className="xk-app-sheet-line">
              <span>Minted to 0x7a3f...c91e</span>
              <span>100.00 XKN</span>
            </div>
            <div className="xk-app-sheet-line">
              <span>Network meter</span>
              <span>242.60 KES</span>
            </div>
            <div className="xk-app-foot">Receipt signed on this phone. No gas, no ETH.</div>
          </Reveal>
        </>
      ) : null}
    </div>
  );
}

registerScreen('buy', Buy);
