import { Link } from 'react-router-dom';

import { fmtKes, usdToKes } from '../lib/money.js';
import CostChart from '../manufacturing/CostChart.jsx';
import MergeAnimation from '../manufacturing/MergeAnimation.jsx';
import {
  BOARD_LANDED_KES,
  BOARD_NRE_KES,
  BOARD_PATH,
  BOARD_UNIT_KES,
  CERTIFICATION,
  CROSSOVER,
  FACTORY_OPTIONS,
  FEASIBILITY,
  HEADER,
  IN_HOUSE,
  KIT_PATH,
  KIT_UNIT_KES,
  LINKS,
  MERGE,
  PHASES,
  RECOMMENDATION,
  TRADEOFFS,
  VOLUMES,
} from '../manufacturing/data.js';
import '../manufacturing/manufacturing.css';

const PICK = 'shenzhen';

function Basis({ children }) {
  return <span className="xk-mfg__basis">Basis: {children}</span>;
}

function certCost(row) {
  if (Number.isFinite(row.costKes)) {
    return fmtKes(row.costKes);
  }
  if (row.costUsd === null) {
    return 'unpriced';
  }
  if (row.costUsd === 0) {
    return 'no fee';
  }
  return `${fmtKes(usdToKes(row.costUsd))} (USD ${row.costUsd.toLocaleString('en-US')})`;
}

export default function Manufacturing() {
  return (
    <div className="xk-page xk-mfg">
      <header className="xk-hero-grid" style={{ paddingBlock: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
        <div className="xk-wrap">
          <p className="xk-eyebrow">{HEADER.eyebrow}</p>
          <h1>{HEADER.title}</h1>
          <p className="xk-lede">{HEADER.lede}</p>
          <p className="xk-mfg__rates">{HEADER.rates}</p>
          <dl className="xk-stats">
            <div className="xk-stat">
              <dt>{fmtKes(KIT_PATH.lines[0].values[0])}</dt>
              <dd>of modules in one Node today</dd>
              <dd className="xk-note">Verified checkout, 2026-09-14</dd>
            </div>
            <div className="xk-stat">
              <dt>{fmtKes(usdToKes(50.17))}</dt>
              <dd>one merged Node, ex-works, at 1,000 units</dd>
              <dd className="xk-note">USD 50.17, estimate from the beta cost model</dd>
            </div>
            <div className="xk-stat">
              <dt>{CROSSOVER.rounded.toLocaleString('en-US')}</dt>
              <dd>units, roughly, where the board path becomes cheaper</dd>
              <dd className="xk-note">Solved from the table below, not asserted</dd>
            </div>
            <div className="xk-stat">
              <dt>7 to 14</dt>
              <dd>weeks from file package to a working board</dd>
              <dd className="xk-note">Beta paper 03 section 4, conditional schedule</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ------------------------------------------------ from kit to board */}
      <section className="xk-section" id="merge">
        <div className="xk-wrap">
          <p className="xk-eyebrow">the picture</p>
          <h2>From kit to board</h2>
          <p>
            A Node on the bench is five bought modules and a plug-in HomePlug adapter, joined by twelve hand-made
            connections. The merged board puts the silicon that those modules carry onto one four-layer outline, and
            leaves three things outside it for reasons that are not about cost.
          </p>
          <MergeAnimation />
          <ul className="xk-mfg__why">
            {MERGE.offBoard.map((block) => (
              <li key={block.id}>
                <strong>{block.label}</strong>
                <span>{block.why}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------- feasibility */}
      <section className="xk-section xk-section--tinted" id="feasibility">
        <div className="xk-wrap">
          <p className="xk-eyebrow">revision 1, proposed</p>
          <h2>What merges, and what stays a module</h2>
          <p>{FEASIBILITY.intro}</p>
          <div className="xk-tablewrap">
            <table className="xk-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Merges onto the board</th>
                  <th>Stays a module</th>
                  <th>Why it stays</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {FEASIBILITY.rows.map((row) => (
                  <tr key={row.device}>
                    <th scope="row" style={{ whiteSpace: 'normal' }}>
                      {row.device}
                    </th>
                    <td>{row.merges}</td>
                    <td>{row.stays}</td>
                    <td>{row.why}</td>
                    <td className="xk-mono">{row.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="xk-note" style={{ marginTop: '1rem' }}>
            {FEASIBILITY.note}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ trade-offs */}
      <section className="xk-section" id="tradeoffs">
        <div className="xk-wrap">
          <p className="xk-eyebrow">the comparison</p>
          <h2>Trade-offs and gains</h2>
          <p>
            Both columns below cost one xKoin-Node delivered in Nairobi and ready to switch on. The kit path is priced
            from a verified checkout; the board path is priced from the beta cost model and carries its one-off
            engineering and certification spend divided across the run, because a board that has not been designed and
            approved cannot be bought.
          </p>

          <div className="xk-mfg-compare">
            <div className="xk-mfg-compare__col">
              <h3 className="xk-mfg-compare__name">{KIT_PATH.name}</h3>
              <p className="xk-mfg-compare__sub">{KIT_PATH.sub}</p>
              {VOLUMES.map((volume, i) => (
                <div className="xk-mfg-compare__figure" key={volume}>
                  <span>{volume.toLocaleString('en-US')} units</span>
                  <span className={KIT_UNIT_KES[i] < BOARD_UNIT_KES[i] ? 'xk-mfg-compare__win' : undefined}>
                    {fmtKes(KIT_UNIT_KES[i])}
                  </span>
                </div>
              ))}
            </div>
            <div className="xk-mfg-compare__col">
              <h3 className="xk-mfg-compare__name">{BOARD_PATH.name}</h3>
              <p className="xk-mfg-compare__sub">{BOARD_PATH.sub}</p>
              {VOLUMES.map((volume, i) => (
                <div className="xk-mfg-compare__figure" key={volume}>
                  <span>{volume.toLocaleString('en-US')} units</span>
                  <span className={BOARD_UNIT_KES[i] < KIT_UNIT_KES[i] ? 'xk-mfg-compare__win' : undefined}>
                    {fmtKes(BOARD_UNIT_KES[i])}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="xk-tablewrap">
            <table className="xk-table">
              <thead>
                <tr>
                  <th>Line, per Node</th>
                  {VOLUMES.map((volume) => (
                    <th key={volume} style={{ textAlign: 'right' }}>
                      {volume.toLocaleString('en-US')}
                    </th>
                  ))}
                  <th>Basis</th>
                </tr>
              </thead>
              <tbody>
                {KIT_PATH.lines.map((line) => (
                  <tr key={line.label}>
                    <th scope="row" style={{ whiteSpace: 'normal' }}>
                      {line.label}
                    </th>
                    {line.values.map((value, i) => (
                      <td key={VOLUMES[i]} className="xk-mono" style={{ textAlign: 'right' }}>
                        {fmtKes(value)}
                      </td>
                    ))}
                    <td>{line.basis}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Kit of modules, total</th>
                  {KIT_UNIT_KES.map((value, i) => (
                    <td key={VOLUMES[i]} className="xk-mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {fmtKes(value)}
                    </td>
                  ))}
                  <td>The two lines above, added.</td>
                </tr>
                <tr>
                  <th scope="row" style={{ whiteSpace: 'normal' }}>
                    Merged board, ex-works factory cost
                  </th>
                  {BOARD_PATH.factoryUsd.map((value, i) => (
                    <td key={VOLUMES[i]} className="xk-mono" style={{ textAlign: 'right' }}>
                      {fmtKes(usdToKes(value))}
                    </td>
                  ))}
                  <td>{BOARD_PATH.factoryBasis}</td>
                </tr>
                <tr>
                  <th scope="row" style={{ whiteSpace: 'normal' }}>
                    Merged board, landed Nairobi
                  </th>
                  {BOARD_LANDED_KES.map((value, i) => (
                    <td key={VOLUMES[i]} className="xk-mono" style={{ textAlign: 'right' }}>
                      {fmtKes(value)}
                    </td>
                  ))}
                  <td>{BOARD_PATH.landedBasis}</td>
                </tr>
                <tr>
                  <th scope="row" style={{ whiteSpace: 'normal' }}>
                    One-off engineering, carried per unit
                  </th>
                  {BOARD_NRE_KES.map((value, i) => (
                    <td key={VOLUMES[i]} className="xk-mono" style={{ textAlign: 'right' }}>
                      {fmtKes(value)}
                    </td>
                  ))}
                  <td>{BOARD_PATH.nreBasis}</td>
                </tr>
                <tr>
                  <th scope="row">Merged board, total</th>
                  {BOARD_UNIT_KES.map((value, i) => (
                    <td key={VOLUMES[i]} className="xk-mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {fmtKes(value)}
                    </td>
                  ))}
                  <td>Landed cost plus the one-off spend carried.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CostChart />

          <p style={{ marginTop: '1.5rem' }}>
            The crossing sits at about {CROSSOVER.rounded.toLocaleString('en-US')} units, where both paths cost roughly{' '}
            {fmtKes(CROSSOVER.kesAtCrossing)} a Node.
            <Basis>{CROSSOVER.basis}</Basis>
          </p>

          <div className="xk-tablewrap">
            <table className="xk-table">
              <thead>
                <tr>
                  <th>What changes</th>
                  <th>Kit of modules</th>
                  <th>Merged board</th>
                  <th>Basis</th>
                </tr>
              </thead>
              <tbody>
                {TRADEOFFS.map((row) => (
                  <tr key={row.attribute}>
                    <th scope="row" style={{ whiteSpace: 'normal' }}>
                      {row.attribute}
                    </th>
                    <td>{row.kit}</td>
                    <td>{row.board}</td>
                    <td className="xk-note">{row.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ factory options */}
      <section className="xk-section xk-section--tinted" id="factory">
        <div className="xk-wrap">
          <p className="xk-eyebrow">who builds it</p>
          <h2>Three factories, one of them ours</h2>
          <p>
            The choice is not only price. It is who holds the file set, who holds the schedule and who holds the yield
            curve while it is being learned. Capital and per-unit figures below are estimates and are marked as such;
            the repository holds no quotation from any factory.
          </p>

          <div className="xk-mfg-options">
            {FACTORY_OPTIONS.map((option) => (
              <article key={option.key} className={`xk-mfg-option${option.key === PICK ? ' is-pick' : ''}`}>
                <span className="xk-mfg-option__tag">
                  {option.tag}
                  {option.key === PICK ? ' - recommended' : ''}
                </span>
                <h3>{option.name}</h3>
                <p className="xk-mfg-option__summary">{option.summary}</p>
                <div className="xk-mfg-option__row">
                  <b>Capital up front</b>
                  {option.capex}
                  <Basis>{option.capexBasis}</Basis>
                </div>
                <div className="xk-mfg-option__row">
                  <b>Per unit</b>
                  {option.opexLabel}
                  <Basis>{option.opexBasis}</Basis>
                </div>
                <div className="xk-mfg-option__row">
                  <b>Lead time</b>
                  {option.lead}
                </div>
                <div className="xk-mfg-option__row">
                  <b>Quality control</b>
                  {option.quality}
                </div>
                <div className="xk-mfg-option__row">
                  <b>
                    IP exposure <span className={`xk-mfg-risk xk-mfg-risk--${option.ipRisk}`}>{option.ipRisk}</span>
                  </b>
                  {option.ip}
                  <span className="xk-mfg__basis">{option.note}</span>
                </div>
              </article>
            ))}
          </div>

          <h3 style={{ marginTop: '2.5rem' }}>{IN_HOUSE.title}</h3>
          <div className="xk-cards">
            {IN_HOUSE.items.map((entry) => (
              <div className="xk-card" key={entry.name}>
                <h3>{entry.name}</h3>
                <p className="xk-note">{entry.detail}</p>
              </div>
            ))}
          </div>
          <p className="xk-note" style={{ marginTop: '1rem' }}>
            {IN_HOUSE.basis}
          </p>

          <h3 style={{ marginTop: '2.5rem' }}>The recommendation</h3>
          <p>
            <strong>{RECOMMENDATION.pick}</strong>
          </p>
          <ol>
            {RECOMMENDATION.reasons.map((reason) => (
              <li key={reason} style={{ marginBottom: '0.5rem', maxWidth: '68ch' }}>
                {reason}
              </li>
            ))}
          </ol>
          <p>{RECOMMENDATION.guard}</p>
        </div>
      </section>

      {/* ------------------------------------------------ certification */}
      <section className="xk-section" id="certification">
        <div className="xk-wrap">
          <p className="xk-eyebrow">before it can be sold</p>
          <h2>Certification and safety</h2>
          <p>{CERTIFICATION.intro}</p>
          <div className="xk-tablewrap">
            <table className="xk-table">
              <thead>
                <tr>
                  <th>Approval</th>
                  <th>What it is</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                  <th>Time</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {CERTIFICATION.rows.map((row) => (
                  <tr key={row.item}>
                    <th scope="row" style={{ whiteSpace: 'normal' }}>
                      {row.item}
                    </th>
                    <td>{row.what}</td>
                    <td className="xk-mono" style={{ textAlign: 'right' }}>
                      {certCost(row)}
                      <span className="xk-mfg__basis">{row.costNote}</span>
                    </td>
                    <td>{row.time}</td>
                    <td className="xk-note">{row.cite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="xk-note" style={{ marginTop: '1rem' }}>
            One decision moves this whole table. The firmware currently drives the radio at +22 dBm, about 158 mW, which
            is roughly six times the 25 mW e.r.p. ceiling of the 868.0 to 868.6 MHz sub-band, so the exemption route is
            not established as configured. Capping the power, implementing listen before talk with adaptive frequency
            agility, or moving bulk traffic to 869.4 to 869.65 MHz are all firmware settings rather than hardware
            limits, and the choice belongs to counsel and to Martin. Paper 11 section 2.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ phases */}
      <section className="xk-section xk-section--tinted" id="plan">
        <div className="xk-wrap">
          <p className="xk-eyebrow">the order of work</p>
          <h2>Four revisions, each with an exit</h2>
          <p>
            A revision does not start because a date arrived. It starts because the previous one met its exit condition,
            and every condition below is taken from the roadmap paper so that a reasonable person can tell whether it
            was met.
          </p>
          <div className="xk-mfg-phases">
            {PHASES.map((phase) => (
              <article className="xk-mfg-phase" key={phase.key}>
                <div className="xk-mfg-phase__head">
                  <span className="xk-mfg-phase__tag">{phase.tag}</span>
                  <span className={`xk-status xk-status--${phase.status}`}>
                    {phase.status === 'progress' ? 'in progress' : 'planned'}
                  </span>
                </div>
                <h3>{phase.name}</h3>
                <p className="xk-note" style={{ margin: 0 }}>
                  {phase.when} | {phase.scale}
                </p>
                <p className="xk-mfg-phase__cost">{phase.cost}</p>
                <span className="xk-mfg__basis">{phase.costBasis}</span>
                <p className="xk-mfg-phase__exit">
                  <strong>Exit. </strong>
                  {phase.exit}
                </p>
                <span className="xk-mfg__basis">{phase.exitCite}</span>
              </article>
            ))}
          </div>

          <div className="xk-mfg-links">
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to}>
                <strong>{link.label}</strong>
                <span>{link.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
