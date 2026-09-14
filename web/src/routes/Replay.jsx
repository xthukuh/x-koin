/*
 * /replay. A microscope on the protocol: six journeys stage by stage with
 * every payload, signature check and on-chain record exposed as proof, the
 * chain and simulation evidence behind them, and the threat scenarios that
 * say what the system does when someone tries.
 *
 * No figure on this page is invented. Each one is read from web/src/proof,
 * from a contract, from the protocol reference implementation or from a
 * paper, and the panel that shows it names the file.
 */

import Authority from '../replay/Authority.jsx';
import Chain from '../replay/Chain.jsx';
import Journey from '../replay/Journey.jsx';
import Mediums from '../replay/Mediums.jsx';
import Threats from '../replay/Threats.jsx';
import { CHAIN, KIOSK, SRC, TRACE, num } from '../replay/data.js';
import { JOURNEYS, LAYERS, MEDIUMS } from '../replay/journeys.js';
import '../replay/replay.css';

const LAYER_ORDER = ['device', 'protocol', 'chain', 'fiat', 'kiosk'];

function Legend() {
  return (
    <>
      <h2 className="xk-rp-h3">Three layers, three mediums</h2>
      <div className="xk-rp-legend">
        {LAYER_ORDER.map((key) => (
          <div className="xk-rp-legend__item" key={key}>
            <span className="xk-rp-legend__key" style={{ color: LAYERS[key].color }}>
              <span className="xk-rp-swatch" style={{ background: LAYERS[key].color }} />
              {LAYERS[key].label}
            </span>
            <p className="xk-rp-legend__note">{LAYERS[key].note}</p>
          </div>
        ))}
      </div>
      <p className="xk-note" style={{ marginTop: '0.6rem' }}>
        Device, protocol and chain are the spine. The fiat and kiosk labels are the layer names
        kiosk.json uses for its own steps, and this page keeps them rather than flattening them.
      </p>
      <div className="xk-rp-legend">
        {MEDIUMS.map((medium) => (
          <div className="xk-rp-legend__item" key={medium.id}>
            <span className="xk-rp-legend__key" style={{ color: medium.color }}>
              <span className="xk-rp-swatch" style={{ background: medium.color }} />
              {medium.label}
            </span>
            <p className="xk-rp-legend__note">{medium.note}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Replay() {
  return (
    <>
      <section className="xk-section xk-rp-hero xk-hero-grid">
        <div className="xk-wrap">
          <p className="xk-eyebrow">Replay</p>
          <h1>Every claim, with the bytes that prove it.</h1>
          <p className="xk-lede">
            Six journeys from an empty chain to shillings on a phone, each one a stage at a time.
            Open any stage and you get what was actually sent: the payload, the key that signed it,
            the check that verified it, the contract call it became, and the file it came from. Then
            the attacks, and what the system does about them.
          </p>

          <dl className="xk-stats">
            <div className="xk-stat">
              <dt>{JOURNEYS.length}</dt>
              <dd>journeys, {JOURNEYS.reduce((sum, journey) => sum + journey.steps.length, 0)} stages</dd>
            </div>
            <div className="xk-stat">
              <dt>{CHAIN.txs.length}</dt>
              <dd>transactions in the proof run</dd>
              <dd className="xk-note">chain id {CHAIN.chain_id}</dd>
            </div>
            <div className="xk-stat">
              <dt>{num(CHAIN.txs.find((tx) => tx.fn === 'settleTicketBatch').gas_used)}</dt>
              <dd>gas to settle two channels at once</dd>
            </div>
            <div className="xk-stat">
              <dt>{Object.keys(TRACE.scenarios).length}</dt>
              <dd>simulated scenarios, frame by frame</dd>
            </div>
            <div className="xk-stat">
              <dt>{KIOSK.journeys.length}</dt>
              <dd>fiat journeys recorded by the gateway dry run</dd>
            </div>
            <div className="xk-stat">
              <dt>0 of 20,000</dt>
              <dd>garbage frames accepted by the codec</dd>
              <dd className="xk-note">protocol/run_sim.py s5_fuzz</dd>
            </div>
          </dl>

          <Legend />

          <ul className="xk-rp-toc">
            {JOURNEYS.map((journey) => (
              <li key={journey.id}>
                <a className="xk-btn xk-btn--small" href={`#${journey.id}`}>
                  {journey.title}
                </a>
              </li>
            ))}
            <li>
              <a className="xk-btn xk-btn--small" href="#money">
                On-chain evidence
              </a>
            </li>
            <li>
              <a className="xk-btn xk-btn--small" href="#mediums">
                Bytes per medium
              </a>
            </li>
            <li>
              <a className="xk-btn xk-btn--small" href="#threats">
                Threat scenarios
              </a>
            </li>
            <li>
              <a className="xk-btn xk-btn--small" href="#authority">
                Who decides
              </a>
            </li>
          </ul>

          <p className="xk-rp-source xk-note">
            <strong className="xk-mono">sources</strong> {SRC.chain} ({CHAIN.generated}),{' '}
            {SRC.kiosk} ({KIOSK.mode}), {SRC.trace} ({TRACE.generated}), plus the contracts in
            contracts/src, the reference implementation in protocol/xkp and the papers in
            docs/papers.
          </p>
        </div>
      </section>

      {JOURNEYS.map((journey, index) => (
        <Journey journey={journey} index={index} key={journey.id} />
      ))}

      <Chain />
      <Mediums />
      <Threats />
      <Authority />
    </>
  );
}
