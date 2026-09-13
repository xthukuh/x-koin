import { BEATS } from './data.js';

/**
 * Asset A5: one small drawing per beat of the money flow. Inline, theme-aware,
 * and deliberately schematic: each one shows what object is created and where it
 * goes, not a picture of a phone.
 */

/**
 * The arrowhead lives in one hidden SVG for the whole section, so the four
 * drawings share a single marker id rather than repeating it four times.
 */
function ArrowDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <marker
          id="xk-beat-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--xk-muted)" />
        </marker>
      </defs>
    </svg>
  );
}

function Arrow({ x1, x2, y }) {
  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke="var(--xk-muted)"
      strokeWidth="1.4"
      markerEnd="url(#xk-beat-arrow)"
    />
  );
}

function Frame({ label, children }) {
  return (
    <svg viewBox="0 0 200 108" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

function VoucherArt() {
  return (
    <Frame label="Fiat paid at the kiosk becomes minted XKN and a signed voucher">
      <rect className="xk-cut-box" x="14" y="30" width="26" height="44" rx="3" />
      <text className="xk-cut-s" x="27" y="56" textAnchor="middle">
        KES
      </text>
      <text className="xk-cut-s" x="27" y="90" textAnchor="middle">
        phone
      </text>
      <Arrow x1={44} x2={68} y={52} />
      <rect className="xk-cut-box" x="72" y="34" width="52" height="36" />
      <text className="xk-cut-s" x="98" y="50" textAnchor="middle">
        bridge
      </text>
      <text className="xk-cut-s" x="98" y="62" textAnchor="middle">
        mint 1:1
      </text>
      <text className="xk-cut-s" x="98" y="90" textAnchor="middle">
        daily cap
      </text>
      <Arrow x1={128} x2={150} y={52} />
      <rect className="xk-cut-box" x="154" y="28" width="34" height="48" />
      <line className="xk-cut" x1="160" y1="38" x2="182" y2="38" />
      <line className="xk-cut" x1="160" y1="45" x2="182" y2="45" />
      <circle cx="171" cy="62" r="6" fill="none" stroke="var(--xk-money)" strokeWidth="1.6" />
      <text className="xk-cut-s" x="171" y="90" textAnchor="middle">
        voucher
      </text>
    </Frame>
  );
}

function ReceiptArt() {
  return (
    <Frame label="Bytes flow to the node and the client signs a cumulative receipt">
      {[14, 30, 46].map((x) => (
        <rect className="xk-cut-box" key={x} x={x} y="44" width="12" height="14" />
      ))}
      <text className="xk-cut-s" x="34" y="90" textAnchor="middle">
        bytes
      </text>
      <Arrow x1={64} x2={84} y={51} />
      <rect className="xk-cut-box" x="88" y="34" width="42" height="36" />
      <text className="xk-cut-s" x="109" y="56" textAnchor="middle">
        node
      </text>
      <Arrow x1={134} x2={152} y={51} />
      <rect className="xk-cut-box" x="156" y="28" width="32" height="46" />
      <line className="xk-cut" x1="161" y1="38" x2="183" y2="38" />
      <line className="xk-cut" x1="161" y1="45" x2="183" y2="45" />
      <line className="xk-cut" x1="161" y1="52" x2="176" y2="52" />
      <text className="xk-cut-s" x="172" y="68" textAnchor="middle">
        108 B
      </text>
      <text className="xk-cut-s" x="172" y="90" textAnchor="middle">
        receipt
      </text>
    </Frame>
  );
}

function TicketArt() {
  return (
    <Frame label="The latest receipt becomes one EIP-712 ticket for a cumulative unit count">
      <rect className="xk-cut-box" x="14" y="30" width="32" height="44" />
      <line className="xk-cut" x1="19" y1="40" x2="41" y2="40" />
      <line className="xk-cut" x1="19" y1="47" x2="41" y2="47" />
      <text className="xk-cut-s" x="30" y="90" textAnchor="middle">
        latest
      </text>
      <Arrow x1={50} x2={72} y={51} />
      <rect className="xk-cut-box" x="76" y="24" width="62" height="56" />
      <text className="xk-cut-s" x="107" y="40" textAnchor="middle">
        EIP-712
      </text>
      <text className="xk-cut-s" x="107" y="54" textAnchor="middle">
        units 2,410
      </text>
      <text className="xk-cut-s" x="107" y="68" textAnchor="middle">
        seq 37
      </text>
      <text className="xk-cut-s" x="107" y="96" textAnchor="middle">
        ticket
      </text>
      <Arrow x1={142} x2={164} y={51} />
      <text className="xk-cut-s" x="176" y="48" textAnchor="middle">
        any
      </text>
      <text className="xk-cut-s" x="176" y="60" textAnchor="middle">
        relayer
      </text>
    </Frame>
  );
}

function SettlementArt() {
  return (
    <Frame label="The escrow pays the operator 95 percent and the treasury 5 percent">
      <rect className="xk-cut-box" x="10" y="34" width="58" height="40" />
      <text className="xk-cut-s" x="39" y="50" textAnchor="middle">
        escrow
      </text>
      <text className="xk-cut-s" x="39" y="63" textAnchor="middle">
        deposit
      </text>
      <path
        d="M 72 50 L 108 30"
        stroke="var(--xk-muted)"
        strokeWidth="1.4"
        markerEnd="url(#xk-beat-arrow)"
      />
      <path
        d="M 72 60 L 108 78"
        stroke="var(--xk-muted)"
        strokeWidth="1.4"
        markerEnd="url(#xk-beat-arrow)"
      />
      <rect className="xk-cut-box" x="112" y="12" width="76" height="32" />
      <text className="xk-cut-s" x="150" y="26" textAnchor="middle">
        operator
      </text>
      <text className="xk-cut-s" x="150" y="38" textAnchor="middle" fill="var(--xk-good)">
        95 percent
      </text>
      <rect className="xk-cut-box" x="112" y="64" width="76" height="32" />
      <text className="xk-cut-s" x="150" y="78" textAnchor="middle">
        treasury
      </text>
      <text className="xk-cut-s" x="150" y="90" textAnchor="middle" fill="var(--xk-money)">
        5 percent
      </text>
    </Frame>
  );
}

const ART = [VoucherArt, ReceiptArt, TicketArt, SettlementArt];

export default function PayPerByte() {
  return (
    <section className="xk-section xk-section--tinted" id="pay">
      <div className="xk-wrap">
        <ArrowDefs />
        <p className="xk-eyebrow">05 / the money</p>
        <h2>Pay per verified byte.</h2>
        <p className="xk-lede">
          Four objects, in order. Each one is a signature over a counter, and the counter is
          cumulative, so losing any single object in the chain costs nobody anything.
        </p>
        <div className="xk-track">
          {BEATS.map((beat, index) => {
            const Art = ART[index];
            return (
              <article className="xk-beat" key={beat.n}>
                <div className="xk-beat__n">{beat.n}</div>
                <h3>{beat.title}</h3>
                <Art />
                <p>{beat.text}</p>
              </article>
            );
          })}
        </div>
        <p className="xk-note" style={{ marginTop: '1rem' }}>
          Sources: protocol/spec.md sections 4 and 5, docs/how-it-works.md section 2, and the
          191,698 gas figure from the handover run of a 2-ticket batch.
        </p>
      </div>
    </section>
  );
}
