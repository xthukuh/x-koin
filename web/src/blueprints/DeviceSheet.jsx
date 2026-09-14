import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';

import { AnimationFrame } from '../player/index.js';
import { kes, mvpDevices } from '../shop/data.js';
import PinTable from './PinTable.jsx';
import Sheet from './Sheet.jsx';
import { buildSheet, frameAt, timing } from './layout.js';
import { downloadSheet, svgFileName } from './download.js';

/** The MVP kit, keyed by device, so a sheet can quote what its parts cost. */
const KIT = new Map(mvpDevices().map((device) => [device.key, device]));

const MEDIUM_STATE = {
  fitted: 'fitted',
  optional: 'optional',
  deferred: 'deferred',
  absent: 'none',
};

/**
 * One device: the header, the sheet of record with its download, the power and
 * medium strip, the parts as bought, the animation and the pin map. Everything
 * it shows comes from the device entry in devices.js and, for money, from
 * hardware/shopping/mvp-kit.json through the shop data module.
 */
export default function DeviceSheet({ device }) {
  const svgRef = useRef(null);
  const sheet = useMemo(() => buildSheet(device), [device]);
  const clock = useMemo(() => timing(sheet, device), [sheet, device]);
  const kit = device.kitKey ? KIT.get(device.kitKey) : null;
  const photos = (kit?.lines ?? []).filter((line) => line.image);

  return (
    <article className="xk-bp-device">
      <header className="xk-bp-device-head">
        <div>
          <h2>{device.name}</h2>
          <p className="xk-lede">{device.tagline}</p>
        </div>
        <div className="xk-bp-device-tags">
          <span className={`xk-status xk-status--${device.status === 'partial' ? 'progress' : 'planned'}`}>
            {device.status}
          </span>
          <button
            type="button"
            className="xk-btn xk-btn--small"
            onClick={() => downloadSheet(svgRef.current, svgFileName(device))}
          >
            Download SVG
          </button>
          <button type="button" className="xk-btn xk-btn--small xk-bp-print" onClick={() => window.print()}>
            Print sheet
          </button>
        </div>
      </header>

      <p className="xk-bp-role">{device.role}</p>

      <div className="xk-bp-figure">
        <Sheet device={device} sheet={sheet} innerRef={svgRef} />
      </div>
      <p className="xk-note xk-bp-caption">
        {device.statusNote} Sources: {device.sources.join('; ')}.
      </p>

      <div className="xk-bp-strip">
        <section className="xk-bp-panel">
          <h3>Mediums it speaks</h3>
          <ul className="xk-bp-mediums">
            {device.mediums.map((medium) => (
              <li key={medium.name + medium.via} className={`xk-bp-medium xk-bp-medium--${medium.state}`}>
                <span className="xk-bp-medium-name">{medium.name}</span>
                <span className="xk-bp-medium-state">{MEDIUM_STATE[medium.state] ?? medium.state}</span>
                <span className="xk-bp-medium-via">{medium.via}</span>
                <span className="xk-bp-medium-detail">{medium.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="xk-bp-panel">
          <h3>Power</h3>
          <p>{device.power}</p>
          <h3 className="xk-bp-panel-sub">Bare minimum kit</h3>
          {kit ? (
            <>
              <p className="xk-bp-money">
                <strong>{kes(kit.totalKes)}</strong>
                <span className="xk-note">
                  {' '}
                  AliExpress {kes(kit.aliKes)} + Nairobi {kes(kit.localKes)}, {kit.lines.length} lines
                </span>
              </p>
              {kit.owned.length > 0 ? <p className="xk-note">Already owned: {kit.owned.join('; ')}.</p> : null}
              <Link className="xk-btn xk-btn--small" to="/shop">
                Open the shopping list
              </Link>
            </>
          ) : (
            <>
              <p className="xk-note">Not in the bare-minimum kit. Nothing here is costed.</p>
              <Link className="xk-btn xk-btn--small" to="/shop">
                Open the shopping list
              </Link>
            </>
          )}
        </section>
      </div>

      {photos.length > 0 ? (
        <section className="xk-bp-modules">
          <h3>Modules used, as bought</h3>
          <ul className="xk-bp-photostrip">
            {photos.map((line) => (
              <li key={line.id}>
                <img alt="" loading="lazy" src={line.image} />
                <span>{line.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="xk-bp-anim">
        <AnimationFrame
          title={`${device.short}: boot order, then one frame`}
          duration={clock.duration}
          caption={device.animCaption}
          aspect="1152 / 720"
        >
          {({ t }) => <Sheet device={device} sheet={sheet} frame={frameAt(sheet, device, t)} grid={false} />}
        </AnimationFrame>
      </div>

      <PinTable device={device} />

      {device.notes?.length > 0 ? (
        <section className="xk-bp-notes">
          <h3>Notes on the drawing</h3>
          <ul>
            {device.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
