import { countUp, ease, item, lerp, ms, stage } from '../../player/index.js';

import { Box, Chip, FRAME, Foot, Link, MONO, Tag } from './parts.jsx';

/**
 * Why a session costs one transaction and not twelve thousand.
 *
 * Twelve signed receipts accumulate at the edge, each one carrying the whole
 * session total rather than an increment. Eleven of them can be lost without
 * costing anything, because the twelfth already says everything they said. That
 * last one becomes the EIP-712 ticket, and the ticket is the only thing that
 * ever reaches the chain.
 */

const RECEIPTS = 12;
const UNITS_EACH = 341;
const COLUMNS = 2;

function seat(i) {
  const column = i % COLUMNS;
  const row = Math.floor(i / COLUMNS);
  return { x: 110 + column * 150, y: 96 + row * 58 };
}

export default function Settlement({ t }) {
  const last = RECEIPTS - 1;
  const lastSeat = seat(last);
  const collapse = stage(t, ms(3.6), ms(1.1), ease.inOutCubic);
  const toTicket = stage(t, ms(4.9), 600);
  const fly = stage(t, ms(5.9), ms(0.9), ease.inOutCubic);
  const chain = stage(t, ms(5.2), 500);
  const absorbed = stage(t, ms(6.7), 400);
  const moved = stage(t, ms(6.9), 400);
  const foot = stage(t, ms(8.4), 600);

  const cx = lerp(lerp(lastSeat.x, 430, collapse), 790, fly);
  const cy = lerp(lerp(lastSeat.y, 250, collapse), 250, fly);
  const scale = lerp(1, 1.35, collapse) * lerp(1, 0.85, fly);

  return (
    <svg viewBox={`0 0 ${FRAME.w} ${FRAME.h}`} role="img" aria-label="Twelve local receipts collapsing into one on-chain settlement">
      <Tag x={185} y={62} text="off chain, at the edge" tint="var(--xk-faint)" p={stage(t, 0, 400)} />
      <Tag x={790} y={62} text="on chain, once" tint="var(--xk-money)" p={chain} />
      <Link x1={560} y1={80} x2={560} y2={440} p={stage(t, ms(0.4), 600)} tint="var(--xk-line)" width={1} dash="5 7" />

      {Array.from({ length: RECEIPTS }, (unused, i) => {
        const appear = item(t, ms(0.2), i, 230, 380);
        if (appear <= 0) {
          return null;
        }
        const isLast = i === last;
        const gone = isLast ? 0 : stage(t, ms(3.4) + i * 45, 520);
        if (!isLast && gone >= 1) {
          return null;
        }
        const spot = isLast ? { x: cx, y: cy } : seat(i);
        return (
          <Chip
            key={i}
            x={spot.x}
            y={spot.y}
            w={128}
            h={44}
            title={isLast && toTicket > 0.5 ? 'EIP-712 TICKET' : `RECEIPT seq ${i + 1}`}
            value={`${((i + 1) * UNITS_EACH).toLocaleString('en-KE')} units`}
            tint={isLast && toTicket > 0.5 ? 'var(--xk-money)' : 'var(--xk-good)'}
            p={appear * (1 - gone) * (isLast ? 1 - absorbed : 1)}
            scale={isLast ? scale : 1}
          />
        );
      })}

      <Tag
        x={185}
        y={452}
        text="each one is the running total, not the last chunk"
        tint="var(--xk-faint)"
        p={stage(t, ms(2.4), 500)}
      />

      <Box
        x={790}
        y={250}
        w={230}
        h={200}
        label=""
        tint="var(--xk-money)"
        p={chain}
        fill="var(--xk-surface-2)"
      />
      <Tag x={790} y={176} text="xKoinEscrow on Base" tint="var(--xk-money)" p={chain} size={15} />

      {moved > 0 ? (
        <g opacity={moved}>
          {[
            ['deposit', `-${countUp(t, ms(6.9), 700, 2.05, { decimals: 2 })} KES`, 'var(--xk-ink)'],
            ['operator', `+${countUp(t, ms(7.1), 700, 1.95, { decimals: 2 })} KES`, 'var(--xk-good)'],
            ['treasury', `+${countUp(t, ms(7.3), 700, 0.1, { decimals: 2 })} KES`, 'var(--xk-money)'],
          ].map(([label, value, tint], i) => (
            <g key={label}>
              <text x={696} y={278 + i * 32} fontFamily={MONO} fontSize="15" fill="var(--xk-muted)">
                {label}
              </text>
              <text x={884} y={278 + i * 32} textAnchor="end" fontFamily={MONO} fontSize="16" fontWeight="600" fill={tint}>
                {value}
              </text>
            </g>
          ))}
          <text x={790} y={214} textAnchor="middle" fontFamily={MONO} fontSize="14" fill="var(--xk-faint)">
            settleTicketBatch
          </text>
        </g>
      ) : null}

      <Foot
        text={`one settlement, ${countUp(t, ms(8.4), 700, 191698)} gas, for a whole session`}
        p={foot}
        tint="var(--xk-ink)"
      />
    </svg>
  );
}
