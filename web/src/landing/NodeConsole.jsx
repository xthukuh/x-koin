import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * The only animation on the page: a simulated xKoin-Node console.
 *
 * Frames arrive on one of the three mediums, the cumulative byte counter rises,
 * a receipt is signed every 64 KB, and the KES balance falls at the placeholder
 * price of 0.05 KES per MB (500 uKES per 10 KB unit). Node ids are four
 * characters and the whole feed is regenerated on every load, so two visitors
 * never see the same trace.
 *
 * Nothing here talks to a network. It is a picture of the protocol in
 * protocol/spec.md, drawn with the goodput figures from that file.
 *
 * prefers-reduced-motion gets a static snapshot of the same generator.
 */

const MEDIA = [
  { key: 'plc', badge: 'PLC 10 Mbps', min: 7000, max: 21000, weight: 0.62 },
  { key: 'nbplc', badge: 'NB-PLC 9600', min: 96, max: 128, weight: 0.2 },
  { key: 'lora', badge: 'LoRa SF7', min: 140, max: 226, weight: 0.18 },
];

const RECEIPT_INTERVAL = 64 * 1024;
const KES_PER_BYTE = 0.05 / (1024 * 1024);
const OPENING_BALANCE = 120;
const FEED_LENGTH = 14;
const HEX = '0123456789abcdef';

function randomId() {
  let id = '';
  for (let i = 0; i < 4; i += 1) {
    id += HEX.charAt(Math.floor(Math.random() * 16));
  }
  return id;
}

function pickMedium() {
  const roll = Math.random();
  let floor = 0;
  for (const medium of MEDIA) {
    floor += medium.weight;
    if (roll < floor) {
      return medium;
    }
  }
  return MEDIA[0];
}

function formatBytes(total) {
  if (total < 1024) {
    return `${total} B`;
  }
  if (total < 1024 * 1024) {
    return `${(total / 1024).toFixed(1)} KB`;
  }
  return `${(total / (1024 * 1024)).toFixed(2)} MB`;
}

/** One step of the trace: returns the next state and the row to print. */
function step(state, clients) {
  const medium = pickMedium();
  const client = clients[Math.floor(Math.random() * clients.length)];
  const bytes = Math.floor(medium.min + Math.random() * (medium.max - medium.min));
  const total = state.total + bytes;
  const receipts = Math.floor(total / RECEIPT_INTERVAL);
  const signed = receipts > state.receipts;
  const row = signed
    ? {
        key: `${state.seq}`,
        medium,
        client,
        bytes: formatBytes(bytes),
        tail: `receipt signed #${receipts}`,
        receipt: true,
      }
    : {
        key: `${state.seq}`,
        medium,
        client,
        bytes: formatBytes(bytes),
        tail: `seq ${state.seq} ack`,
        receipt: false,
      };
  return { next: { total, receipts, seq: state.seq + 1 }, row };
}

export default function NodeConsole() {
  const seed = useMemo(
    () => ({
      node: randomId(),
      clients: [randomId(), randomId(), randomId()],
    }),
    [],
  );

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const snapshot = useMemo(() => {
    let state = { total: 0, receipts: 0, seq: 1 };
    const rows = [];
    const count = reduced ? FEED_LENGTH : 6;
    for (let i = 0; i < count; i += 1) {
      const result = step(state, seed.clients);
      state = result.next;
      rows.push(result.row);
    }
    return { rows, state };
  }, [reduced, seed]);

  const [rows, setRows] = useState(snapshot.rows);
  const [total, setTotal] = useState(snapshot.state.total);
  const [receipts, setReceipts] = useState(snapshot.state.receipts);
  const stateRef = useRef(snapshot.state);

  useEffect(() => {
    if (reduced) {
      return undefined;
    }
    let timer = 0;
    let live = true;
    const tick = () => {
      const result = step(stateRef.current, seed.clients);
      stateRef.current = result.next;
      setRows((current) => current.concat(result.row).slice(-FEED_LENGTH));
      setTotal(result.next.total);
      setReceipts(result.next.receipts);
      if (live) {
        timer = window.setTimeout(tick, 600 + Math.random() * 900);
      }
    };
    timer = window.setTimeout(tick, 700);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [reduced, seed]);

  const balance = Math.max(0, OPENING_BALANCE - total * KES_PER_BYTE);

  return (
    <div className="xk-console" aria-label="Simulated xKoin node console">
      <div className="xk-console__head">
        <span>node</span>
        <span className="xk-console__id xk-mono">xk-{seed.node}</span>
      </div>
      <ul className="xk-console__feed">
        {rows.map((row) => (
          <li
            key={row.key}
            className={row.receipt ? 'xk-console__row xk-console__row--receipt' : 'xk-console__row'}
          >
            <span className={`xk-console__badge xk-badge--${row.medium.key}`}>{row.medium.badge}</span>
            <span className="xk-console__node">{row.client}</span>
            <span className="xk-console__bytes">{row.bytes}</span>
            <span className="xk-console__tail">{row.tail}</span>
          </li>
        ))}
      </ul>
      <dl className="xk-console__meter">
        <div>
          <dt>carried</dt>
          <dd>{formatBytes(total)}</dd>
        </div>
        <div>
          <dt>receipts</dt>
          <dd>{receipts}</dd>
        </div>
        <div>
          <dt>balance</dt>
          <dd className="xk-console__kes">{balance.toFixed(4)} KES</dd>
        </div>
      </dl>
      <p className="xk-console__foot">
        Simulated trace, regenerated on every load. Goodput figures from protocol/spec.md, receipt
        interval 64 KB, price the deferred 500 uKES per 10 KB placeholder.
        {reduced ? ' Motion is off, so this is a static snapshot.' : ''}
      </p>
    </div>
  );
}
