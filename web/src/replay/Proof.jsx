/*
 * The proof panel: the thing that makes /replay a microscope rather than a
 * story. One per stage, open by default, holding the payload, the field
 * notes, the cryptographic check, the contract call, and the file the whole
 * lot came from.
 */

import { LAYERS } from './journeys.js';

/** Pretty JSON in a box that scrolls on its own rather than widening the page. */
export function JsonBlock({ value, label = 'payload' }) {
  return (
    <div className="xk-rp-json">
      <span className="xk-rp-json__tag xk-mono">{label}</span>
      <pre className="xk-rp-json__pre xk-mono">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

export function CodeBlock({ text, lang = 'text', label }) {
  return (
    <div className="xk-rp-json">
      <span className="xk-rp-json__tag xk-mono">{label ?? lang}</span>
      <pre className="xk-rp-json__pre xk-mono">{text}</pre>
    </div>
  );
}

export function LayerBadge({ layer }) {
  const meta = LAYERS[layer] ?? { label: layer, color: 'var(--xk-faint)' };
  return (
    <span className="xk-rp-layer xk-mono" style={{ color: meta.color }}>
      {meta.label}
    </span>
  );
}

function Fields({ fields }) {
  if (!fields || fields.length === 0) {
    return null;
  }
  return (
    <div className="xk-rp-fields">
      <h5 className="xk-rp-h5">Fields</h5>
      <dl className="xk-rp-dl">
        {fields.map(([path, note]) => (
          <div className="xk-rp-dl__row" key={path}>
            <dt className="xk-mono">{path}</dt>
            <dd>{note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Check({ check }) {
  if (!check) {
    return null;
  }
  const rows = [
    ['signs', check.signs],
    ['key', check.key],
    ['verifies', check.verifies],
    ['if tampered', check.tamper],
  ].filter(([, value]) => Boolean(value));
  if (rows.length === 0) {
    return null;
  }
  return (
    <div className="xk-rp-check">
      <h5 className="xk-rp-h5">The check</h5>
      <dl className="xk-rp-dl">
        {rows.map(([label, value]) => (
          <div className="xk-rp-dl__row" key={label}>
            <dt className="xk-mono">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Contract({ contract }) {
  if (!contract) {
    return null;
  }
  const rows = [
    ['call', contract.call],
    ['event', contract.event],
    ['reverts', contract.reverts],
  ].filter(([, value]) => Boolean(value));
  return (
    <div className="xk-rp-check">
      <h5 className="xk-rp-h5">On chain</h5>
      <dl className="xk-rp-dl">
        {rows.map(([label, value]) => (
          <div className="xk-rp-dl__row" key={label}>
            <dt className="xk-mono">{label}</dt>
            <dd className="xk-mono xk-rp-dd-mono">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * One stage of a journey. `open` and `onToggle` are lifted so the journey can
 * expand or collapse every proof at once.
 */
export default function ProofStep({ step, open, onToggle }) {
  const { proof } = step;
  return (
    <li className="xk-rp-step">
      <div className="xk-rp-step__rail" aria-hidden="true">
        <span className="xk-rp-step__dot" />
      </div>
      <div className="xk-rp-step__body">
        <div className="xk-rp-step__head">
          <span className="xk-rp-step__n xk-mono">{String(step.n).padStart(2, '0')}</span>
          <span className="xk-rp-step__actor xk-mono">{step.actor}</span>
          <LayerBadge layer={step.layer} />
        </div>
        <p className="xk-rp-step__action">{step.action}</p>

        <details
          className="xk-rp-proof"
          open={open}
          onToggle={(event) => onToggle(step.n, event.currentTarget.open)}
        >
          <summary className="xk-rp-proof__summary">
            <span className="xk-mono">proof</span>
            <span className="xk-rp-proof__hint xk-note">{open ? 'hide' : 'show'}</span>
          </summary>
          <div className="xk-rp-proof__body">
            {proof.payload !== undefined ? <JsonBlock value={proof.payload} /> : null}
            {proof.code ? <CodeBlock text={proof.code.text} lang={proof.code.lang} /> : null}
            <Fields fields={proof.fields} />
            <Check check={proof.check} />
            <Contract contract={proof.contract} />
            {proof.gap ? (
              <p className="xk-rp-gap">
                <strong className="xk-mono">gap</strong> {proof.gap}
              </p>
            ) : null}
            <p className="xk-rp-source xk-note">
              <strong className="xk-mono">source</strong> {proof.source}
            </p>
          </div>
        </details>
      </div>
    </li>
  );
}
