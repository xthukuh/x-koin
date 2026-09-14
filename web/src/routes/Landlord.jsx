import { AnimationFrame, clamp01, ease, lerp, ms, shown, stage } from '../player/index.js';
import chain from '../proof/chain.json';
import kiosk from '../proof/kiosk.json';
import trace from '../proof/trace.json';
import './landlord.css';

/**
 * The landlord pilot page: the offer to a building owner in plain language,
 * with no protocol internals on the page at all.
 *
 * This is the React port of the old static demo/landlord.html. Same sections,
 * same voice, same illustrative framing. What changed is where it lives (one
 * SPA route on the one theme instead of a hand-rolled static file) and where
 * the hard numbers come from: the figures under "what the building earns" are
 * read out of the tracked proof snapshot in src/proof/, so a re-run of the
 * protocol and chain proofs moves them and nobody has to retype a figure.
 *
 * Everything that moves renders inside an AnimationFrame as a pure function of
 * `t` in milliseconds, so a reader can play it, pause it and scrub it.
 */

/* --------------------------------------------------------------- figures */

const UKES_PER_KES = 1_000_000;
const BYTES_PER_GB = 1_000_000_000;

/** Metered price of one gigabyte at the placeholder per-unit price. */
const KES_PER_GB =
  (chain.params.price_per_unit_ukes * (BYTES_PER_GB / chain.params.unit_bytes)) / UKES_PER_KES;

/** The one settled example in the chain proof, in KES. */
const SETTLED_UNITS = chain.tickets[0].units;
const SETTLED_MB = (SETTLED_UNITS * chain.params.unit_bytes) / 1_000_000;
const SETTLED_NET_KES = chain.summary.gateway_earnings_ukes / UKES_PER_KES;

/** The share the network itself takes, before any building arrangement. */
const NETWORK_FEE_PCT = chain.params.fee_bps / 100;

/** The modelled rate of the wiring path in the protocol simulation. */
const WIRE_MBPS = trace.scenarios.s1.mediums.homeplug.bps / 1_000_000;

/** The top-up and payout rails that were actually exercised in the kiosk run. */
const RAILS = kiosk.journeys.filter((journey) => journey.id.startsWith('buy_gas')).length;

/* ------------------------------------------------------------- geometry */

const TOP = 40;
const FLOOR_H = 58;
const BX = 170;
const BW = 260;
const FLAT_W = BW / 2 - 9;
const FLAT_H = FLOOR_H - 10;

/** Four floors, two flats each, index 0 is the top floor. */
const FLOORS = [0, 1, 2, 3].map((row) => {
  const y = TOP + row * FLOOR_H + 5;
  return [BX + 6, BX + BW / 2 + 3].map((x) => ({
    x,
    y,
    cx: x + FLAT_W / 2,
    cy: y + FLAT_H / 2,
    dotX: x + FLAT_W - 12,
    dotY: y + 12,
  }));
});

const METER = { x: 190, y: TOP + FLOOR_H * 4 + 20, w: 130, h: 46 };
const CARE = { x: 470, y: TOP + FLOOR_H * 2 + 30, w: 100, h: 44 };
const CARE_CY = CARE.y + CARE.h / 2;
const ANT = { x: BX + BW - 20, y: TOP - 18 };
const RISER_X = BX + 40;

/** The riser: out of the meter room, up the existing wiring, to the flats. */
const WIRE_LANE = [
  [METER.x + 30, METER.y],
  [RISER_X, TOP + FLOOR_H * 3],
  [RISER_X, TOP + FLOOR_H],
];
const AIR_TOP = [
  [ANT.x, ANT.y],
  [FLOORS[0][1].cx, FLOORS[0][1].cy],
];
const AIR_CARE = [
  [ANT.x, ANT.y],
  [CARE.x, CARE_CY],
];

/** The illustrative order the units come online in: antenna first, then wire. */
const LIT_ORDER = [
  FLOORS[0][0],
  FLOORS[0][1],
  { dotX: CARE.x + CARE.w - 12, dotY: CARE.y + 12 },
  FLOORS[1][0],
  FLOORS[2][1],
  FLOORS[3][0],
  FLOORS[1][1],
  FLOORS[3][1],
];

/** Position `p` (0..1) of the way along a polyline, by arc length. */
function along(points, p) {
  const spans = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    const len = Math.hypot(dx, dy);
    spans.push(len);
    total += len;
  }
  let want = clamp01(p) * total;
  for (let i = 0; i < spans.length; i += 1) {
    if (want <= spans[i] || i === spans.length - 1) {
      const f = spans[i] === 0 ? 0 : want / spans[i];
      return [lerp(points[i][0], points[i + 1][0], f), lerp(points[i][1], points[i + 1][1], f)];
    }
    want -= spans[i];
  }
  return points[0];
}

function polyline(points) {
  return `M${points.map(([x, y]) => `${x},${y}`).join(' L')}`;
}

/** Evenly spaced dots drifting along a lane, `laps` times over the scene. */
function dots(points, count, laps, p, key, className) {
  return Array.from({ length: count }, (_, i) => {
    const [x, y] = along(points, (p * laps + i / count) % 1);
    return <circle key={`${key}-${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.2" className={className} />;
  });
}

/* ------------------------------------------------------------ the scenes */

const BUILDING_MS = ms(9);

function BuildingScene({ t }) {
  const p = clamp01(t / BUILDING_MS);
  const lit = shown(t, 1200, 800, LIT_ORDER.length);
  return (
    <svg viewBox="0 0 640 350" className="xk-ll-svg" role="img" aria-label="A four-storey building with the box in the meter room, the existing wiring reaching most flats, and a small roof antenna covering the top floor and the caretaker's house">
      <rect x={BX} y={TOP} width={BW} height={FLOOR_H * 4} rx="4" className="box" />
      {FLOORS.flat().map((flat) => (
        <rect key={`flat-${flat.x}-${flat.y}`} x={flat.x} y={flat.y} width={FLAT_W} height={FLAT_H} rx="3" className="flat" />
      ))}

      <rect x={METER.x} y={METER.y} width={METER.w} height={METER.h} rx="5" className="box" />
      <text x={METER.x + METER.w / 2} y={METER.y + METER.h / 2 - 3} className="t" textAnchor="middle">
        Meter room
      </text>
      <text x={METER.x + METER.w / 2} y={METER.y + METER.h / 2 + 13} className="s" textAnchor="middle">
        the box lives here
      </text>

      <rect x={CARE.x} y={CARE.y} width={CARE.w} height={CARE.h} rx="5" className="box" />
      <text x={CARE.x + CARE.w / 2} y={CARE_CY - 3} className="t" textAnchor="middle">
        Caretaker
      </text>
      <text x={CARE.x + CARE.w / 2} y={CARE_CY + 13} className="s" textAnchor="middle">
        house at the back
      </text>

      <line x1={ANT.x} y1={ANT.y} x2={ANT.x} y2={TOP} className="lane lane--air" strokeDasharray="none" />
      <circle cx={ANT.x} cy={ANT.y} r="3.5" fill="var(--xk-lora)" />
      <text x={ANT.x} y={ANT.y - 9} className="lbl" textAnchor="middle">
        small roof antenna
      </text>

      <path d={polyline(WIRE_LANE)} className="lane lane--wire" />
      <path d={polyline(AIR_TOP)} className="lane lane--air" />
      <path d={polyline(AIR_CARE)} className="lane lane--air" />
      <text x={RISER_X + 8} y={TOP + FLOOR_H * 3 - 6} className="lbl">
        existing wiring
      </text>

      {dots(WIRE_LANE, 3, 1.6, p, 'wire', 'fill')}
      {dots(AIR_TOP, 2, 1.1, p, 'air-top', 'fill')}
      {dots(AIR_CARE, 2, 1.1, p, 'air-care', 'fill')}

      {LIT_ORDER.map((unit, i) => (
        <circle
          key={`dot-${unit.dotX}-${unit.dotY}`}
          cx={unit.dotX}
          cy={unit.dotY}
          r="4"
          className={`flat-dot${i < lit ? ' is-lit' : ''}`}
        />
      ))}
    </svg>
  );
}

const SHARE_MS = ms(6);
const SHARE_STAGES = [
  'tenants topping up',
  'usage rising through the week',
  'building share accruing',
  'paid out on the 1st',
];

function ShareScene({ t }) {
  const p = stage(t, 300, SHARE_MS - 800, ease.outCubic);
  const label = SHARE_STAGES[Math.min(SHARE_STAGES.length - 1, Math.floor(p * SHARE_STAGES.length))];
  return (
    <svg viewBox="0 0 640 96" className="xk-ll-svg" role="img" aria-label="A bar filling to show the building share accruing over a month and paying out on the first">
      <text x="4" y="22" className="lbl">
        building share, this month (illustrative)
      </text>
      <rect x="4" y="34" width="632" height="16" rx="4" className="track" />
      <rect x="6" y="36" width={Math.round(p * 626)} height="12" rx="3" className="fill" />
      <text x="4" y="70" className="lbl">
        {label}
      </text>
    </svg>
  );
}

const MONTH_MS = ms(8);
const DAYS = 30;
const MX0 = 30;
const MX1 = 610;
const MY0 = 170;

/** One gentle hump per day, growing through the month. No units, it is a shape. */
const MONTH_CURVE = (() => {
  const points = [];
  for (let d = 0; d <= DAYS; d += 0.5) {
    const x = MX0 + (d / DAYS) * (MX1 - MX0);
    const evening = Math.max(0, Math.sin((d % 1) * Math.PI * 2 - Math.PI / 2));
    const growth = 0.5 + 0.5 * (d / DAYS);
    const y = MY0 - 6 - evening * 34 * growth;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
})();

const TOPUP_DAYS = [3, 8, 13, 18, 23, 27];

function MonthScene({ t }) {
  const p = clamp01((t - 300) / (MONTH_MS - 700));
  const day = p * DAYS;
  const px = MX0 + p * (MX1 - MX0);
  const statement = p <= 0.03 || p >= 0.98 ? 1 : 0;
  return (
    <svg viewBox="0 0 640 240" className="xk-ll-svg" role="img" aria-label="A month-long timeline: tenants topping up, evening usage rising day by day, and the statement arriving">
      <clipPath id="xk-ll-month-clip">
        <rect x="0" y="0" width={px} height="240" />
      </clipPath>
      <text x={MX0} y="24" className="lbl">
        usage, evenings rising through the month (no units)
      </text>
      <line x1={MX0} y1={MY0} x2={MX1} y2={MY0} className="axis" />
      <text x={MX0} y={MY0 + 18} className="lbl">
        day 1
      </text>
      <text x={MX1} y={MY0 + 18} className="lbl" textAnchor="end">
        day 30
      </text>

      <path d={MONTH_CURVE} className="curve curve--ghost" />
      <path d={MONTH_CURVE} className="curve" clipPath="url(#xk-ll-month-clip)" />

      {TOPUP_DAYS.map((d) => {
        const x = MX0 + (d / DAYS) * (MX1 - MX0);
        return (
          <rect
            key={`topup-${d}`}
            x={x - 6}
            y={MY0 + 11}
            width="12"
            height="18"
            rx="2"
            className="box"
            opacity={day >= d ? 1 : 0}
          />
        );
      })}

      <g transform={`translate(${MX0 + 6}, ${MY0 + 50})`} opacity={statement}>
        <rect x="-30" y="-14" width="60" height="24" rx="3" className="box" />
        <text x="0" y="2" className="s" textAnchor="middle">
          statement
        </text>
      </g>

      <line x1={px.toFixed(1)} y1="12" x2={px.toFixed(1)} y2={MY0} className="playhead" />
    </svg>
  );
}

/* --------------------------------------------------------------- content */

const DEALS = [
  {
    name: 'Host and earn',
    provide: 'Meter-room space and a power point. Nothing else.',
    get: 'A share of what tenants spend, paid monthly.',
    we: 'Install, maintain, and support tenants.',
    paid: 'Monthly to your M-Pesa or bank, with a statement.',
  },
  {
    name: 'Host and bundle',
    provide: 'Meter-room space, power, and a basic allowance folded into rent.',
    get: 'A lower share, but a stronger listing: connectivity is already included.',
    we: 'Install, maintain, meter the allowance, and bill top-ups above it.',
    paid: 'Monthly to your M-Pesa or bank, with a statement.',
  },
  {
    name: 'Host and own a node',
    provide: 'Meter-room space, power, and part of the setup cost.',
    get: 'A larger share, reflecting your stake in the box.',
    we: 'Install, maintain, and carry the rest of the setup cost.',
    paid: 'Monthly to your M-Pesa or bank, with a statement.',
  },
];

const TENANTS = [
  ['Small top-ups from the phone', 'No credit application, no meter reading. A tenant tops up what they need, when they need it.'],
  ['No contract', 'A tenant who moves out simply stops topping up. Nothing to cancel.'],
  ['Works in the whole building', 'The same connection reaches every unit, including the ones at the back and on the top floor.'],
  ['Keeps basic messaging working during a power cut', 'The box carries a battery for basic use, so a blackout does not mean a blackout on messaging.'],
];

const PILOT = [
  ['We install at our cost', 'No setup bill to you for the pilot.'],
  ['You give meter-room space and a power point', 'That is the whole ask on the building side.'],
  ['Tenants opt in', 'Nobody is signed up without asking.'],
  ['We report monthly', 'A plain statement, building share and usage shape, no jargon.'],
  ['Either side can end it with 30 days notice', 'No lock-in for the pilot.'],
  ['The box stays ours', 'We maintain it and swap it if it ever needs swapping.'],
];

const TODAY = [
  ['1', 'A walkthrough of the building'],
  ['2', 'The number of units'],
  ['3', 'A photo of the meter room'],
  ['4', 'One contact person'],
];

const FAQ = [
  ['Is it safe?', 'The box is a small, professionally installed unit built to run unattended in a meter room, the same way your existing meter and breakers do.'],
  ['Does it use my electricity?', 'It draws a small, steady amount of power, similar to a router. We can size that against your meter-room supply during the walkthrough.'],
  ['Who fixes it?', 'We do. Maintenance and any repairs are on us for the life of the arrangement, including the pilot.'],
  ['What if I sell the building?', 'The arrangement can transfer to the new owner, end with the standard 30 days notice, or be handed over cleanly, whichever the sale calls for.'],
  ['Can tenants misuse it?', 'Each tenant connects with their own phone and their own top-ups, so usage is tied to the person using it, not shared blindly across the building.'],
  ['Is it legal?', 'Licensing is being worked through with counsel, and the pilot runs within existing rules for the services involved.'],
];

function Lines({ items }) {
  return (
    <ul className="xk-ll-list">
      {items.map(([head, body]) => (
        <li key={head}>
          <div>
            <b>{head}.</b> <span>{body}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------- the page */

export default function Landlord() {
  return (
    <div className="xk-page">
      <section className="xk-section xk-section--tight xk-hero-grid">
        <div className="xk-wrap xk-wrap--narrow">
          <p className="xk-eyebrow">for landlords, the short version</p>
          <h1>Internet your building earns from</h1>
          <p className="xk-lede">
            A small box in the meter room turns your building's existing wiring into a connection tenants pay for,
            from their phone. No new cabling, no drilling.
          </p>
          <p className="xk-note">
            A plain walkthrough for a 90-day pilot conversation. Numbers on this page are illustrative unless they
            name a source, and none of them is a quote.
          </p>
        </div>
      </section>

      <section className="xk-section">
        <div className="xk-wrap xk-wrap--narrow">
          <h2>How it reaches every unit</h2>
          <p>
            The box sits in the meter room and rides your building's existing wiring to most flats. A small antenna
            on the roof covers the units the wiring does not reach, including the caretaker's house at the back.
          </p>
          <AnimationFrame
            title="The box, the wiring and the roof antenna"
            duration={BUILDING_MS}
            aspect="64 / 35"
            caption={`The wiring path is modelled at ${WIRE_MBPS} Mbit per second in the protocol simulation, which is what carries video to a flat. The roof antenna is the slow, long-range link that keeps the far units connected.`}
          >
            {({ t }) => <BuildingScene t={t} />}
          </AnimationFrame>
          <p className="xk-ll-source">source: web/src/proof/trace.json, scenario S1</p>
        </div>
      </section>

      <section className="xk-section xk-section--tinted">
        <div className="xk-wrap xk-wrap--narrow">
          <h2>What the building earns</h2>
          <p>
            Tenants pay as they use it, from their phone. The building earns a share of every shilling tenants spend,
            paid to your M-Pesa or bank every month, with a statement.
          </p>
          <AnimationFrame
            title="A month of building share"
            duration={SHARE_MS}
            aspect="20 / 3"
            caption="The bar is a shape, not a measurement. What it is filled with is metered per byte and settled automatically."
          >
            {({ t }) => <ShareScene t={t} />}
          </AnimationFrame>

          <dl className="xk-stats">
            <div className="xk-stat">
              <dt>{KES_PER_GB} KES</dt>
              <dd>per gigabyte a tenant uses, at the placeholder price</dd>
            </div>
            <div className="xk-stat">
              <dt>{NETWORK_FEE_PCT}%</dt>
              <dd>the network's own fee, before any building arrangement</dd>
            </div>
            <div className="xk-stat">
              <dt>{SETTLED_NET_KES.toFixed(2)} KES</dt>
              <dd>
                paid out to the box operator in the proof run, for {SETTLED_MB} MB across {SETTLED_UNITS} billed
                units
              </dd>
            </div>
            <div className="xk-stat">
              <dt>{RAILS} rails</dt>
              <dd>ways a tenant can top up: M-Pesa, M-Pesa through Equitel, or an Equitel line</dd>
            </div>
          </dl>
          <p className="xk-ll-source">
            source: web/src/proof/chain.json (params and summary) and web/src/proof/kiosk.json (journeys)
          </p>
          <p className="xk-note" style={{ marginTop: '1rem' }}>
            The per-gigabyte price is a placeholder until it can be measured against real backhaul cost. The share the
            building takes of it is the commercial arrangement below, not a figure in the proof run.
          </p>
        </div>
      </section>

      <section className="xk-section">
        <div className="xk-wrap xk-wrap--narrow">
          <h2>Three buildings, three deals</h2>
          <p className="xk-lede">
            Three ways landlords have structured the arrangement. All three pay out monthly to M-Pesa or bank, with a
            statement.
          </p>
          <p>
            <span className="xk-ll-tag">Illustrative, not a quote</span>
          </p>
          <div className="xk-cards">
            {DEALS.map((deal) => (
              <div className="xk-card" key={deal.name}>
                <h3>{deal.name}</h3>
                <dl className="xk-ll-dl">
                  <dt>What you provide</dt>
                  <dd>{deal.provide}</dd>
                  <dt>What you get</dt>
                  <dd>{deal.get}</dd>
                  <dt>What we do</dt>
                  <dd>{deal.we}</dd>
                  <dt>How you get paid</dt>
                  <dd>{deal.paid}</dd>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="xk-section xk-section--tinted">
        <div className="xk-wrap xk-wrap--narrow">
          <h2>What a month looks like</h2>
          <p>
            One month in a 24-unit building: tenants top up from their phones, usage climbs in the evenings, and the
            statement lands on the 1st.
          </p>
          <AnimationFrame
            title="A month, day by day"
            duration={MONTH_MS}
            aspect="8 / 3"
            caption="Usage shown here has no units. It is a shape, not a measurement. The six markers are top-ups, the dashed line is the day the playhead has reached."
          >
            {({ t }) => <MonthScene t={t} />}
          </AnimationFrame>
        </div>
      </section>

      <section className="xk-section">
        <div className="xk-wrap xk-wrap--narrow">
          <h2>Why tenants stay</h2>
          <p className="xk-lede">
            The pitch to a tenant is short: small top-ups from the phone, no contract, works in the whole building.
          </p>
          <Lines items={TENANTS} />
        </div>
      </section>

      <section className="xk-section xk-section--tinted">
        <div className="xk-wrap xk-wrap--narrow">
          <h2>Pilot terms</h2>
          <p className="xk-lede">A 90-day pilot, six lines, nothing hidden in a footnote.</p>
          <h3 style={{ marginTop: '2rem' }}>The six lines</h3>
          <Lines items={PILOT} />

          <h3 style={{ marginTop: '2.5rem' }}>What we need from you today</h3>
          <div className="xk-ll-today">
            {TODAY.map(([n, text]) => (
              <div key={n}>
                <span>{n}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="xk-section">
        <div className="xk-wrap xk-wrap--narrow">
          <h2>Questions landlords ask</h2>
          <p className="xk-lede">The six that come up on every walkthrough.</p>
          <div className="xk-ll-faq">
            {FAQ.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
