import { useId } from 'react';

import { lerp } from '../player/index.js';
import { FRAME, G, LEGEND, NET_KINDS, SHEET, TITLE_BLOCK, px } from './layout.js';
import { sheetNumber } from './devices.js';

/**
 * One blueprint sheet as inline SVG: module outlines, labelled orthogonal
 * traces, a boundary line where one is called for, a legend of the buses the
 * device actually uses, and a title block in the corner.
 *
 * Everything on the drawing comes from the device entry in devices.js, pin
 * numbers included, so the sheet and the pin table below it read the same data.
 *
 * `frame` is the output of layout.frameAt and makes the sheet animate; leaving
 * it null draws the finished sheet. `grid` draws the grid paper, which the
 * animation stage already paints for itself.
 */
export default function Sheet({ device, sheet, frame = null, grid = true, innerRef = null }) {
  const uid = useId().replace(/:/g, '');
  const gridId = `xk-bp-grid-${uid}`;
  const { n, of } = sheetNumber(device);
  const lit = frame?.lit ?? null;
  const drawn = frame?.drawn ?? null;

  return (
    <svg
      ref={innerRef}
      className="xk-bp-sheet"
      viewBox={`0 0 ${SHEET.w} ${SHEET.h}`}
      role="img"
      aria-label={`${device.name} blueprint sheet ${n} of ${of}`}
      style={{ fontFamily: 'var(--xk-font-mono)' }}
    >
      <defs>
        <pattern id={gridId} width={G} height={G} patternUnits="userSpaceOnUse">
          <path d={`M ${G} 0 L 0 0 0 ${G}`} fill="none" stroke="var(--xk-grid)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width={SHEET.w} height={SHEET.h} fill="var(--xk-ground)" />
      {grid ? <rect width={SHEET.w} height={SHEET.h} fill={`url(#${gridId})`} /> : null}

      <rect
        x={px(FRAME.x)}
        y={px(FRAME.y)}
        width={px(FRAME.w)}
        height={px(FRAME.h)}
        fill="none"
        stroke="var(--xk-accent)"
        strokeWidth="1.5"
      />

      {sheet.boundaries.map((line) => (
        <g key={line.label}>
          <line
            x1={line.px.x1}
            y1={line.px.y1}
            x2={line.px.x2}
            y2={line.px.y2}
            stroke="var(--xk-critical)"
            strokeWidth="1.3"
            strokeDasharray="10 6"
          />
          <text x={line.labelPx.x} y={line.labelPx.y} fontSize="10" fill="var(--xk-critical)" letterSpacing="0.06em">
            {line.label}
          </text>
        </g>
      ))}

      {sheet.nets.map((net) => (
        <Trace key={net.id} net={net} progress={drawn ? drawn[net.id] : 1} />
      ))}

      {sheet.boxes.map((box) => (
        <Module key={box.id} box={box} progress={lit ? lit[box.id] : 1} />
      ))}

      <Legend kinds={sheet.kinds} proposed={sheet.nets.some((net) => net.proposed)} />
      <TitleBlock device={device} n={n} of={of} />

      {frame?.packet ? <Packet packet={frame.packet} /> : null}
    </svg>
  );
}

/** One module outline. While it is lighting up its stroke settles from wide to hairline. */
function Module({ box, progress }) {
  const p = typeof progress === 'number' ? progress : 1;
  if (p <= 0.001) {
    return null;
  }
  const isBus = box.kind === 'bus';
  const base = box.kind === 'mcu' ? 2.2 : 1.5;
  const stroke = box.optional ? 'var(--xk-faint)' : isBus ? 'var(--xk-critical)' : 'var(--xk-accent)';
  const lines = wrap(box.sub ?? '', Math.floor((px(box.w) - 20) / 5.9), box.h >= 3 ? 2 : 1);

  return (
    <g opacity={p}>
      <rect
        x={box.px.x}
        y={box.px.y}
        width={box.px.w}
        height={box.px.h}
        fill={isBus ? 'var(--xk-surface-2)' : 'var(--xk-surface)'}
        stroke={stroke}
        strokeWidth={lerp(4, base, p)}
        strokeDasharray={box.optional ? '7 5' : undefined}
      />
      <text
        x={box.px.x + 10}
        y={box.px.y + 19}
        fontSize="12.5"
        fontWeight="600"
        fill="var(--xk-ink)"
        letterSpacing="0.02em"
      >
        {box.label}
      </text>
      {lines.map((line, i) => (
        <text key={line} x={box.px.x + 10} y={box.px.y + 34 + i * 13} fontSize="9.8" fill="var(--xk-muted)">
          {line}
        </text>
      ))}
      {box.optional ? (
        <text x={box.px.x + box.px.w - 8} y={box.px.y + 19} fontSize="9" fill="var(--xk-faint)" textAnchor="end">
          optional
        </text>
      ) : null}
    </g>
  );
}

/** One labelled trace. The path draws itself from the stroke dash offset. */
function Trace({ net, progress }) {
  const p = typeof progress === 'number' ? progress : 1;
  if (p <= 0.001) {
    return null;
  }
  const style = net.style ?? NET_KINDS.ctrl;
  const detail = net.pins.length > 0 ? `GPIO ${net.pins.join(' ')}` : net.note ?? '';
  const done = p >= 0.999;

  return (
    <g>
      <path
        d={net.d}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.width}
        strokeDasharray={done && style.dash ? style.dash : net.length}
        strokeDashoffset={done && style.dash ? undefined : net.length * (1 - p)}
        strokeLinecap="square"
        opacity={net.optional ? 0.65 : 1}
      />
      <g opacity={p > 0.6 ? (p - 0.6) / 0.4 : 0}>
        <text
          x={net.labelPos.x}
          y={net.labelPos.y}
          fontSize="10"
          textAnchor={net.labelPos.anchor}
          fill="var(--xk-ink)"
          stroke="var(--xk-ground)"
          strokeWidth="3.5"
          paintOrder="stroke"
          letterSpacing="0.03em"
        >
          {net.label}
        </text>
        {detail ? (
          <text
            x={net.labelPos.x}
            y={net.labelPos.y + 11}
            fontSize="9"
            textAnchor={net.labelPos.anchor}
            fill="var(--xk-faint)"
            stroke="var(--xk-ground)"
            strokeWidth="3.5"
            paintOrder="stroke"
          >
            {detail}
          </text>
        ) : null}
        {net.proposed ? (
          <text
            x={net.labelPos.x}
            y={net.labelPos.y + (detail ? 21 : 11)}
            fontSize="9"
            textAnchor={net.labelPos.anchor}
            fill="var(--xk-warn)"
            stroke="var(--xk-ground)"
            strokeWidth="3.5"
            paintOrder="stroke"
          >
            proposed
          </text>
        ) : null}
      </g>
    </g>
  );
}

/** The data frame travelling a bus, drawn as a small tagged packet. */
function Packet({ packet }) {
  return (
    <g>
      <rect
        x={packet.x - 9}
        y={packet.y - 6}
        width="18"
        height="12"
        fill="var(--xk-money)"
        stroke="var(--xk-ground)"
        strokeWidth="1.5"
      />
      <text
        x={packet.x}
        y={packet.y - 12}
        fontSize="10"
        textAnchor="middle"
        fill="var(--xk-money)"
        stroke="var(--xk-ground)"
        strokeWidth="3.5"
        paintOrder="stroke"
        letterSpacing="0.06em"
      >
        {packet.label}
      </text>
    </g>
  );
}

/** Only the buses this device uses, four to a row. */
function Legend({ kinds, proposed }) {
  const entries = kinds.map((kind) => ({ kind, ...(NET_KINDS[kind] ?? NET_KINDS.ctrl) }));
  const rows = [];
  for (let i = 0; i < entries.length; i += 4) {
    rows.push(entries.slice(i, i + 4));
  }

  return (
    <g>
      {rows.map((row, rowIndex) => (
        <g key={row.map((entry) => entry.kind).join('-')} transform={`translate(0 ${rowIndex * 22})`}>
          {row.map((entry, i) => {
            const x = px(LEGEND.x) + i * 168;
            const y = px(LEGEND.y);
            return (
              <g key={entry.kind}>
                <line
                  x1={x}
                  y1={y - 4}
                  x2={x + 22}
                  y2={y - 4}
                  stroke={entry.stroke}
                  strokeWidth={entry.width}
                  strokeDasharray={entry.dash}
                />
                <text x={x + 29} y={y} fontSize="9.5" fill="var(--xk-muted)">
                  {entry.tag}
                </text>
              </g>
            );
          })}
        </g>
      ))}
      {proposed ? (
        <text x={px(LEGEND.x)} y={px(LEGEND.y) + rows.length * 22 + 4} fontSize="9.5" fill="var(--xk-warn)">
          proposed: this repository allocation, pending sign-off
        </text>
      ) : null}
    </g>
  );
}

/** The corner block a real drawing carries: who, which revision, when, which sheet. */
function TitleBlock({ device, n, of }) {
  const x = px(TITLE_BLOCK.x);
  const y = px(TITLE_BLOCK.y);
  const w = px(TITLE_BLOCK.w);
  const h = px(TITLE_BLOCK.h);
  const headH = 30;
  const footH = 34;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="var(--xk-surface)" stroke="var(--xk-accent)" strokeWidth="1.5" />
      <line x1={x} y1={y + headH} x2={x + w} y2={y + headH} stroke="var(--xk-accent)" strokeWidth="1" />
      <line x1={x} y1={y + h - footH} x2={x + w} y2={y + h - footH} stroke="var(--xk-accent)" strokeWidth="1" />
      <line x1={x + w / 3} y1={y + h - footH} x2={x + w / 3} y2={y + h} stroke="var(--xk-accent)" strokeWidth="1" />
      <line x1={x + (w * 2) / 3} y1={y + h - footH} x2={x + (w * 2) / 3} y2={y + h} stroke="var(--xk-accent)" strokeWidth="1" />

      <text x={x + 12} y={y + 20} fontSize="12" fontWeight="600" fill="var(--xk-accent)" letterSpacing="0.18em">
        xKoin
      </text>
      <text x={x + w - 12} y={y + 20} fontSize="9.5" fill="var(--xk-faint)" textAnchor="end" letterSpacing="0.1em">
        BLOCK AND WIRING, NOT TO SCALE
      </text>

      <text x={x + 12} y={y + headH + 24} fontSize="15" fontWeight="600" fill="var(--xk-ink)" letterSpacing="0.01em">
        {device.name}
      </text>
      <text x={x + 12} y={y + headH + 41} fontSize="9.5" fill="var(--xk-muted)">
        {device.status}
      </text>

      <Cell x={x + 12} y={y + h - footH} label="REV" value={device.rev} />
      <Cell x={x + w / 3 + 12} y={y + h - footH} label="DATE" value={device.date} />
      <Cell x={x + (w * 2) / 3 + 12} y={y + h - footH} label="SHEET" value={`${n} of ${of}`} />
    </g>
  );
}

function Cell({ x, y, label, value }) {
  return (
    <g>
      <text x={x} y={y + 14} fontSize="8.5" fill="var(--xk-faint)" letterSpacing="0.14em">
        {label}
      </text>
      <text x={x} y={y + 27} fontSize="11" fill="var(--xk-ink)">
        {value}
      </text>
    </g>
  );
}

/** Greedy word wrap for a sub-label, capped at `maxLines`. */
function wrap(text, maxChars, maxLines) {
  if (!text) {
    return [];
  }
  const words = text.split(' ');
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) {
    lines.push(current);
  }
  return lines.slice(0, maxLines);
}
