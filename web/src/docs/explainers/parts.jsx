/**
 * Shared drawing parts for the docs explainers.
 *
 * Every explainer is a pure function of `t` drawn in a 960 by 540 frame, so
 * these helpers take a progress number rather than owning any state. Colours
 * are theme tokens, which is why a diagram reads the same in light and dark.
 */

export const FRAME = { w: 960, h: 540 };

export const MONO = 'var(--xk-font-mono)';

/** A labelled station box, faded and lifted by its own progress `p`. */
export function Box({
  x,
  y,
  w = 140,
  h = 76,
  label,
  sub = '',
  tint = 'var(--xk-accent)',
  p = 1,
  dim = false,
  fill = 'var(--xk-surface)',
}) {
  if (p <= 0) {
    return null;
  }
  const lift = (1 - p) * 14;
  return (
    <g opacity={dim ? 0.35 * p : p} transform={`translate(0 ${lift})`}>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        fill={fill}
        stroke={dim ? 'var(--xk-line)' : tint}
        strokeWidth="2"
      />
      <text
        x={x}
        y={sub ? y - 2 : y + 6}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="19"
        fontWeight="600"
        fill={dim ? 'var(--xk-faint)' : 'var(--xk-ink)'}
      >
        {label}
      </text>
      {sub ? (
        <text x={x} y={y + 22} textAnchor="middle" fontFamily={MONO} fontSize="13" fill="var(--xk-muted)">
          {sub}
        </text>
      ) : null}
    </g>
  );
}

/** A small tag under or beside something, for a medium name or a byte count. */
export function Tag({ x, y, text, tint = 'var(--xk-muted)', p = 1, anchor = 'middle', size = 13 }) {
  if (p <= 0 || !text) {
    return null;
  }
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={MONO} fontSize={size} fill={tint} opacity={p}>
      {text}
    </text>
  );
}

/** A travelling packet: a square with an optional letter inside. */
export function Packet({ x, y, size = 16, tint = 'var(--xk-money)', p = 1, glow = 0 }) {
  if (p <= 0) {
    return null;
  }
  const half = size / 2;
  return (
    <g opacity={p}>
      <rect
        x={x - half - glow * 2}
        y={y - half - glow * 2}
        width={size + glow * 4}
        height={size + glow * 4}
        fill={tint}
      />
    </g>
  );
}

/** A receipt or ticket chip: a card with a title line and a value line. */
export function Chip({ x, y, w = 132, h = 52, title, value, tint = 'var(--xk-good)', p = 1, scale = 1 }) {
  if (p <= 0) {
    return null;
  }
  return (
    <g opacity={p} transform={`translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="var(--xk-surface)" stroke={tint} strokeWidth="2" />
      <text x={x} y={y - 4} textAnchor="middle" fontFamily={MONO} fontSize="12" fill={tint}>
        {title}
      </text>
      <text x={x} y={y + 15} textAnchor="middle" fontFamily={MONO} fontSize="15" fontWeight="600" fill="var(--xk-ink)">
        {value}
      </text>
    </g>
  );
}

/** A straight link between two points that draws itself as `p` runs 0 to 1. */
export function Link({ x1, y1, x2, y2, p = 1, tint = 'var(--xk-line)', width = 2, dash = '' }) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={tint}
      strokeWidth={width}
      strokeDasharray={dash || length}
      strokeDashoffset={dash ? 0 : length * (1 - Math.min(Math.max(p, 0), 1))}
      opacity={dash ? p : 1}
    />
  );
}

/** The one-line note that sits along the bottom of a frame. */
export function Foot({ text, p = 1, tint = 'var(--xk-muted)' }) {
  if (p <= 0 || !text) {
    return null;
  }
  return (
    <g opacity={p}>
      <line x1="60" y1="470" x2={FRAME.w - 60} y2="470" stroke="var(--xk-line)" strokeWidth="1" />
      <text x="60" y="497" fontFamily={MONO} fontSize="17" fill={tint}>
        {text}
      </text>
    </g>
  );
}
