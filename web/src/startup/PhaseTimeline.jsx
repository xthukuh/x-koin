import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Status } from './bits.jsx';
import { PHASES, fmtRange, phaseBudget } from './data.js';

function duration(phase) {
  if (!phase.months) {
    return phase.status === 'done' ? 'complete' : 'not scoped';
  }
  return `${phase.months[0]} to ${phase.months[1]} months`;
}

/**
 * Nine phases on one rail. The rail scrolls inside its own box on a narrow
 * screen rather than pushing the page sideways, and clicking a phase opens its
 * entry condition, its exit condition, the risk that sends it backwards and its
 * budget underneath. The dates are a plan and the panel says so.
 */
export default function PhaseTimeline() {
  const [open, setOpen] = useState('poc-hardware');
  const phase = PHASES.find((row) => row.key === open) ?? PHASES[0];
  const budget = phaseBudget(phase);

  return (
    <section className="xk-section" id="roadmap">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Phase roadmap</p>
        <h2>Nine phases, each with a condition that opens it and one that closes it</h2>
        <p>
          A phase does not start because a date arrived. It starts because the previous phase's exit
          condition was met, and the exit conditions are written so that a reasonable person can tell
          whether they were met. Pick a phase to see both, the money, and the thing that would send it
          backwards.
        </p>

        <div className="xk-su-rail">
          <div className="xk-su-rail-inner" role="tablist" aria-label="Phases">
            {PHASES.map((row) => {
              const rowBudget = phaseBudget(row);
              return (
                <button
                  aria-selected={row.key === open}
                  className={`xk-su-tick${row.key === open ? ' is-open' : ''}`}
                  key={row.key}
                  onClick={() => setOpen(row.key)}
                  role="tab"
                  type="button"
                >
                  <span className="xk-su-tick-n">Phase {row.n}</span>
                  <span className={`xk-su-bead is-${row.status}`} />
                  <span className="xk-su-tick-name">{row.short}</span>
                  <span className="xk-su-tick-meta">
                    <Status status={row.status} />
                    <br />
                    {row.plan}
                    <br />
                    {rowBudget.high > 0 ? fmtRange(rowBudget.low, rowBudget.high, { short: true }) : 'no priced lines'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="xk-su-panel">
          <div className="xk-su-panel-head">
            <h3>
              Phase {phase.n}. {phase.name}
            </h3>
            <span className="xk-mono xk-note">
              {phase.paper} | {phase.plan} | {duration(phase)} |{' '}
              {budget.high > 0 ? fmtRange(budget.low, budget.high) : 'no priced lines'}
              {budget.unpricedCount > 0
                ? ` | ${budget.unpricedCount} ${budget.unpricedCount === 1 ? 'line' : 'lines'} not priced`
                : ''}
            </span>
          </div>

          <p>{phase.note}</p>

          {phase.blockedOn ? (
            <p className="xk-note">
              <strong>Waiting on:</strong> {phase.blockedOn}
            </p>
          ) : null}
          {phase.paperNote ? <p className="xk-note">{phase.paperNote}</p> : null}

          <dl className="xk-su-crit">
            <div>
              <dt>Entry</dt>
              <dd>{phase.entry}</dd>
            </div>
            <div>
              <dt>Exit</dt>
              <dd>{phase.exit}</dd>
            </div>
            <div>
              <dt>What sends it backwards</dt>
              <dd className="is-risk">{phase.backwards}</dd>
            </div>
          </dl>
        </div>

        {/* On paper there is nothing to click, so the leave-behind prints all
            nine phases in full rather than whichever one happened to be open. */}
        <div className="xk-su-print-only">
          {PHASES.map((row) => {
            const rowBudget = phaseBudget(row);
            return (
              <div className="xk-su-printphase" key={row.key}>
                <h3>
                  Phase {row.n}. {row.name}
                </h3>
                <p className="xk-mono xk-note">
                  {row.status === 'progress' ? 'in progress' : row.status} | {row.paper} | {row.plan}{' '}
                  | {duration(row)} |{' '}
                  {rowBudget.high > 0 ? fmtRange(rowBudget.low, rowBudget.high) : 'no priced lines'}
                </p>
                <p>
                  <strong>Entry.</strong> {row.entry}
                </p>
                <p>
                  <strong>Exit.</strong> {row.exit}
                </p>
                <p>
                  <strong>What sends it backwards.</strong> {row.backwards}
                </p>
                {row.blockedOn ? (
                  <p>
                    <strong>Waiting on.</strong> {row.blockedOn}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="xk-su-plan-note">
          The dated column is a plan and not a commitment. It is what the work would look like if
          nothing went wrong, and something will. No quarter has been committed to anyone. The
          full text of each condition is in{' '}
          <Link to="/docs/papers/13-roadmap">paper 13</Link>, which also states why the regulatory
          gates are gates rather than a phase that waits its turn.
        </p>
      </div>
    </section>
  );
}
