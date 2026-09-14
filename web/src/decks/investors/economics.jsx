import { Reveal, countUp, ease, item, ms, stage } from '../../player/index.js';

import { Condition, Foot, Head } from './parts.jsx';

/**
 * Scenes 12 and 13: what a node earns and when it has paid for itself.
 *
 * Every number on these two scenes is conditional and carries its condition in
 * frame as well as in the caption. Sources are
 * docs/papers/04-settlement-and-economics.md section 10 and the landing page
 * Operators section, which share the same arithmetic.
 */

const UNITS_PER_GB = 1_048_576 / 10;
const PRICE_KES_PER_UNIT = 0.0005;
const GROSS_PER_GB = UNITS_PER_GB * PRICE_KES_PER_UNIT;
const NET_PER_GB = GROSS_PER_GB * 0.95;

const COSTS = [
  ['Operator share of every settlement', '95 percent', 'var(--xk-good)', 'fixed in the contract'],
  ['Project fee', '5 percent', 'var(--xk-money)', 'capped at 10 in the contract'],
  ['Chain fee to settle a batch', '0.35 KES', 'var(--xk-ink)', 'measured 2026-09-09'],
  ['The internet line the operator buys', 'not measured', 'var(--xk-critical)', 'the number that decides everything'],
  ['Electricity for the box and the relays', 'not measured', 'var(--xk-critical)', 'about fifteen watts, unpriced'],
];

function WhatANodeEarns({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="12 / what a node earns"
        title="Ninety five percent of every settled byte."
        lede="The share is fixed in the contract. The price per byte is not, and that is the honest part of this slide."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 34, alignContent: 'start' }}>
        <div>
          <Reveal t={t} at={ms(0.4)} from="up" style={{ border: '1px solid var(--xk-line)', background: 'var(--xk-surface)', padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--xk-faint)' }}>
              one gigabyte carried, at the placeholder price
            </div>
            <div style={{ marginTop: 14, display: 'grid', gap: 10, fontSize: 20 }}>
              <Reveal t={t} at={ms(0.9)} from="left" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>A gigabyte, counted in ten kilobyte units</span>
                <span className="xk-mono">{UNITS_PER_GB.toLocaleString('en-KE')}</span>
              </Reveal>
              <Reveal t={t} at={ms(1.4)} from="left" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Charged to the user</span>
                <span className="xk-mono">KES {countUp(t, ms(1.6), ms(1.0), GROSS_PER_GB, { decimals: 2 })}</span>
              </Reveal>
              <Reveal t={t} at={ms(1.9)} from="left" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--xk-money)' }}>
                <span>Project fee, 5 percent</span>
                <span className="xk-mono">KES {countUp(t, ms(2.1), ms(1.0), GROSS_PER_GB - NET_PER_GB, { decimals: 2 })}</span>
              </Reveal>
              <Reveal
                t={t}
                at={ms(2.5)}
                from="left"
                style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--xk-line)', paddingTop: 10 }}
              >
                <span style={{ fontWeight: 600 }}>Kept by the operator</span>
                <span className="xk-mono xk-scene__good" style={{ fontSize: 30, fontWeight: 600 }}>
                  KES {countUp(t, ms(2.7), ms(1.2), NET_PER_GB, { decimals: 2 })}
                </span>
              </Reveal>
            </div>
          </Reveal>

          <div style={{ marginTop: 18 }}>
            <Condition t={t} at={ms(3.6)}>
              The price of a unit is a placeholder. It has to clear the measured cost of the internet
              line the operator buys, and that cost has never been measured. Until it is, no earnings
              figure on this slide should be quoted anywhere.
            </Condition>
          </div>
        </div>

        <div>
          {COSTS.map(([label, value, tone, note], i) => {
            const p = item(t, ms(0.8), i, 340, 460, ease.outCubic);
            return (
              <div
                key={label}
                style={{
                  opacity: p,
                  transform: `translateY(${(1 - p) * 14}px)`,
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--xk-line)',
                }}
              >
                <span>
                  <span style={{ fontSize: 19, display: 'block' }}>{label}</span>
                  <span style={{ fontSize: 15, color: 'var(--xk-faint)' }}>{note}</span>
                </span>
                <span className="xk-mono" style={{ fontSize: 20, color: tone, alignSelf: 'center', whiteSpace: 'nowrap' }}>
                  {value}
                </span>
              </div>
            );
          })}
          <Reveal t={t} at={ms(3.0)} from="up" style={{ marginTop: 14, fontSize: 18, color: 'var(--xk-muted)', lineHeight: 1.45 }}>
            The earnings are held by the contract against the operator address, not inside the box. A
            stolen or wiped box carries no money away with it.
          </Reveal>
        </div>
      </div>
      <Foot source="docs/papers/04-settlement-and-economics.md section 10" right="95 / 5, fixed on chain" />
    </div>
  );
}

const MODELS = [
  {
    key: 'urban',
    name: 'A block of flats in the city',
    tone: 'var(--xk-accent)',
    rows: [
      ['Hardware to buy once', 'KES 29,050'],
      ['To run, every month', 'KES 3,850'],
      ['Ten tenants spending about', 'KES 1,000 each'],
    ],
    months: 5.1,
    annual: 233.4,
  },
  {
    key: 'rural',
    name: 'A rural trading post',
    tone: 'var(--xk-lora)',
    rows: [
      ['Hardware to buy once', 'KES 23,300'],
      ['Traders buying Wi-Fi daily', 'about 20'],
      ['Farms on telemetry', 'about 5'],
    ],
    months: 3.1,
    annual: 384.9,
  },
];

function PayingForItself({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="13 / paying for itself"
        title="About five months in a block of flats. About three at a trading post."
        lede="These are the project's own models. Read them as a shape, not as a quotation."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: 20, alignContent: 'start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          {MODELS.map((model, i) => (
            <Reveal
              key={model.key}
              t={t}
              at={ms(0.4) + i * 420}
              from="up"
              style={{ border: `1px solid ${model.tone}`, background: 'var(--xk-surface)', padding: '16px 20px 18px' }}
            >
              <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 22, color: model.tone }}>{model.name}</div>
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {model.rows.map((row, j) => (
                  <Reveal key={row[0]} t={t} at={ms(1.0) + i * 420 + j * 200} from="left" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
                    <span style={{ color: 'var(--xk-muted)' }}>{row[0]}</span>
                    <span className="xk-mono">{row[1]}</span>
                  </Reveal>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 28, marginTop: 16, borderTop: '1px solid var(--xk-line)', paddingTop: 14 }}>
                <div>
                  <div className="xk-mono" style={{ fontSize: 42, fontWeight: 600 }}>
                    {countUp(t, ms(2.2) + i * 420, ms(1.4), model.months, { decimals: 1 })}
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--xk-muted)' }}>months to pay back the hardware</div>
                </div>
                <div>
                  <div className="xk-mono" style={{ fontSize: 42, fontWeight: 600, color: model.tone }}>
                    {countUp(t, ms(2.4) + i * 420, ms(1.4), model.annual, { decimals: 1 })}%
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--xk-muted)' }}>modelled return in a year</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Condition t={t} at={ms(4.6)}>
          Both models assume a retail rate of KES 10 per gigabyte, ten paying tenants, those hardware
          lines, and a cost of backhaul that nobody has measured. Change any one of the four and the
          payback changes. Until the measurement exists the honest statement is a range whose lower
          bound is unknown.
        </Condition>
      </div>
      <Foot
        source="docs/papers/04-settlement-and-economics.md section 10, quoting the tokenomics model"
        right={`${(stage(t, 0, ms(10), ease.linear) * 100).toFixed(0)}%`}
      />
    </div>
  );
}

export const ECONOMICS_SCENES = [
  {
    id: 'what-a-node-earns',
    title: 'What a node earns',
    duration: ms(10),
    caption:
      'A node keeps ninety five percent of every settled byte. At the placeholder price that is fifty shillings a gigabyte carried. The price is a placeholder: it must clear the measured cost of the internet line the operator buys, which nobody has measured yet.',
    Scene: WhatANodeEarns,
  },
  {
    id: 'paying-for-itself',
    title: 'Paying for itself',
    duration: ms(11),
    caption:
      'The project model shows a block of flats paying back its hardware in about five months and a rural trading post in about three. Both assume ten shillings a gigabyte, ten paying tenants and a backhaul cost nobody has measured yet.',
    Scene: PayingForItself,
  },
];
