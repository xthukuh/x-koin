import { Reveal, ease, ms, stage } from '../../player/index.js';
import chain from '../../proof/chain.json';

import { Condition, FlowBox, Foot, Head, Link, Runner, Stage, Tick } from './parts.jsx';

/**
 * Scenes 05 and 06: how a shilling becomes a token and comes back a shilling,
 * and why holding the token is not a bet.
 *
 * Figures come from web/src/proof/chain.json (the settled tickets and the fee
 * split of the proof run) and docs/papers/04-settlement-and-economics.md
 * sections 2 and 3.
 */

const TICKET = chain.tickets[0];
const KES = (ukes) => (ukes / 1_000_000).toLocaleString('en-KE', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

const STATIONS = [
  { title: 'KES 50', sub: 'paid by M-Pesa', tone: 'var(--xk-ink)' },
  { title: '50 XKN', sub: 'made 1 for 1', tone: 'var(--xk-money)' },
  { title: 'your balance', sub: 'held in escrow', tone: 'var(--xk-accent)' },
  { title: 'bytes used', sub: 'you sign a total', tone: 'var(--xk-ink)' },
  { title: 'paid out', sub: '95 to the operator', tone: 'var(--xk-good)' },
  { title: 'KES again', sub: 'and the token dies', tone: 'var(--xk-money)' },
];

function ShillingRoundTrip({ t }) {
  const w = 166;
  const gap = 22;
  const x0 = 6;
  const y = 96;
  const h = 104;
  const xs = STATIONS.map((_, i) => x0 + i * (w + gap));

  return (
    <div className="xk-scene">
      <Head
        kicker="05 / shillings in, shillings out"
        title="A shilling becomes a token, and comes back a shilling."
        lede="One token is one Kenyan shilling, fixed by the rules of the contract rather than by any market."
      />
      <div className="xk-scene__body">
        <Stage viewBox="0 0 1136 420">
          {xs.slice(0, -1).map((x, i) => (
            <Link key={i} t={t} at={ms(0.9) + i * 260} x1={x + w} x2={xs[i + 1] - 4} y={y + h / 2} />
          ))}
          {STATIONS.map((station, i) => (
            <FlowBox
              key={station.title}
              t={t}
              at={ms(0.5) + i * 260}
              x={xs[i]}
              y={y}
              w={w}
              h={h}
              title={station.title}
              sub={station.sub}
              tone={station.tone}
            />
          ))}

          <Runner t={t} at={ms(2.6)} duration={ms(2.6)} from={xs[0] + w / 2} to={xs[5] + w / 2} y={y + h / 2} />

          <Reveal t={t} at={ms(3.4)} from="up" as="g">
            <path d="M 6 262 H 1130" stroke="var(--xk-line)" strokeWidth="1" />
            <text x="6" y="300" fontFamily="var(--xk-font-mono)" fontSize="18" fill="var(--xk-faint)">
              ONE SETTLED TICKET FROM THE PROOF RUN
            </text>
          </Reveal>

          {[
            [`${TICKET.units.toLocaleString('en-KE')} units of 10 KB`, 'about 25 megabytes carried', 'var(--xk-ink)'],
            [`KES ${KES(TICKET.gross_ukes)}`, 'what those bytes cost the user', 'var(--xk-ink)'],
            [`KES ${KES(TICKET.net_ukes)}`, 'to the node operator, 95 percent', 'var(--xk-good)'],
            [`KES ${KES(TICKET.fee_ukes)}`, 'to the project, 5 percent', 'var(--xk-money)'],
          ].map(([value, label, tone], i) => (
            <Reveal key={label} t={t} at={ms(3.8) + i * 240} from="up" as="g">
              <text x={6 + i * 284} y="352" fontFamily="var(--xk-font-mono)" fontSize="30" fill={tone}>
                {value}
              </text>
              <text x={6 + i * 284} y="384" fontSize="17" fill="var(--xk-muted)">
                {label}
              </text>
            </Reveal>
          ))}
        </Stage>
      </div>
      <Foot source="web/src/proof/chain.json, the settled tickets of the 2026-09-09 run" right="1 XKN = 1 KES" />
    </div>
  );
}

function NotTheRisk({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="06 / why the token is not the risk"
        title="Tokens are made only against money already in the bank."
        lede="There is no trading pair, no price chart and no exchange rate for anyone to get wrong."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40, alignContent: 'start' }}>
        <div style={{ paddingTop: 4 }}>
          <Tick t={t} at={ms(0.4)}>
            A token exists only after the bank has confirmed the payment that bought it.
          </Tick>
          <Tick t={t} at={ms(1.2)}>
            A token is destroyed only when a shilling has actually been paid out.
          </Tick>
          <Tick t={t} at={ms(2.0)}>
            So the tokens in circulation always match the cash held. There is no float to gamble with.
          </Tick>
          <Tick t={t} at={ms(2.8)} tone="var(--xk-accent)">
            No key in the system can destroy your balance. Not the operator, not the founder.
          </Tick>
          <Tick t={t} at={ms(3.6)} tone="var(--xk-accent)">
            Unspent balance can be withdrawn at any time, and it works at any node, not just the one
            you bought at.
          </Tick>
        </div>

        <div>
          <Reveal
            t={t}
            at={ms(1.6)}
            from="up"
            style={{ border: '1px solid var(--xk-line)', background: 'var(--xk-surface)', padding: '16px 18px' }}
          >
            <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--xk-faint)' }}>
              worst case, spelled out
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 18, lineHeight: 1.45 }}>
              If the key that makes tokens were stolen, it could make at most one day of its cap
              before the owner switches it off. The cap ships at KES 50,000 and is set to what the
              kiosk actually collects in a day.
            </p>
          </Reveal>

          <Condition t={t} at={ms(4.4)}>
            The money held on the fiat side sits in named bank and mobile money accounts. That part is
            a trusted party and this deck says so rather than implying otherwise.
          </Condition>

          <Reveal t={t} at={ms(5.2)} from="up" style={{ marginTop: 14 }}>
            <div className="xk-scene__stat" style={{ padding: '12px 16px' }}>
              <div className="xk-scene__stat-value xk-scene__good" style={{ fontSize: 32 }}>
                The books balance
              </div>
              <div className="xk-scene__stat-label">
                what is held equals what is owed plus what is earned, checked on every proof run rather
                than hoped for
              </div>
            </div>
          </Reveal>
        </div>
      </div>
      <Foot
        source="docs/papers/04-settlement-and-economics.md sections 2 and 3; chain.json summary"
        right={`${(stage(t, 0, ms(6), ease.linear) * 100).toFixed(0)}%`}
      />
    </div>
  );
}

export const MONEY_SCENES = [
  {
    id: 'shilling-round-trip',
    title: 'A shilling becomes a token',
    duration: ms(10),
    caption:
      'You pay fifty shillings by M-Pesa and fifty tokens are made, one for each shilling. They sit in an account you can spend at any node. Ninety five percent of what a node is paid is the operator share. Cashing out destroys the tokens.',
    Scene: ShillingRoundTrip,
  },
  {
    id: 'not-the-risk',
    title: 'Why the token is not the risk',
    duration: ms(10),
    caption:
      'One token is one shilling by construction, not by trading. Tokens are made only against money the bank has confirmed and destroyed only when money is paid out, so the number in circulation matches the cash held and nobody can burn your balance.',
    Scene: NotTheRisk,
  },
];
