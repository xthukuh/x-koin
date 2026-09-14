import { Reveal, countUp, ease, item, ms, pulse, stage } from '../../player/index.js';

import { Bar, Foot, Head, Stage } from './parts.jsx';

/**
 * Scenes 01 and 02: the problem, in one Kenyan block of flats.
 *
 * Every figure here comes from docs/papers/01-problem-and-market.md section 2
 * and section 4, recorded in the design suite on 2026-09-12 and marked there
 * for re-verification before it is quoted publicly.
 */

const FLATS = [
  { fibre: false },
  { fibre: true },
  { fibre: false },
  { fibre: false },
  { fibre: false },
  { fibre: false },
  { fibre: false },
  { fibre: true },
  { fibre: false },
  { fibre: false },
  { fibre: false },
  { fibre: false },
];

function Neighbourhood({ t }) {
  const glow = pulse(t, 2000);
  return (
    <div className="xk-scene">
      <Head
        kicker="01 / the problem"
        title="Twelve flats. Two have a proper line. Ten buy data a day at a time."
        lede="A walk-up block off Outering Road. Mains wiring in every room, and no data infrastructure at all."
      />
      <div className="xk-scene__body">
        <Stage>
          <Reveal t={t} at={ms(0.2)} from="up" as="g">
            <rect x="48" y="24" width="420" height="356" fill="var(--xk-surface)" stroke="var(--xk-ink)" strokeWidth="2" />
            <path d="M 30 24 L 258 0 L 486 24" fill="none" stroke="var(--xk-ink)" strokeWidth="2" />
            <rect x="228" y="318" width="60" height="62" fill="var(--xk-surface-2)" stroke="var(--xk-ink)" strokeWidth="2" />
          </Reveal>

          {FLATS.map((flat, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = 86 + col * 124;
            const y = 52 + row * 76;
            const p = item(t, ms(0.7), i, 120, 420, ease.outBack);
            const tone = flat.fibre ? 'var(--xk-accent)' : 'var(--xk-money)';
            return (
              <g key={i} opacity={p}>
                <rect x={x} y={y} width="92" height="52" fill="var(--xk-ground)" stroke="var(--xk-line)" strokeWidth="1.5" />
                <rect
                  x={x + 6}
                  y={y + 6}
                  width="80"
                  height="40"
                  fill={tone}
                  opacity={(flat.fibre ? 0.62 : 0.34) * p * (0.82 + 0.18 * glow)}
                />
              </g>
            );
          })}

          <Reveal t={t} at={ms(2.6)} from="left" as="g">
            <rect x="536" y="34" width="26" height="26" fill="var(--xk-accent)" opacity="0.62" stroke="var(--xk-line)" />
            <text x="580" y="46" fontFamily="var(--xk-font-mono)" fontSize="22" fill="var(--xk-ink)">
              2 flats on a monthly line
            </text>
            <text x="580" y="74" fontSize="18" fill="var(--xk-muted)">
              paying roughly KES 10 a gigabyte
            </text>
          </Reveal>

          <Reveal t={t} at={ms(3.2)} from="left" as="g">
            <rect x="536" y="120" width="26" height="26" fill="var(--xk-money)" opacity="0.34" stroke="var(--xk-line)" />
            <text x="580" y="132" fontFamily="var(--xk-font-mono)" fontSize="22" fill="var(--xk-ink)">
              10 flats on daily passes
            </text>
            <text x="580" y="160" fontSize="18" fill="var(--xk-muted)">
              paying KES 40 to KES 80 a gigabyte
            </text>
          </Reveal>

          <Reveal t={t} at={ms(4.2)} from="up" as="g">
            <path d="M 536 212 H 1096" stroke="var(--xk-line)" strokeWidth="1" />
            <text x="536" y="252" fontFamily="var(--xk-font-mono)" fontSize="26" fill="var(--xk-critical)">
              The cheap line already ends in this building.
            </text>
            <text x="536" y="288" fontSize="20" fill="var(--xk-muted)">
              Ten households have no way to share it, so they buy the
            </text>
            <text x="536" y="316" fontSize="20" fill="var(--xk-muted)">
              same bytes at four to eight times the price, one day at a time.
            </text>
          </Reveal>
        </Stage>
      </div>
      <Foot source="docs/papers/01-problem-and-market.md, sections 2 and 4" right="Roysambu, Kasarani, Kariobangi South" />
    </div>
  );
}

function EightTimes({ t }) {
  const rate = (target, at) => countUp(t, at, ms(1.1), target, { decimals: 0 });
  return (
    <div className="xk-scene">
      <Head
        kicker="02 / the price of buying small"
        title="Same bytes. Up to eight times the price."
        lede="The gap is not bandwidth. It is being allowed to pay in small amounts."
      />
      <div className="xk-scene__body">
        <Stage viewBox="0 0 1136 470">
          <Bar
            t={t}
            at={ms(0.5)}
            x={40}
            y={64}
            width={640}
            height={54}
            value={80}
            max={80}
            fill="var(--xk-critical)"
            label="Daily pass, 250 MB for KES 20"
            note={`KES ${rate(80, ms(0.7))} per GB`}
          />
          <Bar
            t={t}
            at={ms(1.1)}
            x={40}
            y={182}
            width={640}
            height={54}
            value={40}
            max={80}
            fill="var(--xk-money)"
            label="Daily pack, 500 MB for KES 20"
            note={`KES ${rate(40, ms(1.3))} per GB`}
          />
          <Bar
            t={t}
            at={ms(1.7)}
            x={40}
            y={300}
            width={640}
            height={54}
            value={10}
            max={80}
            fill="var(--xk-good)"
            label="Home fibre, 10 Mbps, KES 2,999 a month"
            note={`KES ${rate(10, ms(1.9))} per GB`}
          />

          <Reveal t={t} at={ms(3.0)} from="up" as="g">
            <path d="M 40 392 H 1096" stroke="var(--xk-line)" strokeWidth="1" />
            <text x="40" y="432" fontSize="21" fill="var(--xk-ink)">
              A household that can pay KES 2,999 once a month gets a rate eight times better than a
            </text>
            <text x="40" y="460" fontSize="21" fill="var(--xk-ink)">
              household that pays KES 20 at a time. The second one is paying for the billing model.
            </text>
          </Reveal>
        </Stage>
      </div>
      <Foot
        source="Recorded 2026-09-12. Re-verify before quoting; Kenyan tariffs change several times a year."
        right={`${(stage(t, 0, ms(4), ease.linear) * 100).toFixed(0)}%`}
      />
    </div>
  );
}

export const PROBLEM_SCENES = [
  {
    id: 'neighbourhood',
    title: 'Twelve flats, two lines',
    duration: ms(9),
    caption:
      'In a walk-up block off Outering Road, two households pay for a monthly line. The other ten buy a daily pass, one day at a time, and pay four to eight times as much for every gigabyte.',
    Scene: Neighbourhood,
  },
  {
    id: 'eight-times',
    title: 'The price of buying small',
    duration: ms(8),
    caption:
      'A daily pass works out near eighty shillings a gigabyte. A monthly fibre line is about ten. Nobody is getting worse bytes. They are paying for the right to buy in twenty shilling steps. These prices were recorded on 2026-09-12.',
    Scene: EightTimes,
  },
];
