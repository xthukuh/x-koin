/*
 * Bytes per medium, from the discrete-event simulation. One scenario at a
 * time: the topology it ran on, a step chart per medium over the whole run,
 * the event log, and the summary the simulator asserted.
 */

import { useState } from 'react';

import {
  MEDIUM_LABEL,
  MEDIUM_TOKEN,
  SCENARIO_IDS,
  SRC,
  TRACE,
  bytes,
  num,
  rate,
  scenarioTotals,
  seconds,
} from './data.js';
import { JsonBlock } from './Proof.jsx';

const W = 1000;
const H = 84;

function StepChart({ series, color, label }) {
  const peak = Math.max(...series, 1);
  const stepX = W / series.length;
  let d = `M 0 ${H}`;
  series.forEach((value, index) => {
    const y = H - (value / peak) * (H - 8);
    d += ` L ${index * stepX} ${y} L ${(index + 1) * stepX} ${y}`;
  });
  d += ` L ${W} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={d} fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Topology({ scenario }) {
  const nodes = scenario.nodes;
  const gap = (1000 - 160) / Math.max(nodes.length - 1, 1);
  const pos = Object.fromEntries(nodes.map((node, index) => [node, 80 + index * gap]));
  const role = {
    client: 'pays per byte',
    gateway: 'serves, verifies receipts',
    satellite: 'relays, earns attribution',
  };
  return (
    <div className="xk-rp-figure">
      <svg viewBox="0 0 1000 220" role="img" aria-label={`Topology for ${scenario.title}`}>
        {scenario.links.map(([a, b, mediums]) =>
          mediums.map((medium, index) => {
            const offset = (index - (mediums.length - 1) / 2) * 26;
            return (
              <g key={`${a}-${b}-${medium}`}>
                <line
                  x1={pos[a] + 62}
                  y1={110 + offset}
                  x2={pos[b] - 62}
                  y2={110 + offset}
                  stroke={MEDIUM_TOKEN[medium]}
                  strokeWidth="3"
                />
                <text
                  x={(pos[a] + pos[b]) / 2}
                  y={104 + offset}
                  textAnchor="middle"
                  fontFamily="var(--xk-font-mono)"
                  fontSize="13"
                  fill="var(--xk-muted)"
                >
                  {MEDIUM_LABEL[medium] ?? medium}
                </text>
              </g>
            );
          }),
        )}
        {nodes.map((node) => (
          <g key={node}>
            <rect x={pos[node] - 62} y="76" width="124" height="68" fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="2" />
            <text x={pos[node]} y="106" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="17" fill="var(--xk-ink)">
              {node}
            </text>
            <text
              x={Math.min(Math.max(pos[node], 96), 904)}
              y="126"
              textAnchor="middle"
              fontFamily="var(--xk-font-mono)"
              fontSize="11.5"
              fill="var(--xk-faint)"
            >
              {role[node] ?? ''}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Mediums() {
  const [id, setId] = useState(SCENARIO_IDS[0]);
  const [view, setView] = useState('app');
  const scenario = TRACE.scenarios[id];
  const totals = scenarioTotals(scenario);
  const events = scenario.events;

  return (
    <section className="xk-section" id="mediums">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Simulation evidence</p>
        <h2>Bytes per medium</h2>
        <p className="xk-lede">
          Three scenarios from the discrete-event simulation. The chart is the simulator own bin
          series: application bytes delivered per bin, or wire bytes transmitted per bin, which is
          the same traffic with frame overhead and retransmissions included.
        </p>

        <div className="xk-rp-tabs" role="tablist" aria-label="Scenario">
          {SCENARIO_IDS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === id}
              className={`xk-btn xk-btn--small${key === id ? ' xk-rp-tab--on' : ''}`}
              onClick={() => setId(key)}
            >
              {TRACE.scenarios[key].title}
            </button>
          ))}
        </div>

        <Topology scenario={scenario} />

        <div className="xk-rp-controls">
          <span className="xk-note">
            {seconds(scenario.duration_s)} of simulated time, one bin every {scenario.bin_s} s
          </span>
          <span className="xk-rp-controls__btns">
            <button
              type="button"
              className={`xk-btn xk-btn--small${view === 'app' ? ' xk-rp-tab--on' : ''}`}
              onClick={() => setView('app')}
            >
              application bytes
            </button>
            <button
              type="button"
              className={`xk-btn xk-btn--small${view === 'wire' ? ' xk-rp-tab--on' : ''}`}
              onClick={() => setView('wire')}
            >
              wire bytes
            </button>
          </span>
        </div>

        <div className="xk-rp-mediums">
          {totals.map((row) => {
            const series = view === 'app' ? scenario.bins[row.medium] : scenario.tx_bins[row.medium];
            return (
              <div className="xk-rp-medium" key={row.medium}>
                <div className="xk-rp-medium__head">
                  <span className="xk-rp-swatch" style={{ background: MEDIUM_TOKEN[row.medium] }} />
                  <strong>{MEDIUM_LABEL[row.medium] ?? row.medium}</strong>
                  <span className="xk-note xk-mono">
                    {rate(row.model.bps)}, {row.model.mtu} B payload, loss {(row.model.loss * 100).toFixed(1)} percent
                  </span>
                  <span className="xk-rp-medium__total xk-mono">
                    {bytes(view === 'app' ? row.app : row.wire)}
                  </span>
                </div>
                <div className="xk-rp-medium__chart">
                  <StepChart
                    series={series ?? []}
                    color={MEDIUM_TOKEN[row.medium]}
                    label={`${row.medium} ${view} bytes per bin`}
                  />
                </div>
                <div className="xk-rp-medium__axis xk-note xk-mono">
                  <span>0 s</span>
                  <span>{seconds(scenario.duration_s)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="xk-rp-two">
          <div>
            <h3>Events</h3>
            <div className="xk-tablewrap xk-rp-scrolly">
              <table className="xk-table">
                <thead>
                  <tr>
                    <th>t</th>
                    <th>Event</th>
                    <th>Node</th>
                    <th>Session</th>
                    <th>Cumulative bytes</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr key={`${event[0]}-${index}`}>
                      <td className="xk-mono">{Number(event[0]).toFixed(3)} s</td>
                      <td className="xk-mono">{event[1]}</td>
                      <td className="xk-mono">{event[2] ?? '-'}</td>
                      <td className="xk-mono">{event[3] ?? '-'}</td>
                      <td className="xk-mono">{event[4] === undefined ? '-' : num(event[4])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3>Scenario result</h3>
            <JsonBlock value={scenario.summary} label={`trace.json scenarios.${id}.summary`} />
          </div>
        </div>

        <p className="xk-rp-source xk-note">
          <strong className="xk-mono">source</strong> {SRC.trace}, generated {TRACE.generated}.
          Medium models and scoring in {SRC.sim}; the scenario definitions in {SRC.runSim}.
        </p>
      </div>
    </section>
  );
}
