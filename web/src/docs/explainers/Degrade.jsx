import { ease, lerp, loop, ms, pulse, stage } from '../../player/index.js';

import { Box, Chip, FRAME, Foot, Link, MONO, Packet, Tag } from './parts.jsx';

/**
 * What a grid cut actually does.
 *
 * Both power-line mediums die with the mains. LoRa does not, because the
 * Satellite runs off a panel and a cell and the Node keeps its radio on the
 * same backup that keeps its meter alive. Nothing is configured and nothing
 * fails over by hand: three delivery failures quarantine a medium for two
 * seconds, the score of the dead mediums goes to zero, and the radio plane
 * wins by arithmetic in about 0.8 seconds.
 */

const LEFT = 120;
const RIGHT = 840;
const LANES = [
  { y: 140, name: 'HomePlug AV', tint: 'var(--xk-plc)', score: '10 Mbps', dies: ms(3.2) },
  { y: 250, name: 'narrowband PLC', tint: 'var(--xk-nbplc)', score: '960 B/s', dies: ms(3.9) },
  { y: 360, name: 'LoRa SF7', tint: 'var(--xk-lora)', score: '5.4 kbps', dies: Infinity },
];

function dots(t, count, period, x1, x2) {
  const base = loop(t, 0, period);
  return Array.from({ length: count }, (unused, k) => lerp(x1, x2, (base + k / count) % 1));
}

export default function Degrade({ t }) {
  const cut = stage(t, ms(3.0), 320, ease.outQuart);
  const flash = pulse(t, 700);
  const quarantine = Math.max(0, 2 - (t - ms(4.2)) / 1000);
  const showQuarantine = t >= ms(4.2) && t <= ms(6.4);
  const carrier = stage(t, ms(6.4), 500, ease.outBack);
  const receipt = stage(t, ms(6.8), ms(1.4));
  const foot = stage(t, ms(7.4), 600);

  return (
    <svg viewBox={`0 0 ${FRAME.w} ${FRAME.h}`} role="img" aria-label="The two power line lanes going dark and the traffic rerouting onto LoRa">
      <Box x={LEFT - 40} y={250} w={120} h={250} label="" tint="var(--xk-ink)" p={stage(t, 0, 400)} />
      <Tag x={LEFT - 40} y={244} text="Client" tint="var(--xk-ink)" p={stage(t, 0, 400)} size={18} />
      <Tag x={LEFT - 40} y={268} text="one session" tint="var(--xk-faint)" p={stage(t, 0, 400)} />

      <Box x={RIGHT + 50} y={250} w={120} h={250} label="" tint="var(--xk-plc)" p={stage(t, ms(0.2), 400)} />
      <Tag x={RIGHT + 50} y={244} text="Node" tint="var(--xk-ink)" p={stage(t, ms(0.2), 400)} size={18} />
      <Tag x={RIGHT + 50} y={268} text="backhaul" tint="var(--xk-faint)" p={stage(t, ms(0.2), 400)} />

      {LANES.map((lane, i) => {
        const appear = stage(t, ms(0.4) + i * 200, 480);
        const dead = t >= lane.dies;
        const boosted = lane.dies === Infinity ? stage(t, ms(4.4), 900) : 0;
        const width = lane.dies === Infinity ? lerp(3, 8, boosted) : 3;
        const count = lane.dies === Infinity ? Math.round(lerp(3, 8, boosted)) : 4;
        const period = lane.dies === Infinity ? lerp(2200, 1200, boosted) : 2000;
        return (
          <g key={lane.name}>
            <Link
              x1={LEFT + 20}
              y1={lane.y}
              x2={RIGHT - 10}
              y2={lane.y}
              p={appear}
              tint={dead ? 'var(--xk-line)' : lane.tint}
              width={width}
              dash={dead ? '8 8' : ''}
            />
            <Tag
              x={LEFT + 24}
              y={lane.y - 18}
              text={lane.name}
              tint={dead ? 'var(--xk-faint)' : lane.tint}
              p={appear}
              anchor="start"
              size={16}
            />
            <Tag
              x={RIGHT - 14}
              y={lane.y - 18}
              text={dead ? 'score 0' : `score ${lane.score}`}
              tint={dead ? 'var(--xk-critical)' : 'var(--xk-muted)'}
              p={appear}
              anchor="end"
            />
            {!dead && appear > 0.6
              ? dots(t, count, period, LEFT + 20, RIGHT - 10).map((x, k) => (
                  <Packet key={k} x={x} y={lane.y} size={12} tint={lane.tint} />
                ))
              : null}
            {dead ? (
              <Tag
                x={(LEFT + RIGHT) / 2}
                y={lane.y + 26}
                text="3 failures, quarantined"
                tint="var(--xk-critical)"
                p={stage(t, lane.dies, 400)}
              />
            ) : null}
          </g>
        );
      })}

      {cut > 0 ? (
        <g opacity={cut}>
          <line x1={480} y1={90} x2={480} y2={410} stroke="var(--xk-critical)" strokeWidth={2 + flash * 2} strokeDasharray="10 8" />
          <rect x={404} y={64} width={152} height={30} fill="var(--xk-critical)" />
          <text x={480} y={85} textAnchor="middle" fontFamily={MONO} fontSize="16" fontWeight="600" fill="var(--xk-ground)">
            mains cut
          </text>
        </g>
      ) : null}

      {showQuarantine ? (
        <Tag
          x={480}
          y={434}
          text={`quarantine ${quarantine.toFixed(1)} s`}
          tint="var(--xk-warn)"
          p={1}
          size={16}
        />
      ) : null}

      {carrier > 0 ? (
        <g opacity={Math.min(1, carrier)}>
          <rect x={352} y={392} width={256} height={30} fill="var(--xk-surface)" stroke="var(--xk-lora)" strokeWidth="2" />
          <text x={480} y={413} textAnchor="middle" fontFamily={MONO} fontSize="16" fill="var(--xk-lora)">
            carrier: LoRa, 0.8 s to switch
          </text>
        </g>
      ) : null}

      {receipt > 0 && receipt < 1 ? (
        <Chip
          x={lerp(LEFT + 40, RIGHT - 40, receipt)}
          y={306}
          w={150}
          h={40}
          title="RECEIPT"
          value="still counting"
          tint="var(--xk-good)"
          p={1}
        />
      ) : null}

      <Foot text="Bulk traffic stops. Control, class C and the receipts do not." p={foot} tint="var(--xk-ink)" />
    </svg>
  );
}
