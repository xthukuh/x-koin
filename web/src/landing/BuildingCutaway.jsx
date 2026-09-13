/**
 * Asset A2: the building cutaway, drawn inline so it is theme-aware, selectable
 * and readable by a screen reader.
 *
 * One drawing serves two sections. Section 4 shows it whole; section 6 passes
 * `cut` and the mains-carried lanes go dead while the LoRa path thickens, which
 * is exactly what the medium scorer does when three consecutive deliveries fail
 * (protocol/spec.md s1).
 *
 * Geometry, in viewBox units: the wired building is x 60 to 390, ground slab at
 * y 380, floor slabs at 280 and 175, roof at 70. The mains riser runs at x 200
 * with the narrowband pair at x 212. The LoRa feeder runs up at x 160 to a roof
 * antenna and arcs to a Satellite on the neighbouring rooftop at x 600.
 */

function lane(base, dead) {
  return dead ? 'xk-lane xk-lane--dead' : base;
}

export default function BuildingCutaway({ cut = false, idPrefix = 'cut' }) {
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;
  return (
    <svg viewBox="0 0 760 440" role="img" aria-labelledby={`${titleId} ${descId}`}>
      <title id={titleId}>Cutaway of a building carrying xKoin over its own wiring</title>
      <desc id={descId}>
        {cut
          ? 'The mains is cut: the HomePlug and narrowband power line paths are dead and the LoRa link from the Node to the rooftop Satellite is carrying the session.'
          : 'A Node in the meter room feeds two Node-Satellites on the floors above over the mains riser, phones attach to them over Wi-Fi, and a LoRa link reaches a Satellite on the neighbouring rooftop.'}
      </desc>

      {/* neighbouring rooftop */}
      <rect className="xk-cut-wall" x="500" y="250" width="205" height="130" />
      <line className="xk-cut" x1="500" y1="250" x2="705" y2="250" />
      <text className="xk-cut-s" x="510" y="270">
        neighbouring rooftop
      </text>

      {/* the wired building: shell, slabs, roof */}
      <rect className="xk-cut-wall" x="60" y="70" width="330" height="310" />
      <line className="xk-cut" x1="60" y1="175" x2="390" y2="175" />
      <line className="xk-cut" x1="60" y1="280" x2="390" y2="280" />
      <line className="xk-cut" x1="40" y1="380" x2="730" y2="380" strokeWidth="2" />
      <text className="xk-cut-s" x="68" y="88">
        flat 2
      </text>
      <text className="xk-cut-s" x="68" y="193">
        flat 1
      </text>
      <text className="xk-cut-s" x="68" y="298">
        meter room
      </text>

      {/* HomePlug AV: the mains riser, bulk data */}
      <path
        className={lane('xk-lane xk-lane--plc', cut)}
        d="M 200 372 L 200 95 M 180 326 L 200 326 M 200 228 L 250 228 M 200 123 L 250 123"
      />
      {/* KQ-130F: the same wiring, receipts and control */}
      <path
        className={lane('xk-lane xk-lane--nbplc', cut)}
        d="M 212 372 L 212 130 M 212 240 L 250 240 M 212 135 L 250 135"
      />

      {/* LoRa: coax up the riser to the roof antenna, then the hop */}
      <path
        className={lane(`xk-lane xk-lane--lora${cut ? ' xk-lane--hot' : ''}`, false)}
        d="M 160 298 L 160 48"
      />
      <path
        className={`xk-lane xk-lane--lora${cut ? ' xk-lane--hot' : ''}`}
        d="M 160 48 C 285 -4, 470 22, 596 142"
      />
      <line className="xk-cut" x1="148" y1="48" x2="172" y2="48" />

      {/* xKoin-Node */}
      <rect className="xk-cut-box" x="76" y="300" width="104" height="52" />
      <text className="xk-cut-t" x="86" y="320">
        xKoin-Node
      </text>
      <text className="xk-cut-s" x="86" y="336">
        backhaul, meter,
      </text>
      <text className="xk-cut-s" x="86" y="347">
        kiosk, radio
      </text>

      {/* xKoin-Node-Satellites */}
      <rect className="xk-cut-box" x="250" y="205" width="104" height="46" opacity={cut ? 0.45 : 1} />
      <text className="xk-cut-t" x="258" y="224" opacity={cut ? 0.45 : 1}>
        Node-Sat 1
      </text>
      <text className="xk-cut-s" x="258" y="240" opacity={cut ? 0.45 : 1}>
        socket relay
      </text>
      <rect className="xk-cut-box" x="250" y="100" width="104" height="46" opacity={cut ? 0.45 : 1} />
      <text className="xk-cut-t" x="258" y="119" opacity={cut ? 0.45 : 1}>
        Node-Sat 2
      </text>
      <text className="xk-cut-s" x="258" y="135" opacity={cut ? 0.45 : 1}>
        socket relay
      </text>

      {/* phones on Wi-Fi */}
      <rect
        className="xk-cut-box"
        x="362"
        y="212"
        width="16"
        height="30"
        opacity={cut ? 0.45 : 1}
      />
      <rect
        className="xk-cut-box"
        x="362"
        y="107"
        width="16"
        height="30"
        opacity={cut ? 0.45 : 1}
      />
      <path
        className={lane('xk-lane xk-lane--plc', cut)}
        strokeWidth="1.6"
        d="M 354 227 L 362 227 M 354 122 L 362 122"
      />
      <text className="xk-cut-s" x="336" y="262" opacity={cut ? 0.45 : 1}>
        Wi-Fi
      </text>

      {/* xKoin-Satellite on the neighbouring rooftop */}
      <line className="xk-cut" x1="600" y1="250" x2="600" y2="186" strokeWidth="2" />
      <rect className="xk-cut-box" x="556" y="142" width="88" height="44" />
      <text className="xk-cut-t" x="564" y="161">
        Satellite
      </text>
      <text className="xk-cut-s" x="564" y="177">
        solar, LoRa
      </text>
      <path className="xk-cut" d="M 648 150 l 26 -12 l 0 16 l -26 12 z" />

      {/* labels */}
      <text className="xk-cut-s" x="418" y="92">
        LoRa SX1262, SF7
      </text>
      <text className="xk-cut-s" x="418" y="105">
        ~5.4 kbps
      </text>
      <text className="xk-cut-s" x="60" y="404">
        HomePlug AV over the mains riser, ~10 Mbps, bulk data
      </text>
      <text className="xk-cut-s" x="60" y="420">
        KQ-130F narrowband on the same wiring, ~960 B/s, receipts and control
      </text>
      {cut ? (
        <text className="xk-cut-s" x="60" y="436" style={{ fill: 'var(--xk-critical)' }}>
          Mains cut: both power line paths quarantined, LoRa carrying
        </text>
      ) : null}
    </svg>
  );
}
