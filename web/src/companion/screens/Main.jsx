import { registerScreen } from '../Phone.jsx';
import { hl } from './hl.js';
import '../screens.css';

/**
 * Main wallet screen, ported from ../wireframes/Main.dc.html.
 *
 * Highlight keys:
 *   address   the wallet address in the header
 *   meter     the network meter card, 142.60 KES (also answers to "balance")
 *   balance   same card
 *   wallet    the XKN wallet balance row, 20.00
 *   buy       the Buy action
 *   send      the Send action
 *   withdraw  the Withdraw action
 *   receive   the Receive action
 *   attach    the attached node card, KILI-2 (also answers to "node")
 *   node      same card
 *   recent    the recent activity list
 *   tabs      the bottom tab bar
 *
 * This screen has nothing to animate, so it ignores `t`.
 */
export default function Main({ highlight = null }) {
  return (
    <div className="xk-app xk-app--main">
      <div className="xk-app-head">
        <div className="xk-app-eyebrow">Wallet</div>
        <div className={`xk-app-mono xk-app-mini${hl(highlight, 'address')}`}>0x7a3f...c91e</div>
      </div>

      <div className={`xk-app-box xk-app-meter${hl(highlight, 'meter', 'balance')}`}>
        <div className="xk-app-label">Network meter (escrow deposit)</div>
        <div className="xk-app-figure">
          142.60 <span>KES</span>
        </div>
        <div className="xk-app-note">usable at any xKoin node</div>
      </div>

      <div className={`xk-app-box xk-app-box--dashed xk-app-wallet${hl(highlight, 'wallet')}`}>
        <span className="xk-app-muted">Wallet balance (XKN)</span>
        <span className="xk-app-mono">20.00</span>
      </div>

      <div className="xk-app-actions">
        <div className={`xk-app-action xk-app-action--primary${hl(highlight, 'buy')}`}>Buy</div>
        <div className={`xk-app-action${hl(highlight, 'send')}`}>Send</div>
        <div className={`xk-app-action${hl(highlight, 'withdraw')}`}>Withdraw</div>
        <div className={`xk-app-action${hl(highlight, 'receive')}`}>Receive</div>
      </div>

      <div className={`xk-app-box xk-app-node${hl(highlight, 'attach', 'node')}`}>
        <div className="xk-app-node-head">
          <div className="xk-app-strong">Attached: KILI-2 (Node-Satellite)</div>
          <div className="xk-app-dot" />
        </div>
        <div className="xk-app-mono xk-app-note">session 3.2 MB, receipt #51 signed, 0.16 KES so far</div>
        <div className="xk-app-note">Free LAN: chat, local files, sensors. Paid: internet.</div>
      </div>

      <div className={`xk-app-recent${hl(highlight, 'recent')}`}>
        <div className="xk-app-label">Recent</div>
        <div className="xk-app-recent-item">
          <span>Settled to KILI-2</span>
          <span className="xk-app-mono">-1.25</span>
        </div>
        <div className="xk-app-recent-item">
          <span>Bought via M-Pesa</span>
          <span className="xk-app-mono">+100.00</span>
        </div>
        <div className="xk-app-recent-item">
          <span>Sent to Amina</span>
          <span className="xk-app-mono">-50.00</span>
        </div>
      </div>

      <div className={`xk-app-tabs${hl(highlight, 'tabs')}`}>
        <div className="xk-app-tab--on">Wallet</div>
        <div>Network</div>
        <div>Chat</div>
        <div>Settings</div>
      </div>
    </div>
  );
}

registerScreen('main', Main);
