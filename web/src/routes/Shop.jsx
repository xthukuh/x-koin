import { Link } from 'react-router-dom';

import PartCard from '../shop/PartCard.jsx';
import { PARTS, groups, kes, summary } from '../shop/data.js';
import '../shop/shop.css';

function Figure({ value, label, money }) {
  return (
    <div className="xk-shop-figure">
      <span className={money ? 'xk-shop-figure-value xk-shop-money' : 'xk-shop-figure-value'}>
        {value}
      </span>
      <span className="xk-shop-figure-label">{label}</span>
    </div>
  );
}

/**
 * The proof of concept shopping list. Every figure on this page comes from
 * hardware/shopping/parts/*.json, compiled into the bundle at build time by
 * ../shop/data.js, so the page has no fetch, no loading state and no way to
 * disagree with what the scouts recorded.
 */
export default function Shop() {
  const totals = summary();
  const roleGroups = groups();

  return (
    <main className="xk-shop">
      <div className="xk-shop-wrap">
        <p className="xk-shop-back">
          <Link to="/map">xKoin index</Link>
        </p>

        <header className="xk-shop-head">
          <h1 className="xk-shop-title">Proof of concept parts</h1>
          <p className="xk-shop-lede">
            Built on a zero budget, so every line is the cheapest genuine listing a scout could
            find for the part the demo matrix needs. Prices are in KES as AliExpress showed them
            to a Kenyan visitor on the recorded date, shipping is what the listing page displayed
            without a login, and where a listing sells several variants the right one still has to
            be selected at checkout.
          </p>

          {PARTS.length > 0 ? (
            <>
              <div className="xk-shop-summary">
                <Figure label="lines" value={totals.lines} />
                <Figure label="scouted" value={totals.scouted} />
                <Figure label="pending" value={totals.pending} />
                {totals.local > 0 ? <Figure label="bought locally" value={totals.local} /> : null}
                <Figure label="kit total" money value={kes(totals.totalKes)} />
              </div>
              <p className="xk-shop-note">
                Kit total is the chosen price times the quantity, summed over the scouted lines.
                Shipping is excluded: most of these listings did not show a shipping figure without
                a login, so the cart will add to this.
              </p>
            </>
          ) : null}
        </header>

        {PARTS.length === 0 ? (
          <p className="xk-shop-empty">
            No part files yet. The page compiles hardware/shopping/parts/*.json at build time.
          </p>
        ) : null}

        {roleGroups.map((group) => (
          <section className="xk-shop-group" key={group.key}>
            <div className="xk-shop-group-head">
              <h2 className="xk-shop-group-title">{group.title}</h2>
              <p className="xk-shop-group-sub">
                {group.parts.length} {group.parts.length === 1 ? 'line' : 'lines'} | subtotal{' '}
                <strong>{kes(group.subtotalKes)}</strong>
              </p>
            </div>
            <p className="xk-shop-group-why">{group.why}</p>
            {group.parts.map((part) => (
              <PartCard key={part.id} part={part} />
            ))}
          </section>
        ))}

        {roleGroups.length > 1 ? (
          <p className="xk-shop-note">
            A part that serves several devices is listed under each of them, so the role subtotals
            add up to more than the kit total.
          </p>
        ) : null}

        <footer className="xk-shop-foot">
          <span className="xk-shop-mono">
            {totals.recorded ? `Recorded on ${totals.recorded}` : 'No recording date yet'}
          </span>
          <span>
            The devices these parts build are specified in{' '}
            <Link to="/docs/papers/00-START-HERE">the papers</Link>.
          </span>
        </footer>
      </div>
    </main>
  );
}
