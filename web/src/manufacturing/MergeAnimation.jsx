import { AnimationFrame, draw, ease, item, lerp, ms, stage } from '../player/index.js';
import { MERGE } from './data.js';

/**
 * Revision 0 to revision 1, as a moving picture. Six bought modules start
 * scattered on the left, a board outline draws itself, and the modules that can
 * merge slide onto their footprints. The parts that cannot merge slide to a
 * rail on the right, each labelled with the reason, and the W5500 is struck out
 * because it does not merge, it disappears.
 *
 * Everything is a pure function of `t`, so scrubbing the frame is the same as
 * playing it. Labels inside the picture are short on purpose: the reasons are
 * written out in prose beneath the frame, where a phone can read them.
 */

const DURATION = ms(11);

const START_BOARD = ms(1.2);
const START_MERGE = ms(2.4);
const MERGE_GAP = 680;
const MERGE_RUN = 900;
const START_PARK = ms(5.4);
const START_DELETE = ms(7.4);
const START_FOOT = ms(8.6);

const TONE = {
  ink: 'var(--xk-ink)',
  lora: 'var(--xk-lora)',
  nbplc: 'var(--xk-nbplc)',
  plc: 'var(--xk-plc)',
  faint: 'var(--xk-faint)',
};

const KIT_LABEL = {
  mcu: 'ESP32-S3 DevKitC',
  lora: 'E22-900M22S',
  nbplc: 'KQ-130F',
  w5500: 'W5500 bridge',
  power: 'USB 5 V supply',
};

const BOARD_LABEL = {
  mcu: 'ESP32-S3-WROOM-1',
  lora: 'SX1262 and match',
  nbplc: 'KQ-130F or ST7540',
  w5500: 'W5500',
  power: 'HLK-5M12 behind the isolation slot',
};

const PARK_LABEL = {
  homeplug: ['HomePlug adapter', 'no open price yet'],
  antenna: ['Antenna and SMA', 'RF keep-out'],
  case: ['BS 1363 case', 'own approval'],
  cell: ['Cell and panel', 'UN3480 shipping'],
};

function Box({ x, y, w, h, color, label, sub, opacity = 1, dashed = false, strike = 0 }) {
  return (
    <g opacity={opacity}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="var(--xk-surface)"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={dashed ? '7 5' : undefined}
      />
      <text x={x + 12} y={y + (sub ? 26 : h / 2 + 6)} fontFamily="var(--xk-font-mono)" fontSize="17" fill="var(--xk-ink)">
        {label}
      </text>
      {sub ? (
        <text x={x + 12} y={y + 48} fontFamily="var(--xk-font-mono)" fontSize="14" fill="var(--xk-muted)">
          {sub}
        </text>
      ) : null}
      {strike > 0 ? (
        <>
          <path
            d={`M ${x + 6} ${y + 6} L ${x + w - 6} ${y + h - 6}`}
            stroke="var(--xk-critical)"
            strokeWidth="3"
            fill="none"
            style={draw(strike, 260)}
          />
          <path
            d={`M ${x + w - 6} ${y + 6} L ${x + 6} ${y + h - 6}`}
            stroke="var(--xk-critical)"
            strokeWidth="3"
            fill="none"
            style={draw(strike, 260)}
          />
        </>
      ) : null}
    </g>
  );
}

function Scene({ t }) {
  const { board, onBoard, offBoard } = MERGE;
  const outline = stage(t, START_BOARD, 1000, ease.inOutCubic);
  const perimeter = 2 * (board.w + board.h);
  const deleting = stage(t, START_DELETE, 700, ease.outCubic);
  const foot = stage(t, START_FOOT, 700);

  return (
    <svg viewBox="0 0 1200 560" width="100%" height="100%" role="img" aria-label="Six bought modules merging onto one board outline, with the parts that stay off the board parked at the side">
      <text x="40" y="34" fontFamily="var(--xk-font-mono)" fontSize="16" fill="var(--xk-faint)" letterSpacing="2">
        REVISION 0: WHAT THE BENCH BUYS
      </text>
      <text x="300" y="34" fontFamily="var(--xk-font-mono)" fontSize="16" fill="var(--xk-faint)" letterSpacing="2" opacity={outline}>
        REVISION 1: ONE BOARD
      </text>
      <text x="830" y="34" fontFamily="var(--xk-font-mono)" fontSize="16" fill="var(--xk-faint)" letterSpacing="2" opacity={stage(t, START_PARK, 600)}>
        STAYS OFF THE BOARD
      </text>

      {/* the board outline draws itself */}
      <rect
        x={board.x}
        y={board.y}
        width={board.w}
        height={board.h}
        fill="none"
        stroke="var(--xk-accent)"
        strokeWidth="3"
        style={draw(outline, perimeter)}
      />
      <text
        x={board.x + board.w / 2}
        y={board.y + board.h + 26}
        textAnchor="middle"
        fontFamily="var(--xk-font-mono)"
        fontSize="15"
        fill="var(--xk-accent)"
        opacity={outline}
      >
        108 by 58 mm, four layers, one stencil
      </text>

      {/* the mains isolation slot, drawn once the power stage lands */}
      <path
        d={`M ${board.x + 300} ${board.y + 176} V ${board.y + board.h - 8}`}
        stroke="var(--xk-money)"
        strokeWidth="3"
        strokeDasharray="8 6"
        fill="none"
        opacity={stage(t, START_MERGE + 4 * MERGE_GAP + MERGE_RUN, 600)}
      />

      {/* modules that merge */}
      {onBoard.map((block, i) => {
        const appear = item(t, ms(0.2), i, 160, 420);
        const move = stage(t, START_MERGE + i * MERGE_GAP, MERGE_RUN, ease.inOutCubic);
        const x = lerp(block.from.x, block.to.x, move);
        const y = lerp(block.from.y, block.to.y, move);
        const w = lerp(block.from.w, block.to.w, move);
        const h = lerp(block.from.h, block.to.h, move);
        const deleted = block.deleted;
        const opacity = appear * (deleted ? lerp(1, 0.3, deleting) : 1);
        return (
          <Box
            key={block.id}
            x={x}
            y={y}
            w={w}
            h={h}
            color={TONE[block.tone] ?? TONE.ink}
            label={move > 0.6 ? BOARD_LABEL[block.id] : KIT_LABEL[block.id]}
            opacity={opacity}
            dashed={deleted && deleting > 0}
            strike={deleted ? deleting : 0}
          />
        );
      })}

      {/* parts that do not merge */}
      {offBoard.map((block, i) => {
        const move = stage(t, START_PARK + i * 320, 800, ease.inOutCubic);
        const appear = block.id === 'homeplug' ? item(t, ms(0.2), 5, 160, 420) : move;
        const x = lerp(block.from.x, block.to.x, move);
        const y = lerp(block.from.y, block.to.y, move);
        const w = lerp(block.from.w, block.to.w, move);
        const h = lerp(block.from.h, block.to.h, move);
        const [label, sub] = PARK_LABEL[block.id];
        return (
          <Box
            key={block.id}
            x={x}
            y={y}
            w={w}
            h={h}
            color="var(--xk-faint)"
            label={block.id === 'homeplug' && move < 0.5 ? 'HomePlug pair' : label}
            sub={move > 0.5 ? sub : null}
            opacity={appear}
            dashed
          />
        );
      })}

      <text x="40" y="520" fontFamily="var(--xk-font-mono)" fontSize="17" fill="var(--xk-ink)" opacity={foot}>
        Five modules and twelve hand-made connections become one board.
      </text>
      <text x="40" y="546" fontFamily="var(--xk-font-mono)" fontSize="15" fill="var(--xk-muted)" opacity={foot}>
        The W5500 is not merged, it is deleted: the broadband modem is native SPI.
      </text>
    </svg>
  );
}

export default function MergeAnimation() {
  return (
    <AnimationFrame
      title="From kit to board"
      duration={DURATION}
      aspect="1200 / 560"
      caption="Revision 1 is a staged merge. The silicon that is priced and in stock goes down on copper; the two lines that are neither stay as modules until a written quotation comes back."
    >
      {({ t }) => <Scene t={t} />}
    </AnimationFrame>
  );
}
