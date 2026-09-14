import { PRICE_UKES, SETTLE_GAS, TICKETS, gas, kesFromUkes } from './facts.js';
import {
  Bar,
  COLOR,
  Code,
  Grid,
  H,
  MONO,
  Panel,
  Reveal,
  Rows,
  Slide,
  Stage,
  Stat,
  Verdict,
  W,
  ease,
  lerp,
  ms,
  stage,
} from './parts.jsx';

/** Chapter 3. The protocol: the frame, the phases, the proof and the money. */

/* ------------------------------------------------------------ 3.1 the frame */

const U = 24; // pixels per byte on the ruler
const X0 = 48; // left edge of the ruler
const HEADER_BYTES = 27;
const PAYLOAD_W = 300;
const RULER_Y = 26;
const RULER_H = 40;

const FIELDS = [
  { n: 1, at: 0, size: 2, name: 'magic', tone: COLOR.accent, offset: '0', why: '0x4B58, the two letters X and K' },
  { n: 2, at: 2, size: 1, name: 'version | type', tone: COLOR.plc, offset: '2', why: 'sixteen versions and sixteen frame types in one byte' },
  { n: 3, at: 3, size: 1, name: 'flags', tone: COLOR.plc, offset: '3', why: 'ack requested, encrypted, fragment' },
  { n: 4, at: 4, size: 1, name: 'ttl', tone: COLOR.nbplc, offset: '4', why: 'hops remaining, decremented by each relay' },
  { n: 5, at: 5, size: 8, name: 'src node id', tone: COLOR.money, offset: '5', why: 'SHA-256 of the Ed25519 public key, first 8 bytes' },
  { n: 6, at: 13, size: 8, name: 'dst node id', tone: COLOR.money, offset: '13', why: 'all bits set means broadcast' },
  { n: 7, at: 21, size: 4, name: 'seq', tone: COLOR.lora, offset: '21', why: 'per-source and monotonic: the dedupe key at the receiver' },
  { n: 8, at: 25, size: 2, name: 'payload length', tone: COLOR.lora, offset: '25', why: 'sixteen bits, so one header fits a 128 B frame and a 1400 B frame' },
];

const PAYLOAD_X = X0 + HEADER_BYTES * U + 14;
const CRC_X = PAYLOAD_X + PAYLOAD_W + 14;

function Frame({ t }) {
  const sweep = stage(t, ms(6.4), ms(1.8), ease.inOutCubic);
  const sweepX = lerp(X0, CRC_X, sweep);
  return (
    <Slide
      t={t}
      kicker="the protocol, XKP"
      title="One frame, twenty-nine bytes of overhead, every medium"
      lede="Little-endian throughout. The Python reference, the C firmware and the chain share the same test vectors."
      foot={['27 B header + payload + CRC16-CCITT', 'protocol/spec.md section 2']}
    >
      <Stage h={H.both}>
        {Array.from({ length: HEADER_BYTES }, (_, i) => (
          <rect
            key={`cell-${i}`}
            x={X0 + i * U}
            y={RULER_Y}
            width={U}
            height={RULER_H}
            fill={X0 + i * U < sweepX ? 'var(--xk-accent-soft)' : COLOR.surface}
            stroke={COLOR.soft}
            strokeWidth="1"
            opacity={stage(t, ms(0.9) + i * 14, 260)}
          />
        ))}

        <Reveal t={t} at={ms(4.4)} from="fade" as="g">
          <rect x={PAYLOAD_X} y={RULER_Y} width={PAYLOAD_W} height={RULER_H} fill={COLOR.surface} stroke={COLOR.line} strokeWidth="2" strokeDasharray="6 4" />
          <text x={PAYLOAD_X + PAYLOAD_W / 2} y={RULER_Y + 26} textAnchor="middle" fontFamily={MONO} fontSize="15" fill={COLOR.muted}>
            payload, 0 to 65,535 B
          </text>
        </Reveal>

        <Reveal t={t} at={ms(5.6)} from="fade" as="g">
          <rect x={CRC_X} y={RULER_Y} width={2 * U} height={RULER_H} fill={COLOR.surface} stroke={COLOR.good} strokeWidth="2" />
          <text x={CRC_X + U} y={RULER_Y - 10} textAnchor="middle" fontFamily={MONO} fontSize="13" fill={COLOR.good}>
            CRC
          </text>
        </Reveal>

        {FIELDS.map((field, i) => {
          const x = X0 + field.at * U;
          const w = field.size * U;
          const p = stage(t, ms(1.4) + i * 300, 360, ease.outCubic);
          if (p <= 0.01) {
            return null;
          }
          return (
            <g key={field.name} opacity={p}>
              <rect x={x} y={RULER_Y} width={w} height={RULER_H} fill="none" stroke={field.tone} strokeWidth="2.5" />
              <circle cx={x + w / 2} cy={RULER_Y - 16} r="10" fill={field.tone} />
              <text x={x + w / 2} y={RULER_Y - 11} textAnchor="middle" fontFamily={MONO} fontSize="12" fontWeight="600" fill="var(--xk-ground)">
                {field.n}
              </text>
            </g>
          );
        })}

        {sweep > 0 && sweep < 1 ? (
          <line x1={sweepX} y1={RULER_Y - 6} x2={sweepX} y2={RULER_Y + RULER_H + 6} stroke={COLOR.good} strokeWidth="2.5" />
        ) : null}

        <line x1="0" y1={104} x2={W} y2={104} stroke={COLOR.line} strokeWidth="1" opacity={stage(t, ms(1.4), 400)} />

        {FIELDS.map((field, i) => {
          const y = 128 + i * 25;
          const p = stage(t, ms(1.4) + i * 300, 360, ease.outCubic);
          if (p <= 0.01) {
            return null;
          }
          return (
            <g key={`row-${field.name}`} opacity={p}>
              <text x="0" y={y} fontFamily={MONO} fontSize="15" fill={field.tone} fontWeight="600">
                {field.n}
              </text>
              <text x="26" y={y} fontFamily={MONO} fontSize="15" fill={COLOR.faint}>
                {`@${field.offset}`}
              </text>
              <text x="86" y={y} fontFamily={MONO} fontSize="15" fill={COLOR.faint}>
                {`${field.size} B`}
              </text>
              <text x="146" y={y} fontFamily={MONO} fontSize="15" fill={COLOR.ink} fontWeight="600">
                {field.name}
              </text>
              <text x="340" y={y} fontSize="16" fill={COLOR.muted}>
                {field.why}
              </text>
            </g>
          );
        })}

        <Reveal t={t} at={ms(7.4)} from="up" as="g">
          <text x="0" y={330} fontFamily={MONO} fontSize="16.5" fill={COLOR.good}>
            The check runs before any cryptography: magic, then length, then CRC.
          </text>
          <text x="0" y={352} fontSize="16" fill={COLOR.muted}>
            Corruption is common on a power line and on a radio, and verification is the expensive operation.
          </text>
        </Reveal>
      </Stage>
    </Slide>
  );
}

/* ----------------------------------------------------------- 3.2 the phases */

const LANES = [
  { id: 'client', label: 'Client', x: 110 },
  { id: 'node', label: 'Node', x: 430 },
  { id: 'api', label: 'gateway-api', x: 760 },
  { id: 'chain', label: 'Base', x: 1060 },
];

const MESSAGES = [
  { at: 1.1, from: 1, to: 0, y: 62, label: 'BEACON', note: 'P0 discovery, free, and it earns nothing', tone: COLOR.faint },
  { at: 2.0, from: 0, to: 1, y: 118, label: 'JOIN_REQ + voucher', note: '', tone: COLOR.money },
  { at: 3.4, from: 1, to: 0, y: 156, label: 'JOIN_ACK + 16 B session nonce', note: 'P1 admission, offline, against a key in firmware', tone: COLOR.money },
  { at: 4.6, from: 0, to: 1, y: 216, label: 'DATA and DATA_ACK, window of 16', note: 'P2 transfer on the highest scoring live medium', tone: COLOR.accent },
  { at: 5.8, from: 0, to: 1, y: 274, label: 'RECEIPT, 108 B signed, then RECEIPT_ACK', note: 'P3 proof, one cumulative receipt per interval', tone: COLOR.good },
  { at: 7.4, from: 1, to: 2, y: 332, label: 'EIP-712 ticket', note: 'P4 settlement', tone: COLOR.lora },
  { at: 8.2, from: 2, to: 3, y: 332, label: 'settleTicketBatch', note: 'the only phase that leaves the mesh', tone: COLOR.lora },
];

function Message({ t, msg }) {
  const p = stage(t, ms(msg.at), 480, ease.outCubic);
  if (p <= 0.01) {
    return null;
  }
  const a = LANES[msg.from].x;
  const b = LANES[msg.to].x;
  const head = lerp(a, b, p);
  const dir = b > a ? 1 : -1;
  return (
    <g opacity={Math.min(1, p * 1.6)}>
      <line x1={a} y1={msg.y} x2={head} y2={msg.y} stroke={msg.tone} strokeWidth="2.5" />
      <path d={`M ${head} ${msg.y} l ${-8 * dir} -5 l 0 10 z`} fill={msg.tone} />
      <text x={(a + b) / 2} y={msg.y - 8} textAnchor="middle" fontFamily={MONO} fontSize="15" fill={msg.tone}>
        {msg.label}
      </text>
      {msg.note ? (
        <text x={(a + b) / 2} y={msg.y + 17} textAnchor="middle" fontFamily={MONO} fontSize="13" fill={COLOR.faint}>
          {msg.note}
        </text>
      ) : null}
    </g>
  );
}

function Phases({ t }) {
  return (
    <Slide
      t={t}
      kicker="the protocol, XKP"
      title="Five phases, and only the last one leaves the mesh"
      lede="Admission is offline by requirement: the backhaul is the thing being sold."
      foot={['P0 discovery, P1 admission, P2 transfer, P3 proof, P4 settlement', 'paper 03 section 4']}
    >
      <Stage h={H.both}>
        {LANES.map((lane, i) => (
          <Reveal key={lane.id} t={t} at={ms(0.7) + i * 130} from="down" as="g">
            <text x={lane.x} y={20} textAnchor="middle" fontFamily={MONO} fontSize="17" fontWeight="600" fill={COLOR.ink}>
              {lane.label}
            </text>
            <line x1={lane.x} y1={32} x2={lane.x} y2={356} stroke={COLOR.line} strokeWidth="1.5" strokeDasharray="4 5" />
          </Reveal>
        ))}

        {MESSAGES.map((msg) => (
          <Message key={`${msg.label}-${msg.y}`} t={t} msg={msg} />
        ))}

        <Reveal t={t} at={ms(2.7)} from="left" as="g">
          <rect x={LANES[1].x + 16} y={90} width={276} height={42} fill="var(--xk-surface-2)" stroke={COLOR.money} strokeWidth="1.5" />
          <text x={LANES[1].x + 28} y={108} fontFamily={MONO} fontSize="13" fill={COLOR.money}>
            Ed25519 verify, key in firmware
          </text>
          <text x={LANES[1].x + 28} y={125} fontFamily={MONO} fontSize="13" fill={COLOR.muted}>
            under 4.5 ms, no network
          </text>
        </Reveal>

      </Stage>
    </Slide>
  );
}

/* ---------------------------------------------------------- 3.3 the receipt */

function ReceiptScene({ t }) {
  return (
    <Slide
      t={t}
      kicker="the proof layer"
      title="The receipt is 108 bytes because the slowest medium said so"
      lede="A node that delivered bytes and cannot collect the proof has worked for free, so proofs must flow when nothing else can."
      foot={['44 canonical bytes plus a 64 byte Ed25519 signature', 'an invariant this repository defends']}
    >
      <Grid cols={2} gap={24}>
        <Panel t={t} at={ms(1.0)} title="the canonical form" tone={COLOR.accent}>
          <Code
            t={t}
            at={ms(1.4)}
            size={17}
            gap={230}
            lines={[
              '<8s  client_id>',
              '<8s  node_id>',
              '<16s session_nonce>',
              '<Q   cumulative_bytes>',
              '<I   seq>',
            ]}
          />
          <Reveal t={t} at={ms(2.8)} from="fade" style={{ marginTop: 12, fontFamily: MONO, fontSize: 17, color: COLOR.money }}>
            44 B of fields + 64 B signature = 108 B
          </Reveal>
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel t={t} at={ms(3.4)} title="it fits one narrowband frame" tone={COLOR.nbplc}>
            <svg viewBox="0 0 460 84" width="100%" height="84" aria-hidden="true">
              <rect x="0" y="12" width="440" height="26" fill="none" stroke={COLOR.line} strokeWidth="1.5" />
              <rect x="0" y="12" width={440 * (108 / 128) * stage(t, ms(3.8), 800, ease.outQuart)} height="26" fill={COLOR.money} />
              <text x="0" y="60" fontFamily={MONO} fontSize="14" fill={COLOR.muted}>
                108 B receipt
              </text>
              <text x="440" y="60" textAnchor="end" fontFamily={MONO} fontSize="14" fill={COLOR.nbplc}>
                128 B KQ-130F payload
              </text>
              <text x="0" y="80" fontFamily={MONO} fontSize="13" fill={COLOR.faint}>
                one transmission on the slowest medium in the system
              </text>
            </svg>
          </Panel>
          <Panel t={t} at={ms(4.8)} title="the bound on unproven credit" tone={COLOR.good}>
            <div style={{ fontSize: 18, color: COLOR.muted, lineHeight: 1.45 }}>
              A node extends at most twice the receipt interval of credit before it throttles and then drops.
              The client can always walk away; the node cannot always collect. That exposure is set in bytes,
              not in trust, and scenario S1 asserts the bound rather than assuming it.
            </div>
          </Panel>
        </div>
      </Grid>
    </Slide>
  );
}

/* ------------------------------------------------------- 3.4 cumulative counters */

const RECEIPTS = [
  { mb: 1, lost: false },
  { mb: 2, lost: true },
  { mb: 3, lost: true },
  { mb: 4, lost: true },
  { mb: 5, lost: false },
];

function Cumulative({ t }) {
  const held = RECEIPTS.reduce((value, r, i) => (!r.lost && t >= ms(1.6) + i * 700 ? r.mb : value), 0);
  return (
    <Slide
      t={t}
      kicker="the proof layer"
      title="Cumulative counters: lose four receipts, lose nothing"
      lede="A receipt reports the session total rather than the increment, and three failure classes disappear rather than being mitigated."
      foot={['the node stores one receipt per client, never a log', 'Law 5, replay pays nothing']}
    >
      <Stage h={H.both}>
        {RECEIPTS.map((r, i) => {
          const x = 40 + i * 150;
          const p = stage(t, ms(1.6) + i * 700, 420, ease.outBack);
          if (p <= 0.01) {
            return null;
          }
          return (
            <g key={r.mb} opacity={Math.min(1, p)}>
              <rect x={x} y={20} width={122} height={64} fill={COLOR.surface} stroke={r.lost ? COLOR.bad : COLOR.good} strokeWidth="2.5" />
              <text x={x + 61} y={46} textAnchor="middle" fontFamily={MONO} fontSize="17" fontWeight="600" fill={COLOR.ink}>
                {`${r.mb} MB`}
              </text>
              <text x={x + 61} y={68} textAnchor="middle" fontFamily={MONO} fontSize="13" fill={r.lost ? COLOR.bad : COLOR.good}>
                {r.lost ? 'lost on the wire' : 'arrives'}
              </text>
              {r.lost ? (
                <path d={`M ${x + 8} 28 L ${x + 114} 76 M ${x + 114} 28 L ${x + 8} 76`} stroke={COLOR.bad} strokeWidth="2" opacity="0.55" />
              ) : null}
            </g>
          );
        })}

        <Reveal t={t} at={ms(1.2)} from="fade" as="g">
          <text x="40" y={130} fontFamily={MONO} fontSize="15" fill={COLOR.faint}>
            what the node holds for this client, after every arrival
          </text>
        </Reveal>
        <rect x="40" y={144} width={740} height={54} fill="var(--xk-surface-2)" stroke={COLOR.line} strokeWidth="1.5" opacity={stage(t, ms(1.2), 400)} />
        <text x="60" y={179} fontFamily={MONO} fontSize="30" fontWeight="600" fill={COLOR.money} opacity={stage(t, ms(1.2), 400)}>
          {`${held} MB`}
        </text>
        <text x="200" y={179} fontFamily={MONO} fontSize="17" fill={COLOR.muted} opacity={stage(t, ms(5.6), 500)}>
          the fifth receipt already contains everything the first four said
        </text>

        <g opacity={stage(t, ms(7.2), 600)}>
          <text x="40" y={244} fontFamily={MONO} fontSize="17" fontWeight="600" fill={COLOR.good}>
            1. Losing an intermediate receipt loses nothing.
          </text>
          <text x="40" y={280} fontFamily={MONO} fontSize="17" fontWeight="600" fill={COLOR.good} opacity={stage(t, ms(8.2), 600)}>
            2. Replaying an old one yields a delta of zero, and the call reverts.
          </text>
          <text x="40" y={316} fontFamily={MONO} fontSize="17" fontWeight="600" fill={COLOR.good} opacity={stage(t, ms(9.2), 600)}>
            3. There is no receipt history to protect, corrupt or subpoena at the edge.
          </text>
        </g>
      </Stage>
    </Slide>
  );
}

/* ----------------------------------------------------------- 3.5 the ticket */

function Ticket({ t }) {
  const ticket = TICKETS[0];
  return (
    <Slide
      t={t}
      kicker="the reward layer"
      title="The ticket: a receipt the chain can check"
      lede="The field order is fixed by the plan document and baked into the type hash."
      foot={['domain xKoinEscrow version 1, signed secp256k1', 'one unit is 10 KB of relayed WAN traffic']}
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <Grid cols={2} gap={24}>
        <Panel t={t} at={ms(1.0)} title="struct Ticket" tone={COLOR.accent}>
          <Code
            t={t}
            at={ms(1.3)}
            size={17}
            gap={200}
            lines={[
              'address client;',
              'address nodeAdmin;',
              'uint64  sequenceNumber;',
              'uint128 cumulativeUnits;',
              'uint256 epochExpiry;',
            ]}
          />
        </Panel>
        <Panel t={t} at={ms(1.2)} title="the ticket the chain proof settled" tone={COLOR.money}>
          <Rows
            t={t}
            at={ms(2.6)}
            gap={230}
            size={17}
            widths={['54%', '46%']}
            rows={[
              ['sequenceNumber', String(ticket.sequence_number)],
              ['cumulativeUnits', `${ticket.units.toLocaleString('en-US')} units, 25 MB`],
              ['gross at the placeholder price', `${kesFromUkes(ticket.gross_ukes)} KES`],
              ['treasury fee, 5 percent', `${kesFromUkes(ticket.fee_ukes)} KES`],
              ['to the node operator', `${kesFromUkes(ticket.net_ukes)} KES`],
            ]}
          />
          <Reveal t={t} at={ms(4.6)} from="fade" style={{ marginTop: 10, fontFamily: MONO, fontSize: 15, color: COLOR.good }}>
            digest computed locally == the contract hashTicket
          </Reveal>
        </Panel>
      </Grid>
      <Reveal
        t={t}
        at={ms(5.6)}
        from="up"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 18, color: COLOR.muted, lineHeight: 1.4 }}
      >
        Settlement pays the delta over what it already settled for that channel, so an intermediate ticket
        that never reached the chain costs nobody anything. The price of {PRICE_UKES} micro-KES per unit is a
        placeholder until it clears measured backhaul cost.
      </Reveal>
    </Slide>
  );
}

/* ------------------------------------------------------- 3.6 the settlement */

function Settlement({ t }) {
  return (
    <Slide
      t={t}
      kicker="the reward layer"
      title="One call closes a whole session"
      lede="The escrow has no idea there is a mesh. It sees two addresses, a sequence and a unit count, and moves value between two numbers."
      foot={['settleTicketBatch, callable by anyone', 'Law 6 and Law 7, each with a named test']}
    >
      <Grid cols={2} gap={24}>
        <Panel t={t} at={ms(1.0)} title="what the contract checks, in order" tone={COLOR.accent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Verdict t={t} at={ms(1.4)} ok text="the ticket has not expired" size={18} />
            <Verdict t={t} at={ms(1.7)} ok text="the sequence is strictly greater than the channel last" size={18} />
            <Verdict t={t} at={ms(2.0)} ok text="the signature recovers to the client address" size={18} />
            <Verdict t={t} at={ms(2.3)} ok text="the delta over settled units is not zero" size={18} />
            <Verdict t={t} at={ms(2.6)} ok text="the amount owed is capped at the remaining deposit" size={18} />
          </div>
          <Reveal t={t} at={ms(3.2)} from="fade" style={{ marginTop: 12, fontSize: 17, color: COLOR.warn, lineHeight: 1.4 }}>
            An invalid ticket reverts the whole batch. The relayer pre-checks off chain, so one arriving on
            chain is a bug or an attack and must be loud rather than silently skipped.
          </Reveal>
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel t={t} at={ms(3.8)} title="where the money goes" tone={COLOR.money}>
            <svg viewBox="0 0 460 96" width="100%" height="96" aria-hidden="true">
              <Bar t={t} at={ms(4.1)} x={0} y={10} w={340} h={26} fill={0.95} tone={COLOR.money} label="95% node operator" />
              <Bar t={t} at={ms(4.4)} x={0} y={50} w={340} h={26} fill={0.05} tone={COLOR.good} label="5% treasury" />
            </svg>
            <Reveal t={t} at={ms(5.0)} from="fade" style={{ fontSize: 16, color: COLOR.muted, lineHeight: 1.4 }}>
              The fee moved is the exact sum of the per-ticket amounts, never a percentage recomputed on the
              gross, which is what keeps the solvency invariant exact.
            </Reveal>
          </Panel>
          <Grid cols={2} gap={14}>
            <Stat t={t} at={ms(5.8)} value={gas(SETTLE_GAS)} label="gas, measured, two tickets in one batch" />
            <Stat t={t} at={ms(6.1)} value="0.35 KES" label="of that gas at the 2026-09-09 price, ETH rate and shilling rate" tone={COLOR.good} />
          </Grid>
        </div>
      </Grid>
    </Slide>
  );
}

export const SCENES = {
  'xkp-frame': Frame,
  'xkp-phases': Phases,
  'xkp-receipt': ReceiptScene,
  'xkp-cumulative': Cumulative,
  'xkp-ticket': Ticket,
  'xkp-settlement': Settlement,
};
