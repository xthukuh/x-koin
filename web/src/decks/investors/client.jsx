import { Reveal, countUp, ease, item, ms, stage } from '../../player/index.js';
import { Phone } from '../../companion/index.js';
import chain from '../../proof/chain.json';
import kiosk from '../../proof/kiosk.json';
import trace from '../../proof/trace.json';

import { Condition, Foot, Head, Tick } from './parts.jsx';

/**
 * Scenes 09, 10 and 11: the user's side, with the companion app in frame.
 *
 * The purchase figures are the recorded dry-run journey in kiosk.json, the
 * admission time is scenario S1 in trace.json, and the session cost is the
 * settled ticket in chain.json at the placeholder price.
 */

const BUY = kiosk.journeys.find((journey) => journey.id === 'buy_gas_mpesa_daraja');
const MINT = BUY.steps.find((step) => step.evidence?.mint)?.evidence.mint;
const VOUCHER = BUY.steps.find((step) => step.evidence?.voucher)?.evidence.voucher;
const VOUCHER_HOURS = Math.round(VOUCHER.ttl_seconds / 3600);

const ADMISSION_MS = trace.scenarios.s1.summary.admission_ms;
const TICKET = chain.tickets[0];
const SESSION_MB = (TICKET.units * 10_000) / 1_000_000;
const SESSION_KES = TICKET.gross_ukes / 1_000_000;
const SCALE = 0.45;

function FirstMinute({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="09 / the user, first minute"
        title="Open the app once. Join the network."
        lede="No account, no form, no name. The phone makes its own key and that key is the identity."
      />
      <div
        className="xk-scene__body"
        style={{ display: 'grid', gridTemplateColumns: `${390 * SCALE}px 1fr ${390 * SCALE}px`, gap: 34, alignItems: 'start' }}
      >
        <Reveal t={t} at={ms(0.3)} from="up">
          <Phone screen="onboard" scale={SCALE} highlight="create" t={t} label="Companion app, first run" />
        </Reveal>

        <div style={{ paddingTop: 10 }}>
          <Tick t={t} at={ms(1.0)} tone="var(--xk-accent)">
            The app makes one key inside the phone and shows twelve words to write down.
          </Tick>
          <Tick t={t} at={ms(1.9)} tone="var(--xk-accent)">
            Lose the phone and the twelve words bring the same balance back on a new one. Nobody has
            to be asked for anything.
          </Tick>
          <Tick t={t} at={ms(2.8)} tone="var(--xk-good)">
            It finds the nearest box and joins it. In the simulation run that check took about four
            thousandths of a second.
          </Tick>

          <Reveal t={t} at={ms(3.8)} from="up" className="xk-scene__stat" style={{ marginTop: 6 }}>
            <div className="xk-scene__stat-value xk-scene__good" style={{ fontSize: 36 }}>
              {countUp(t, ms(4.0), ms(1.2), ADMISSION_MS, { decimals: 2 })} ms
            </div>
            <div className="xk-scene__stat-label">to check the pass and let the phone on, measured in scenario S1</div>
          </Reveal>
        </div>

        <Reveal t={t} at={ms(0.9)} from="up">
          <Phone screen="attach" scale={SCALE} highlight="attach" t={t} label="Companion app, joining a node" />
        </Reveal>
      </div>
      <Foot source="web/src/proof/trace.json, scenario S1" right="the key is the account" />
    </div>
  );
}

const BUY_STEPS = [
  ['You ask for KES 50 of data', 'in the app, on your own phone'],
  ['M-Pesa asks for your PIN', 'the usual prompt, nothing new to learn'],
  ['The bank confirms the payment', 'and only then does anything else happen'],
  [`${MINT.amount_kes} tokens are made`, 'one for each shilling you paid'],
  [`A pass is signed, good for ${VOUCHER_HOURS} hours`, 'the box can check it with no internet of its own'],
];

function BuyingCredit({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="10 / the user buys"
        title="Fifty shillings by M-Pesa, and a pass that works with no internet."
        lede="This is the recorded journey from the proof run, step for step."
      />
      <div
        className="xk-scene__body"
        style={{ display: 'grid', gridTemplateColumns: `${390 * SCALE}px 1fr`, gap: 40, alignItems: 'start' }}
      >
        <Reveal t={t} at={ms(0.3)} from="up">
          <Phone screen="buy" scale={SCALE} highlight="buy" t={t} label="Companion app, buying credit" />
        </Reveal>

        <div style={{ paddingTop: 6 }}>
          {BUY_STEPS.map(([title, note], i) => {
            const p = item(t, ms(0.8), i, 460, 480, ease.outCubic);
            const done = stage(t, ms(0.8) + i * 460 + 320, 360, ease.outBack);
            return (
              <div
                key={title}
                style={{
                  opacity: p,
                  transform: `translateX(${(1 - p) * 22}px)`,
                  display: 'grid',
                  gridTemplateColumns: '46px 1fr',
                  gap: 16,
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--xk-line)',
                }}
              >
                <span
                  className="xk-mono"
                  style={{
                    width: 38,
                    height: 38,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${done > 0.5 ? 'var(--xk-good)' : 'var(--xk-line)'}`,
                    color: done > 0.5 ? 'var(--xk-good)' : 'var(--xk-faint)',
                    fontSize: 17,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <span style={{ fontSize: 21, display: 'block' }}>{title}</span>
                  <span style={{ fontSize: 16, color: 'var(--xk-muted)' }}>{note}</span>
                </span>
              </div>
            );
          })}

          <Condition t={t} at={ms(3.6)}>
            The run above is a dry run with the bank calls mocked, on the same code path production
            uses. Live sandbox credentials are still to be registered.
          </Condition>
        </div>
      </div>
      <Foot source="web/src/proof/kiosk.json, journey buy_gas_mpesa_daraja" right={`${MINT.amount_kes} KES paid`} />
    </div>
  );
}

function TheMeter({ t }) {
  const wanP = stage(t, ms(1.4), ms(3.2), ease.outCubic);
  const lanP = stage(t, ms(1.4), ms(3.2), ease.outCubic);
  return (
    <div className="xk-scene">
      <Head
        kicker="11 / the meter"
        title="The meter only runs when the byte actually leaves."
        lede="Same twenty five megabytes. One trip to the internet, one trip down the corridor."
      />
      <div
        className="xk-scene__body"
        style={{ display: 'grid', gridTemplateColumns: `${390 * SCALE}px 1fr`, gap: 40, alignItems: 'start' }}
      >
        <Reveal t={t} at={ms(0.3)} from="up">
          <Phone screen="main" scale={SCALE} highlight="balance" t={t} label="Companion app, balance and meter" />
        </Reveal>

        <div style={{ display: 'grid', gap: 18, alignContent: 'start', paddingTop: 6 }}>
          <Reveal t={t} at={ms(0.8)} from="up">
            <div style={{ border: '1px solid var(--xk-money)', background: 'var(--xk-surface)', padding: '16px 18px' }}>
              <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 15, color: 'var(--xk-money)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                out to the internet
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 8 }}>
                <span className="xk-mono" style={{ fontSize: 42, fontWeight: 600 }}>
                  {countUp(t, ms(1.4), ms(3.2), SESSION_MB, { decimals: 1 })} MB
                </span>
                <span className="xk-mono" style={{ fontSize: 30, color: 'var(--xk-money)' }}>
                  KES {countUp(t, ms(1.4), ms(3.2), SESSION_KES, { decimals: 4 })}
                </span>
              </div>
              <div style={{ height: 10, background: 'var(--xk-surface-2)', marginTop: 12 }}>
                <div style={{ height: '100%', width: `${wanP * 100}%`, background: 'var(--xk-money)' }} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 17, color: 'var(--xk-muted)' }}>
                {TICKET.units.toLocaleString('en-KE')} units of ten kilobytes, at the placeholder price.
              </p>
            </div>
          </Reveal>

          <Reveal t={t} at={ms(1.1)} from="up">
            <div style={{ border: '1px solid var(--xk-good)', background: 'var(--xk-surface)', padding: '16px 18px' }}>
              <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 15, color: 'var(--xk-good)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                inside the building
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 8 }}>
                <span className="xk-mono" style={{ fontSize: 42, fontWeight: 600 }}>
                  {countUp(t, ms(1.4), ms(3.2), SESSION_MB, { decimals: 1 })} MB
                </span>
                <span className="xk-mono" style={{ fontSize: 30, color: 'var(--xk-good)' }}>
                  KES 0.0000
                </span>
              </div>
              <div style={{ height: 10, background: 'var(--xk-surface-2)', marginTop: 12 }}>
                <div style={{ height: '100%', width: `${lanP * 100}%`, background: 'var(--xk-good)' }} />
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 17, color: 'var(--xk-muted)' }}>
                The meter never moved, because nothing crossed out of the building.
              </p>
            </div>
          </Reveal>

          <Condition t={t} at={ms(4.6)}>
            The price of a unit is still a placeholder. It has to clear the measured cost of the
            internet line the operator pays for before it becomes a real number.
          </Condition>
        </div>
      </div>
      <Foot source="web/src/proof/chain.json; 500 micro-KES per 10 KB placeholder" right="LAN free, WAN metered" />
    </div>
  );
}

export const CLIENT_SCENES = [
  {
    id: 'first-minute',
    title: 'The user, first minute',
    duration: ms(9),
    caption:
      'The user opens the app once. It makes a key inside the phone and shows twelve words to write down. Then it finds the nearest box and joins, a check that took about four thousandths of a second in the simulation run.',
    Scene: FirstMinute,
  },
  {
    id: 'buying-credit',
    title: 'Buying credit',
    duration: ms(10),
    caption:
      'The user pays fifty shillings by M-Pesa. The bank confirms it, fifty tokens are made, and the kiosk signs a small pass tied to that phone for twenty four hours. The box can check that pass on its own, with no internet of its own.',
    Scene: BuyingCredit,
  },
  {
    id: 'the-meter',
    title: 'The meter',
    duration: ms(10),
    caption:
      'Twenty five megabytes out to the internet is two thousand five hundred units, which at the placeholder price is one shilling and twenty five cents. The same twenty five megabytes inside the building costs nothing. The price is still a placeholder.',
    Scene: TheMeter,
  },
];
