import { Link } from 'react-router-dom';

import { PHASES, TRANCHES, fmtRange, phaseBudget, trancheTotal } from './data.js';

/**
 * What each tranche unlocks, and what an investor can go and check for
 * themselves at each milestone. The links are the point: every claim on this
 * page has a page on this site that shows the working.
 */
export default function UseOfFunds() {
  return (
    <section className="xk-section xk-section--tinted" id="tranches">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Use of funds against milestones</p>
        <h2>Three tranches, each one gated on the one before</h2>
        <p>
          Money is asked for in the order the risk comes off. Tranche A buys evidence, not scale: six
          demos on real hardware, answers from counsel, and one building that either works for thirty
          days or does not. Nothing in tranche B is worth spending until the price is measured, and
          nothing in tranche C is worth spending until a board passes the demos a breadboard passed.
        </p>

        {TRANCHES.map((tranche) => {
          const total = trancheTotal(tranche);
          return (
            <article className="xk-su-tranche" key={tranche.key}>
              <div className="xk-su-tranche-head">
                <h3>
                  {tranche.label}. {tranche.name}
                </h3>
                <span className="xk-su-tranche-total xk-mono">{fmtRange(total.low, total.high)}</span>
              </div>

              <p style={{ marginTop: '0.9rem' }}>{tranche.unlocks}</p>

              <div className="xk-tablewrap">
                <table className="xk-table xk-su-table">
                  <thead>
                    <tr>
                      <th scope="col">Phase it funds</th>
                      <th scope="col">Status</th>
                      <th scope="col">Plan</th>
                      <th className="xk-su-num" scope="col">Low</th>
                      <th className="xk-su-num" scope="col">High</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tranche.phases.map((key) => {
                      const phase = PHASES.find((row) => row.key === key);
                      const budget = phaseBudget(phase);
                      return (
                        <tr key={key}>
                          <th scope="row" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, whiteSpace: 'normal' }}>
                            {phase.n}. {phase.name}
                          </th>
                          <td>
                            <span className={`xk-status xk-status--${phase.status}`}>
                              {phase.status === 'progress' ? 'in progress' : phase.status}
                            </span>
                          </td>
                          <td className="xk-mono">{phase.plan}</td>
                          <td className="xk-su-num">{fmtRange(budget.low, budget.low)}</td>
                          <td className="xk-su-num">{fmtRange(budget.high, budget.high)}</td>
                        </tr>
                      );
                    })}
                    <tr className="is-total">
                      <td colSpan="3">
                        {tranche.label} total, {tranche.runwayMonths[0]} to {tranche.runwayMonths[1]}{' '}
                        months of runway
                        {total.unpricedCount > 0
                          ? `, with ${total.unpricedCount} ${total.unpricedCount === 1 ? 'line' : 'lines'} not priced`
                          : ''}
                      </td>
                      <td className="xk-su-num">{fmtRange(total.low, total.low)}</td>
                      <td className="xk-su-num">{fmtRange(total.high, total.high)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="xk-note" style={{ marginTop: '1rem' }}>
                <strong>Milestone that releases the next tranche.</strong> {tranche.milestone}
              </p>

              <div className="xk-su-verify">
                {tranche.verify.map((link) => (
                  <Link key={link.to} to={link.to}>
                    <b>{link.label}</b>
                    <span>{link.text}</span>
                  </Link>
                ))}
              </div>
            </article>
          );
        })}

        <p className="xk-su-plan-note">
          Two phases carry no figure at all. The kiosk network is scoped in the next working session
          and has no lines yet; scale is funded from revenue and from a later round, and the inputs
          that would price it are exactly what the pilot measures. Both are on the roadmap above with
          their status shown rather than quietly left out.
        </p>
      </div>
    </section>
  );
}
