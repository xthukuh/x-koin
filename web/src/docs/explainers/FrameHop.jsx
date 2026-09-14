import { ease, item, lerp, ms, pulse, stage } from '../../player/index.js';

import { Box, Chip, FRAME, Foot, Link, MONO, Packet, Tag } from './parts.jsx';

/**
 * How a byte travels: a frame hops from the Client to a Satellite to the Node
 * and out to the internet, the answer comes back down the same path, and the
 * Client signs one cumulative receipt to the device that actually served it.
 *
 * The point of the picture is the last beat: the Satellite is the party that
 * earns, and nothing in the whole hop touched the chain.
 */

const Y = 200;
const STATIONS = [
  { x: 110, label: 'Client', sub: 'holds the keys', tint: 'var(--xk-ink)' },
  { x: 370, label: 'Satellite', sub: 'serves, earns', tint: 'var(--xk-lora)' },
  { x: 630, label: 'Node', sub: 'transport only', tint: 'var(--xk-plc)' },
  { x: 870, label: 'Internet', sub: 'metered side', tint: 'var(--xk-muted)' },
];
const HOPS = [
  { label: 'LoRa', tint: 'var(--xk-lora)' },
  { label: 'LoRa relay', tint: 'var(--xk-lora)' },
  { label: 'backhaul', tint: 'var(--xk-plc)' },
];

export default function FrameHop({ t }) {
  const glow = pulse(t, 900);
  const reply = stage(t, ms(3.6), ms(1.5), ease.inOutSine);
  const receipt = stage(t, ms(5.3), ms(1.2), ease.outCubic);
  const stamp = stage(t, ms(6.6), 520, ease.outBack);
  const foot = stage(t, ms(7.2), 600);

  return (
    <svg viewBox={`0 0 ${FRAME.w} ${FRAME.h}`} role="img" aria-label="A frame hopping from client to satellite to node to the internet, with a signed receipt going back to the satellite">
      {STATIONS.slice(0, -1).map((station, i) => (
        <Link
          key={`link-${station.label}`}
          x1={station.x + 70}
          y1={Y}
          x2={STATIONS[i + 1].x - 70}
          y2={Y}
          p={item(t, ms(0.8), i, 200, 420)}
          tint="var(--xk-line)"
          width={3}
        />
      ))}

      {STATIONS.map((station, i) => (
        <Box
          key={station.label}
          x={station.x}
          y={Y}
          label={station.label}
          sub={station.sub}
          tint={station.tint}
          p={item(t, 0, i, 180, 420)}
        />
      ))}

      {HOPS.map((hop, i) => {
        const p = stage(t, ms(1.6) + i * 620, 620, ease.linear);
        const mid = (STATIONS[i].x + STATIONS[i + 1].x) / 2;
        const showing = p > 0 && p < 1;
        return (
          <g key={hop.label}>
            <Tag x={mid} y={Y - 58} text={hop.label} tint={hop.tint} p={stage(t, ms(1.5) + i * 620, 380)} />
            {showing ? (
              <Packet
                x={lerp(STATIONS[i].x + 70, STATIONS[i + 1].x - 70, p)}
                y={Y}
                tint="var(--xk-money)"
                glow={glow}
              />
            ) : null}
          </g>
        );
      })}

      <Tag
        x={750}
        y={Y - 90}
        text="every byte out is counted here"
        tint="var(--xk-money)"
        p={stage(t, ms(3.0), 500)}
      />

      {reply > 0 && reply < 1 ? (
        <g>
          <Link x1={110} y1={300} x2={870} y2={300} p={1} tint="var(--xk-line-soft)" width={2} dash="6 6" />
          <Packet x={lerp(870, 110, reply)} y={300} tint="var(--xk-accent)" size={14} />
          <Tag x={490} y={286} text="the answer comes back the same way" p={1} tint="var(--xk-faint)" />
        </g>
      ) : null}

      {receipt > 0 ? (
        <g>
          <Link x1={110} y1={400} x2={370} y2={400} p={receipt} tint="var(--xk-good)" width={2} />
          <Chip
            x={lerp(110, 370, receipt)}
            y={400}
            title="RECEIPT 108 B"
            value="cumulative bytes"
            tint="var(--xk-good)"
            p={Math.min(1, receipt * 3)}
          />
          <Tag
            x={560}
            y={392}
            text="signed with Ed25519"
            tint="var(--xk-good)"
            p={stage(t, ms(6.0), 400)}
            anchor="start"
          />
          <Tag
            x={560}
            y={414}
            text="the Client signs, the server keeps it"
            tint="var(--xk-faint)"
            p={stage(t, ms(6.3), 400)}
            anchor="start"
          />
        </g>
      ) : null}

      {stamp > 0 ? (
        <g opacity={Math.min(1, stamp)}>
          <rect x={300} y={Y + 58} width={140} height={28} fill="var(--xk-surface)" stroke="var(--xk-good)" strokeWidth="2" />
          <text x={370} y={Y + 78} textAnchor="middle" fontFamily={MONO} fontSize="15" fill="var(--xk-good)">
            paid to this one
          </text>
        </g>
      ) : null}

      <Foot text="3 hops, 1 signature, 0 chain transactions" p={foot} tint="var(--xk-ink)" />
    </svg>
  );
}
