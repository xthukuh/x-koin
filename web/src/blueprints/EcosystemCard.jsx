import { Link } from 'react-router-dom';

/**
 * A pre-existing LoRa device stated in plain facts: its radio, its band, what
 * the xKoin Satellite offers it, and, for the Meshtastic handset, the exact
 * interoperation claim with its limits at equal length. Nothing here goes
 * beyond docs/papers/09-lora-ecosystem-devices.md.
 */
export default function EcosystemCard({ device }) {
  return (
    <section className="xk-bp-eco">
      <header className="xk-bp-eco-head">
        <div>
          <h2>{device.name}</h2>
          <p className="xk-lede">{device.tagline}</p>
        </div>
        <span className="xk-status xk-status--planned">{device.status}</span>
      </header>

      <dl className="xk-bp-eco-facts">
        <div>
          <dt>Radio</dt>
          <dd>{device.radio}</dd>
        </div>
        <div>
          <dt>Band</dt>
          <dd>{device.band}</dd>
        </div>
        <div>
          <dt>What the Satellite offers it</dt>
          <dd>{device.offer}</dd>
        </div>
        <div>
          <dt>Power</dt>
          <dd>{device.power}</dd>
        </div>
      </dl>

      <p className="xk-bp-role">{device.role}</p>

      {device.claimed ? (
        <div className="xk-bp-claims">
          <section>
            <h3>What is claimed</h3>
            <ul>
              {device.claimed.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          <section className="xk-bp-claims-not">
            <h3>What is not claimed</h3>
            <ul>
              {device.notClaimed.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {device.kind === 'card' ? (
        <>
          {device.notes?.length > 0 ? (
            <ul className="xk-bp-eco-notes">
              {device.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
          <p className="xk-note">
            {device.statusNote} Sources: {device.sources.join('; ')}.{' '}
            <Link to="/shop">Shopping list</Link>
          </p>
        </>
      ) : null}
    </section>
  );
}
