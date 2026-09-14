import { Reveal, ScenePlayer, countUp, draw, item, lerp, ms, pulse, stage } from '../../player/index.js';

/**
 * A three-scene deck that exercises the player: staggered reveals, a counting
 * number, a self-drawing path and a looping pulse, every one a pure function
 * of `t`. Deck authors copy this shape. Scenes are written in the 1280x720
 * frame the player scales; the `xk-scene*` classes come from player.css.
 */

function Opening({ t }) {
  return (
    <div className="xk-scene">
      <Reveal t={t} at={0} from="fade">
        <p className="xk-scene__kicker">xKoin</p>
      </Reveal>
      <Reveal t={t} at={ms(0.3)} from="up">
        <h2 className="xk-scene__title xk-scene__title--big">Free local mesh.</h2>
      </Reveal>
      <Reveal t={t} at={ms(1.1)} from="up">
        <h2 className="xk-scene__title xk-scene__title--big" style={{ color: 'var(--xk-money)' }}>
          Paid transit, sold per verified byte.
        </h2>
      </Reveal>
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignContent: 'end' }}>
        {[
          ['3', 'physical mediums under one frame'],
          ['0', 'chain transactions per packet'],
          ['1', 'settlement per session'],
        ].map(([value, label], i) => (
          <Reveal key={label} t={t} at={ms(2.2) + i * 220} from="up" className="xk-scene__stat">
            <div className="xk-scene__stat-value">{value}</div>
            <div className="xk-scene__stat-label">{label}</div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function Flow({ t }) {
  const nodes = [
    { x: 120, y: 360, label: 'Client', color: 'var(--xk-ink)' },
    { x: 460, y: 360, label: 'Satellite', color: 'var(--xk-lora)' },
    { x: 800, y: 360, label: 'Node', color: 'var(--xk-plc)' },
    { x: 1140, y: 360, label: 'Internet', color: 'var(--xk-muted)' },
  ];
  const packet = stage(t, ms(2.4), ms(2.2), (x) => x);
  const px = lerp(120, 800, packet);
  const glow = pulse(t, 900);
  return (
    <div className="xk-scene">
      <Reveal t={t} at={0} from="fade">
        <p className="xk-scene__kicker">How a byte travels</p>
      </Reveal>
      <Reveal t={t} at={ms(0.2)} from="up">
        <h2 className="xk-scene__title">Frames hop the mesh, receipts follow.</h2>
      </Reveal>
      <div className="xk-scene__body">
        <svg viewBox="0 0 1280 420" width="1136" height="373" style={{ position: 'absolute', inset: 0 }}>
          {nodes.slice(0, -1).map((node, i) => (
            <path
              key={node.label}
              d={`M ${node.x + 44} ${node.y} H ${nodes[i + 1].x - 44}`}
              stroke="var(--xk-line)"
              strokeWidth="3"
              fill="none"
              style={draw(item(t, ms(0.9), i, 260, 500), 300)}
            />
          ))}
          {nodes.map((node, i) => (
            <Reveal key={node.label} t={t} at={ms(0.6) + i * 200} from="up" as="g">
              <rect x={node.x - 44} y={node.y - 44} width="88" height="88" fill="var(--xk-surface)" stroke={node.color} strokeWidth="3" />
              <text x={node.x} y={node.y + 72} textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="18" fill="var(--xk-muted)">
                {node.label}
              </text>
            </Reveal>
          ))}
          {packet > 0 && packet < 1 ? (
            <circle cx={px} cy={360} r={10 + glow * 3} fill="var(--xk-money)" />
          ) : null}
          <Reveal t={t} at={ms(4.7)} from="down" as="g">
            <text x="800" y="290" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="20" fill="var(--xk-good)">
              receipt signed, 0 gas
            </text>
          </Reveal>
        </svg>
      </div>
      <div className="xk-scene__foot">
        <span>frame flow</span>
        <span>{(t / 1000).toFixed(1)} s</span>
      </div>
    </div>
  );
}

function Numbers({ t }) {
  return (
    <div className="xk-scene">
      <Reveal t={t} at={0} from="fade">
        <p className="xk-scene__kicker">Measured, not modelled</p>
      </Reveal>
      <Reveal t={t} at={ms(0.2)} from="up">
        <h2 className="xk-scene__title">One settlement closes a whole session.</h2>
      </Reveal>
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, alignContent: 'start' }}>
        <Reveal t={t} at={ms(0.8)} from="up" className="xk-scene__stat">
          <div className="xk-scene__stat-value">{countUp(t, ms(1.0), ms(1.6), 191698)}</div>
          <div className="xk-scene__stat-label">gas to settle a cumulative-unit delta on xKoinEscrow</div>
        </Reveal>
        <Reveal t={t} at={ms(1.0)} from="up" className="xk-scene__stat">
          <div className="xk-scene__stat-value">{countUp(t, ms(1.2), ms(1.6), 9.768, { decimals: 3 })} Mbps</div>
          <div className="xk-scene__stat-label">goodput measured over the PLC backhaul</div>
        </Reveal>
        <Reveal t={t} at={ms(1.2)} from="up" className="xk-scene__stat">
          <div className="xk-scene__stat-value xk-scene__good">0 / {countUp(t, ms(1.4), ms(1.4), 20000)}</div>
          <div className="xk-scene__stat-label">malformed frames accepted by the protocol fuzz</div>
        </Reveal>
        <Reveal t={t} at={ms(1.4)} from="up" className="xk-scene__stat">
          <div className="xk-scene__stat-value">{countUp(t, ms(1.6), ms(1.2), 28)}</div>
          <div className="xk-scene__stat-label">forge tests passing, including the solvency invariant</div>
        </Reveal>
      </div>
    </div>
  );
}

export const EXAMPLE_SCENES = [
  {
    id: 'opening',
    title: 'Free local mesh, paid transit',
    duration: ms(4),
    caption: 'xKoin is a neighbourhood network that is free to use locally and charges only for bytes that leave for the wider internet.',
    Scene: Opening,
  },
  {
    id: 'flow',
    title: 'How a byte travels',
    duration: ms(6),
    caption: 'A frame hops from a phone to a Satellite to a Node. Each hop is signed, and no hop touches the blockchain.',
    Scene: Flow,
  },
  {
    id: 'numbers',
    title: 'Measured, not modelled',
    duration: ms(4),
    caption: 'These are numbers from the proof runs in this repository, not projections.',
    Scene: Numbers,
  },
];

export default function ExampleDeck() {
  return <ScenePlayer scenes={EXAMPLE_SCENES} title="Example deck" />;
}
