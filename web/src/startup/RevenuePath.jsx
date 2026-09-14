import { Link } from 'react-router-dom';

import { AnimationFrame } from '../player/index.js';
import { fmtKes } from '../lib/money.js';
import RevenueMap, { MAP_DURATION } from './RevenueMap.jsx';
import {
  KES_PER_MB,
  PRICE_UKES_PER_UNIT,
  REVENUE,
  REVENUE_ASSUMPTIONS,
  buildingMonth,
  fmtMb,
  protocolBreakEven,
  scenarios,
} from './data.js';

/**
 * The path to revenue, stated as a scenario rather than a forecast. Every row
 * is one building multiplied out, every figure is computed from REVENUE, and
 * every one of them is conditional on a price that is still a placeholder.
 */
export default function RevenuePath() {
  const one = buildingMonth();
  const rows = scenarios();
  const protocol = protocolBreakEven();

  return (
    <section className="xk-section" id="revenue">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Path to revenue</p>
        <h2>One building, ten buildings, a hundred buildings</h2>
        <p>
          The network sells one thing: bytes that leave the building for the wider internet. Local
          traffic is free and always will be. A node meters the wide-area bytes it carries, the
          client signs a cumulative counter for them, and the escrow pays the node operator 95
          percent of what was signed and the treasury 5 percent. So revenue is bytes multiplied by a
          price, and the price is the number this whole plan is arranged around.
        </p>

        <dl className="xk-su-assume">
          {REVENUE_ASSUMPTIONS.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd className="xk-su-assume-value">{row.value}</dd>
              <dd className="xk-su-assume-basis">{row.basis}</dd>
            </div>
          ))}
        </dl>

        <div className="xk-tablewrap">
          <table className="xk-table xk-su-table">
            <caption className="xk-sr">Monthly revenue by network size, in Kenyan shillings</caption>
            <thead>
              <tr>
                <th className="xk-su-num" scope="col">Buildings</th>
                <th className="xk-su-num" scope="col">Nodes</th>
                <th className="xk-su-num" scope="col">Paying tenants</th>
                <th className="xk-su-num" scope="col">WAN sold a month</th>
                <th className="xk-su-num" scope="col">Gross a month</th>
                <th className="xk-su-num" scope="col">Operator share</th>
                <th className="xk-su-num" scope="col">Treasury share</th>
                <th className="xk-su-num" scope="col">Operator net</th>
                <th className="xk-su-num" scope="col">Operator break-even</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.buildings}>
                  <th className="xk-su-num" scope="row" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    {row.buildings}
                  </th>
                  <td className="xk-su-num">{row.nodes.toLocaleString('en-US')}</td>
                  <td className="xk-su-num">{row.tenants.toLocaleString('en-US')}</td>
                  <td className="xk-su-num">{fmtMb(row.mb)}</td>
                  <td className="xk-su-num">{fmtKes(row.gross)}</td>
                  <td className="xk-su-num">{fmtKes(row.operator)}</td>
                  <td className="xk-su-num">{fmtKes(row.treasury)}</td>
                  <td className="xk-su-num">{fmtKes(row.operatorNet)}</td>
                  <td className="xk-su-num">
                    {row.breakEvenMonth ? `month ${row.breakEvenMonth}` : 'never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="xk-su-condition">
          Every figure in that table is conditional on the {PRICE_UKES_PER_UNIT} micro-KES per 10 KB
          unit price, which works out at {KES_PER_MB} KES per MB and is a placeholder until it clears
          measured backhaul cost through the price floor formula. Replacing it with a measured number
          is the pilot's single most consequential output, and it moves every column above.
        </p>

        <AnimationFrame
          caption={`Each block is one building: one Node in the meter room, three relays on the risers, ten paying tenants. The counters are the same arithmetic as the table above, at ${fmtKes(one.gross)} of gross a month per building, and they carry the same condition on the price.`}
          duration={MAP_DURATION}
          title="A hundred buildings, one at a time"
        >
          {({ t }) => <RevenueMap t={t} />}
        </AnimationFrame>

        <h3 style={{ marginTop: '2rem' }}>Two break-evens, and they are not the same one</h3>
        <p>
          <strong>The node operator breaks even in month {one.breakEvenMonth}.</strong> A landlord
          puts in {fmtKes(REVENUE.capexKes)} of hardware, pays {fmtKes(REVENUE.opexKes)} a month for
          backhaul and power, and keeps {fmtKes(one.operator)} of the {fmtKes(one.gross)} their
          building generates. That is {fmtKes(one.operatorNet)} a month of net, and it repays the
          hardware in {one.breakEvenMonth} months. It scales exactly, because every building is its
          own operator with its own capital and its own tenants.
        </p>
        <p>
          <strong>
            The protocol breaks even somewhere between {protocol.low} and {protocol.high} buildings.
          </strong>{' '}
          The treasury keeps {fmtKes(protocol.perBuilding)} a month per building. A lean Nairobi
          operation, meaning one virtual private server, one support person and the gas reserve,
          costs {fmtKes(protocol.fixedLow)} to {fmtKes(protocol.fixedHigh)} a month, which is{' '}
          {protocol.low} to {protocol.high} buildings of treasury share. Both numbers are computed on
          this page from the placeholder price and the tenant spend above, not asserted, and both
          move the moment the pilot produces a measured price.
        </p>
        <p className="xk-note">
          What is not conditional: chain gas. Paper 04 measured a one-ticket settlement batch at
          191,698 gas, which was 0.35 KES on 2026-09-09 Base pricing, and all three contracts deploy
          for 7.7 KES. The costs that decide viability are backhaul per megabyte and the mobile money
          charge on every fiat leg, and the pilot measures both.{' '}
          <Link to="/docs/papers/04-settlement-and-economics">Paper 04</Link> carries the arithmetic
          and every condition attached to it.
        </p>
      </div>
    </section>
  );
}
