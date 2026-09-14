import { Link } from 'react-router-dom';

import { RISKS } from './data.js';

/**
 * The risks that would stop this, each with what is already done about it and
 * the document that carries the detail. Nothing here is a reassurance without a
 * link behind it.
 */
export default function Risks() {
  return (
    <section className="xk-section" id="risks">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Risks and mitigations</p>
        <h2>What would stop this, and what is already done about each one</h2>
        <p>
          Three of these are regulatory and none of them is answered yet. That is the honest state of
          the project and it is why the cheapest line in the budget, one written opinion from
          counsel, sits in the first tranche rather than a later one.
        </p>

        <div className="xk-tablewrap">
          <table className="xk-table xk-su-table">
            <caption className="xk-sr">Risks, mitigations and the paper that carries each</caption>
            <thead>
              <tr>
                <th scope="col">Kind</th>
                <th scope="col">Risk</th>
                <th scope="col">Mitigation</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {RISKS.map((risk) => (
                <tr key={risk.risk}>
                  <th className="xk-mono" scope="row" style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>
                    {risk.kind}
                  </th>
                  <td>{risk.risk}</td>
                  <td>{risk.mitigation}</td>
                  <td>
                    <Link to={risk.doc}>{risk.docLabel}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="xk-su-plan-note">
          Nothing on this site is a service offer, and no device has transmitted outside a bench. The
          full regulatory position, including the fifteen numbered questions in the form a lawyer can
          answer, is <Link to="/docs/papers/11-regulatory-and-safety">paper 11</Link>.
        </p>
      </div>
    </section>
  );
}
