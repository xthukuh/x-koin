import { Link } from 'react-router-dom';

const PAPER = '/docs/papers/15-hidden-gems-and-fallback-channels';

/**
 * The six best-graded ideas out of the seventeen in paper 15. `grade` reuses the
 * roadmap status chips: built is the paper's "now", progress is "pilot", and
 * planned is "check first", which is an idea one question decides.
 */
const GEMS = [
  {
    name: 'Mains noise schedule',
    grade: 'built',
    gradeLabel: 'now',
    text: 'An optoisolated zero-crossing detector costing under KES 100 tells the narrowband modem when the mains noise burst is not happening, which is the cheapest reliability the receipt plane can buy.',
  },
  {
    name: 'Signed time beacons',
    grade: 'built',
    gradeLabel: 'now',
    text: 'A node that has a clock broadcasts the second over LoRa under the kiosk root key, so an off-grid node can still judge a voucher expiry, and a monotonic counter stops the beacon being replayed backwards.',
  },
  {
    name: 'One ticket, one SMS',
    grade: 'progress',
    gradeLabel: 'pilot',
    text: 'A compact settlement ticket is 137 bytes and one binary short message carries 140, so a SIM becomes the channel of last resort for the thing that cannot be deferred, which is the operator getting paid.',
  },
  {
    name: 'Power-loss-safe queue',
    grade: 'built',
    gradeLabel: 'now',
    text: 'Two flash slots, a monotonic sequence and a CRC carry the cumulative counters and the unrelayed tickets across a power cut. Flash endurance turns out not to be the limit; atomicity is.',
  },
  {
    name: 'Fountain-coded firmware',
    grade: 'progress',
    gradeLabel: 'pilot',
    text: 'RaptorQ symbols broadcast to many Satellites at once with no acknowledgements at all is the difference between a firmware update that is possible over the survival plane and one that is not.',
  },
  {
    name: 'Satellite, no new radio',
    grade: 'planned',
    gradeLabel: 'check first',
    text: 'Lacuna receives LoRa at 868 MHz from orbit, so the SX1262 already in the bill of materials may reach it. One email about coverage over Kenya decides whether this is free or impossible.',
  },
];

/** Log-scaled rungs. `w` is 620 * log10(bits per second) / 7, rounded. */
const RUNGS = [
  { y: 84, w: 620, name: 'HomePlug AV, broadband power line', rate: '10 Mbps', tone: 'plc' },
  { y: 140, w: 450, name: 'SX1262 in GFSK at 150 kbps', rate: '122 kbps', tone: 'lora' },
  { y: 196, w: 344, name: 'KQ-130F narrowband power line', rate: '7.7 kbps', tone: 'nbplc' },
  { y: 252, w: 331, name: 'SX1262 LoRa at SF7', rate: '5.4 kbps', tone: 'lora' },
];

/** Drawn open, because none of these has carried an xKoin frame yet. */
const FALLBACKS = [
  { y: 344, w: 273, name: 'Voice-channel modem', rate: 'about 1.2 kbps, unproven' },
  { y: 400, w: 170, name: 'Short message service, 8-bit', rate: '140 B per message' },
  { y: 456, w: 230, name: 'Sneakernet at a matatu stage', rate: 'one pass, no rate' },
];

function Ladder() {
  return (
    <svg role="img" viewBox="0 0 1200 510" xmlns="http://www.w3.org/2000/svg">
      <title>The channel ladder from broadband power line down to sneakernet.</title>

      <text className="xk-ladder__group" x="16" y="40">
        in the design today
      </text>
      <text className="xk-ladder__axis" x="936" y="40">
        rough rate, log scale
      </text>

      {RUNGS.map((rung) => (
        <g key={rung.name}>
          <text className="xk-ladder__name" x="300" y={rung.y + 18}>
            {rung.name}
          </text>
          <rect
            fill={`var(--xk-${rung.tone})`}
            height="26"
            width={rung.w}
            x="320"
            y={rung.y}
          />
          <text className="xk-ladder__rate" x="960" y={rung.y + 18}>
            {rung.rate}
          </text>
        </g>
      ))}

      <line className="xk-ladder__rule" x1="16" x2="1184" y1="308" y2="308" />
      <text className="xk-ladder__group" x="16" y="332">
        fallbacks graded in paper 15
      </text>

      {FALLBACKS.map((rung) => (
        <g key={rung.name}>
          <text className="xk-ladder__name" x="300" y={rung.y + 18}>
            {rung.name}
          </text>
          <rect
            className="xk-ladder__bar--open"
            height="26"
            width={rung.w}
            x="320"
            y={rung.y}
          />
          <text className="xk-ladder__rate" x="960" y={rung.y + 18}>
            {rung.rate}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function BeyondMvp() {
  return (
    <section className="xk-section" id="beyond">
      <div className="xk-wrap">
        <p className="xk-eyebrow">14 / beyond the MVP</p>
        <h2>Seventeen ideas, graded honestly. These six earn their cost.</h2>
        <p className="xk-lede">
          Paper 15 takes every extension anyone has proposed for this network and grades it on
          feasibility, bit rate, cost in shillings with a basis, legality in Kenya, and whether the
          proof-of-concept kit can demonstrate it today. The ideas that win are cheap and
          unglamorous. Twenty-four facts in it are marked for verification rather than guessed.
        </p>

        <figure className="xk-figure">
          <Ladder />
          <figcaption>
            Figure. The channel ladder. The top four rungs are in the design and measured in
            simulation; the bottom three are fallbacks, drawn open because none of them has carried
            an xKoin frame yet. Bar length is the log of the rate, so each rung down is an order of
            magnitude, not a small step.
          </figcaption>
        </figure>

        <div className="xk-cards">
          {GEMS.map((gem) => (
            <article className="xk-card" key={gem.name}>
              <span className={`xk-status xk-status--${gem.grade}`}>{gem.gradeLabel}</span>
              <h3 style={{ marginTop: '0.6rem' }}>{gem.name}</h3>
              <p style={{ fontSize: '0.88rem' }}>{gem.text}</p>
            </article>
          ))}
        </div>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          Two ideas that sounded best were graded weak, and the paper says so plainly. Data over a
          GSM voice channel is defeated by the vocoder and, more decisively, by packet data working
          on the same SIM. Offline zero-knowledge proofs of balance solve a problem the 96-byte
          voucher already solves, because a proof of balance at a block height is exactly as stale
          as a voucher signed at that block height. Full grading, the ranked table and the one
          experiment that settles each idea: <Link to={PAPER}>paper 15</Link>.
        </p>
      </div>
    </section>
  );
}
