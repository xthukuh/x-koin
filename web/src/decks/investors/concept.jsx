import { Reveal, ease, item, loop, ms, stage } from '../../player/index.js';

import { Head, Foot, Panel, Tick } from './parts.jsx';

/**
 * Scenes 03 and 04: what the thing is, and the one rule inside it.
 *
 * The rule table is the plain-language form of protocol/spec.md sections 5 and
 * 6, the same split the landing page shows in FreeLanPaidWan.jsx. The billing
 * unit is 10 KB and the placeholder price is 500 micro-KES per unit, which is
 * 0.05 KES per megabyte.
 */

const PRICE_KES_PER_UNIT = 0.0005;

function WhatItIs({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="03 / what xKoin is"
        title="One box, one internet line, and the wires that are already in the walls."
        lede="That is the whole invention. Everything after this is how it gets paid for."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: '1fr 460px', gap: 40, alignContent: 'start' }}>
        <div style={{ paddingTop: 8 }}>
          <Tick t={t} at={ms(0.5)} tone="var(--xk-accent)">
            It plugs into one internet line and into a wall socket.
          </Tick>
          <Tick t={t} at={ms(1.4)} tone="var(--xk-accent)">
            It sends the data down the building's own electrical wiring, so every room is covered
            without pulling a single new cable.
          </Tick>
          <Tick t={t} at={ms(2.3)} tone="var(--xk-money)">
            It counts every byte that leaves the building, and charges for those and nothing else.
          </Tick>
          <Tick t={t} at={ms(3.2)} tone="var(--xk-good)">
            It keeps a radio alive so the network survives a power cut.
          </Tick>
        </div>

        <div>
          <svg viewBox="0 0 440 400" width="100%" style={{ display: 'block' }}>
            <Reveal t={t} at={ms(0.3)} from="up" as="g">
              <rect x="150" y="18" width="140" height="52" fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="2" />
              <text x="220" y="50" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="17" fill="var(--xk-muted)">
                internet line
              </text>
            </Reveal>

            <path
              d="M 220 70 V 128"
              stroke="var(--xk-line)"
              strokeWidth="2"
              strokeDasharray="58"
              strokeDashoffset={58 * (1 - stage(t, ms(0.8), 400))}
            />

            <Reveal t={t} at={ms(1.0)} from="pop" as="g">
              <rect x="128" y="128" width="184" height="96" fill="var(--xk-surface)" stroke="var(--xk-accent)" strokeWidth="3" />
              <text x="220" y="168" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="22" fill="var(--xk-ink)">
                xKoin-Node
              </text>
              <text x="220" y="196" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="15" fill="var(--xk-money)">
                the meter lives here
              </text>
            </Reveal>

            {[
              { x: 60, label: 'mains wiring', tone: 'var(--xk-plc)' },
              { x: 220, label: 'Wi-Fi', tone: 'var(--xk-accent)' },
              { x: 380, label: 'radio', tone: 'var(--xk-lora)' },
            ].map((leg, i) => {
              const p = item(t, ms(1.8), i, 220, 460, ease.outCubic);
              return (
                <g key={leg.label} opacity={p}>
                  <path d={`M 220 224 L ${leg.x} 296`} stroke={leg.tone} strokeWidth="2" fill="none" />
                  <rect x={leg.x - 58} y="296" width="116" height="46" fill="var(--xk-surface)" stroke={leg.tone} strokeWidth="2" />
                  <text x={leg.x} y="325" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="16" fill="var(--xk-ink)">
                    {leg.label}
                  </text>
                </g>
              );
            })}

            <Reveal t={t} at={ms(3.0)} from="up" as="g">
              <text x="220" y="382" textAnchor="middle" fontSize="18" fill="var(--xk-muted)">
                Three ways to carry a byte, one format on all three.
              </text>
            </Reveal>
          </svg>
        </div>
      </div>
      <Foot source="docs/papers/00-x-koin-concept.md, sections 1 and 4" right="one box per building" />
    </div>
  );
}

const RULES = [
  { traffic: 'A message to the neighbour', where: 'stays inside', cost: 'free' },
  { traffic: 'Films and files kept on the box', where: 'stays inside', cost: 'free' },
  { traffic: 'Farm and water tank sensors', where: 'stays inside', cost: 'free' },
  { traffic: 'Checking your balance, buying credit', where: 'stays inside', cost: 'free' },
  { traffic: 'Anything on the wider internet', where: 'leaves', cost: 'counted' },
];

function FreeInside({ t }) {
  const cross = loop(t, ms(2.2), 1400);
  const inner = loop(t, ms(1.2), 1800);
  const crossings = t < ms(2.2) ? 0 : Math.floor((t - ms(2.2)) / 1400) + 1;
  const units = Math.min(47, crossings * 6);
  const owed = (units * PRICE_KES_PER_UNIT).toFixed(4);

  return (
    <div className="xk-scene">
      <Head
        kicker="04 / the rule inside the box"
        title="Free inside the building. Paid only on the way out."
        lede="The box holds a short rule table. Local traffic is waved through; anything leaving passes a meter."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: 36, alignContent: 'start' }}>
        <div>
          {RULES.map((rule, i) => {
            const paid = rule.cost === 'counted';
            return (
              <Reveal
                key={rule.traffic}
                t={t}
                at={ms(0.5) + i * 300}
                from="left"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 130px 110px',
                  gap: 12,
                  alignItems: 'center',
                  padding: '11px 14px',
                  borderBottom: '1px solid var(--xk-line)',
                  background: paid ? 'var(--xk-surface-2)' : 'transparent',
                  fontSize: 19,
                }}
              >
                <span>{rule.traffic}</span>
                <span style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 15, color: 'var(--xk-faint)' }}>{rule.where}</span>
                <span
                  className="xk-mono"
                  style={{ fontSize: 18, color: paid ? 'var(--xk-money)' : 'var(--xk-good)', textAlign: 'right' }}
                >
                  {rule.cost}
                </span>
              </Reveal>
            );
          })}
          <Reveal t={t} at={ms(2.4)} from="up" style={{ marginTop: 16, fontSize: 18, color: 'var(--xk-muted)', lineHeight: 1.45 }}>
            Said once in the technical words: the box has a rule table that lets local traffic through
            for nothing and counts every byte that leaves, in ten kilobyte steps.
          </Reveal>
        </div>

        <div>
          <svg viewBox="0 0 460 340" width="100%" style={{ display: 'block' }}>
            <Reveal t={t} at={ms(0.3)} from="up" as="g">
              <rect x="10" y="30" width="230" height="190" fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="2" />
              <text x="125" y="58" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="16" fill="var(--xk-faint)">
                inside the building
              </text>
              <rect x="320" y="30" width="130" height="190" fill="var(--xk-surface-2)" stroke="var(--xk-line)" strokeWidth="2" />
              <text x="385" y="58" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="16" fill="var(--xk-faint)">
                the internet
              </text>
              <rect x="252" y="76" width="56" height="98" fill="var(--xk-surface)" stroke="var(--xk-money)" strokeWidth="3" />
              <text x="280" y="120" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="13" fill="var(--xk-money)">
                METER
              </text>
              <text x="280" y="138" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="13" fill="var(--xk-money)">
                10 KB
              </text>
            </Reveal>

            {inner > 0 ? (
              <circle cx={60 + Math.abs(0.5 - inner) * 2 * 140} cy="178" r="8" fill="var(--xk-good)" opacity={stage(t, ms(1.2), 300)} />
            ) : null}
            {cross > 0 ? <circle cx={40 + cross * 390} cy="112" r="8" fill="var(--xk-money)" /> : null}

            <Reveal t={t} at={ms(1.5)} from="up" as="g">
              <text x="125" y="208" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="15" fill="var(--xk-good)">
                never counted
              </text>
            </Reveal>

            <Reveal t={t} at={ms(3.0)} from="up" as="g">
              <rect x="10" y="248" width="440" height="80" fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="1" />
              <text x="28" y="280" fontFamily="var(--xk-font-mono)" fontSize="17" fill="var(--xk-muted)">
                units that left
              </text>
              <text x="28" y="312" fontFamily="var(--xk-font-mono)" fontSize="26" fill="var(--xk-ink)">
                {units}
              </text>
              <text x="250" y="280" fontFamily="var(--xk-font-mono)" fontSize="17" fill="var(--xk-muted)">
                owed at the placeholder price
              </text>
              <text x="250" y="312" fontFamily="var(--xk-font-mono)" fontSize="26" fill="var(--xk-money)">
                KES {owed}
              </text>
            </Reveal>
          </svg>
        </div>
      </div>
      <Foot source="protocol/spec.md sections 5 and 6; price is the 500 micro-KES placeholder" right="10 KB per unit" />
    </div>
  );
}

export const CONCEPT_SCENES = [
  {
    id: 'what-it-is',
    title: 'What xKoin is',
    duration: ms(8),
    caption:
      'xKoin is one box in a building. It takes a single internet line, spreads it over the electrical wiring that is already in the walls, and charges only for the bytes that leave for the wider internet.',
    Scene: WhatItIs,
  },
  {
    id: 'free-inside',
    title: 'Free inside, paid on the way out',
    duration: ms(10),
    caption:
      'Traffic that stays in the building passes free and is never counted. Traffic that leaves goes through a meter that counts it in ten kilobyte units. That one rule is what makes the network worth joining before anybody has paid a shilling.',
    Scene: FreeInside,
  },
];
