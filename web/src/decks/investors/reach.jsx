import { Reveal, ease, item, loop, ms, pulse, stage } from '../../player/index.js';

import { Foot, Head, Stage } from './parts.jsx';

/**
 * Scene 14: the free radio plane, and the devices that live on it.
 *
 * Devices and figures come from docs/papers/09-lora-ecosystem-devices.md (the
 * farm sensor node, the water tank node, the Meshtastic handset, the 2.4 mAh a
 * day power budget) and docs/potential/01-large-scale-farm-iot.md (the Laikipia
 * farm with four boreholes and two fifty thousand litre tanks).
 */

const DEVICES = [
  { x: 760, y: 70, label: 'Soil probe', note: 'moisture and temperature, every 15 minutes' },
  { x: 900, y: 190, label: 'Water tank', note: 'level in a 50,000 litre tank' },
  { x: 760, y: 310, label: 'Borehole pump', note: 'reports when it starts and stops' },
  { x: 560, y: 380, label: 'Handset', note: 'a walker with no phone signal at all' },
];

function TheFreePlane({ t }) {
  const ring = loop(t, ms(0.8), 2600);
  const glow = pulse(t, 1800);
  return (
    <div className="xk-scene">
      <Head
        kicker="14 / the free plane"
        title="Sensors that never open a wallet."
        lede="A probe that talks to the box and never leaves the mesh costs nothing to run, so the network gets denser for free."
      />
      <div className="xk-scene__body">
        <Stage viewBox="0 0 1136 464">
          {[0, 1, 2].map((i) => {
            const p = (ring + i / 3) % 1;
            return (
              <circle
                key={i}
                cx="230"
                cy="220"
                r={70 + p * 320}
                fill="none"
                stroke="var(--xk-lora)"
                strokeWidth="1.5"
                opacity={(1 - p) * 0.55 * stage(t, ms(0.6), 500)}
              />
            );
          })}

          <Reveal t={t} at={ms(0.2)} from="pop" as="g">
            <rect x="160" y="176" width="140" height="88" fill="var(--xk-surface)" stroke="var(--xk-accent)" strokeWidth="3" />
            <text x="230" y="212" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="19" fill="var(--xk-ink)">
              xKoin-Node
            </text>
            <text x="230" y="238" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="15" fill="var(--xk-lora)">
              radio always on
            </text>
          </Reveal>

          {DEVICES.map((device, i) => {
            const p = item(t, ms(1.2), i, 420, 500, ease.outCubic);
            return (
              <g key={device.label} opacity={p}>
                <path d={`M 300 220 L ${device.x} ${device.y + 22}`} stroke="var(--xk-lora)" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.7" />
                <rect x={device.x} y={device.y} width="270" height="76" fill="var(--xk-surface)" stroke="var(--xk-line)" strokeWidth="1.5" />
                <circle cx={device.x + 22} cy={device.y + 26} r="7" fill="var(--xk-lora)" opacity={0.6 + 0.4 * glow} />
                <text x={device.x + 40} y={device.y + 32} fontFamily="var(--xk-font-mono)" fontSize="19" fill="var(--xk-ink)">
                  {device.label}
                </text>
                <text x={device.x + 40} y={device.y + 56} fontSize="15" fill="var(--xk-muted)">
                  {device.note}
                </text>
                <text x={device.x + 248} y={device.y + 32} textAnchor="end" fontFamily="var(--xk-font-mono)" fontSize="19" fill="var(--xk-good)">
                  free
                </text>
              </g>
            );
          })}

          <Reveal t={t} at={ms(3.4)} from="up" as="g">
            <path d="M 10 396 H 520" stroke="var(--xk-line)" strokeWidth="1" />
          </Reveal>

          {[
            ['2.4 mAh', 'a day, so one cell lasts', 'var(--xk-ink)'],
            ['15 min', 'between readings', 'var(--xk-ink)'],
            ['KES 0', 'to send any of it', 'var(--xk-good)'],
          ].map(([value, label, tone], i) => (
            <Reveal key={label} t={t} at={ms(3.6) + i * 300} from="up" as="g">
              <text x={10 + i * 176} y="426" fontFamily="var(--xk-font-mono)" fontSize="28" fill={tone}>
                {value}
              </text>
              <text x={10 + i * 176} y="452" fontSize="15" fill="var(--xk-muted)">
                {label}
              </text>
            </Reveal>
          ))}

          <Reveal t={t} at={ms(4.4)} from="up" as="g">
            <text x="10" y="372" fontSize="19" fill="var(--xk-muted)">
              The radio is also the plane that survives a power cut, which is the next scene.
            </text>
          </Reveal>
        </Stage>
      </div>
      <Foot
        source="docs/papers/09-lora-ecosystem-devices.md; docs/potential/01-large-scale-farm-iot.md"
        right="free LAN, no voucher needed"
      />
    </div>
  );
}

export const REACH_SCENES = [
  {
    id: 'the-free-plane',
    title: 'The free radio plane',
    duration: ms(10),
    caption:
      'A soil probe, a tank sensor, a borehole pump or a handheld radio talks to the box and never leaves the mesh, so it costs nothing to run. The farm probe draws so little that one cell outlasts its own shelf life.',
    Scene: TheFreePlane,
  },
];
