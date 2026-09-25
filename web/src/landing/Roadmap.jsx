import { Link } from 'react-router-dom';

import { ROADMAP } from './data.js';

const LABEL = {
  built: 'built',
  progress: 'in progress',
  planned: 'planned',
};

/**
 * The phased checklist. Order and wording are the founder's. Each phase carries
 * one line of detail and either the date the phase was verified green or the
 * thing that is blocking it, taken from HANDOVER.md, docs/papers/13-roadmap.md
 * and the ROADMAP rows below the list.
 */
const PHASES = [
  {
    done: true,
    name: 'Proof of concept, software tests (simulated)',
    detail:
      '35 Foundry tests, 11 protocol units, scenarios S1 to S6, 75 firmware host checks and the full loop settled on a real chain.',
    when: 'verified green 2026-09-09',
  },
  {
    done: false,
    name: 'Proof of concept, hardware tests',
    detail:
      'Six demos D1 to D6 on a bench: power-line bulk, LoRa through attenuators, the transformer jump, last network standing, video, and farm sensors on the free plane.',
    when: 'blocked on the kit arriving',
  },
  {
    done: false,
    name: 'Prototyping custom PCB',
    detail:
      'One board with four populations, replacing the breakout modules with the silicon underneath them, at a target of USD 52 a Node and USD 25 a Satellite at 1,000 units.',
    when: 'blocked on the six demos passing',
  },
  {
    done: false,
    name: 'Manufacturing',
    detail:
      'Local factory or outsourced assembly to the chip makers region. Firmware updates and protocol or network resilience stay in house.',
    when: 'blocked on a written quotation against the manufacturing brief',
  },
  {
    done: false,
    name: 'Pilot building, thirty days',
    detail:
      'One building, one landlord, about ten paying tenants, and the five numbers that do not exist yet, starting with measured backhaul cost in KES per MB.',
    when: 'blocked on a company, a landlord and counsel first written opinion',
  },
  {
    done: false,
    name: 'Regulatory and corporate gates',
    detail:
      'Ten gates covering spectrum, type approval, mains certification, transit resale, the legal character of XKN, money laundering, tax and the multisig owner. All ten are open.',
    when: 'open, with counsel',
  },
  {
    done: false,
    name: 'Companion app MVP',
    detail:
      'One seed in the Android Keystore, a 12-word backup, buy, deposit, auto-signed receipts, send and withdraw. The largest single item in the MVP.',
    when: 'scoped for the next session',
  },
  {
    done: false,
    name: 'Kiosk network (xkoinkiosk.com)',
    detail:
      'The retail layer that takes cash and signs vouchers, so a user with no bank and no app can still get on the network.',
    when: 'scoped next session',
  },
  {
    done: false,
    name: 'Scale',
    detail:
      'Units landed in Nairobi at a known landed cost, with the import classification settled rather than assumed.',
    when: 'blocked on manufacture',
  },
];

function Rows({ rows }) {
  return (
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
          {rows.map((row) => (
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
  );
}

export default function Roadmap() {
  const built = ROADMAP.filter((row) => row.status === 'built');
  const open = ROADMAP.filter((row) => row.status !== 'built');

  return (
    <section className="xk-section" id="roadmap">
      <div className="xk-wrap">
        <p className="xk-eyebrow">11 / roadmap and status</p>
        <h2>One box is ticked.</h2>
        <p className="xk-lede">
          The phases are in the order they have to happen, and a phase starts because the previous
          one met its exit condition rather than because a date arrived. Anything unticked says what
          is blocking it. Each phase links to the startup plan, which carries the budget in
          shillings.
        </p>

        <ol className="xk-checklist">
          {PHASES.map((phase) => (
            <li className="xk-checklist__item" key={phase.name}>
              <span
                aria-hidden="true"
                className={`xk-check${phase.done ? ' xk-check--done' : ''}`}
              />
              <div className="xk-checklist__body">
                <Link className="xk-checklist__name" to="/startup">
                  {phase.name}
                </Link>
                <p className="xk-checklist__detail">{phase.detail}</p>
                <p className="xk-checklist__when xk-mono">{phase.when}</p>
              </div>
            </li>
          ))}
        </ol>

        <details className="xk-details">
          <summary>What is already verified green</summary>
          <Rows rows={built} />
        </details>

        <details className="xk-details">
          <summary>What is still open</summary>
          <Rows rows={open} />
        </details>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          Sources: HANDOVER.md sections 1 and 4, docs/papers/13-roadmap.md, and
          docs/_plan/revamp-plan.md section 5. Dates in the two lists above are the day the work was
          verified green; an open date means the item is waiting on a person or a decision, and the
          row says which.
        </p>
      </div>
    </section>
  );
}
