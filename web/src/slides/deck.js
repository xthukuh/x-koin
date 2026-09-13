/**
 * The explainer deck, in one file.
 *
 * Every card is an object. The route in Slides.jsx renders each `kind` with a
 * small template, so the words and the numbers are edited here and the JSX is
 * left alone. The shape follows docs/_plan/research/03-explainer-video-study.md:
 * one idea per card, 20 to 60 spoken words, and narration that never points at
 * the screen, so the voice track can be recorded before the slides exist.
 *
 *   id        stable slug; also the URL hash fragment through reveal's hash option
 *   kind      title | card | chain | graph | component | list | price | demo
 *   title     the card heading
 *   body      one short line under the heading, or null
 *   narration the spoken words, deixis-free, 20 to 60 words
 *   figure    an inline SVG string, or null
 *   notes     a production note for whoever records the track
 *
 * Kind-specific fields: `items` on list and demo, `stats` on component and
 * title, `stages` on chain. The price card carries no total: the template reads
 * it from src/shop/data.js, which compiles hardware/shopping/parts/*.json at
 * build time, so the figure on the slide cannot drift from the shop page.
 *
 * Numbers come from docs/papers/00-x-koin-concept.md and
 * docs/papers/02-system-architecture.md. A conditional number keeps its
 * condition in the same sentence, because most of them are simulation results
 * rather than field measurements.
 */

/** Words per minute the narration is written to, from the format study. */
export const WORDS_PER_MINUTE = 179;

const CHAIN_SVG = `
<svg viewBox="0 0 1180 330" role="img" width="100%"
     aria-label="Six stages from a phone to the public internet, with signed receipts returning along the same path to the Node.">
  <defs>
    <marker id="xk-arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--xk-accent)" />
    </marker>
    <marker id="xk-arrow-money" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--xk-money)" />
    </marker>
  </defs>

  <g font-family="'IBM Plex Mono', ui-monospace, Consolas, monospace">
    <g fill="var(--xk-surface)" stroke="var(--xk-line)" stroke-width="1.5">
      <rect x="0" y="60" width="170" height="84" rx="4" />
      <rect x="202" y="60" width="170" height="84" rx="4" />
      <rect x="404" y="60" width="170" height="84" rx="4" />
      <rect x="606" y="60" width="170" height="84" rx="4" stroke="var(--xk-accent)" stroke-width="2.5" />
      <rect x="808" y="60" width="170" height="84" rx="4" />
      <rect x="1010" y="60" width="170" height="84" rx="4" />
    </g>

    <g fill="var(--xk-ink)" font-size="17" font-weight="600" text-anchor="middle">
      <text x="85" y="96">Phone</text>
      <text x="287" y="96">Node-Satellite</text>
      <text x="489" y="96">Mains riser</text>
      <text x="691" y="96">Node</text>
      <text x="893" y="96">Backhaul</text>
      <text x="1095" y="96">Internet</text>
    </g>
    <g fill="var(--xk-muted)" font-size="13" text-anchor="middle">
      <text x="85" y="120">holds the keys</text>
      <text x="287" y="120">wall socket</text>
      <text x="489" y="120">HomePlug AV</text>
      <text x="691" y="120">meter board</text>
      <text x="893" y="120">router or hotspot</text>
      <text x="1095" y="120">metered bytes</text>
    </g>

    <g stroke="var(--xk-accent)" stroke-width="2" marker-end="url(#xk-arrow)" fill="none">
      <path d="M 172 102 L 198 102" />
      <path d="M 374 102 L 400 102" />
      <path d="M 576 102 L 602 102" />
      <path d="M 778 102 L 804 102" />
      <path d="M 980 102 L 1006 102" />
    </g>

    <g fill="var(--xk-accent)" font-size="12" text-anchor="middle">
      <text x="185" y="42">Wi-Fi</text>
      <text x="387" y="42">HomePlug</text>
      <text x="589" y="42">bulk</text>
      <text x="791" y="42">WAN</text>
      <text x="993" y="42">proxy</text>
    </g>

    <path d="M 691 148 L 691 238 L 85 238 L 85 152"
          stroke="var(--xk-money)" stroke-width="2" fill="none"
          stroke-dasharray="7 5" marker-end="url(#xk-arrow-money)" />
    <text x="388" y="264" fill="var(--xk-money)" font-size="14" text-anchor="middle">
      signed cumulative receipt, 108 bytes, one per receipt interval
    </text>
    <text x="388" y="288" fill="var(--xk-faint)" font-size="13" text-anchor="middle">
      the Node keeps the latest receipt per client and discards the rest
    </text>

    <path d="M 776 148 L 776 196 L 1180 196" stroke="var(--xk-money)" stroke-width="2"
          fill="none" marker-end="url(#xk-arrow-money)" />
    <text x="1004" y="184" fill="var(--xk-money)" font-size="13" text-anchor="middle">
      ticket batch to Base
    </text>
  </g>
</svg>
`.trim();

const GRAPH_SVG = `
<svg viewBox="0 0 1180 380" role="img" width="100%"
     aria-label="Two mains segments separated by a distribution transformer, joined by a LoRa hop, with a solar Satellite and a farm sensor on the free plane.">
  <g font-family="'IBM Plex Mono', ui-monospace, Consolas, monospace">
    <g fill="none" stroke="var(--xk-line)" stroke-width="1.5">
      <rect x="0" y="40" width="380" height="190" rx="5" />
      <rect x="540" y="40" width="380" height="190" rx="5" />
    </g>
    <g fill="var(--xk-faint)" font-size="13">
      <text x="16" y="64">Segment A: one mains riser</text>
      <text x="556" y="64">Segment B: a second riser</text>
    </g>

    <line x1="460" y1="20" x2="460" y2="360" stroke="var(--xk-critical)"
          stroke-width="2" stroke-dasharray="6 6" />
    <text x="460" y="16" fill="var(--xk-critical)" font-size="13" text-anchor="middle">
      distribution transformer: the power-line carrier stops here
    </text>

    <g fill="var(--xk-surface)" stroke="var(--xk-accent)" stroke-width="2.5">
      <rect x="26" y="92" width="154" height="70" rx="4" />
      <rect x="566" y="92" width="184" height="70" rx="4" />
    </g>
    <g fill="var(--xk-surface)" stroke="var(--xk-line)" stroke-width="1.5">
      <rect x="206" y="92" width="154" height="70" rx="4" />
      <rect x="776" y="92" width="124" height="70" rx="4" />
      <rect x="700" y="248" width="200" height="70" rx="4" />
      <rect x="950" y="248" width="200" height="70" rx="4" />
    </g>

    <g fill="var(--xk-ink)" font-size="16" font-weight="600" text-anchor="middle">
      <text x="103" y="122">Node</text>
      <text x="283" y="122">Node-Satellite</text>
      <text x="658" y="122">Node-Satellite</text>
      <text x="838" y="122">phones</text>
      <text x="800" y="278">xKoin-Satellite</text>
      <text x="1050" y="278">farm sensor</text>
    </g>
    <g fill="var(--xk-muted)" font-size="12.5" text-anchor="middle">
      <text x="103" y="144">backhaul, metering</text>
      <text x="283" y="144">bulk stays local</text>
      <text x="658" y="144">plus an SX1262 radio</text>
      <text x="838" y="144">Wi-Fi attach</text>
      <text x="800" y="300">solar, under 40 mA average</text>
      <text x="1050" y="300">free LAN plane, zero XKN</text>
    </g>

    <g stroke="var(--xk-plc)" stroke-width="3" fill="none">
      <path d="M 182 127 L 202 127" />
      <path d="M 752 127 L 772 127" />
    </g>

    <path d="M 103 166 C 103 296, 658 296, 658 166" stroke="var(--xk-lora)"
          stroke-width="3" fill="none" />
    <g fill="var(--xk-lora)" font-size="14" text-anchor="middle">
      <text x="250" y="334">LoRa carries control and</text>
      <text x="250" y="354">class C across the boundary</text>
    </g>

    <g stroke="var(--xk-lora)" stroke-width="2.5" fill="none" stroke-dasharray="8 5">
      <path d="M 700 166 L 700 244" />
      <path d="M 902 283 L 946 283" />
    </g>
    <text x="925" y="348" fill="var(--xk-faint)" font-size="13" text-anchor="middle">
      868.1 MHz, SF7, BW125, 226 byte payload
    </text>
  </g>
</svg>
`.trim();

export const DECK = [
  {
    id: 'title',
    kind: 'title',
    title: 'xKoin',
    body: 'Free local mesh. Paid transit, sold per verified byte.',
    stats: [
      { value: '3', label: 'physical mediums under one frame' },
      { value: '0', label: 'chain transactions per packet' },
    ],
    figure: null,
    narration:
      'xKoin is a network for buildings and small towns in Kenya. Traffic that stays inside the mesh costs nothing at all. Traffic that leaves for the public internet is sold by the verified byte. The wiring already in the walls carries most of it, and a radio carries the rest when the mains stops.',
    notes: 'Open flat. No music swell. The whole claim is in the second and third sentences.',
  },
  {
    id: 'outage',
    kind: 'card',
    title: 'Nine in the evening, Roysambu',
    body: 'A transformer drops and every network in the block goes with it.',
    stats: [
      { value: 'KES 80 / GB', label: 'daily pass, 20 shillings for 250 MB, recorded 2026-09-12' },
      { value: 'KES 10 / GB', label: 'home fibre at 2,999 a month, at the stated fair-use volume' },
    ],
    figure: null,
    narration:
      'A transformer drops in Roysambu at nine in the evening. The lights go, the fibre box in the stairwell goes with them, and the cell site starts draining its battery. Twelve flats hold charged phones with nothing left to reach. The outage is routine. So is paying eighty shillings a gigabyte between outages.',
    notes:
      'Concrete nouns only. The two tariff figures were recorded on 2026-09-12 and Kenyan tariffs move several times a year, so re-verify before any public showing.',
  },
  {
    id: 'reversal',
    kind: 'card',
    title: 'What already exists, and what it will not do',
    body: 'Meshtastic moves messages. It does not move transit, and it pays nobody.',
    figure: null,
    narration:
      'Meshtastic already runs an open radio mesh on cheap LoRa boards, and it works well. It carries messages, not internet transit. It has no medium other than radio, so a short message is all it can ever carry. And nobody is paid to put a node in the place that needs one.',
    notes: 'Credit the prior system honestly before naming the gap. No dismissal.',
  },
  {
    id: 'object',
    kind: 'card',
    title: 'The object is a box beside the meter board',
    body: 'One backhaul in. Two planes out, over copper that is already paid for.',
    figure: null,
    narration:
      'An xKoin-Node is a box near the meter board. One side terminates a backhaul link. The other side injects broadband data into the building mains wiring, puts receipts and control on a narrowband carrier over the same copper, and keeps a LoRa radio alive through the hours when the mains is not. The copper was paid for years ago.',
    notes: 'This is the named object of the piece. Every later card refers back to it by name.',
  },
  {
    id: 'chain',
    kind: 'chain',
    title: 'From a phone to the internet, and the receipt back',
    body: 'Admission is checked at the edge with no network access at all.',
    figure: CHAIN_SVG,
    narration:
      'A phone joins the Wi-Fi of the nearest Node-Satellite and presents a voucher. The relay checks the signature against a key compiled into its firmware, in under 4.5 milliseconds on the ESP32-S3, with no network access at all. Bytes run over the mains to the Node and out to the backhaul. Receipts travel the same copper backwards.',
    notes: 'Longest card in the deck. Hold it while the forward path and the return path both land.',
  },
  {
    id: 'mesh',
    kind: 'graph',
    title: 'Where the wiring stops, the radio starts',
    body: 'A LoRa hop crosses the transformer boundary that ends the mains segment.',
    figure: GRAPH_SVG,
    narration:
      'A distribution transformer ends the power-line carrier, and no amount of transmit power changes that. A LoRa hop crosses the boundary instead, carrying control and transactional service to a second building that keeps its own bulk traffic local. A third hop reaches a solar Satellite with a farm sensor, spending nothing. Relay topology moves. Who is owed what does not.',
    notes: 'The node graph. The last two sentences are the point of the whole figure.',
  },
  {
    id: 'money',
    kind: 'list',
    title: 'Free LAN, paid WAN, in four steps',
    body: 'Nothing in the mesh is a claim about money that is not also a signature.',
    items: [
      { label: 'Voucher', text: 'Ed25519, signed by the kiosk root key, verified offline at the edge.' },
      { label: 'Receipt', text: '108 bytes, cumulative, sized to fit one 128 byte narrowband frame.' },
      { label: 'Ticket', text: 'EIP-712 over the latest counter, batched with other clients.' },
      { label: 'Settlement', text: '95 percent to the node operator, 5 percent to the treasury.' },
    ],
    figure: null,
    narration:
      'Traffic that stays inside the mesh costs zero and needs no voucher: local chat, cached school material, sensor telemetry, a camera down the corridor. Traffic leaving for the public internet is metered in four steps. A voucher admits. A receipt records. A ticket settles. The chain pays ninety-five percent to the operator and five to the treasury.',
    notes: 'The escalation ladder. Each rung is a named artifact, not an abstraction.',
  },
  {
    id: 'cases',
    kind: 'list',
    title: 'Four places the shape fits',
    body: 'Same firmware, same contracts, different building.',
    items: [
      { label: 'Apartment estates', text: 'A 40 unit block in Ruaka: the landlord operates the node without becoming an internet provider.' },
      { label: 'Large-scale farm IoT', text: 'A 400 acre farm in Laikipia: soil, tank and gate telemetry at zero XKN for the life of the deployment.' },
      { label: 'Rural market hubs', text: 'Market day in Kagio: transit by the hour for traders who want it, class C for traders who need a few hundred bytes.' },
      { label: 'Schools and clinics', text: 'Cached curriculum on the free plane, a metered allowance for teachers, a dispensary uploading at 02:00.' },
    ],
    figure: null,
    narration:
      'Four places the shape fits. A forty unit block in Ruaka, where the landlord becomes the node operator without becoming an internet provider. A four hundred acre farm in Laikipia, telemetry free for the life of the deployment. A market kiosk in Kagio. A school serving cached curriculum at zero cost. One firmware runs all four.',
    notes: 'Four one-liners, no elaboration. The detail is on the slide, not in the voice.',
  },
  {
    id: 'node',
    kind: 'component',
    title: 'xKoin-Node',
    body: 'The gateway: backhaul termination, packet classification, metering, ticket assembly.',
    stats: [
      { value: 'USD 200', label: 'of modules per unit, field kit indicative prices' },
      { value: '230 mA', label: 'narrowband module at 5 V on a transmit burst' },
    ],
    figure: null,
    narration:
      'The xKoin-Node is the only device that touches the internet. It speaks Wi-Fi, broadband power line, narrowband power line and LoRa. About two hundred United States dollars of modules per unit at the field kit indicative prices, dominated by the ninety-five dollar cellular module, which the proof of concept leaves out. The supply is sized at three amps.',
    notes: 'First of four named-object cards. Same layout each time so the eye learns it once.',
  },
  {
    id: 'node-satellite',
    kind: 'component',
    title: 'xKoin-Node-Satellite',
    body: 'The wall-socket relay: pulls the signal off the copper, regenerates Wi-Fi, admits clients.',
    stats: [
      { value: '10 Mbps', label: 'HomePlug AV bulk plane, as modelled' },
      { value: '1400 B', label: 'frame payload on the broadband carrier' },
    ],
    figure: null,
    narration:
      'The xKoin-Node-Satellite plugs into a wall socket on the same mains segment, pulls the broadband signal off the copper, and regenerates Wi-Fi for the flats around it. The bulk carrier is modelled at about ten megabits per second with a 1400 byte frame. A relay that serves a client collects that client receipts and is paid for them.',
    notes: 'The attribution sentence matters to operators. Do not cut it for time.',
  },
  {
    id: 'satellite',
    kind: 'component',
    title: 'xKoin-Satellite',
    body: 'The off-grid remote: solar, deep sleep, transactional service over LoRa alone.',
    stats: [
      { value: 'under 40 mA', label: 'average current design target' },
      { value: 'USD 55', label: 'of modules per unit, field kit indicative prices' },
    ],
    figure: null,
    narration:
      'The xKoin-Satellite runs off grid on solar and one 18650 cell, speaking LoRa alone. The design target is under forty milliamps average, so a ten watt panel and a 3,400 milliamp hour cell ride through two overcast days. About fifty-five dollars of modules per unit at the field kit indicative prices. No internet protocol runs on it at all.',
    notes: 'The current figure is a design target, not a measurement. Keep the word target.',
  },
  {
    id: 'client',
    kind: 'component',
    title: 'xKoin-Client and the OTG dongle',
    body: 'A phone holds the keys. A dongle on a USB-C lead gives that phone direct LoRa reach.',
    stats: [
      { value: '226 B', label: 'LoRa payload at SF7, BW125, CR4/5' },
      { value: '108 B', label: 'signed receipt, one narrowband frame' },
    ],
    figure: null,
    narration:
      'The xKoin-Client is a phone holding the keys, or an OTG dongle on a USB-C lead giving that phone direct LoRa reach. The radio carries a 226 byte payload at spreading factor seven, and a signed receipt is 108 bytes, sized to fit one narrowband frame of 128. A lost phone costs nothing; the balance was never in it.',
    notes: 'Last component card. The closing sentence answers the question everyone asks.',
  },
  {
    id: 'price',
    kind: 'price',
    title: 'What one proof of concept kit costs',
    body: 'Proof of concept parts total, Kenyan shillings, shipping excluded.',
    figure: null,
    narration:
      'The proof of concept parts total is thirty-five thousand three hundred and ninety-three shillings across fourteen scouted lines, shipping excluded. Each line is a chosen listing price times quantity, recorded in September 2026, and the set buys one kit that runs all six demonstrations once. The cellular module is deferred, so it is not in the sum.',
    notes:
      'The number on the slide is read from src/shop/data.js at build time. If a part is re-scouted, the slide moves and this narration has to be re-recorded.',
  },
  {
    id: 'proof',
    kind: 'list',
    title: 'What is already proven, and how',
    body: 'Two of the four are simulation results. The label stays on them.',
    items: [
      { label: '28', text: 'Foundry tests passing on three contracts, including a 256 run solvency fuzz.' },
      { label: '9.768 Mbps', text: 'protocol goodput against the 10 Mbps HomePlug model, 97.7 percent of it. Simulation.' },
      { label: '0.8 s', text: 'to move traffic to LoRa after a grid cut, in the discrete-event simulation.' },
      { label: '0 / 20,000', text: 'garbage frames accepted under the protocol fuzz over malformed input.' },
    ],
    figure: null,
    narration:
      'Twenty-eight Foundry tests pass on the contracts, including a 256 run solvency fuzz. The protocol simulation reaches 9.768 megabits per second against a ten megabit power line model, and moves traffic to LoRa in about 0.8 seconds after a grid cut. Zero of twenty thousand garbage frames were accepted. The middle figures are simulation, not field measurement.',
    notes: 'Never let the two simulation numbers leave the deck without the qualifier.',
  },
  {
    id: 'demo',
    kind: 'demo',
    title: 'Six demonstrations on a bench',
    body: 'Each one names its hardware, its observable, and what it proves.',
    items: [
      { label: 'D1', text: 'Local LAN over the mains: captive portal, a purchase, receipts ticking on the Node.' },
      { label: 'D2', text: 'Air-gapped LoRa through two 30 dB attenuators: class C traffic at SF7, RSSI on screen.' },
      { label: 'D3', text: 'Transformer jump: a mains filter blocks the power-line carrier, LoRa carries control across.' },
      { label: 'D4', text: 'Last network standing: backhaul unplugged, free LAN alive, receipts accumulating.' },
      { label: 'D5', text: 'High-speed internet: 720p video and a live session through the HomePlug path.' },
      { label: 'D6', text: 'Farm IoT on the free plane: soil moisture and temperature arrive for zero XKN.' },
    ],
    figure: null,
    narration:
      'Six demonstrations are specified on the bench. Local traffic over the mains. Air-gapped LoRa through sixty decibels of attenuator. A jump across a mains filter standing in for a transformer. The wide area link unplugged, with receipts accumulating. Video over the power line. Farm sensors arriving for nothing. Each names its hardware and its observable.',
    notes: 'Read the six as a list with equal weight. No build-up on the last one.',
  },
  {
    id: 'close',
    kind: 'card',
    title: 'Three things stand between here and a pilot',
    body: 'DNS records, a parts order, and one landlord.',
    figure: null,
    narration:
      'Three things stand between the design and a running pilot. Three DNS records pointing at a host that already runs the software. Thirty-five thousand shillings of parts, ordered. And one building whose landlord will put a box beside the meter board and take ninety-five percent of what it earns. The contracts, firmware and protocol already exist.',
    notes: 'End on the ask. No sign-off flourish, no music, cut to black on the last word.',
  },
];

/** Words in one narration string, counting whitespace-separated tokens. */
export function wordCount(text) {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Total spoken words in the deck. */
export function deckWordCount() {
  return DECK.reduce((sum, card) => sum + wordCount(card.narration), 0);
}

/** Seconds a card should hold on screen at WORDS_PER_MINUTE. */
export function cardSeconds(card) {
  return (wordCount(card.narration) / WORDS_PER_MINUTE) * 60;
}
