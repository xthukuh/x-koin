import { fmtKes } from '../lib/money.js';
import {
  BOARD_UNIT_KES,
  CROSSOVER,
  KIT_UNIT_KES,
  VOLUMES,
  boardCostAt,
  kitCostAt,
} from './data.js';

/**
 * Unit cost against volume for the two paths, as a step chart drawn from the
 * same four columns the table above prints. No charting library: the axes are
 * logarithmic in both directions because the board path spans two orders of
 * magnitude between ten units and ten thousand, and a linear axis would show
 * one line and a flat floor.
 *
 * Solid steps are the tier figures. The faint dashed curves are the log
 * interpolation between tiers that the crossover is solved on, so the marked
 * crossing is visibly the crossing of the lines it was computed from.
 */

const W = 960;
const H = 470;
const PAD = { left: 92, right: 28, top: 28, bottom: 74 };

const X_MIN = 7;
const X_MAX = 22000;
const Y_MIN = 4000;
const Y_MAX = 700000;

const Y_TICKS = [5000, 10000, 20000, 50000, 100000, 200000, 500000];

const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;

function sx(v) {
  return PAD.left + ((Math.log10(v) - Math.log10(X_MIN)) / (Math.log10(X_MAX) - Math.log10(X_MIN))) * plotW;
}

function sy(v) {
  return PAD.top + plotH - ((Math.log10(v) - Math.log10(Y_MIN)) / (Math.log10(Y_MAX) - Math.log10(Y_MIN))) * plotH;
}

/** A step path: one horizontal run per tier, joined by vertical risers. */
function stepPath(values) {
  const parts = [`M ${sx(X_MIN)} ${sy(values[0])}`];
  for (let i = 0; i < values.length; i += 1) {
    const next = i + 1 < VOLUMES.length ? VOLUMES[i + 1] : X_MAX;
    parts.push(`L ${sx(next)} ${sy(values[i])}`);
    if (i + 1 < values.length) {
      parts.push(`L ${sx(next)} ${sy(values[i + 1])}`);
    }
  }
  return parts.join(' ');
}

/** The smooth log interpolation the crossover is solved on. */
function curvePath(costAt) {
  const points = [];
  const steps = 90;
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    const v = VOLUMES[0] * (VOLUMES[VOLUMES.length - 1] / VOLUMES[0]) ** f;
    points.push(`${i === 0 ? 'M' : 'L'} ${sx(v)} ${sy(costAt(v))}`);
  }
  return points.join(' ');
}

function shortKes(value) {
  if (value >= 100000) {
    return `${Math.round(value / 1000)}k`;
  }
  if (value >= 10000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${(value / 1000).toFixed(1)}k`;
}

export default function CostChart() {
  const crossX = CROSSOVER.units ? sx(CROSSOVER.units) : null;
  const crossY = CROSSOVER.units ? sy(kitCostAt(CROSSOVER.units)) : null;

  return (
    <figure className="xk-mfg-chart">
      <div className="xk-mfg-chart__scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="xk-mfg-chart__svg"
          role="img"
          aria-label={`Unit cost against volume. The kit of modules costs ${fmtKes(
            KIT_UNIT_KES[0],
          )} per Node at ten units and ${fmtKes(
            KIT_UNIT_KES[3],
          )} at ten thousand. The merged board costs ${fmtKes(BOARD_UNIT_KES[0])} at ten units and ${fmtKes(
            BOARD_UNIT_KES[3],
          )} at ten thousand, and becomes the cheaper path at about ${CROSSOVER.rounded} units.`}
        >
          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} y1={sy(tick)} x2={W - PAD.right} y2={sy(tick)} stroke="var(--xk-line-soft)" strokeWidth="1" />
              <text x={PAD.left - 12} y={sy(tick) + 5} textAnchor="end" fontFamily="var(--xk-font-mono)" fontSize="15" fill="var(--xk-faint)">
                {shortKes(tick)}
              </text>
            </g>
          ))}

          {VOLUMES.map((volume) => (
            <g key={volume}>
              <line x1={sx(volume)} y1={PAD.top} x2={sx(volume)} y2={PAD.top + plotH} stroke="var(--xk-line-soft)" strokeWidth="1" />
              <text
                x={sx(volume)}
                y={PAD.top + plotH + 26}
                textAnchor="middle"
                fontFamily="var(--xk-font-mono)"
                fontSize="15"
                fill="var(--xk-muted)"
              >
                {volume.toLocaleString('en-US')}
              </text>
            </g>
          ))}

          <text
            x={PAD.left - 12}
            y={PAD.top - 10}
            textAnchor="end"
            fontFamily="var(--xk-font-mono)"
            fontSize="13"
            fill="var(--xk-faint)"
          >
            KES
          </text>
          <text
            x={PAD.left + plotW / 2}
            y={H - 18}
            textAnchor="middle"
            fontFamily="var(--xk-font-mono)"
            fontSize="14"
            fill="var(--xk-faint)"
          >
            units built (both axes logarithmic)
          </text>

          <path d={curvePath(kitCostAt)} fill="none" stroke="var(--xk-money)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
          <path d={curvePath(boardCostAt)} fill="none" stroke="var(--xk-accent)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />

          <path d={stepPath(KIT_UNIT_KES)} fill="none" stroke="var(--xk-money)" strokeWidth="3" />
          <path d={stepPath(BOARD_UNIT_KES)} fill="none" stroke="var(--xk-accent)" strokeWidth="3" />

          {crossX !== null ? (
            <g>
              <line x1={crossX} y1={PAD.top} x2={crossX} y2={PAD.top + plotH} stroke="var(--xk-good)" strokeWidth="2" strokeDasharray="6 5" />
              <circle cx={crossX} cy={crossY} r="6" fill="var(--xk-good)" />
              <text x={crossX + 12} y={PAD.top + 22} fontFamily="var(--xk-font-mono)" fontSize="15" fill="var(--xk-good)">
                about {CROSSOVER.rounded.toLocaleString('en-US')} units
              </text>
              <text x={crossX + 12} y={PAD.top + 42} fontFamily="var(--xk-font-mono)" fontSize="13" fill="var(--xk-good)">
                the board becomes the cheaper path
              </text>
            </g>
          ) : null}

          {VOLUMES.map((volume, i) => (
            <g key={`marks-${volume}`}>
              <circle cx={sx(volume)} cy={sy(KIT_UNIT_KES[i])} r="4.5" fill="var(--xk-money)" />
              <circle cx={sx(volume)} cy={sy(BOARD_UNIT_KES[i])} r="4.5" fill="var(--xk-accent)" />
            </g>
          ))}

          <g>
            <rect x={W - PAD.right - 250} y={PAD.top + plotH - 66} width="250" height="58" fill="var(--xk-surface)" stroke="var(--xk-line)" />
            <line x1={W - PAD.right - 236} y1={PAD.top + plotH - 46} x2={W - PAD.right - 206} y2={PAD.top + plotH - 46} stroke="var(--xk-money)" strokeWidth="3" />
            <text x={W - PAD.right - 196} y={PAD.top + plotH - 41} fontFamily="var(--xk-font-mono)" fontSize="14" fill="var(--xk-ink)">
              kit of modules
            </text>
            <line x1={W - PAD.right - 236} y1={PAD.top + plotH - 24} x2={W - PAD.right - 206} y2={PAD.top + plotH - 24} stroke="var(--xk-accent)" strokeWidth="3" />
            <text x={W - PAD.right - 196} y={PAD.top + plotH - 19} fontFamily="var(--xk-font-mono)" fontSize="14" fill="var(--xk-ink)">
              merged board
            </text>
          </g>
        </svg>
      </div>
      <figcaption className="xk-note">
        Solid steps are the four columns of the table above. The faint dashed curves are the log interpolation between
        those columns, and the crossing marked on them at about {CROSSOVER.rounded.toLocaleString('en-US')} units is
        solved from the same figures rather than asserted. Every figure behind both lines is an estimate, so read the
        crossing as an order of magnitude: the merged board pays for itself in the low thousands of units.
      </figcaption>
    </figure>
  );
}
