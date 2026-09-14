import { RATES, RATE_NOTE, fmtKes } from '../lib/money.js';
import { TRANCHES, fmtRange, trancheTotal, wholePathTotal } from './data.js';

const BUYS = [
  {
    n: '01',
    text: 'Six demos on real hardware. The kit is priced to the listing, the ten-day bench schedule is written, and the firmware has never been compiled on a dev machine.',
  },
  {
    n: '02',
    text: 'A company that exists and counsel answers in writing. Fifteen numbered questions are already drafted; sending them is the cheapest item on the roadmap and it gates the three most expensive ones.',
  },
  {
    n: '03',
    text: 'An Android app a tenant can install, and one building running for thirty consecutive days with paying tenants and a measured backhaul cost.',
  },
];

/**
 * The header and the ask. Every figure here is summed from the budget lines in
 * data.js rather than typed, so the number in this tile and the number at the
 * foot of the budget table cannot drift apart.
 */
export default function Ask() {
  const seed = trancheTotal(TRANCHES[0]);
  const whole = wholePathTotal();

  return (
    <header className="xk-su-hero xk-hero-grid">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Startup plan, 2026-09-14</p>
        <h1>What the money is for</h1>
        <p className="xk-su-lede">
          <span className="xk-su-ask-line">
            The ask is {fmtRange(seed.low, seed.high)} over {TRANCHES[0].runwayMonths[0]} to{' '}
            {TRANCHES[0].runwayMonths[1]} months, to take a protocol that passes every test it has
            into one building with paying tenants in it.
          </span>{' '}
          xKoin today is a working protocol with no building attached to it. Everything below is
          costed from the documents in this repository, every figure says how much weight it
          carries, and the lines nobody has quoted are listed as unquoted rather than invented.
        </p>

        <dl className="xk-stats">
          <div className="xk-stat">
            <dt className="xk-mono">{fmtRange(seed.low, seed.high, { short: true })}</dt>
            <dd>Tranche A, the ask on this page</dd>
            <dd className="xk-note">Summed from {seed.phases.length} phases of line items</dd>
          </div>
          <div className="xk-stat">
            <dt className="xk-mono">
              {TRANCHES[0].runwayMonths[0]} to {TRANCHES[0].runwayMonths[1]} months
            </dt>
            <dd>Runway it buys</dd>
            <dd className="xk-note">Four phases, three of them running in parallel</dd>
          </div>
          <div className="xk-stat">
            <dt className="xk-mono">{fmtRange(whole.low, whole.high, { short: true })}</dt>
            <dd>The whole path to a first production run</dd>
            <dd className="xk-note">Three tranches, each gated on the one before</dd>
          </div>
          <div className="xk-stat">
            <dt className="xk-mono">{whole.unpricedCount}</dt>
            <dd>Lines deliberately not priced</dd>
            <dd className="xk-note">Regulator fees and two silicon parts nobody has quoted</dd>
          </div>
          <div className="xk-stat">
            <dt className="xk-mono">{fmtKes(0)}</dt>
            <dd>Raised so far</dd>
            <dd className="xk-note">Everything proven to date was built by one person</dd>
          </div>
        </dl>

        <div className="xk-su-buys">
          {BUYS.map((buy) => (
            <div className="xk-su-buy" key={buy.n}>
              <span className="xk-su-buy-n">{buy.n}</span>
              <p>{buy.text}</p>
            </div>
          ))}
        </div>

        <div className="xk-su-unlock">
          <h3>What unlocks the next round</h3>
          <p className="xk-note">{TRANCHES[0].milestone}</p>
        </div>

        <p className="xk-su-rates">
          <strong>Rates, stated once.</strong> {RATE_NOTE} Recorded {RATES.recorded}. Where a figure
          started life in dollars or yuan the shilling value comes first and the foreign amount sits
          in parentheses beside it. Every revenue figure on this page is conditional on the 500
          micro-KES per 10 KB unit price, which is a placeholder until it clears measured backhaul
          cost.
        </p>
      </div>
    </header>
  );
}
