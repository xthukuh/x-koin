import { Reveal, countUp, ease, item, loop, ms, stage } from '../../player/index.js';
import trace from '../../proof/trace.json';

import { Foot, Head, Stage, Tick } from './parts.jsx';

/**
 * Scenes 15 and 16: what happens when the power, the fibre and the mast all
 * stop.
 *
 * The blackout figures are scenario S2 in web/src/proof/trace.json. The two
 * stories are docs/potential/00-last-network-standing.md (a block in
 * Kariobangi South) and docs/potential/05-disaster-relief-corridors.md (the
 * Mathioya valley after a landslide).
 */

const S2 = trace.scenarios.s2.summary;
const CUT_AT = ms(2.6);
const LANES = [
  { key: 'plc', label: 'Broadband over the mains', tone: 'var(--xk-plc)', survives: false },
  { key: 'nbplc', label: 'Slow carrier over the mains', tone: 'var(--xk-nbplc)', survives: false },
  { key: 'lora', label: 'Radio', tone: 'var(--xk-lora)', survives: true },
];

function WhenThePowerGoes({ t }) {
  const cut = t >= CUT_AT;
  const recovered = t >= CUT_AT + 800;
  const flow = loop(t, 0, 1500);
  return (
    <div className="xk-scene">
      <Head
        kicker="15 / when the power goes"
        title="Cut the mains and it slows down. It does not stop."
        lede="Both carriers in the wiring die with the grid. The radio runs on a panel and a cell, and it does not."
      />
      <div className="xk-scene__body">
        <Stage viewBox="0 0 1136 430">
          {LANES.map((lane, i) => {
            const y = 54 + i * 92;
            const alive = !cut || lane.survives;
            const carrying = lane.survives ? recovered : !cut;
            const appear = item(t, ms(0.3), i, 240, 460, ease.outCubic);
            return (
              <g key={lane.key} opacity={appear}>
                <text x="10" y={y - 8} fontFamily="var(--xk-font-mono)" fontSize="17" fill={alive ? lane.tone : 'var(--xk-faint)'}>
                  {lane.label}
                </text>
                <rect
                  x="10"
                  y={y}
                  width="800"
                  height="46"
                  fill="var(--xk-surface)"
                  stroke={alive ? lane.tone : 'var(--xk-line)'}
                  strokeWidth="2"
                  opacity={alive ? 1 : 0.45}
                />
                {carrying
                  ? [0, 1, 2, 3, 4].map((d) => (
                      <circle key={d} cx={30 + (((flow + d / 5) % 1) * 760)} cy={y + 23} r="7" fill={lane.tone} />
                    ))
                  : null}
                <text
                  x="828"
                  y={y + 30}
                  fontFamily="var(--xk-font-mono)"
                  fontSize="18"
                  fill={alive ? (carrying ? 'var(--xk-good)' : 'var(--xk-warn)') : 'var(--xk-critical)'}
                >
                  {alive ? (carrying ? 'carrying' : 'taking over') : 'dead with the grid'}
                </text>
              </g>
            );
          })}

          {cut ? (
            <g opacity={stage(t, CUT_AT, 240)}>
              <path d="M 10 26 H 1126" stroke="var(--xk-critical)" strokeWidth="2" strokeDasharray="10 6" />
              <text x="10" y="18" fontFamily="var(--xk-font-mono)" fontSize="16" fill="var(--xk-critical)">
                the grid goes at this moment
              </text>
            </g>
          ) : null}

          <Reveal t={t} at={ms(4.2)} from="up" as="g">
            <path d="M 10 336 H 1126" stroke="var(--xk-line)" strokeWidth="1" />
          </Reveal>

          {[
            [`${countUp(t, ms(4.4), ms(1.2), S2.failover_ms / 1000, { decimals: 1 })} s`, 'to move the session onto the radio', 'var(--xk-good)'],
            [`${countUp(t, ms(4.6), ms(1.2), S2.delivered_bytes / 1_000_000, { decimals: 1 })} MB`, 'still delivered through the outage', 'var(--xk-ink)'],
            [`${S2.receipts_verified}`, 'receipts still signed and checked', 'var(--xk-ink)'],
            ['0', 'bytes already paid for and lost', 'var(--xk-good)'],
          ].map(([value, label, tone], i) => (
            <Reveal key={label} t={t} at={ms(4.4) + i * 220} from="up" as="g">
              <text x={10 + i * 282} y="382" fontFamily="var(--xk-font-mono)" fontSize="34" fill={tone}>
                {value}
              </text>
              <text x={10 + i * 282} y="412" fontSize="16" fill="var(--xk-muted)">
                {label}
              </text>
            </Reveal>
          ))}
        </Stage>
      </div>
      <Foot source="web/src/proof/trace.json, scenario S2, grid cut at t = 2 s" right="measured, not modelled" />
    </div>
  );
}

function LastNetworkStanding({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="16 / the last network standing"
        title="The night nothing else works is the night people remember."
        lede="The fibre cabinet drains in an hour or two. The mast fills up. A box whose pass is a signature and whose meter is a counter keeps going."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 34, alignContent: 'start' }}>
        <div>
          <Reveal t={t} at={ms(0.3)} from="up" style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 21, color: 'var(--xk-accent)', marginBottom: 14 }}>
            A block in Kariobangi South, on a blackout night
          </Reveal>
          <Tick t={t} at={ms(0.7)} tone="var(--xk-accent)">
            Every mains powered access point in the building dies in the same second.
          </Tick>
          <Tick t={t} at={ms(1.4)} tone="var(--xk-accent)">
            Money stops too, because mobile money needs a data path, and you cannot buy a bundle
            without one.
          </Tick>
          <Tick t={t} at={ms(2.1)} tone="var(--xk-good)">
            The box keeps its radio up, keeps letting people on, and settles what is owed when the
            line comes back.
          </Tick>
        </div>

        <div>
          <Reveal t={t} at={ms(2.8)} from="up" style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 21, color: 'var(--xk-lora)', marginBottom: 14 }}>
            The Mathioya valley, after a landslide
          </Reveal>
          <Tick t={t} at={ms(3.2)} tone="var(--xk-lora)">
            Solar relays are dropped along the road and hop traffic across the break.
          </Tick>
          <Tick t={t} at={ms(3.9)} tone="var(--xk-lora)">
            Passes signed before the team drove out still work, because a box checks a pass without
            asking anyone.
          </Tick>
          <Tick t={t} at={ms(4.6)} tone="var(--xk-lora)">
            Nothing is installed. Everything is carried, dropped and picked up again.
          </Tick>
        </div>
      </div>
      <Reveal
        t={t}
        at={ms(5.6)}
        from="up"
        style={{
          borderTop: '1px solid var(--xk-line)',
          marginTop: 6,
          paddingTop: 14,
          fontSize: 23,
          lineHeight: 1.4,
          color: 'var(--xk-ink)',
        }}
      >
        This is also the growth story. People keep, and tell their neighbours about, the thing that
        was still working when nothing else was.
      </Reveal>
      <Foot
        source="docs/potential/00-last-network-standing.md and 05-disaster-relief-corridors.md"
        right={`${(stage(t, 0, ms(10), ease.linear) * 100).toFixed(0)}%`}
      />
    </div>
  );
}

export const RESILIENCE_SCENES = [
  {
    id: 'when-the-power-goes',
    title: 'When the power goes',
    duration: ms(10),
    caption:
      'Both carriers in the wiring die with the grid. The radio does not. In the simulation run the session moved onto the radio in eight tenths of a second, three megabytes still arrived, and nothing already paid for was lost.',
    Scene: WhenThePowerGoes,
  },
  {
    id: 'last-network-standing',
    title: 'The last network standing',
    duration: ms(10),
    caption:
      'In a blackout the fibre cabinet drains within hours and the mast fills up. A box that checks a pass by signature and keeps its accounts as a counter keeps serving and settles the arrears later. That convenience is what makes it spread.',
    Scene: LastNetworkStanding,
  },
];
