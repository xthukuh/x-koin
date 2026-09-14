/*
 * One journey: the heading, the animation of the flow, and the stepper where
 * every stage carries its proof. Expand all and collapse all act on the whole
 * journey at once.
 */

import { useState } from 'react';

import { AnimationFrame } from '../player/index.js';

import Flow from './Flow.jsx';
import ProofStep from './Proof.jsx';

export default function Journey({ journey, index }) {
  const [openMap, setOpenMap] = useState(() =>
    Object.fromEntries(journey.steps.map((step) => [step.n, true])),
  );

  const setAll = (value) =>
    setOpenMap(Object.fromEntries(journey.steps.map((step) => [step.n, value])));

  const openCount = journey.steps.filter((step) => openMap[step.n]).length;

  return (
    <section className="xk-section xk-rp-journey" id={journey.id}>
      <div className="xk-wrap">
        <p className="xk-eyebrow">Journey {String(index + 1).padStart(2, '0')}</p>
        <h2>{journey.title}</h2>
        <p className="xk-lede">{journey.lede}</p>

        <AnimationFrame
          title={journey.title}
          duration={journey.animation.duration}
          caption={`${journey.animation.hops.length} stages, ${journey.animation.actors.length} actors. Every label is a real call or frame from the stages below.`}
        >
          {({ t }) => <Flow t={t} animation={journey.animation} />}
        </AnimationFrame>

        <div className="xk-rp-controls">
          <span className="xk-note">
            {openCount} of {journey.steps.length} proofs open
          </span>
          <span className="xk-rp-controls__btns">
            <button type="button" className="xk-btn xk-btn--small" onClick={() => setAll(true)}>
              expand all proofs
            </button>
            <button type="button" className="xk-btn xk-btn--small" onClick={() => setAll(false)}>
              collapse all proofs
            </button>
          </span>
        </div>

        <ol className="xk-rp-steps">
          {journey.steps.map((step) => (
            <ProofStep
              key={step.n}
              step={step}
              open={Boolean(openMap[step.n])}
              onToggle={(n, value) =>
                setOpenMap((current) =>
                  current[n] === value ? current : { ...current, [n]: value },
                )
              }
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
