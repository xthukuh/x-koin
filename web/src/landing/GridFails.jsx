import { useEffect, useState } from 'react';

import BuildingCutaway from './BuildingCutaway.jsx';

/**
 * The one interactive control on the page. Cutting the mains greys the two power
 * line paths and lights the LoRa path, and the counter runs the real 2 second
 * quarantine window from protocol/spec.md section 1 before declaring LoRa the
 * carrier.
 */
export default function GridFails() {
  const [cut, setCut] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!cut) {
      setRemaining(0);
      return undefined;
    }
    setRemaining(2);
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cut]);

  let state;
  if (!cut) {
    state = 'All three mediums live. HomePlug is carrying the bulk plane.';
  } else if (remaining > 0) {
    state = `Three delivery failures. Power line mediums quarantined for ${remaining} s.`;
  } else {
    state = 'LoRa is carrying the session. Receipts keep accumulating.';
  }

  return (
    <section className="xk-section" id="grid">
      <div className="xk-wrap">
        <p className="xk-eyebrow">06 / when the grid fails</p>
        <h2>Cut the mains and the network degrades. It does not stop.</h2>
        <p className="xk-lede">
          Both power line mediums die with the grid. LoRa does not: the Satellite runs on a panel and
          a cell, and the Node keeps its radio alive on the same backup that keeps its meter alive.
        </p>

        <figure className="xk-figure">
          <BuildingCutaway cut={cut} idPrefix="grid" />
          <figcaption>
            Figure 2. The same building, with the mains cut. Three consecutive delivery failures
            quarantine a medium for 2 seconds and the next-best medium takes over.
          </figcaption>
        </figure>

        <div className="xk-cutbar">
          <button
            type="button"
            className={cut ? 'xk-btn' : 'xk-btn xk-btn--primary'}
            onClick={() => setCut((value) => !value)}
            aria-pressed={cut}
          >
            {cut ? 'Restore the mains' : 'Cut the mains'}
          </button>
          <span
            className={remaining > 0 ? 'xk-quarantine' : 'xk-quarantine xk-quarantine--clear'}
            aria-live="polite"
          >
            <b>{cut ? (remaining > 0 ? `quarantine ${remaining} s` : 'LoRa carrying') : 'grid up'}</b>
            {'  '}
            {state}
          </span>
        </div>

        <div className="xk-tablewrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Measured in the simulation run</th>
                <th scope="col">Value</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Failover to LoRa after the cut</td>
                <td className="xk-mono">0.8 s</td>
                <td className="xk-mono">scenario S2, protocol/out/trace.json</td>
              </tr>
              <tr>
                <td>Quarantine window per medium</td>
                <td className="xk-mono">2 s</td>
                <td className="xk-mono">protocol/spec.md s1</td>
              </tr>
              <tr>
                <td>HomePlug goodput before the cut</td>
                <td className="xk-mono">9.768 Mbps</td>
                <td className="xk-mono">scenario S1, measured not modelled</td>
              </tr>
              <tr>
                <td>Bytes already paid for and lost in the cut</td>
                <td className="xk-mono">0</td>
                <td className="xk-mono">cumulative counters, Law 5</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          Heartbeats over LoRa keep the session sequence numbers alive through the outage, so nothing
          already paid for is lost and nothing new is owed until a fresh receipt is signed.
        </p>
      </div>
    </section>
  );
}
