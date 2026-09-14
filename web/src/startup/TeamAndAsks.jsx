import { Link } from 'react-router-dom';

import { Fn } from './bits.jsx';
import { TEAM, fmtRange } from './data.js';
import { fmtKes } from '../lib/money.js';

function cost(hire) {
  if (hire.oneOff) {
    return `${fmtRange(hire.oneOff[0], hire.oneOff[1])}, one off`;
  }
  return `${fmtRange(hire.monthly[0], hire.monthly[1])} a month`;
}

function total(hire) {
  if (hire.oneOff) {
    return fmtRange(hire.oneOff[0], hire.oneOff[1]);
  }
  return fmtRange(hire.monthly[0] * hire.months[0], hire.monthly[1] * hire.months[1]);
}

/**
 * Who is here, who gets hired first and what each costs a month, then the three
 * things worth more than money. The rate bands are placeholders with a footnote
 * saying so, because the repository holds no rate card and an invented salary
 * would propagate into every total on the page.
 */
export default function TeamAndAsks() {
  return (
    <section className="xk-section xk-section--tinted" id="team">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Team and asks</p>
        <h2>One founder, three hires, and three things money cannot buy</h2>

        <p>
          <strong>{TEAM.founder.name}.</strong> {TEAM.founder.role} {TEAM.founder.evidence} The
          commands that prove each of those are in{' '}
          <Link to="/docs/papers/13-roadmap">paper 13 section 2</Link> and every one of them can be
          run from a clone of the repository.
        </p>

        <div className="xk-tablewrap">
          <table className="xk-table xk-su-table">
            <caption className="xk-sr">First hires with their monthly cost basis in Kenyan shillings</caption>
            <thead>
              <tr>
                <th scope="col">Role</th>
                <th scope="col">When</th>
                <th scope="col">Duration</th>
                <th className="xk-su-num" scope="col">Cost basis</th>
                <th className="xk-su-num" scope="col">In the budget as</th>
                <th scope="col">Why first</th>
              </tr>
            </thead>
            <tbody>
              {TEAM.hires.map((hire) => (
                <tr key={hire.role}>
                  <th scope="row" style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0, whiteSpace: 'normal' }}>
                    {hire.role}
                    <Fn id={hire.note} />
                  </th>
                  <td>{hire.when}</td>
                  <td>{hire.duration}</td>
                  <td className="xk-su-num">{cost(hire)}</td>
                  <td className="xk-su-num">{total(hire)}</td>
                  <td>{hire.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          Founder time is costed at {fmtKes(0)} throughout this page. That is stated rather than
          hidden: it is not free work, it is unpaid work, and a round that funds a salary for it
          would be larger than the one being asked for here.
        </p>

        <h3 style={{ marginTop: '2.5rem' }}>The non-money asks</h3>
        <p>Each of these removes a line from the budget or a month from the schedule.</p>

        <div className="xk-su-asks">
          {TEAM.asks.map((ask) => (
            <div key={ask.ask}>
              <h3>{ask.ask}</h3>
              <p>{ask.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
