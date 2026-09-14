import { Reveal, countUp, ease, item, ms } from '../../player/index.js';
import chain from '../../proof/chain.json';

import { Console, Foot, Head } from './parts.jsx';

/**
 * Scenes 07 and 08: the operator's side, on day one and on day two.
 *
 * The console is a themed picture of what the firmware prints, with the byte
 * count and the payout taken from the settled ticket in chain.json. The
 * settlement cost of 0.35 KES is the measured figure in
 * docs/papers/04-settlement-and-economics.md section 9.
 */

const TICKET = chain.tickets[0];
const PAID_KES = TICKET.net_ukes / 1_000_000;
const BYTES = TICKET.units * 10_000;

const STEPS = [
  {
    n: '01',
    title: 'Buy the kit',
    text: 'One box for the building, and a wall plug for each part of the block the wiring does not reach on its own.',
    Art: KitArt,
    tone: 'var(--xk-accent)',
  },
  {
    n: '02',
    title: 'Plug it in',
    text: 'Into the internet line and into a socket. Nothing has to be installed in the flats, and no new cable is pulled.',
    Art: PlugArt,
    tone: 'var(--xk-plc)',
  },
  {
    n: '03',
    title: 'Put a little float in',
    text: 'Enough to cover the settlement message. One batch of tickets costs about a third of a shilling to settle.',
    Art: FloatArt,
    tone: 'var(--xk-money)',
  },
];

function KitArt({ tone }) {
  return (
    <svg viewBox="0 0 280 120" width="100%" style={{ display: 'block' }}>
      <rect x="14" y="30" width="96" height="60" fill="var(--xk-surface)" stroke={tone} strokeWidth="2.5" />
      <text x="62" y="66" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="14" fill="var(--xk-ink)">
        Node
      </text>
      {[140, 190, 240].map((x) => (
        <g key={x}>
          <rect x={x} y="44" width="34" height="34" fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="2" />
          <circle cx={x + 17} cy="61" r="4" fill={tone} />
        </g>
      ))}
      <text x="197" y="100" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="13" fill="var(--xk-faint)">
        wall relays
      </text>
    </svg>
  );
}

function PlugArt({ tone }) {
  return (
    <svg viewBox="0 0 280 120" width="100%" style={{ display: 'block' }}>
      <rect x="14" y="20" width="80" height="40" fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="2" />
      <text x="54" y="45" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="13" fill="var(--xk-muted)">
        router
      </text>
      <rect x="14" y="76" width="80" height="34" fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="2" />
      <text x="54" y="98" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="13" fill="var(--xk-muted)">
        socket
      </text>
      <path d="M 94 40 H 150 V 60" stroke={tone} strokeWidth="2" fill="none" />
      <path d="M 94 92 H 150 V 76" stroke={tone} strokeWidth="2" fill="none" />
      <rect x="152" y="40" width="112" height="44" fill="var(--xk-surface)" stroke={tone} strokeWidth="2.5" />
      <text x="208" y="68" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="14" fill="var(--xk-ink)">
        Node
      </text>
    </svg>
  );
}

function FloatArt({ tone }) {
  return (
    <svg viewBox="0 0 280 120" width="100%" style={{ display: 'block' }}>
      <rect x="20" y="34" width="100" height="56" fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="2" />
      <text x="70" y="60" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="13" fill="var(--xk-muted)">
        operator
      </text>
      <text x="70" y="78" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="13" fill="var(--xk-muted)">
        wallet
      </text>
      <path d="M 122 62 H 168" stroke={tone} strokeWidth="2" fill="none" />
      <path d="M 158 56 L 168 62 L 158 68" stroke={tone} strokeWidth="2" fill="none" />
      <rect x="170" y="34" width="92" height="56" fill="var(--xk-surface)" stroke={tone} strokeWidth="2.5" />
      <text x="216" y="60" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="19" fill={tone}>
        0.35
      </text>
      <text x="216" y="80" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="13" fill="var(--xk-faint)">
        KES a batch
      </text>
    </svg>
  );
}

function OperatorDayOne({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="07 / the operator, day one"
        title="Buy the kit. Plug it in. Leave it alone."
        lede="Setting up a node is three steps, and none of them needs an engineer in the building."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, alignContent: 'start' }}>
        {STEPS.map((step, i) => {
          const p = item(t, ms(0.4), i, 500, 520, ease.outCubic);
          return (
            <div
              key={step.n}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 20}px)`,
                border: '1px solid var(--xk-line)',
                background: 'var(--xk-surface)',
                padding: '16px 18px 20px',
              }}
            >
              <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 15, color: step.tone, letterSpacing: '0.12em' }}>{step.n}</div>
              <h3 style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 25, margin: '6px 0 14px', fontWeight: 600 }}>{step.title}</h3>
              <step.Art tone={step.tone} />
              <p style={{ margin: '14px 0 0', fontSize: 18, lineHeight: 1.45, color: 'var(--xk-muted)' }}>{step.text}</p>
            </div>
          );
        })}
      </div>
      <Foot source="docs/papers/05-hardware-node.md; settlement cost from paper 04 section 9" right="no engineer required" />
    </div>
  );
}

const LINES = [
  { text: 'client 3f9a joined, voucher checked here, no internet needed', tone: 'var(--xk-console-ink)' },
  { text: 'bytes out 64 KB   receipt 01 signed by the phone' },
  { text: 'bytes out 512 KB  receipt 08 signed by the phone' },
  { text: 'bytes in  2.1 MB  stayed in the building, not counted', tone: '#62d69b' },
  { text: 'bytes out 4.0 MB  receipt 16 signed by the phone' },
  { text: 'bytes out 25.0 MB receipt 25 signed by the phone' },
  { text: 'old receipts dropped, only the latest one matters' },
  { text: `ticket built: ${TICKET.units.toLocaleString('en-KE')} units, sequence ${TICKET.sequence_number}` },
  { text: 'sent to the chain by a stranger, which costs you nothing' },
  { text: `settled. KES ${(PAID_KES).toFixed(4)} is yours to withdraw`, tone: '#f0b95a' },
];

function OperatorDayTwo({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="08 / the operator, day two"
        title="The receipts arrive on their own."
        lede="Nobody watches this happen. The box keeps the latest signed total and cashes it in when it is worth doing."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 26, alignContent: 'start' }}>
        <Console t={t} at={ms(0.4)} gap={560} lines={LINES} height={352} />

        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Reveal t={t} at={ms(0.6)} from="up" className="xk-scene__stat">
            <div className="xk-scene__stat-value" style={{ fontSize: 34 }}>
              {countUp(t, ms(0.8), ms(5.2), BYTES / 1_000_000, { decimals: 1 })} MB
            </div>
            <div className="xk-scene__stat-label">carried out to the internet for this one user</div>
          </Reveal>

          <Reveal t={t} at={ms(1.0)} from="up" className="xk-scene__stat">
            <div className="xk-scene__stat-value xk-scene__money" style={{ fontSize: 34 }}>
              KES {countUp(t, ms(5.0), ms(1.6), PAID_KES, { decimals: 4 })}
            </div>
            <div className="xk-scene__stat-label">paid to the operator, which is 95 percent of the charge</div>
          </Reveal>

          <Reveal t={t} at={ms(1.4)} from="up" className="xk-scene__stat">
            <div className="xk-scene__stat-value xk-scene__good" style={{ fontSize: 34 }}>
              {chain.summary.settle_gas.toLocaleString('en-KE')}
            </div>
            <div className="xk-scene__stat-label">
              units of chain fee for the whole batch, about a third of a shilling
            </div>
          </Reveal>
        </div>
      </div>
      <Foot source="web/src/proof/chain.json; the console is a picture of what the firmware prints" right="one settlement per session" />
    </div>
  );
}

export const ADMIN_SCENES = [
  {
    id: 'operator-day-one',
    title: 'The operator, day one',
    duration: ms(9),
    caption:
      'An operator buys one box and a few wall plugs, connects it to the building internet line and a socket, and leaves a small float for settlement. Nothing is installed in the flats and no new cable is pulled.',
    Scene: OperatorDayOne,
  },
  {
    id: 'operator-day-two',
    title: 'The receipts arrive on their own',
    duration: ms(10),
    caption:
      'Every few seconds a phone signs a running total of the bytes it has used. The box keeps only the latest one and turns it into a single claim. A stranger can push that claim to the chain.',
    Scene: OperatorDayTwo,
  },
];
