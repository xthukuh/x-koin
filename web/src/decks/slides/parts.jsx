import { Reveal, countUp, draw, ease, item, lerp, loop, ms, pulse, shown, stage } from '../../player/index.js';

/**
 * The shared furniture of the invention deck.
 *
 * Every scene is a pure function of `t` and lives in the player's 1280x720
 * frame, so these helpers do the same: nothing here starts a timer, reads the
 * clock or holds state. A scene composes `Slide` with one body, and the body is
 * either a grid of the primitives below or one `Stage` of SVG.
 *
 * The drawing area inside `Slide` is 1136 wide. `Stage` picks its height from
 * how much furniture the slide put above it, so a scene passes the same `h` it
 * used in the viewBox and the picture is never squashed.
 */

/** Content width inside the scene padding: 1280 minus 72 left and 72 right. */
export const W = 1136;

/**
 * Body heights, measured against the furniture each combination puts above the
 * body. A one-line title and a one-line lede leave 412 px; every value here is
 * a little under its measured height so a title that wraps to two lines still
 * fits. `Stage` scales its drawing to the real box in any case, so these are
 * the design size rather than a hard limit.
 */
export const H = {
  full: 478, // kicker and title only
  lede: 445, // kicker, title and lede
  foot: 430, // kicker, title and a foot rule
  both: 400, // kicker, title, lede and a foot rule
};

export const COLOR = {
  ink: 'var(--xk-ink)',
  muted: 'var(--xk-muted)',
  faint: 'var(--xk-faint)',
  line: 'var(--xk-line)',
  soft: 'var(--xk-line-soft)',
  surface: 'var(--xk-surface)',
  accent: 'var(--xk-accent)',
  money: 'var(--xk-money)',
  good: 'var(--xk-good)',
  warn: 'var(--xk-warn)',
  bad: 'var(--xk-critical)',
  plc: 'var(--xk-plc)',
  nbplc: 'var(--xk-nbplc)',
  lora: 'var(--xk-lora)',
};

export const MONO = 'var(--xk-font-mono)';

/**
 * The one slide chrome: kicker, title, optional lede, body, optional foot.
 * `big` switches the title to the opening size.
 */
export function Slide({ t, kicker, title, big = false, lede = null, foot = null, children, bodyStyle = null }) {
  return (
    <div className="xk-scene">
      {kicker ? (
        <Reveal t={t} at={0} from="fade" duration={380}>
          <p className="xk-scene__kicker">{kicker}</p>
        </Reveal>
      ) : null}
      <Reveal t={t} at={ms(0.18)} from="up">
        <h2 className={`xk-scene__title${big ? ' xk-scene__title--big' : ''}`}>{title}</h2>
      </Reveal>
      {lede ? (
        <Reveal t={t} at={ms(0.5)} from="up">
          <p className="xk-scene__lede">{lede}</p>
        </Reveal>
      ) : null}
      <div className="xk-scene__body" style={bodyStyle ?? undefined}>{children}</div>
      {foot ? (
        <Reveal t={t} at={ms(0.9)} from="fade">
          <div className="xk-scene__foot">
            <span>{foot[0]}</span>
            <span>{foot[1]}</span>
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}

/**
 * The drawing surface, filling the slide body.
 *
 * A scene draws in a 1136 by `h` coordinate space and the surface fits that
 * space into whatever the body actually has, anchored top left. A title that
 * wraps to a second line therefore shrinks the picture a few percent instead of
 * pushing it through the bottom of the frame.
 */
export function Stage({ h = H.lede, children, style = null }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${h}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMinYMin meet"
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** A grid of blocks, used for stat rows and two-column bodies. */
export function Grid({ cols = 3, gap = 16, children, style = null }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap, ...style }}>
      {children}
    </div>
  );
}

/** One number with its label, on the shared stat card. */
export function Stat({ t, at = 0, value, label, tone = null, sub = null }) {
  return (
    <Reveal t={t} at={at} from="up" className="xk-scene__stat">
      <div className="xk-scene__stat-value" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      <div className="xk-scene__stat-label">{label}</div>
      {sub ? <div style={{ fontSize: 13, color: COLOR.faint, marginTop: 4, fontFamily: MONO }}>{sub}</div> : null}
    </Reveal>
  );
}

/** A compact figure for a strip of four, where a full stat card is too tall. */
export function MiniStat({ t, at = 0, value, label, tone = COLOR.ink }) {
  return (
    <Reveal
      t={t}
      at={at}
      from="up"
      style={{ border: `1px solid ${COLOR.line}`, background: COLOR.surface, padding: '9px 12px 11px', minWidth: 0 }}
    >
      <div style={{ fontFamily: MONO, fontSize: 25, fontWeight: 600, letterSpacing: '-0.02em', color: tone, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: COLOR.muted, marginTop: 4, lineHeight: 1.3 }}>{label}</div>
    </Reveal>
  );
}

/**
 * A staggered list of lines. Each item is `{ label, text, tone }`; the label is
 * the mono tag on the left and the text is the sentence beside it.
 */
export function Lines({ t, at = 0, gap = 260, items, size = 20, labelWidth = 150 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((entry, i) => (
        <Reveal
          key={entry.label ?? entry.text}
          t={t}
          at={at + i * gap}
          from="left"
          style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: size - 3,
              fontWeight: 600,
              color: entry.tone ?? COLOR.accent,
              minWidth: labelWidth,
              flex: '0 0 auto',
            }}
          >
            {entry.label}
          </span>
          <span style={{ fontSize: size, lineHeight: 1.35, color: COLOR.muted }}>{entry.text}</span>
        </Reveal>
      ))}
    </div>
  );
}

/** A bordered panel with a mono heading, for side-by-side comparisons. */
export function Panel({ t, at = 0, title, tone = COLOR.line, children, style = null, from = 'up' }) {
  return (
    <Reveal
      t={t}
      at={at}
      from={from}
      style={{
        border: `1px solid ${tone}`,
        background: COLOR.surface,
        padding: '16px 18px 18px',
        minWidth: 0,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 14,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: tone,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </Reveal>
  );
}

/** A small mono chip, for medium names and status marks. */
export function Chip({ label, tone = COLOR.accent, style = null }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 13,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: tone,
        border: `1px solid ${tone}`,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label}
    </span>
  );
}

/* ---------------------------------------------------------------- drawings */

/** A labelled box on the SVG stage. */
export function Box({ t, at = 0, x, y, w = 190, h = 82, label, sub = null, tone = COLOR.line, fill = COLOR.surface, dashed = false }) {
  return (
    <Reveal t={t} at={at} from="up" as="g">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        stroke={tone}
        strokeWidth="2.5"
        strokeDasharray={dashed ? '7 5' : undefined}
      />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 7)} textAnchor="middle" fontFamily={MONO} fontSize="19" fontWeight="600" fill={COLOR.ink}>
        {label}
      </text>
      {sub ? (
        <text x={x + w / 2} y={y + h / 2 + 22} textAnchor="middle" fontFamily={MONO} fontSize="14" fill={COLOR.muted}>
          {sub}
        </text>
      ) : null}
    </Reveal>
  );
}

/** A link between two points that draws itself, with an optional label above. */
export function Wire({ t, at = 0, d, tone = COLOR.line, width = 3, length = 400, dashed = false, duration = 520, label = null, lx = 0, ly = 0 }) {
  const p = stage(t, at, duration, ease.inOutCubic);
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={tone}
        strokeWidth={width}
        strokeDasharray={dashed ? '9 6' : undefined}
        style={dashed ? { opacity: p } : draw(p, length)}
      />
      {label ? (
        <Reveal t={t} at={at + duration * 0.6} from="fade" as="g">
          <text x={lx} y={ly} textAnchor="middle" fontFamily={MONO} fontSize="14" fill={tone}>
            {label}
          </text>
        </Reveal>
      ) : null}
    </g>
  );
}

/** A dot travelling a straight run between two x positions at one y. */
export function Packet({ t, at, duration, x1, x2, y, tone = COLOR.money, r = 9, easing = ease.linear }) {
  const p = stage(t, at, duration, easing);
  if (p <= 0 || p >= 1) {
    return null;
  }
  return <circle cx={lerp(x1, x2, p)} cy={y} r={r} fill={tone} />;
}

/** A tick or a cross with a sentence, for the verdict lines in the attack deck. */
export function Verdict({ t, at = 0, ok = true, text, size = 21 }) {
  return (
    <Reveal t={t} at={at} from="left" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <svg viewBox="0 0 24 24" width="22" height="22" style={{ flex: '0 0 auto', marginTop: 3 }} aria-hidden="true">
        {ok ? (
          <path d="M4 13l5 5L20 6" fill="none" stroke={COLOR.good} strokeWidth="3" strokeLinecap="square" />
        ) : (
          <path d="M5 5l14 14M19 5L5 19" fill="none" stroke={COLOR.bad} strokeWidth="3" strokeLinecap="square" />
        )}
      </svg>
      <span style={{ fontSize: size, lineHeight: 1.35, color: COLOR.muted }}>{text}</span>
    </Reveal>
  );
}

/** A horizontal bar whose fill grows from t, used for throughput comparisons. */
export function Bar({ t, at = 0, x, y, w, h = 22, fill, tone, label = null, duration = 700 }) {
  const p = stage(t, at, duration, ease.outQuart);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={COLOR.soft} strokeWidth="1" />
      <rect x={x} y={y} width={Math.max(0, w * fill * p)} height={h} fill={tone} />
      {label ? (
        <text x={x + w + 12} y={y + h - 5} fontFamily={MONO} fontSize="15" fill={COLOR.muted} opacity={p}>
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** A byte cell for the frame diagram: offset above, field name inside. */
export function ByteField({ t, at = 0, x, y, w, h = 56, name, offset, tone = COLOR.accent, note = null }) {
  const p = stage(t, at, 420, ease.outBack);
  if (p <= 0.001) {
    return null;
  }
  return (
    <g opacity={Math.min(1, p)}>
      <rect x={x} y={y} width={w} height={h} fill={COLOR.surface} stroke={tone} strokeWidth="2" />
      <text x={x + w / 2} y={y - 8} textAnchor="middle" fontFamily={MONO} fontSize="13" fill={COLOR.faint}>
        {offset}
      </text>
      <text x={x + w / 2} y={y + (note ? h / 2 - 1 : h / 2 + 6)} textAnchor="middle" fontFamily={MONO} fontSize="15" fontWeight="600" fill={COLOR.ink}>
        {name}
      </text>
      {note ? (
        <text x={x + w / 2} y={y + h / 2 + 18} textAnchor="middle" fontFamily={MONO} fontSize="12.5" fill={COLOR.muted}>
          {note}
        </text>
      ) : null}
    </g>
  );
}

/** The mono code block used for wire formats and struct definitions. */
export function Code({ t, at = 0, lines, size = 19, tone = COLOR.ink, gap = 90 }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: size, lineHeight: 1.55, color: tone }}>
      {lines.map((line, i) => (
        <Reveal key={`${i}-${line}`} t={t} at={at + i * gap} from="fade" duration={300}>
          <div style={{ whiteSpace: 'pre' }}>{line === '' ? ' ' : line}</div>
        </Reveal>
      ))}
    </div>
  );
}

/** A two-column table rendered as rows, staggered in. */
export function Rows({ t, at = 0, gap = 170, head, rows, widths = ['30%', '70%'], size = 18 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {head ? (
        <Reveal t={t} at={at} from="fade" style={{ display: 'flex', borderBottom: `1px solid ${COLOR.line}`, paddingBottom: 6 }}>
          {head.map((cell, i) => (
            <span
              key={cell}
              style={{
                width: widths[i],
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: COLOR.faint,
              }}
            >
              {cell}
            </span>
          ))}
        </Reveal>
      ) : null}
      {rows.map((row, i) => (
        <Reveal
          key={row[0]}
          t={t}
          at={at + (head ? gap : 0) + i * gap}
          from="up"
          style={{ display: 'flex', borderBottom: `1px solid ${COLOR.soft}`, padding: '7px 0' }}
        >
          {row.map((cell, j) => (
            <span
              key={`${row[0]}-${j}`}
              style={{
                width: widths[j],
                fontSize: size,
                lineHeight: 1.3,
                color: j === 0 ? COLOR.ink : COLOR.muted,
                fontFamily: j === 0 ? MONO : undefined,
                fontWeight: j === 0 ? 600 : undefined,
                paddingRight: 12,
              }}
            >
              {cell}
            </span>
          ))}
        </Reveal>
      ))}
    </div>
  );
}

/**
 * The template every attack scene uses: what is tried on the left, the check
 * that catches it on the right, and the Law and the test underneath.
 */
export function AttackSlide({ t, n, title, lede, attempt, defence, law, test, earns = 'nothing' }) {
  return (
    <Slide
      t={t}
      kicker={`attack vector ${String(n).padStart(2, '0')} of 10`}
      title={title}
      lede={lede}
      foot={[law, `test: ${test}`]}
    >
      <Grid cols={2} gap={22}>
        <Panel t={t} at={ms(1.0)} title="the attempt" tone={COLOR.bad}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {attempt.map((line, i) => (
              <Verdict key={line} t={t} at={ms(1.3) + i * 240} ok={false} text={line} size={19} />
            ))}
          </div>
        </Panel>
        <Panel t={t} at={ms(1.2)} title="the check that catches it" tone={COLOR.good}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {defence.map((line, i) => (
              <Verdict key={line} t={t} at={ms(2.2) + i * 240} ok text={line} size={19} />
            ))}
          </div>
        </Panel>
      </Grid>
      <Reveal
        t={t}
        at={ms(3.6)}
        from="up"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          border: `1px solid ${COLOR.line}`,
          background: 'var(--xk-surface-2)',
          padding: '10px 16px',
          fontFamily: MONO,
          fontSize: 18,
        }}
      >
        <span style={{ color: COLOR.faint }}>what the attacker earns: </span>
        <span style={{ color: COLOR.good, fontWeight: 600 }}>{earns}</span>
      </Reveal>
    </Slide>
  );
}

/** The timing helpers, re-exported so a scene imports one module. */
export { Reveal, countUp, draw, ease, item, lerp, loop, ms, pulse, shown, stage };
