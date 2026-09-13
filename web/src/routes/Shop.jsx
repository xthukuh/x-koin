import { Link } from 'react-router-dom';

import PartCard from '../shop/PartCard.jsx';
import { PARTS, groups, kes, mvpDevices, mvpSummary, summary } from '../shop/data.js';
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

/** One device of the bare minimum kit: a fixed-column table, one row per line. */
function DeviceTable({ device }) {
  return (
    <section className="xk-shop-device">
      <div className="xk-shop-device-head">
        <h3 className="xk-shop-device-name">{device.name}</h3>
        <span className="xk-shop-device-sum xk-shop-mono">
          <span className="xk-shop-dim">AliExpress {kes(device.aliKes)} | Nairobi {kes(device.localKes)}</span>
          <strong>{kes(device.totalKes)}</strong>
        </span>
      </div>
      <p className="xk-shop-device-why">{device.journey}</p>
      <div className="xk-shop-scroll">
        <table className="xk-shop-table xk-shop-kit-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Variant</th>
              <th className="xk-shop-num">Qty</th>
              <th className="xk-shop-num">Unit</th>
              <th className="xk-shop-num">Cost</th>
              <th>Source</th>
              <th>Arrives</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {device.lines.map((line) => (
              <tr key={line.id}>
                <td className="xk-shop-kit-name">
                  {line.image ? <img alt="" className="xk-shop-kit-thumb" loading="lazy" src={line.image} /> : <span className="xk-shop-kit-thumb" />}
                  <span>{line.name}</span>
                </td>
                <td>{line.variant}{line.pack > 1 ? ` (1 of ${line.pack})` : ''}</td>
                <td className="xk-shop-num xk-shop-mono">{line.qty}</td>
                <td className="xk-shop-num xk-shop-mono">{kes(line.unitKes)}</td>
                <td className="xk-shop-num xk-shop-mono">{kes(line.costKes)}</td>
                <td>
                  <span className={line.buy === 'ali' ? 'xk-shop-src xk-shop-src-ali' : 'xk-shop-src xk-shop-src-local'}>
                    {line.buy === 'ali' ? 'AliExpress' : 'Nairobi'}
                  </span>{' '}
                  {line.seller}
                </td>
                <td className="xk-shop-mono">{line.arrives}</td>
                <td>
                  {line.url ? (
                    <a className="xk-shop-buy" href={line.url} rel="noreferrer" target="_blank">
                      Buy
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {device.owned.length > 0 ? (
        <p className="xk-shop-owned">Already owned: {device.owned.join('; ')}.</p>
      ) : null}
    </section>
  );
}

/**
 * The proof of concept shopping list. Every figure on this page is compiled
 * from hardware/shopping at build time by ../shop/data.js, so the page has no
 * fetch, no loading state and no way to disagree with what was recorded.
 */
export default function Shop() {
  const totals = summary();
  const roleGroups = groups();
  const devices = mvpDevices();
  const kit = mvpSummary();

  return (
    <main className="xk-shop">
      <div className="xk-shop-wrap">
        <p className="xk-shop-back">
          <Link to="/map">xKoin index</Link>
        </p>

        <header className="xk-shop-head">
          <h1 className="xk-shop-title">Proof of concept parts</h1>
          <p className="xk-shop-lede">
            Bare minimum kit, one unit per device, every medium and basic journey covered. Every
            line was verified on its listing with ship-to Kenya on {kit.recorded}; prices in KES.
          </p>
          <div className="xk-shop-summary">
            <Figure label="AliExpress lines" money value={kes(kit.ali)} />
            <Figure label="AliExpress shipping" money value={kes(kit.shipping)} />
            <Figure label="Nairobi lines" money value={kes(kit.local)} />
            <Figure label="kit before customs" money value={kes(kit.total)} />
            <Figure label="stage two lines" value={kit.stageTwo.length} />
          </div>
          <p className="xk-shop-note">
            Kit excludes AliExpress shipping, VAT on the HomePlug kit if charged, and customs on
            the parcel. Plan and options: hardware/shopping/mvp-sourcing.md.
          </p>
        </header>

        <section className="xk-shop-section">
          <h2 className="xk-shop-section-title">MVP kit by device</h2>
          {devices.map((device) => (
            <DeviceTable device={device} key={device.key} />
          ))}
        </section>

        <section className="xk-shop-section">
          <div className="xk-shop-section-head">
            <h2 className="xk-shop-section-title">All scouted lines</h2>
            <p className="xk-shop-section-sub xk-shop-mono">
              {totals.lines} lines | {totals.scouted} priced | full list {kes(totals.totalKes)}
            </p>
          </div>
          {PARTS.length === 0 ? (
            <p className="xk-shop-empty">No part files yet.</p>
          ) : null}
          {roleGroups.map((group) => (
            <div className="xk-shop-group" key={group.key}>
              <div className="xk-shop-group-head">
                <h3 className="xk-shop-group-title">{group.title}</h3>
                <p className="xk-shop-group-sub xk-shop-mono">
                  {group.parts.length} {group.parts.length === 1 ? 'line' : 'lines'} | <strong>{kes(group.subtotalKes)}</strong>
                </p>
              </div>
              <div className="xk-shop-grid">
                {group.parts.map((part) => (
                  <PartCard key={part.id} part={part} />
                ))}
              </div>
            </div>
          ))}
          <p className="xk-shop-note">
            A part that serves several devices is listed under each, so role subtotals exceed the
            list total. Local lines carry no price here.
          </p>
        </section>

        <footer className="xk-shop-foot">
          <span className="xk-shop-mono">
            {totals.recorded ? `Recorded ${totals.recorded}` : 'No recording date yet'}
          </span>
          <span>
            Devices are specified in <Link to="/docs/papers/00-START-HERE">the papers</Link>.
          </span>
        </footer>
      </div>
    </main>
  );
}
