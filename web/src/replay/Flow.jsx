/*
 * The moving picture for one journey: actors as lifelines, one hop per stage,
 * the payload travelling along the path, and a check mark landing when the
 * validation for that hop passes. A pure function of `t`, so the player's
 * pause, replay and scrubber all work without this file knowing about them.
 */

import { Reveal, ease, lerp, stage } from '../player/index.js';

import { LAYERS } from './journeys.js';

const W = 1000;
const H = 562;
const TOP = 34;
const BOX_W = 150;
const BOX_H = 52;
const FIRST_ROW = 152;

function colorOf(layer) {
  return (LAYERS[layer] ?? { color: 'var(--xk-faint)' }).color;
}

export default function Flow({ t, animation }) {
  const { actors, hops, duration } = animation;
  const columns = actors.length;
  const gap = (W - 80) / columns;
  const x = (id) => {
    const index = actors.findIndex((actor) => actor.id === id);
    return 40 + gap * (index + 0.5);
  };
  const layerOf = (id) => (actors.find((actor) => actor.id === id) ?? {}).layer ?? 'protocol';

  const rows = Math.max(hops.length, 1);
  const rowH = Math.min(96, (H - FIRST_ROW - 40) / rows);
  const slot = duration / rows;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Journey flow">
      {/* lifelines */}
      {actors.map((actor) => (
        <line
          key={`life-${actor.id}`}
          x1={x(actor.id)}
          y1={TOP + BOX_H}
          x2={x(actor.id)}
          y2={H - 24}
          stroke="var(--xk-line)"
          strokeWidth="2"
          strokeDasharray="4 6"
        />
      ))}

      {/* actors */}
      {actors.map((actor, index) => (
        <Reveal key={actor.id} t={t} at={index * 120} duration={380} from="down" as="g">
          <rect
            x={x(actor.id) - BOX_W / 2}
            y={TOP}
            width={BOX_W}
            height={BOX_H}
            fill="var(--xk-surface)"
            stroke={colorOf(actor.layer)}
            strokeWidth="2"
          />
          <text
            x={x(actor.id)}
            y={TOP + 24}
            textAnchor="middle"
            fontFamily="var(--xk-font-mono)"
            fontSize="17"
            fill="var(--xk-ink)"
          >
            {actor.label}
          </text>
          <text
            x={x(actor.id)}
            y={TOP + 42}
            textAnchor="middle"
            fontFamily="var(--xk-font-mono)"
            fontSize="12"
            fill={colorOf(actor.layer)}
          >
            {actor.layer}
          </text>
        </Reveal>
      ))}

      {/* hops */}
      {hops.map((hop, index) => {
        const y = FIRST_ROW + index * rowH;
        const start = index * slot;
        const from = x(hop.from);
        const to = x(hop.to);
        const self = hop.from === hop.to;
        const color = colorOf(layerOf(hop.to));
        const travel = stage(t, start + slot * 0.2, slot * 0.5, ease.inOutSine);
        const arrived = travel >= 1;
        const dir = to >= from ? 1 : -1;
        const endX = self ? from : to - dir * 10;
        const px = self ? from + 46 : lerp(from, endX, travel);
        const py = self ? y + lerp(-14, 14, travel) : y;
        // Keep long labels and check lines inside the frame at every width.
        const labelWidth = hop.label.length * 8.6;
        const labelX = self
          ? Math.min(from + 62, W - 16 - labelWidth)
          : Math.min(Math.max((from + endX) / 2, 16 + labelWidth / 2), W - 16 - labelWidth / 2);
        const checkX = Math.max(
          16,
          Math.min(labelX - 8, W - 30 - String(hop.check ?? '').length * 8),
        );

        return (
          <g key={`${hop.from}-${hop.to}-${index}`}>
            <Reveal t={t} at={start} duration={320} from="left" as="g">
              <text
                x={labelX}
                y={y - 14}
                textAnchor={self ? 'start' : 'middle'}
                fontFamily="var(--xk-font-mono)"
                fontSize="15"
                fill="var(--xk-muted)"
              >
                {hop.label}
              </text>
              {self ? (
                <path
                  d={`M ${from} ${y - 16} h 30 a 16 16 0 0 1 0 32 h -30`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                />
              ) : (
                <line x1={from} y1={y} x2={endX} y2={y} stroke={color} strokeWidth="2" />
              )}
              {!self ? (
                <path
                  d={`M ${endX} ${y} l ${-dir * 10} -6 v 12 z`}
                  fill={color}
                />
              ) : null}
            </Reveal>

            {travel > 0 && travel < 1 ? (
              <g>
                <rect
                  x={px - 9}
                  y={py - 9}
                  width="18"
                  height="18"
                  fill={color}
                  stroke="var(--xk-surface)"
                  strokeWidth="2"
                />
              </g>
            ) : null}

            {arrived ? (
              <Reveal t={t} at={start + slot * 0.72} duration={300} from="pop" as="g">
                <path
                  d={`M ${checkX} ${y + 20} l 6 7 l 12 -14`}
                  fill="none"
                  stroke="var(--xk-good)"
                  strokeWidth="3"
                  strokeLinecap="square"
                />
                <text
                  x={checkX + 24}
                  y={y + 25}
                  fontFamily="var(--xk-font-mono)"
                  fontSize="13"
                  fill="var(--xk-good)"
                >
                  {hop.check}
                </text>
              </Reveal>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
