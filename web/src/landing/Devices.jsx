import { useState } from 'react';

import { DEVICES } from './data.js';
import { photoForDevice } from './parts.js';

/**
 * The photo is the chosen listing's own gallery image, which lives on the
 * seller's CDN. A CDN that stops serving it must degrade to the placeholder
 * rather than to a broken image icon, so a load failure is handled too.
 */
function Photo({ device }) {
  const photo = photoForDevice(device.key);
  const [failed, setFailed] = useState(false);
  if (!photo || failed) {
    return (
      <div className="xk-card__photo">
        <div className="xk-card__placeholder">
          {photo ? 'photo unavailable' : 'part not scouted yet'}
        </div>
      </div>
    );
  }
  return (
    <div className="xk-card__photo">
      <img
        src={photo.src}
        alt={`${photo.line} for the ${device.name}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function Devices() {
  return (
    <section className="xk-section" id="devices">
      <div className="xk-wrap">
        <p className="xk-eyebrow">07 / the devices</p>
        <h2>Four roles, one firmware core.</h2>
        <p className="xk-lede">
          The photo on each card is the listing the sourcing scout chose for a part that role uses,
          read from hardware/shopping/parts at build time. A role with no scouted part line yet shows
          an empty block rather than a stock photograph of something else.
        </p>

        <div className="xk-cards">
          {DEVICES.map((device) => (
            <article className="xk-card" key={device.key}>
              <Photo device={device} />
              <h3>{device.name}</h3>
              <p style={{ fontSize: '0.88rem' }}>{device.role}</p>
              <dl className="xk-spec">
                <div>
                  <dt>Mediums</dt>
                  <dd>{device.mediums}</dd>
                </div>
                <div>
                  <dt>Power</dt>
                  <dd>{device.power}</dd>
                </div>
                <div>
                  <dt>Build</dt>
                  <dd className="xk-mono" style={{ fontSize: '0.78rem' }}>
                    {device.build}
                  </dd>
                </div>
              </dl>
              <p className="xk-prove">
                <b>Demo {device.demo}</b> must prove: {device.proves}
              </p>
            </article>
          ))}
        </div>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          Device lineup and demo matrix: docs/_plan/revamp-plan.md sections 1 and 2. The mapping of
          Node-Satellite as the mains relay and Satellite as the off-grid LoRa remote is the reading
          the current work assumes.
        </p>
      </div>
    </section>
  );
}
