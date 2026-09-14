import { Reveal, ease, lerp, ms, shown, stage } from '../player/index.js';
import { buildingMonth, fmtMb } from './data.js';

const COLS = 10;
const ROWS = 10;
const COUNT = COLS * ROWS;
const CELL_W = 66;
const CELL_H = 48;
const GRID_X = 40;
const GRID_Y = 150;

const START = ms(1.2);
const GAP = 76;
export const MAP_DURATION = ms(11);

/**
 * A fixed order in which the hundred buildings light. A small linear
 * congruential generator with a constant seed, evaluated once at module load,
 * so the animation is identical on every play, every reload and every machine.
 * Math.random would break the one rule the player has: a scene is a pure
 * function of t.
 */
const ORDER = (() => {
  const rank = new Array(COUNT).fill(0);
  const pool = Array.from({ length: COUNT }, (unused, i) => i);
  let seed = 20260914;
  for (let step = 0; step < COUNT; step += 1) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const pick = seed % pool.length;
    rank[pool[pick]] = step;
    pool.splice(pick, 1);
  }
  return rank;
})();

function money(value) {
  return `KES ${Math.round(value).toLocaleString('en-US')}`;
}

function count(value) {
  return Math.round(value).toLocaleString('en-US');
}

/** One building glyph: a block with lit windows once it joins the network. */
function Building({ index, p }) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = GRID_X + col * CELL_W;
  const y = GRID_Y + row * CELL_H;
  const lit = p > 0.001;
  const rise = lerp(6, 0, p);

  return (
    <g transform={`translate(${x} ${y + rise})`}>
      <rect
        width="44"
        height="34"
        fill={lit ? 'var(--xk-accent-soft)' : 'var(--xk-surface)'}
        stroke={lit ? 'var(--xk-accent)' : 'var(--xk-line)'}
        strokeWidth="1.5"
      />
      {[0, 1, 2].map((wx) =>
        [0, 1].map((wy) => (
          <rect
            key={`${wx}-${wy}`}
            x={7 + wx * 12}
            y={7 + wy * 12}
            width="7"
            height="7"
            fill="var(--xk-money)"
            opacity={lit ? 0.25 + 0.75 * p : 0}
          />
        )),
      )}
      {lit ? (
        <circle cx="41" cy="3" r={2 + 2 * (1 - p)} fill="var(--xk-good)" opacity={p} />
      ) : null}
    </g>
  );
}

function Stat({ y, label, value, note, colour = 'var(--xk-ink)' }) {
  return (
    <g transform={`translate(760 ${y})`}>
      <text fontFamily="var(--xk-font-mono)" fontSize="15" fill="var(--xk-faint)" letterSpacing="1.6">
        {label.toUpperCase()}
      </text>
      <text y="42" fontFamily="var(--xk-font-mono)" fontSize="38" fontWeight="600" fill={colour}>
        {value}
      </text>
      {note ? (
        <text y="66" fontFamily="var(--xk-font-sans)" fontSize="15" fill="var(--xk-muted)">
          {note}
        </text>
      ) : null}
    </g>
  );
}

/**
 * A hundred buildings joining one at a time, with the money they produce rising
 * beside them. Every value is computed from the same buildingMonth() the
 * scenario table uses, so the picture and the table cannot disagree, and every
 * figure it shows is conditional on the placeholder unit price.
 */
export default function RevenueMap({ t }) {
  const one = buildingMonth();
  const lit = shown(t, START, GAP, COUNT);
  const gross = lit * one.gross;
  const treasury = lit * one.treasury;
  const operator = lit * one.operator;
  const mb = lit * one.mb;

  return (
    <svg className="xk-su-map" viewBox="0 0 1200 675" role="img" aria-label="One hundred buildings joining the network, with monthly revenue rising">
      <rect width="1200" height="675" fill="var(--xk-surface)" />

      <Reveal t={t} at={0} from="fade" as="g">
        <text x="40" y="52" fontFamily="var(--xk-font-mono)" fontSize="17" fill="var(--xk-faint)" letterSpacing="2.4">
          ONE BUILDING AT A TIME
        </text>
        <text x="40" y="100" fontFamily="var(--xk-font-mono)" fontSize="34" fontWeight="600" fill="var(--xk-ink)">
          Each block is one building: one Node, three relays, ten tenants.
        </text>
      </Reveal>

      <g style={{ opacity: stage(t, ms(0.6), 500, ease.outCubic) }}>
        {Array.from({ length: COUNT }, (unused, i) => (
          <Building index={i} key={i} p={stage(t, START + ORDER[i] * GAP, 420)} />
        ))}
      </g>

      <line
        x1="726"
        y1="140"
        x2="726"
        y2="640"
        stroke="var(--xk-line)"
        strokeWidth="1.5"
        style={{ opacity: stage(t, ms(0.9), 500) }}
      />

      <g style={{ opacity: stage(t, ms(1.0), 500) }}>
        <Stat
          y="160"
          label="buildings live"
          value={String(lit)}
          note={`${count(lit * 4)} nodes, ${count(lit * 10)} paying tenants`}
        />
        <Stat
          y="280"
          label="WAN sold a month"
          value={fmtMb(mb)}
          note="at 0.05 KES per MB, the placeholder price"
        />
        <Stat y="400" label="gross a month" value={money(gross)} note={`${money(operator)} to node operators`} colour="var(--xk-money)" />
        <Stat y="520" label="treasury share, 5 percent" value={money(treasury)} note="what the protocol keeps" colour="var(--xk-good)" />
      </g>

      <text
        x="40"
        y="662"
        fontFamily="var(--xk-font-sans)"
        fontSize="15"
        fill="var(--xk-faint)"
        style={{ opacity: stage(t, ms(2), 600) }}
      >
        Conditional on the 500 micro-KES per 10 KB unit price, which is a placeholder until it clears measured backhaul cost.
      </text>
    </svg>
  );
}
