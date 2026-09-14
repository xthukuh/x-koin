import { Reveal, ease, lerp, stage } from '../../player/index.js';

/**
 * Shared pieces for the investor deck.
 *
 * Two rules hold across every scene in this folder. The head (kicker, title,
 * lede) is drawn statically so the still the player shows at t = 0 is already
 * composed and readable, and every animated body element finishes well before
 * the scene duration so the still at t = duration is settled. Nothing here
 * holds state: every value is computed from `t`.
 */

/** The static head of a scene. Drawn at t = 0 exactly as it is at the end. */
export function Head({ kicker, title, lede, big = false, accent = null }) {
  return (
    <>
      <p className="xk-scene__kicker">{kicker}</p>
      <h2 className={big ? 'xk-scene__title xk-scene__title--big' : 'xk-scene__title'} style={accent ? { color: accent } : undefined}>
        {title}
      </h2>
      {lede ? <p className="xk-scene__lede">{lede}</p> : null}
    </>
  );
}

/** A hairline panel with a small mono label along its top edge. */
export function Panel({ label, children, style, tone = null }) {
  return (
    <div
      style={{
        border: `1px solid ${tone ?? 'var(--xk-line)'}`,
        background: 'var(--xk-surface)',
        padding: '14px 16px 16px',
        minWidth: 0,
        ...style,
      }}
    >
      {label ? (
        <div
          style={{
            fontFamily: 'var(--xk-font-mono)',
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: tone ?? 'var(--xk-faint)',
            marginBottom: 10,
          }}
        >
          {label}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** One line of a checklist that ticks itself on. */
export function Tick({ t, at, children, tone = 'var(--xk-good)', gap = 12 }) {
  const p = stage(t, at + 260, 380, ease.outBack);
  return (
    <Reveal t={t} at={at} from="up" style={{ display: 'flex', gap, alignItems: 'flex-start', marginBottom: 14 }}>
      <svg viewBox="0 0 24 24" width="26" height="26" style={{ flex: 'none', marginTop: 2 }}>
        <rect x="2" y="2" width="20" height="20" fill="none" stroke="var(--xk-line)" strokeWidth="2" />
        <path
          d="M 6 12 L 10.5 16.5 L 18 8"
          fill="none"
          stroke={tone}
          strokeWidth="2.6"
          strokeDasharray="20"
          strokeDashoffset={20 * (1 - p)}
        />
      </svg>
      <span style={{ fontSize: 20, lineHeight: 1.4 }}>{children}</span>
    </Reveal>
  );
}

/** A horizontal bar that grows to `value` of `max`, in an SVG. */
export function Bar({ t, at, x, y, width, height, value, max, fill, label, note }) {
  const p = stage(t, at, 900, ease.outQuart);
  const w = Math.max(0, (value / max) * width * p);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="1" />
      <rect x={x} y={y} width={w} height={height} fill={fill} />
      <text x={x} y={y - 10} fontFamily="var(--xk-font-mono)" fontSize="18" fill="var(--xk-muted)">
        {label}
      </text>
      {note ? (
        <text x={x + width + 14} y={y + height / 2 + 7} fontFamily="var(--xk-font-mono)" fontSize="20" fill="var(--xk-ink)" opacity={p}>
          {note}
        </text>
      ) : null}
    </g>
  );
}

/** A labelled box in an SVG flow, with its own entrance. */
export function FlowBox({ t, at, x, y, w, h, title, sub, tone = 'var(--xk-ink)' }) {
  return (
    <Reveal t={t} at={at} from="up" as="g">
      <rect x={x} y={y} width={w} height={h} fill="var(--xk-surface)" stroke={tone} strokeWidth="2" />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 4 : h / 2 + 6)} textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="18" fill="var(--xk-ink)">
        {title}
      </text>
      {sub ? (
        <text x={x + w / 2} y={y + h / 2 + 20} textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="15" fill={tone}>
          {sub}
        </text>
      ) : null}
    </Reveal>
  );
}

/** A connector that draws itself between two flow boxes. */
export function Link({ t, at, x1, x2, y, tone = 'var(--xk-line)', duration = 420 }) {
  const p = stage(t, at, duration, ease.outCubic);
  const length = Math.abs(x2 - x1);
  return (
    <g>
      <path
        d={`M ${x1} ${y} H ${x2}`}
        stroke={tone}
        strokeWidth="2"
        fill="none"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - p)}
      />
      <path
        d={`M ${x2 - 10} ${y - 6} L ${x2} ${y} L ${x2 - 10} ${y + 6}`}
        stroke={tone}
        strokeWidth="2"
        fill="none"
        opacity={p > 0.9 ? 1 : 0}
      />
    </g>
  );
}

/** A single dot travelling a straight line between `from` and `to`. */
export function Runner({ t, at, duration, from, to, y, tone = 'var(--xk-money)', r = 9 }) {
  const p = stage(t, at, duration, ease.linear);
  if (p <= 0 || p >= 1) {
    return null;
  }
  return <circle cx={lerp(from, to, p)} cy={y} r={r} fill={tone} />;
}

/** A console block whose lines print one after another. */
export function Console({ t, at, gap, lines, height = 300 }) {
  return (
    <div
      style={{
        background: 'var(--xk-console-bg)',
        border: '1px solid var(--xk-console-line)',
        color: 'var(--xk-console-ink)',
        fontFamily: 'var(--xk-font-mono)',
        fontSize: 17,
        lineHeight: 1.75,
        padding: '14px 18px',
        height,
        overflow: 'hidden',
      }}
    >
      {lines.map((line, i) => (
        <Reveal key={line.key ?? i} t={t} at={at + i * gap} duration={240} from="left" style={{ whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--xk-console-line)', marginRight: 12 }}>{String(i + 1).padStart(2, '0')}</span>
          <span style={{ color: line.tone ?? 'var(--xk-console-ink)' }}>{line.text}</span>
        </Reveal>
      ))}
    </div>
  );
}

/** The condition strip. Every conditional number on this deck carries one. */
export function Condition({ t, at, children }) {
  return (
    <Reveal
      t={t}
      at={at}
      from="up"
      style={{
        borderLeft: '3px solid var(--xk-warn)',
        background: 'var(--xk-surface-2)',
        padding: '10px 14px',
        fontSize: 17,
        lineHeight: 1.4,
        color: 'var(--xk-ink)',
      }}
    >
      <b style={{ fontFamily: 'var(--xk-font-mono)', color: 'var(--xk-warn)', marginRight: 8 }}>condition</b>
      {children}
    </Reveal>
  );
}

/** The standard scene foot: what the figures came from, and the clock. */
export function Foot({ source, right }) {
  return (
    <div className="xk-scene__foot">
      <span>{source}</span>
      <span>{right}</span>
    </div>
  );
}

/** A full-bleed SVG sized to the body box of a scene. */
export function Stage({ viewBox = '0 0 1136 400', children }) {
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      {children}
    </svg>
  );
}
