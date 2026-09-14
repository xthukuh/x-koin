import { Bar, Box, COLOR, Chip, Grid, H, MONO, Panel, Reveal, Rows, Slide, Stage, Stat, W, Wire, ease, lerp, ms, stage } from './parts.jsx';

/** Chapter 5. Normal, and every way the ground gives way. */

/* ------------------------------------------------------- 5.1 medium scoring */

const CUT_AT = 6.0;
const SCORED = [
  { name: 'HomePlug AV', tone: COLOR.plc, before: 1.0, after: 0, note: 'rides the mains' },
  { name: 'narrowband PLC', tone: COLOR.nbplc, before: 0.42, after: 0, note: 'rides the same mains' },
  { name: 'LoRa SF7', tone: COLOR.lora, before: 0.18, after: 0.18, note: 'rides its own battery' },
];

function ModeNormal({ t }) {
  const cut = stage(t, ms(CUT_AT), ms(0.8), ease.inOutCubic);
  return (
    <Slide
      t={t}
      kicker="operating mode 1 of 6, normal"
      title="The sender scores every live medium and picks the highest"
      lede="There is no configured preference order and no manual failover anywhere in the system."
      foot={['three consecutive failures quarantine a medium for 2 seconds', 'window 16 by default, 8 on LoRa-only paths']}
    >
      <Stage h={H.both}>
        <Reveal t={t} at={ms(1.0)} from="fade" as="g">
          <text x="0" y={26} fontFamily={MONO} fontSize="22" fill={COLOR.accent}>
            score = goodput_ewma x (1 - loss_ewma)
          </text>
        </Reveal>

        {SCORED.map((medium, i) => {
          const y = 70 + i * 74;
          const value = lerp(medium.before, medium.after, cut);
          return (
            <g key={medium.name}>
              <Reveal t={t} at={ms(1.6) + i * 260} from="left" as="g">
                <text x="0" y={y + 20} fontFamily={MONO} fontSize="19" fontWeight="600" fill={medium.tone}>
                  {medium.name}
                </text>
                <text x="0" y={y + 40} fontFamily={MONO} fontSize="14" fill={COLOR.faint}>
                  {medium.note}
                </text>
              </Reveal>
              <Bar t={t} at={ms(1.9) + i * 260} x={280} y={y + 2} w={520} h={26} fill={value} tone={medium.tone} />
              <text x={820} y={y + 23} fontFamily={MONO} fontSize="17" fill={value > 0.001 ? COLOR.ink : COLOR.bad} opacity={stage(t, ms(2.2) + i * 260, 400)}>
                {value > 0.001 ? value.toFixed(2) : 'quarantined'}
              </text>
            </g>
          );
        })}

        <g opacity={cut}>
          <line x1="0" y1={300} x2={W} y2={300} stroke={COLOR.bad} strokeWidth="1.5" strokeDasharray="6 5" />
          <text x="0" y={326} fontFamily={MONO} fontSize="18" fontWeight="600" fill={COLOR.bad}>
            grid cut: both power-line mediums fail together, and they fail without warning
          </text>
          <text x="0" y={350} fontFamily={MONO} fontSize="17" fill={COLOR.good}>
            the radio wins by default, about 0.8 s later in the simulation
          </text>
        </g>
      </Stage>
    </Slide>
  );
}

/* ------------------------------------------------------------ 5.2 WAN down */

function ModeWanDown({ t }) {
  return (
    <Slide
      t={t}
      kicker="operating mode 2 of 6, the wide area is down"
      title="New transit stops. Everything the mesh already promised holds."
      lede="A node cannot ask the gateway for a deposit, so it serves against the voucher alone up to a smaller offline cap."
      foot={['journey J9, built at the protocol layer', 'demo D4, last network standing']}
    >
      <Grid cols={2} gap={24}>
        <Panel t={t} at={ms(1.0)} title="what stops" tone={COLOR.bad}>
          <Rows
            t={t}
            at={ms(1.4)}
            gap={280}
            size={18}
            widths={['45%', '55%']}
            rows={[
              ['new WAN traffic', 'there is nothing upstream to carry it to'],
              ['balance lookup', 'the deposit cannot be read from the chain'],
              ['ticket relay', 'batches queue rather than settle'],
            ]}
          />
        </Panel>
        <Panel t={t} at={ms(1.2)} title="what survives" tone={COLOR.good}>
          <Rows
            t={t}
            at={ms(2.6)}
            gap={280}
            size={18}
            widths={['45%', '55%']}
            rows={[
              ['the free LAN plane', 'entirely, because it never needed the link'],
              ['admission', 'vouchers verify offline against a key in firmware'],
              ['receipts', 'they accumulate, and the counters are cumulative'],
              ['settlement', 'it lands when the link returns, to the micro-KES'],
            ]}
          />
        </Panel>
      </Grid>
      <Reveal
        t={t}
        at={ms(4.4)}
        from="up"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <Chip label="offline cap: 5 KES recommended" tone={COLOR.warn} />
        <span style={{ fontSize: 17, color: COLOR.muted }}>
          The cap bounds the one case the chain cannot: a user attached to several nodes at once. Nothing goes
          insolvent either way, but without it the last node to settle is the one that is underpaid.
        </span>
      </Reveal>
    </Slide>
  );
}

/* -------------------------------------------------------- 5.3 segment cut */

function ModeSegmentCut({ t }) {
  return (
    <Slide
      t={t}
      kicker="operating mode 3 of 6, the mains segment ends"
      title="Where the wiring stops, the radio starts"
      lede="A transformer, a phase change or a filter ends the power-line carrier, and no amount of transmit power changes that."
      foot={['demo D3, transformer node jump', 'pass criterion: zero carrier across the filter in 10 minutes']}
    >
      <Stage h={H.both}>
        <Reveal t={t} at={ms(1.0)} from="fade" as="g">
          <rect x="0" y="30" width="470" height="170" fill="none" stroke={COLOR.line} strokeWidth="1.5" />
          <text x="14" y="52" fontFamily={MONO} fontSize="14" fill={COLOR.faint}>
            segment A: one mains riser
          </text>
        </Reveal>
        <Reveal t={t} at={ms(1.2)} from="fade" as="g">
          <rect x="666" y="30" width="470" height="170" fill="none" stroke={COLOR.line} strokeWidth="1.5" />
          <text x="680" y="52" fontFamily={MONO} fontSize="14" fill={COLOR.faint}>
            segment B: a second riser
          </text>
        </Reveal>

        <Box t={t} at={ms(1.4)} x={30} y={80} w={190} h={78} label="Node" sub="backhaul, metering" tone={COLOR.accent} />
        <Box t={t} at={ms(1.6)} x={250} y={80} w={190} h={78} label="Relay" sub="bulk stays local" />
        <Box t={t} at={ms(1.8)} x={700} y={80} w={210} h={78} label="Relay + radio" sub="segment B, its own bulk" tone={COLOR.accent} />
        <Box t={t} at={ms(2.0)} x={940} y={80} w={166} h={78} label="phones" sub="Wi-Fi attach" />

        <Wire t={t} at={ms(2.2)} d="M 220 119 H 250" tone={COLOR.plc} length={30} />
        <Wire t={t} at={ms(2.3)} d="M 910 119 H 940" tone={COLOR.plc} length={30} />

        <Reveal t={t} at={ms(3.0)} from="fade" as="g">
          <line x1="568" y1="14" x2="568" y2="300" stroke={COLOR.bad} strokeWidth="2.5" strokeDasharray="7 6" />
          <text x="568" y="8" textAnchor="middle" fontFamily={MONO} fontSize="14" fill={COLOR.bad}>
            distribution transformer: the power-line carrier stops here
          </text>
        </Reveal>

        <Wire
          t={t}
          at={ms(4.0)}
          d="M 125 162 C 125 296, 805 296, 805 162"
          tone={COLOR.lora}
          width={3}
          length={900}
          duration={900}
          label="LoRa carries control and class C across the boundary"
          lx={465}
          ly={322}
        />

        <Reveal t={t} at={ms(6.0)} from="up" as="g">
          <text x="0" y={366} fontSize="17" fill={COLOR.muted}>
            Each segment keeps serving its own bulk traffic locally. Only control and transactional service
            cross.
          </text>
        </Reveal>
      </Stage>
    </Slide>
  );
}

/* --------------------------------------------------------- 5.4 radio only */

function ModeLoraOnly({ t }) {
  return (
    <Slide
      t={t}
      kicker="operating mode 4 of 6, radio only"
      title="What can still be sold at 5.4 kbps"
      lede="The gateway terminates the upstream connection and serves three classes. Every figure here is a simulation result."
      foot={['duty cycle binds class A harder than bandwidth does', 'the Kenyan duty-cycle position is unverified until counsel answers']}
    >
      <Grid cols={3} gap={18}>
        <Panel t={t} at={ms(1.0)} title="class C, transactional" tone={COLOR.good}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            Native frames, no internet protocol at all. Balances, prices, messages, kiosk operations, DNS. A
            108 byte receipt fits one narrowband frame, so the payment plane never stops.
          </div>
        </Panel>
        <Panel t={t} at={ms(1.3)} title="class A, distilled web" tone={COLOR.money}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            A 2.5 MB page reduced to about 12 KB in the cloud proxy by text extraction and shared-dictionary
            compression: 21.9 s per page on SF7, 0.86 s on GFSK. The ratio holds only for text-dominated
            pages.
          </div>
        </Panel>
        <Panel t={t} at={ms(1.6)} title="class B, adaptive" tone={COLOR.lora}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            The same radio switched between LoRa and GFSK by link score, reaching 121.9 kbps at GFSK 150k.
            GFSK trades sensitivity for rate, so it needs a strong link.
          </div>
        </Panel>
      </Grid>
      <Grid cols={3} gap={14} style={{ marginTop: 20 }}>
        <Stat t={t} at={ms(3.0)} value="1.5 / hour" label="pages on SF7 on one channel at a 1 percent duty cycle" tone={COLOR.warn} />
        <Stat t={t} at={ms(3.25)} value="11.7 / hour" label="the same, across eight channels" tone={COLOR.warn} />
        <Stat t={t} at={ms(3.5)} value="about 27x" label="the lift GFSK gives, because the airtime per page collapses" tone={COLOR.lora} />
      </Grid>
      <Reveal
        t={t}
        at={ms(4.6)}
        from="fade"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 16, color: COLOR.faint }}
      >
        The class exists to make news, email and text browsing possible on a survival link. It is not a claim
        that the web fits down a 5.4 kbps pipe.
      </Reveal>
    </Slide>
  );
}

/* ---------------------------------------------------- 5.5 outage recovery */

const TIMELINE = [
  { at: 0.0, x: 0, label: 't = 0', text: 'transfer running on the mains', tone: COLOR.plc },
  { at: 2.0, x: 0.22, label: 't = 2 s', text: 'the grid is cut', tone: COLOR.bad },
  { at: 2.8, x: 0.32, label: '+0.8 s', text: 'first bytes delivered on the radio', tone: COLOR.lora },
  { at: 3.0, x: 0.55, label: 'outage', text: 'free LAN alive, receipts accumulating', tone: COLOR.good },
  { at: 3.0, x: 0.82, label: 'return', text: 'the backhaul comes back', tone: COLOR.accent },
  { at: 3.0, x: 1.0, label: 'settled', text: 'the pending batch lands on chain', tone: COLOR.money },
];

function ModeOutageRecovery({ t }) {
  const run = stage(t, ms(1.2), ms(5.4), ease.inOutSine);
  const axisY = 120;
  const x0 = 30;
  const x1 = W - 60;
  return (
    <Slide
      t={t}
      kicker="operating mode 5 of 6, full outage and recovery"
      title="Nothing owed is lost while the lights are off"
      lede="The counters are cumulative, so the receipt that arrives after the blackout already accounts for the bytes before it."
      foot={['scenario S2, deterministic seed', 'demo D4: settlement within 5 minutes of the link returning']}
    >
      <Stage h={H.both}>
        <line x1={x0} y1={axisY} x2={x1} y2={axisY} stroke={COLOR.line} strokeWidth="2" />
        <line x1={x0} y1={axisY} x2={lerp(x0, x1, run)} y2={axisY} stroke={COLOR.accent} strokeWidth="3" />

        {TIMELINE.map((point, i) => {
          const x = lerp(x0, x1, point.x);
          const shown = run >= point.x - 0.001;
          const anchor = i === 0 ? 'start' : i === TIMELINE.length - 1 ? 'end' : 'middle';
          const above = i % 2 === 0;
          return (
            <g key={point.label + i} opacity={shown ? 1 : 0}>
              <line x1={x} y1={axisY - 14} x2={x} y2={axisY + 14} stroke={point.tone} strokeWidth="3" />
              <text x={x} y={above ? axisY - 30 : axisY + 44} textAnchor={anchor} fontFamily={MONO} fontSize="16" fontWeight="600" fill={point.tone}>
                {point.label}
              </text>
              <text x={x} y={above ? axisY - 10 : axisY + 66} textAnchor={anchor} fontFamily={MONO} fontSize="13.5" fill={COLOR.muted}>
                {point.text}
              </text>
            </g>
          );
        })}

        <Reveal t={t} at={ms(7.4)} from="up" as="g">
          <text x="0" y={236} fontFamily={MONO} fontSize="18" fontWeight="600" fill={COLOR.good}>
            zero receipts lost across the outage
          </text>
          <text x="0" y={262} fontSize="17" fill={COLOR.muted}>
            measured as the on-chain settled total matching the counter recorded before the link returned,
            to the micro-KES.
          </text>
          <text x="0" y={306} fontFamily={MONO} fontSize="18" fontWeight="600" fill={COLOR.warn}>
            what the demo has to separate
          </text>
          <text x="0" y={332} fontSize="17" fill={COLOR.muted}>
            A batch that is not yet full sits waiting. If the five minute criterion fails, the run records
            whether the cause was the threshold or a defect.
          </text>
        </Reveal>
      </Stage>
    </Slide>
  );
}

/* --------------------------------------------------------- 5.6 degrade */

function ModeDegrade({ t }) {
  return (
    <Slide
      t={t}
      kicker="operating mode 6 of 6"
      title="Degrade, do not die"
      lede="For each failure the design question is not whether service degrades but what degrades, and what is still true afterwards."
      foot={['paper 02 section 7, failure modes', 'every row names its mechanism']}
    >
      <Rows
        t={t}
        at={ms(1.0)}
        gap={520}
        size={17}
        widths={['20%', '25%', '55%']}
        head={['failure', 'what stops', 'what survives, and by what mechanism']}
        rows={[
          ['grid down', 'both power-line carriers, bulk WAN', 'radio control and class C in about 0.8 s, by medium scoring and quarantine'],
          ['backhaul down', 'new WAN traffic, balance lookup', 'the free plane entirely, admission by offline voucher, receipts by cumulative counters'],
          ['operator vanishes', 'that node, if nobody maintains it', 'every deposit, because it is per user and withdrawable, and the operator own unclaimed earnings'],
          ['founder vanishes', 'governance changes, then new admissions', 'settlement, deposits, withdrawals and claims, none of which need the founder at all'],
        ]}
      />
    </Slide>
  );
}

export const SCENES = {
  'mode-normal': ModeNormal,
  'mode-wan-down': ModeWanDown,
  'mode-segment-cut': ModeSegmentCut,
  'mode-lora-only': ModeLoraOnly,
  'mode-outage-recovery': ModeOutageRecovery,
  'mode-degrade': ModeDegrade,
};
