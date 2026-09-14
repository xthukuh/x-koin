import { FEE_BPS, PRICE_UKES, TREASURY_FEE_UKES, UNIT_BYTES, kesFromUkes } from './facts.js';
import { Box, COLOR, Code, Grid, H, MONO, Panel, Reveal, Rows, Slide, Stage, Stat, Verdict, W, Wire, ms } from './parts.jsx';

/** Chapter 7. The peg, the price, the operator return and the fee. */

const RING = [
  { label: 'KES', sub: 'at the kiosk', x: 0, tone: COLOR.money },
  { label: 'mint', sub: 'against a bank callback', x: 1, tone: COLOR.good },
  { label: 'XKN', sub: 'in the user wallet', x: 2, tone: COLOR.accent },
  { label: 'spend', sub: 'signed receipts', x: 3, tone: COLOR.accent },
  { label: 'burn', sub: 'on the payout', x: 4, tone: COLOR.good },
  { label: 'KES', sub: 'to a phone', x: 5, tone: COLOR.money },
];

const RW = 168;
const RGAP = (W - RING.length * RW) / (RING.length - 1);

function Peg({ t }) {
  return (
    <Slide
      t={t}
      kicker="economics 1 of 4"
      title="The peg is construction, not market making"
      lede="There is no liquidity pool and no exchange listing, so the product has no exchange rate to get wrong."
      foot={['1 XKN = 1 KES, base unit one micro-KES, 6 decimals', 'circulating XKN equals the shilling float held at the bank']}
    >
      <Stage h={H.both}>
        {RING.slice(0, -1).map((step, i) => (
          <Wire
            key={`peg-w-${i}`}
            t={t}
            at={ms(1.3) + i * 240}
            d={`M ${i * (RW + RGAP) + RW} 79 H ${(i + 1) * (RW + RGAP)}`}
            tone={COLOR.line}
            length={RGAP}
            duration={300}
          />
        ))}
        {RING.map((step, i) => (
          <Box
            key={`${step.label}-${i}`}
            t={t}
            at={ms(1.0) + i * 240}
            x={i * (RW + RGAP)}
            y={40}
            w={RW}
            h={78}
            label={step.label}
            sub={step.sub}
            tone={step.tone}
          />
        ))}

        <Reveal t={t} at={ms(3.6)} from="up" as="g">
          <text x="0" y={172} fontFamily={MONO} fontSize="18" fontWeight="600" fill={COLOR.accent}>
            Two limits are the whole trust surface of the fiat boundary, and both are on chain.
          </text>
        </Reveal>
        <Reveal t={t} at={ms(4.4)} from="left" as="g">
          <text x="0" y={210} fontFamily={MONO} fontSize="17" fill={COLOR.good}>
            bridgeMint is capped per rolling day, 50,000 KES by default
          </text>
          <text x="0" y={234} fontSize="16.5" fill={COLOR.muted}>
            A fully compromised bridge key leaks at most one day of that cap before the owner revokes it.
          </text>
        </Reveal>
        <Reveal t={t} at={ms(5.4)} from="left" as="g">
          <text x="0" y={276} fontFamily={MONO} fontSize="17" fill={COLOR.good}>
            bridgeBurn is self-only and takes no account parameter
          </text>
          <text x="0" y={300} fontSize="16.5" fill={COLOR.muted}>
            No key in the system, the owner key included, can destroy a user balance.
          </text>
        </Reveal>
        <Reveal t={t} at={ms(6.6)} from="fade" as="g">
          <text x="0" y={344} fontFamily={MONO} fontSize="16" fill={COLOR.faint}>
            Six decimals rather than two, because at the placeholder price one unit is 0.0005 KES.
          </text>
        </Reveal>
      </Stage>
    </Slide>
  );
}

function Price({ t }) {
  return (
    <Slide
      t={t}
      kicker="economics 2 of 4"
      title="The price is a placeholder. The floor is a formula."
      lede="The decision was deferred until it can clear measured backhaul cost, and every economic claim in the set is conditional on it."
      foot={['on-chain band: 1 to 50,000 uKES per unit, one change a day', 'HANDOVER backlog item 8, the single most consequential open decision']}
    >
      <Grid cols={2} gap={24}>
        <Panel t={t} at={ms(1.0)} title="the floor" tone={COLOR.accent}>
          <Code
            t={t}
            at={ms(1.4)}
            size={16}
            gap={280}
            lines={[
              'price_floor =',
              '  backhaul KES per MB',
              '  x (10 KB / 1 MB)',
              '  / 0.95',
              '  adjusted by the measured cache hit rate',
            ]}
          />
          <Reveal t={t} at={ms(3.2)} from="fade" style={{ marginTop: 12, fontSize: 16.5, color: COLOR.muted, lineHeight: 1.4 }}>
            The 0.95 is fee retention: the operator keeps ninety-five percent, so the gross price has to clear
            cost divided by that share. The hit rate is measured, never assumed.
          </Reveal>
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel t={t} at={ms(2.0)} title="the arithmetic at the placeholder" tone={COLOR.money}>
            <Rows
              t={t}
              at={ms(2.4)}
              gap={240}
              size={17}
              widths={['58%', '42%']}
              rows={[
                ['one billing unit', `${(UNIT_BYTES / 1000).toFixed(0)} KB of relayed WAN traffic`],
                ['placeholder price', `${PRICE_UKES} uKES per unit, 0.05 KES per MB`],
                ['a 25 MB session', '2,500 units'],
                ['gross on that session', `${kesFromUkes(1250000)} KES`],
              ]}
            />
          </Panel>
          <Panel t={t} at={ms(4.2)} title="why batching exists" tone={COLOR.warn}>
            <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
              A one-ticket batch needs about 7.0 KES of gross to break even on its own gas, which is about
              140 MB of relayed traffic. The gap between that and 1.25 KES on a 25 MB session is why the
              relayer batches until the pending fee is at least twice the estimated gas.
            </div>
          </Panel>
        </div>
      </Grid>
    </Slide>
  );
}

function Roi({ t }) {
  return (
    <Slide
      t={t}
      kicker="economics 3 of 4"
      title="Operator return, with every condition attached"
      lede="Until the backhaul measurement exists, the honest statement is a range whose lower bound is unknown, not a payback period."
      foot={['the figures below are model outputs, not results', 'they are not to be quoted without their condition']}
    >
      <Grid cols={2} gap={24}>
        <Panel t={t} at={ms(1.0)} title="what the design suite models" tone={COLOR.money}>
          <Rows
            t={t}
            at={ms(1.4)}
            gap={260}
            size={17}
            widths={['54%', '46%']}
            rows={[
              ['urban apartment hub', '5.1 months, 233.4 percent a year'],
              ['its stated capital expenditure', 'KES 29,050'],
              ['its stated monthly operating cost', 'KES 3,850'],
              ['rural trading post', '3.1 months, 384.9 percent a year'],
              ['its stated capital expenditure', 'KES 23,300'],
            ]}
          />
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel t={t} at={ms(3.4)} title="every one of those assumes" tone={COLOR.bad}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Verdict t={t} at={ms(3.8)} ok={false} text="a retail rate of KES 10 per GB" size={17} />
              <Verdict t={t} at={ms(4.1)} ok={false} text="about KES 1,000 a month across ten active tenants" size={17} />
              <Verdict t={t} at={ms(4.4)} ok={false} text="a backhaul cost that has never been measured" size={17} />
            </div>
          </Panel>
          <Panel t={t} at={ms(5.2)} title="what can be stated without conditions" tone={COLOR.good}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Verdict t={t} at={ms(5.5)} ok text="one ticket batch settles for 0.35 KES of chain gas, measured" size={17} />
              <Verdict t={t} at={ms(5.8)} ok text="25 MB is 2,500 units, because the unit is 10 KB by definition" size={17} />
              <Verdict t={t} at={ms(6.1)} ok text={`${FEE_BPS / 100} percent to the treasury and the rest to the operator, by contract constant`} size={17} />
            </div>
          </Panel>
        </div>
      </Grid>
    </Slide>
  );
}

function Treasury({ t }) {
  return (
    <Slide
      t={t}
      kicker="economics 4 of 4"
      title="The treasury pays one address, and anyone can trigger it"
      lede="The requirement was that the founder must be paid, must not be able to take the network down, and must bear no theft risk on the fee."
      foot={[`recorded claim in the chain proof: ${kesFromUkes(TREASURY_FEE_UKES)} KES, triggered by a stranger`, 'paper 10 section 4']}
    >
      <Grid cols={3} gap={18}>
        <Panel t={t} at={ms(1.0)} title="claim has no destination" tone={COLOR.good}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            Anyone may call it and it sweeps the balance to the beneficiary. There is no
            withdraw-to-address anywhere in the contract, so a stolen owner key cannot redirect a single
            micro-KES.
          </div>
        </Panel>
        <Panel t={t} at={ms(1.3)} title="seven public days, with a veto" tone={COLOR.good}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            Changing the beneficiary is queued in public and activates after seven days. The current
            beneficiary, which is the founder cold key, can cancel inside the window, and so can the owner.
            Key theft becomes a fire alarm rather than a loss.
          </div>
        </Panel>
        <Panel t={t} at={ms(1.6)} title="the fee has a ceiling" tone={COLOR.good}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            Five percent by default and hard-capped at ten in the contract rather than by governance. The fee
            lever can hurt margins and can never confiscate or halt settlement.
          </div>
        </Panel>
      </Grid>
      <Grid cols={2} gap={22} style={{ marginTop: 20 }}>
        <Panel t={t} at={ms(2.8)} title="the fiat leg has the same shape" tone={COLOR.money}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            The payout worker fires only for transfers originating from the beneficiary, to a number pinned by
            signature and checked against the on-chain beneficiary at start. A compromised server can delay
            the payout and never redirect it.
          </div>
        </Panel>
        <Panel t={t} at={ms(3.2)} title="stated as a gap" tone={COLOR.warn}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            The owner is not yet a multisig. A 2-of-3 Safe is a required gate before any mainnet deployment,
            and at about 0.55 KES to create it, cost is not the reason it is pending.
          </div>
        </Panel>
      </Grid>
    </Slide>
  );
}

export const SCENES = {
  'econ-peg': Peg,
  'econ-price': Price,
  'econ-roi': Roi,
  'econ-treasury': Treasury,
};
