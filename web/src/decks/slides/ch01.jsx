import { SETTLE_GAS, gas } from './facts.js';
import { Box, COLOR, Grid, H, MONO, Packet, Reveal, Slide, Stage, Stat, W, Wire, ms, pulse } from './parts.jsx';

/** Chapter 1. What the network is, and the whole of it on one frame. */

function Opening({ t }) {
  return (
    <div className="xk-scene">
      <Reveal t={t} at={0} from="fade">
        <p className="xk-scene__kicker">xKoin, an invention by Martin Thuku</p>
      </Reveal>
      <Reveal t={t} at={ms(0.4)} from="up">
        <h2 className="xk-scene__title xk-scene__title--big">Free local mesh.</h2>
      </Reveal>
      <Reveal t={t} at={ms(1.4)} from="up">
        <h2 className="xk-scene__title xk-scene__title--big" style={{ color: COLOR.money }}>
          Paid transit, sold per verified byte.
        </h2>
      </Reveal>
      <div className="xk-scene__body" style={{ display: 'flex', alignItems: 'flex-end' }}>
        <Grid cols={4} gap={16} style={{ width: '100%' }}>
          <Stat t={t} at={ms(3.0)} value="3" label="physical mediums under one frame format" />
          <Stat t={t} at={ms(3.25)} value="0" label="chain transactions per delivered packet" />
          <Stat t={t} at={ms(3.5)} value="1" label="settlement closes a whole session" />
          <Stat t={t} at={ms(3.75)} value="8" label="Laws, each with a named passing test" tone={COLOR.good} />
        </Grid>
      </div>
      <Reveal t={t} at={ms(4.6)} from="fade">
        <div className="xk-scene__foot">
          <span>the full invention deck</span>
          <span>45 scenes, ten chapters</span>
        </div>
      </Reveal>
    </div>
  );
}

const CHAIN = [
  { label: 'Phone', sub: 'holds the keys', tone: COLOR.ink },
  { label: 'Relay', sub: 'Node-Satellite', tone: COLOR.accent },
  { label: 'Riser', sub: 'the mains wiring', tone: COLOR.plc },
  { label: 'Node', sub: 'meters the byte', tone: COLOR.accent },
  { label: 'Uplink', sub: 'router or LTE', tone: COLOR.muted },
  { label: 'Internet', sub: 'metered bytes', tone: COLOR.muted },
];

const BW = 160;
const GAP = (W - CHAIN.length * BW) / (CHAIN.length - 1);
const BX = (i) => i * (BW + GAP);
const BY = 74;
const BH = 86;
const MID = BY + BH / 2;

function OnePicture({ t }) {
  const glow = pulse(t, 1100);
  return (
    <Slide
      t={t}
      kicker="the invention in one picture"
      title="A byte out, a signature back, one settlement at the end"
      lede="Nothing in the mesh is a claim about money that is not also a signature."
      foot={['free inside the mesh, metered on the way out', 'no hop touches the chain']}
    >
      <Stage h={H.lede}>
        {CHAIN.slice(0, -1).map((node, i) => (
          <Wire
            key={`w-${node.label}`}
            t={t}
            at={ms(1.4) + i * 200}
            d={`M ${BX(i) + BW} ${MID} H ${BX(i + 1)}`}
            tone={i === 1 || i === 2 ? COLOR.plc : COLOR.line}
            length={GAP}
            duration={320}
          />
        ))}

        {CHAIN.map((node, i) => (
          <Box
            key={node.label}
            t={t}
            at={ms(1.0) + i * 200}
            x={BX(i)}
            y={BY}
            w={BW}
            h={BH}
            label={node.label}
            sub={node.sub}
            tone={node.tone}
          />
        ))}

        <Reveal t={t} at={ms(2.6)} from="fade" as="g">
          <text x={BX(0) + BW + GAP / 2} y={BY - 14} textAnchor="middle" fontFamily={MONO} fontSize="14" fill={COLOR.faint}>
            Wi-Fi
          </text>
          <text x={BX(1) + BW + GAP / 2} y={BY - 14} textAnchor="middle" fontFamily={MONO} fontSize="14" fill={COLOR.plc}>
            HomePlug AV
          </text>
          <text x={BX(3) + BW + GAP / 2} y={BY - 14} textAnchor="middle" fontFamily={MONO} fontSize="14" fill={COLOR.faint}>
            WAN
          </text>
        </Reveal>

        <Packet t={t} at={ms(3.2)} duration={ms(2.0)} x1={BX(0) + BW} x2={BX(5)} y={MID} tone={COLOR.money} r={9 + glow * 2} />

        <Wire
          t={t}
          at={ms(5.6)}
          d={`M ${BX(3) + BW / 2} ${BY + BH} V 250 H ${BX(0) + BW / 2} V ${BY + BH + 6}`}
          tone={COLOR.money}
          width={2.5}
          dashed
          duration={600}
          label="signed cumulative receipt, 108 bytes, one narrowband frame"
          lx={W / 2 - 60}
          ly={276}
        />
        <Packet t={t} at={ms(7.0)} duration={ms(1.4)} x1={BX(3) + BW / 2} x2={BX(0) + BW / 2} y={250} tone={COLOR.money} r={7} />

        <Wire
          t={t}
          at={ms(8.4)}
          d={`M ${BX(3) + BW} ${MID + 20} V 330 H ${BX(4) + 30}`}
          tone={COLOR.good}
          width={2.5}
          length={340}
          duration={600}
        />
        <Box
          t={t}
          at={ms(9.6)}
          x={BX(4) + 30}
          y={300}
          w={W - BX(4) - 30}
          h={60}
          label="xKoinEscrow on Base"
          sub="one ticket batch settles the session"
          tone={COLOR.good}
        />

        <Reveal t={t} at={ms(10.8)} from="up" as="g">
          <text x="0" y={332} fontFamily={MONO} fontSize="17" fill={COLOR.good} fontWeight="600">
            {gas(SETTLE_GAS)} gas
          </text>
          <text x="0" y={356} fontFamily={MONO} fontSize="15" fill={COLOR.muted}>
            measured, two tickets in one batch
          </text>
          <text x="0" y={380} fontFamily={MONO} fontSize="15" fill={COLOR.muted}>
            0.35 KES at the 2026-09-09 gas price
          </text>
        </Reveal>
      </Stage>
    </Slide>
  );
}

export const SCENES = {
  opening: Opening,
  'one-picture': OnePicture,
};
