import { ROADMAP } from './data.js';

const LABEL = {
  built: 'built',
  progress: 'in progress',
  planned: 'planned',
};

export default function Roadmap() {
  return (
    <section className="xk-section" id="roadmap">
      <div className="xk-wrap">
        <p className="xk-eyebrow">11 / roadmap and status</p>
        <h2>What is built, what is moving, what is not started.</h2>
        <p className="xk-lede">
          Dates are the day the work was verified green, taken from HANDOVER.md and the working plan.
          Anything with an open date is waiting on a person or a decision, and says which.
        </p>

        <div className="xk-tablewrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Item</th>
                <th scope="col">Detail</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {ROADMAP.map((row) => (
                <tr key={row.item}>
                  <td>
                    <span className={`xk-status xk-status--${row.status}`}>{LABEL[row.status]}</span>
                  </td>
                  <td>{row.item}</td>
                  <td>{row.detail}</td>
                  <td className="xk-mono">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          Sources: HANDOVER.md sections 1 and 4, docs/_plan/revamp-plan.md section 5, and the status
          list on the investor page.
        </p>
      </div>
    </section>
  );
}
