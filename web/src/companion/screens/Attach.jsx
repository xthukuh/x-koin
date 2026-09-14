import { registerScreen } from '../Phone.jsx';
import { hl } from './hl.js';
import '../screens.css';

/**
 * Network screen while attached to a node, ported from
 * ../wireframes/Attach.dc.html.
 *
 * Highlight keys:
 *   status   the "attached" state in the header
 *   attach   the KILI-2 node card (also answers to "node")
 *   node     same card
 *   session  this session's byte, receipt and owed figures
 *   free     the free-on-this-LAN row
 *   nearby   the nearby nodes list
 *   pause    the Pause paid traffic button
 *
 * This screen has nothing to animate, so it ignores `t`.
 */
export default function Attach({ highlight = null }) {
  return (
    <div className="xk-app xk-app--attach">
      <div className="xk-app-head">
        <div className="xk-app-eyebrow">Network</div>
        <div className={`xk-app-note xk-app-good${hl(highlight, 'status')}`}>attached</div>
      </div>

      <div className={`xk-app-box xk-app-node${hl(highlight, 'attach', 'node')}`}>
        <div className="xk-app-node-head">
          <div className="xk-app-node-name">KILI-2</div>
          <div className="xk-app-mono xk-app-mini">Node-Satellite, floor 3</div>
        </div>
        <div className="xk-app-facts">
          <div className="xk-app-fact">
            <div className="xk-app-muted">Medium</div>
            <div className="xk-app-mono">PLC 9.7 Mbps</div>
          </div>
          <div className="xk-app-fact">
            <div className="xk-app-muted">Backhaul</div>
            <div className="xk-app-mono">up, 41 ms</div>
          </div>
          <div className="xk-app-fact">
            <div className="xk-app-muted">Price</div>
            <div className="xk-app-mono">0.05 KES/MB</div>
          </div>
        </div>
        <div className="xk-app-note">Voucher accepted offline. Session limit 20 KES, 0.16 used.</div>
      </div>

      <div className="xk-app-stack">
        <div className="xk-app-label">This session</div>
        <div className={`xk-app-box xk-app-session${hl(highlight, 'session')}`}>
          <div className="xk-app-row">
            <span>bytes acked</span>
            <span>3,276,800</span>
          </div>
          <div className="xk-app-row">
            <span>receipts signed</span>
            <span>#51 (every 64 KB)</span>
          </div>
          <div className="xk-app-row">
            <span>owed this session</span>
            <span>0.16 KES</span>
          </div>
          <div className="xk-app-bar">
            <div className="xk-app-bar-fill" style={{ width: '1%' }} />
          </div>
        </div>
      </div>

      <div className="xk-app-stack">
        <div className="xk-app-label">Free on this LAN</div>
        <div className={`xk-app-grid xk-app-grid--3${hl(highlight, 'free')}`}>
          <div className="xk-app-free-item">Chat</div>
          <div className="xk-app-free-item">Files</div>
          <div className="xk-app-free-item">Sensors</div>
        </div>
      </div>

      <div className="xk-app-stack">
        <div className="xk-app-label">Nearby</div>
        <div className={hl(highlight, 'nearby').trim()}>
          <div className="xk-app-nearby-item">
            <span>KILI-1 (Node, meter room)</span>
            <span className="xk-app-mono xk-app-note">PLC</span>
          </div>
          <div className="xk-app-nearby-item">
            <span>RIDGE-7 (Satellite, solar)</span>
            <span className="xk-app-mono xk-app-note">LoRa -97 dBm</span>
          </div>
        </div>
      </div>

      <div className="xk-app-spacer" />
      <div className={`xk-app-btn xk-app-btn--snug${hl(highlight, 'pause')}`}>Pause paid traffic</div>
    </div>
  );
}

registerScreen('attach', Attach);
