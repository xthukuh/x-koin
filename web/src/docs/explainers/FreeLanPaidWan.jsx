import { ease, item, lerp, loop, ms, pulse, stage } from '../../player/index.js';

import { Box, FRAME, Foot, Link, MONO, Packet, Tag } from './parts.jsx';

/**
 * The economic hook in one picture: everything on the left of the gateway is
 * free, and only what crosses it is counted. A neighbour chat, a file from the
 * Node and a farm sensor reporting never touch the meter, because none of them
 * consume backhaul. The meter only moves when a byte leaves for the internet.
 */

const NODE = { x: 330, y: 250 };
const GATE = 560;
const PEERS = [
  { x: 130, y: 128, label: 'Phone', tint: 'var(--xk-ink)' },
  { x: 130, y: 372, label: 'Neighbour', tint: 'var(--xk-ink)' },
  { x: 330, y: 420, label: 'Farm sensor', tint: 'var(--xk-lora)' },
];
const UNIT_MICRO_KES = 500;

/** A packet that runs out and back along a link, so the LAN looks like chatter. */
function shuttle(t, start, period) {
  const p = loop(t, start, period);
  return p < 0.5 ? p * 2 : (1 - p) * 2;
}

export default function FreeLanPaidWan({ t }) {
  const glow = pulse(t, 1000);
  const lanOn = stage(t, ms(1.0), 500);
  const wanStart = ms(3.2);
  const wanPeriod = 1100;
  const crossings = Math.max(0, Math.min(4, Math.floor((t - wanStart) / wanPeriod)));
  const wanTrip = t >= wanStart ? loop(t, wanStart, wanPeriod) : 0;
  const meter = stage(t, ms(2.8), 500);
  const foot = stage(t, ms(7.2), 600);

  return (
    <svg viewBox={`0 0 ${FRAME.w} ${FRAME.h}`} role="img" aria-label="Local traffic passing free inside the mesh while wide area traffic is metered at the gateway">
      <rect x={40} y={60} width={GATE - 80} height={400} fill="var(--xk-accent-soft)" opacity={0.35 * stage(t, 0, 500)} />
      <Tag x={60} y={88} text="free LAN plane" tint="var(--xk-good)" p={stage(t, 0, 500)} anchor="start" size={16} />
      <Tag x={900} y={88} text="paid WAN" tint="var(--xk-money)" p={stage(t, ms(0.3), 500)} anchor="end" size={16} />

      {PEERS.map((peer, i) => (
        <Link
          key={`link-${peer.label}`}
          x1={peer.x}
          y1={peer.y}
          x2={NODE.x}
          y2={NODE.y}
          p={item(t, ms(0.5), i, 160, 400)}
          tint="var(--xk-good)"
          width={2}
        />
      ))}

      <Link x1={NODE.x + 76} y1={NODE.y} x2={840 - 76} y2={NODE.y} p={stage(t, ms(1.0), 500)} tint="var(--xk-money)" width={3} />

      {PEERS.map((peer, i) => (
        <Box
          key={peer.label}
          x={peer.x}
          y={peer.y}
          w={132}
          h={62}
          label={peer.label}
          tint={peer.tint}
          p={item(t, 0, i, 170, 400)}
        />
      ))}
      <Box x={NODE.x} y={NODE.y} w={140} h={76} label="Node" sub="gateway" tint="var(--xk-plc)" p={stage(t, ms(0.2), 400)} />
      <Box x={840} y={NODE.y} w={140} h={76} label="Internet" tint="var(--xk-muted)" p={stage(t, ms(0.6), 400)} />

      {lanOn > 0.4
        ? PEERS.map((peer, i) => {
            const p = shuttle(t, ms(1.0) + i * 260, 1600 + i * 180);
            return (
              <Packet
                key={`lan-${peer.label}`}
                x={lerp(peer.x, NODE.x, p)}
                y={lerp(peer.y, NODE.y, p)}
                size={12}
                tint="var(--xk-good)"
              />
            );
          })
        : null}

      <g opacity={lanOn}>
        <rect x={60} y={190} width={150} height={56} fill="var(--xk-surface)" stroke="var(--xk-good)" strokeWidth="2" />
        <text x={135} y={212} textAnchor="middle" fontFamily={MONO} fontSize="13" fill="var(--xk-good)">
          LAN metered
        </text>
        <text x={135} y={234} textAnchor="middle" fontFamily={MONO} fontSize="19" fontWeight="600" fill="var(--xk-good)">
          0 XKN
        </text>
      </g>

      <g opacity={stage(t, ms(0.8), 500)}>
        <line x1={GATE} y1={70} x2={GATE} y2={450} stroke="var(--xk-money)" strokeWidth="2" strokeDasharray="8 8" />
        <rect x={GATE - 78} y={118} width={156} height={30} fill="var(--xk-money)" />
        <text x={GATE} y={139} textAnchor="middle" fontFamily={MONO} fontSize="15" fontWeight="600" fill="var(--xk-ground)">
          the meter
        </text>
      </g>

      {t >= wanStart && crossings < 4 ? (
        <Packet x={lerp(NODE.x + 76, 840 - 76, wanTrip)} y={NODE.y} size={18} tint="var(--xk-money)" glow={glow} />
      ) : null}

      <g opacity={meter}>
        <rect x={648} y={300} width={220} height={96} fill="var(--xk-surface)" stroke="var(--xk-money)" strokeWidth="2" />
        <text x={758} y={324} textAnchor="middle" fontFamily={MONO} fontSize="13" fill="var(--xk-faint)">
          billed, 10 KB units
        </text>
        <text x={758} y={354} textAnchor="middle" fontFamily={MONO} fontSize="26" fontWeight="600" fill="var(--xk-money)">
          {crossings}
        </text>
        <text x={758} y={380} textAnchor="middle" fontFamily={MONO} fontSize="15" fill="var(--xk-ink)">
          {(crossings * UNIT_MICRO_KES).toLocaleString('en-KE')} micro-KES
        </text>
      </g>

      <Tag
        x={60}
        y={282}
        text="chat, files, sensors:"
        tint="var(--xk-good)"
        p={stage(t, ms(2.0), 500, ease.outCubic)}
        anchor="start"
      />
      <Tag
        x={60}
        y={302}
        text="no backhaul, no bill"
        tint="var(--xk-good)"
        p={stage(t, ms(2.2), 500, ease.outCubic)}
        anchor="start"
      />

      <Foot text="Only bytes that leave the mesh are ever counted." p={foot} tint="var(--xk-ink)" />
    </svg>
  );
}
