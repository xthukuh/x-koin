import BuildingCutaway from './BuildingCutaway.jsx';
import { MEDIUMS } from './data.js';

export default function Mediums() {
  return (
    <section className="xk-section" id="how">
      <div className="xk-wrap">
        <p className="xk-eyebrow">04 / the transport</p>
        <h2>Three mediums, one protocol.</h2>
        <p className="xk-lede">
          Every frame is medium-agnostic: the same 29-byte header, the same CRC, the same signatures.
          A sender picks whichever live medium has the best recent delivery record, so a medium going
          down is a routing decision, not an outage.
        </p>

        <figure className="xk-figure">
          <BuildingCutaway idPrefix="mediums" />
          <figcaption>
            Figure 1. One Node in the meter room, two Node-Satellites on the floors above, phones on
            Wi-Fi, and a LoRa hop to a Satellite on the neighbouring rooftop. Goodput figures from
            protocol/spec.md section 1.
          </figcaption>
        </figure>

        <div className="xk-legend">
          <span>
            <i style={{ background: 'var(--xk-plc)' }} /> HomePlug AV, bulk
          </span>
          <span>
            <i style={{ background: 'var(--xk-nbplc)' }} /> KQ-130F narrowband, receipts and control
          </span>
          <span>
            <i style={{ background: 'var(--xk-lora)' }} /> LoRa SX1262, discovery and survival
          </span>
        </div>

        <div className="xk-tablewrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Medium</th>
                <th scope="col">Model</th>
                <th scope="col">Goodput</th>
                <th scope="col">Frame payload</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {MEDIUMS.map((medium) => (
                <tr key={medium.name}>
                  <td>{medium.name}</td>
                  <td className="xk-mono">{medium.model}</td>
                  <td className="xk-mono">{medium.goodput}</td>
                  <td className="xk-mono">{medium.payload}</td>
                  <td>{medium.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          Selection is score based: goodput_ewma multiplied by (1 minus loss_ewma). Three consecutive
          delivery failures quarantine a medium for 2 seconds and the next-best one takes over. Grid
          failure therefore degrades the mesh to LoRa instead of killing it, which is section 6.
        </p>
      </div>
    </section>
  );
}
