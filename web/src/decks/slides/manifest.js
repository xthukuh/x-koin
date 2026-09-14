import { ms } from '../../player/stage.js';

/**
 * The deck, as data.
 *
 * Every scene's id, title, duration, spoken caption and glossary terms live
 * here; the picture that goes with each id lives in the chapter file named by
 * `module`. index.js joins the two and refuses to build a deck with a scene
 * that has no picture or a picture with no scene.
 *
 * The split exists so scripts/capture-slides.mjs can import the running order
 * and the durations in plain Node, which cannot parse the JSX the scenes are
 * written in. Editing a duration or a caption therefore never touches a
 * component, and the capture script and the page cannot disagree about how long
 * a scene runs.
 *
 * Rules the deck is written to:
 *
 * 1. A scene runs 6 to 15 seconds and then holds until the reader moves on, so
 *    the caption is read at the reader's pace rather than the clock's.
 * 2. A caption never points at the screen. No "as shown here", no "this
 *    diagram", so the voice track can be recorded before the pictures are final.
 * 3. Short sentences, plain words. A caption is heard once, not re-read.
 * 4. A number that carries a condition keeps the condition in the same
 *    sentence. Simulation results say simulation; the per-unit price says
 *    placeholder every time it appears.
 */

export const CHAPTERS = [
  {
    id: 'overview',
    n: 1,
    title: 'The invention in one picture',
    blurb: 'What the network is, and the whole of it on one frame.',
    scenes: [
      {
        id: 'opening',
        module: 'ch01',
        title: 'Free local mesh, paid transit',
        duration: ms(9),
        terms: ['free-lan', 'xkn', 'unit'],
        caption:
          'xKoin is a network for buildings and small towns in Kenya. Anything that stays inside the mesh is free. Anything that goes out to the internet is paid for by the byte, and every byte is signed.',
      },
      {
        id: 'one-picture',
        module: 'ch01',
        title: 'The whole system on one frame',
        duration: ms(15),
        terms: ['client', 'node-satellite', 'node', 'backhaul', 'receipt', 'ticket', 'escrow'],
        caption:
          'A phone joins the nearest relay over Wi-Fi. The bytes cross the building wiring to the gateway and out to the internet. Signed receipts come back the same way, and one settlement closes the session.',
      },
    ],
  },
  {
    id: 'devices',
    n: 2,
    title: 'Devices and mediums',
    blurb: 'Five kinds of device over four physical carriers.',
    scenes: [
      {
        id: 'mediums',
        module: 'ch02',
        title: 'Three mediums carry the mesh, one attaches the clients',
        duration: ms(14),
        terms: ['medium', 'homeplug', 'narrowband-plc', 'kq130f', 'lora', 'sx1262', 'sf7', 'wifi', 'mtu'],
        caption:
          'The three carriers differ in speed by more than a thousand times. One frame format rides all of them. That is why the header is small and fixed.',
      },
      {
        id: 'device-node',
        module: 'ch02',
        title: 'xKoin-Node, the only device that touches the internet',
        duration: ms(13),
        terms: ['node', 'esp32s3', 'e22', 'kq130f', 'homeplug', 'backhaul'],
        caption:
          'The Node ends the internet link, decides what is free and what is paid, checks vouchers offline and builds the tickets. It speaks all four carriers.',
      },
      {
        id: 'device-node-satellite',
        module: 'ch02',
        title: 'xKoin-Node-Satellite, the wall-socket relay',
        duration: ms(12),
        terms: ['node-satellite', 'mains-segment', 'homeplug', 'captive-portal', 'node-operator'],
        caption:
          'The relay plugs into a socket on the same wiring, pulls the signal off the copper and gives out Wi-Fi. Whichever device serves you is the device that gets paid.',
      },
      {
        id: 'device-satellite',
        module: 'ch02',
        title: 'xKoin-Satellite, off grid on solar and one cell',
        duration: ms(12),
        terms: ['satellite', 'heltec', 'sx1262', 'class-c', 'lora'],
        caption:
          'The Satellite runs on a small panel and one cell, using radio alone. The design ceiling is forty milliamps on average, and no internet protocol runs on it.',
      },
      {
        id: 'device-client',
        module: 'ch02',
        title: 'xKoin-Client: a phone, and a dongle for direct reach',
        duration: ms(12),
        terms: ['client', 'otg', 'heltec', 'ed25519', 'secp256k1', 'receipt'],
        caption:
          'The client is a phone holding one seed, or that phone with a radio dongle on a lead. The dongle holds no key. Losing either one costs nothing, because the money was never in them.',
      },
      {
        id: 'device-ecosystem',
        module: 'ch02',
        title: 'LoRa ecosystem devices ride the free plane',
        duration: ms(11),
        terms: ['ra-01sh', 'esp32c3', 'meshtastic', 'free-lan', 'farms'],
        caption:
          'A farm sensor, a tank gauge and an ordinary Meshtastic handset all reach the mesh without paying, because their traffic never leaves it. With Meshtastic the only claim is that each can find the other.',
      },
    ],
  },
  {
    id: 'protocol',
    n: 3,
    title: 'The protocol, XKP',
    blurb: 'The frame, the phases, the proof, the money.',
    scenes: [
      {
        id: 'xkp-frame',
        module: 'ch03',
        title: 'One frame, byte by byte',
        duration: ms(15),
        terms: ['xkp', 'frame', 'node-id', 'ttl', 'crc16', 'law8'],
        caption:
          'Twenty-seven bytes of header, then the payload, then a two byte check. The identity field is eight bytes rather than a full key, because a full key would eat half of a narrowband message.',
      },
      {
        id: 'xkp-phases',
        module: 'ch03',
        title: 'Five phases, and admission works with no network',
        duration: ms(15),
        terms: ['voucher', 'kiosk-root-key', 'ed25519', 'esp32s3', 'class-c', 'settlement'],
        caption:
          'Find, join, transfer, prove, settle. Joining works with no internet at all, because the internet is the thing being sold. A gateway that is cut off must still let in someone who paid five minutes ago.',
      },
      {
        id: 'xkp-receipt',
        module: 'ch03',
        title: 'The receipt is 108 bytes because the slowest medium says so',
        duration: ms(13),
        terms: ['receipt', 'ed25519', 'kq130f', 'narrowband-plc', 'law3'],
        caption:
          'Forty-four bytes of fields and a sixty-four byte signature fit one message on the slowest carrier. Proof has to move when nothing else can, or a node that carried the bytes has worked for free.',
      },
      {
        id: 'xkp-cumulative',
        module: 'ch03',
        title: 'Cumulative counters: lose four receipts, lose nothing',
        duration: ms(13),
        terms: ['cumulative', 'law5', 'law3', 'receipt'],
        caption:
          'A receipt carries the running total, never the increase. Only the newest one matters, an old one is worth nothing, and the node keeps one per client instead of a log.',
      },
      {
        id: 'xkp-ticket',
        module: 'ch03',
        title: 'The ticket: the last receipt, in a form the chain can check',
        duration: ms(13),
        terms: ['ticket', 'eip712', 'secp256k1', 'unit', 'node-operator'],
        caption:
          'The node takes its newest receipt and has the client sign it again in the form the chain reads. One unit is ten kilobytes, the count is a running total, and the field order is fixed.',
      },
      {
        id: 'xkp-settlement',
        module: 'ch03',
        title: 'Settlement: one call closes a whole session',
        duration: ms(14),
        terms: ['settlement', 'escrow', 'treasury', 'relayer', 'law6', 'law7', 'base'],
        caption:
          'The contract checks the date and the counter, pays only the new part, and never pays more than the balance holds. Ninety-five percent goes to the operator, five to the treasury, and anyone can make the call.',
      },
    ],
  },
  {
    id: 'journeys',
    n: 4,
    title: 'User journeys, end to end',
    blurb: 'Every party, from first install to shillings in hand.',
    scenes: [
      {
        id: 'journey-operator-setup',
        module: 'ch04',
        title: 'Journey: a node admin sets up and funds the float',
        duration: ms(14),
        terms: ['node-operator', 'node', 'gateway-api', 'relayer', 'bridge', 'session-credit'],
        caption:
          'An operator fits the box, points it at an internet link, writes in one address and keeps a little gas. The operator is an address, not a device, because devices get replaced and stolen.',
      },
      {
        id: 'journey-onboarding',
        module: 'ch04',
        title: 'Journey: a client onboards with twelve words',
        duration: ms(13),
        terms: ['client', 'secp256k1', 'ed25519', 'xkn', 'escrow', 'eip2612'],
        caption:
          'One seed in the phone gives both keys: one signs tickets, one signs receipts. The balance sits on the chain from the first minute, so writing the words onto a new phone brings everything back.',
      },
      {
        id: 'journey-kiosk',
        module: 'ch04',
        title: 'Journey: buying at the kiosk, shillings to a funded meter',
        duration: ms(14),
        terms: ['stk-push', 'daraja', 'jenga', 'bridge', 'voucher', 'escrow', 'kes-peg'],
        caption:
          'The payer gets the usual prompt and types a PIN. When the bank confirms, the gateway makes the same value in tokens, signs a voucher and tops up the shared meter. The user pays no gas.',
      },
      {
        id: 'journey-free-lan',
        module: 'ch04',
        title: 'Journey: browsing the free LAN plane',
        duration: ms(12),
        terms: ['free-lan', 'class-c', 'wifi', 'farms'],
        caption:
          'Chat, cached school material, a camera in the corridor, sensor readings. None of it leaves the mesh, so none of it is counted and none of it needs a voucher.',
      },
      {
        id: 'journey-paid-wan',
        module: 'ch04',
        title: 'Journey: a paid session on the wide area',
        duration: ms(14),
        terms: ['session-credit', 'receipt', 'law3', 'escrow', 'unit'],
        caption:
          'The serving device sets a limit, counts what leaves, takes a signature every so often, and settles at half the limit. What it risks on a dishonest client is measured in bytes, not in trust.',
      },
      {
        id: 'journey-earnings',
        module: 'ch04',
        title: 'Journey: earnings become shillings',
        duration: ms(14),
        terms: ['node-operator', 'settlement', 'bridge', 'msisdn', 'xkn'],
        caption:
          'Every batch adds to the operator address. The operator claims it, sends it to the bridge, gets shillings on their phone, and the bridge destroys exactly what it paid out.',
      },
      {
        id: 'journey-landlord',
        module: 'ch04',
        title: 'Journey: a landlord says yes',
        duration: ms(13),
        terms: ['estates', 'node-operator', 'kebs'],
        caption:
          'The ask is socket space, a wall, permission and one caretaker with a key. The owner becomes the operator and keeps ninety-five percent. They are not reselling their own line and are not becoming an internet provider.',
      },
      {
        id: 'journey-farmer',
        module: 'ch04',
        title: 'Journey: a farm sensor that never pays',
        duration: ms(12),
        terms: ['farms', 'free-lan', 'ra-01sh', 'demos'],
        caption:
          'A soil probe wakes every fifteen minutes, sends one reading and sleeps. The test is simple: the balance for its address has to be the same before and after twenty readings.',
      },
    ],
  },
  {
    id: 'modes',
    n: 5,
    title: 'Operating modes',
    blurb: 'Normal, and every way the ground gives way.',
    scenes: [
      {
        id: 'mode-normal',
        module: 'ch05',
        title: 'Normal: the sender scores the mediums and picks one',
        duration: ms(13),
        terms: ['medium-score', 'ewma', 'homeplug', 'lora', 'narrowband-plc'],
        caption:
          'Speed estimate times the chance of arrival, highest wins. Three failures in a row and a carrier is set aside for two seconds. Nothing is configured and nothing is switched by hand.',
      },
      {
        id: 'mode-wan-down',
        module: 'ch05',
        title: 'Wide area down: the mesh keeps its promises',
        duration: ms(13),
        terms: ['backhaul', 'voucher', 'cumulative', 'session-credit', 'free-lan'],
        caption:
          'New internet traffic stops, and so does reading the balance. Joining still works, because vouchers are checked offline. Receipts pile up and settle when the link is back.',
      },
      {
        id: 'mode-segment-cut',
        module: 'ch05',
        title: 'Mains segment cut: the radio jumps the transformer',
        duration: ms(14),
        terms: ['mains-segment', 'plc', 'lora', 'class-c', 'demos'],
        caption:
          'A transformer, a phase change or a filter ends the power-line signal, and more transmit power will not change that. A radio hop carries control across, and each side keeps its own bulk traffic local.',
      },
      {
        id: 'mode-lora-only',
        module: 'ch05',
        title: 'Radio only: what can still be sold at 5.4 kbps',
        duration: ms(14),
        terms: ['class-a', 'class-b', 'class-c', 'sf7', 'gfsk', 'duty-cycle'],
        caption:
          'Plain transactions need no internet protocol at all. A text page is stripped down in the cloud and arrives in twenty-two seconds, or under one second in the faster radio mode. Airtime rules bind this harder than speed does.',
      },
      {
        id: 'mode-outage-recovery',
        module: 'ch05',
        title: 'Full outage, and the recovery afterwards',
        duration: ms(14),
        terms: ['last-network', 'cumulative', 'settlement', 'demos'],
        caption:
          'The grid drops and both power-line carriers die together. In the simulation the radio carries the first bytes about eight tenths of a second later. When the link returns the waiting batch settles and nothing owed was lost.',
      },
      {
        id: 'mode-degrade',
        module: 'ch05',
        title: 'Degrade, do not die',
        duration: ms(11),
        terms: ['laws', 'free-lan', 'cumulative'],
        caption:
          'Every failure gets the same question: what stops, and what is still true afterwards. In every case the money layer is still true, because it never depended on the part that broke.',
      },
    ],
  },
  {
    id: 'attacks',
    n: 6,
    title: 'Attack vectors and defences',
    blurb: 'Ten scenarios, and the check that catches each one.',
    scenes: [
      {
        id: 'attack-replay',
        module: 'ch06',
        title: 'Replayed receipt',
        duration: ms(11),
        terms: ['law5', 'cumulative', 'ticket'],
        caption:
          'An old receipt is sent again to be paid twice. The counter has to move forward and the contract pays only the new part, so the second try is worth nothing and the call fails.',
      },
      {
        id: 'attack-forged-signature',
        module: 'ch06',
        title: 'Forged signature',
        duration: ms(11),
        terms: ['ed25519', 'secp256k1', 'eip712', 'node-id'],
        caption:
          'A ticket arrives with a signature the client never made. Working back from it gives a different address, so the ticket does not match its own signer and the whole batch fails.',
      },
      {
        id: 'attack-inflated-counter',
        module: 'ch06',
        title: 'Inflated byte counter',
        duration: ms(11),
        terms: ['law3', 'receipt', 'ed25519'],
        caption:
          'A node claims more bytes than it carried. There is no judgement call and no dispute: the number sits inside what the client signed, so raising it breaks the signature.',
      },
      {
        id: 'attack-double-spend',
        module: 'ch06',
        title: 'Double spend across several nodes',
        duration: ms(12),
        terms: ['law6', 'escrow', 'session-credit'],
        caption:
          'One balance is run against several nodes at once. Nothing goes short, because every settlement stops at what is left, and the node-side limit turns the worst case into one cap of bytes.',
      },
      {
        id: 'attack-rogue-relay',
        module: 'ch06',
        title: 'Rogue relay in the path',
        duration: ms(11),
        terms: ['node-operator', 'relayer', 'settlement'],
        caption:
          'A relay in the middle wants a cut. Payment follows the session, not the route: whoever held the session is owed, and the chain never checks a route at all.',
      },
      {
        id: 'attack-key-compromise',
        module: 'ch06',
        title: 'Key compromise, bounded by design',
        duration: ms(14),
        terms: ['bridge', 'kiosk-root-key', 'treasury', 'safe', 'ownable2step'],
        caption:
          'Each key is worth a stated maximum. A stolen bridge key leaks at most one day of its cap and can destroy nobody else balance. A stolen owner key can be expensive within limits, and can redirect nothing.',
      },
      {
        id: 'attack-frame-flood',
        module: 'ch06',
        title: 'Frame flood and corruption',
        duration: ms(11),
        terms: ['law8', 'crc16', 'frame'],
        caption:
          'Rubbish is pushed at the receiver as fast as the medium allows. The cheap checks run first, so the costly signature check is only spent on frames that could be real.',
      },
      {
        id: 'attack-chain-tamper',
        module: 'ch06',
        title: 'Tampering with the settled record',
        duration: ms(12),
        terms: ['law7', 'escrow', 'base', 'foundry'],
        caption:
          'The settled record is attacked directly. What the contract holds has to equal what it owes after every call, the fee is the exact sum of the tickets, and a fuzz run of 256 cases proves it.',
      },
      {
        id: 'attack-mac-spoof',
        module: 'ch06',
        title: 'Spoofing another device on the air',
        duration: ms(11),
        terms: ['node-id', 'ed25519', 'voucher'],
        caption:
          'A frame goes out under someone else name. The name comes from a key rather than a register, and anything carrying value is checked against the full key, so wearing a name buys nothing.',
      },
      {
        id: 'attack-sybil',
        module: 'ch06',
        title: 'Sybil nodes and beacon spam',
        duration: ms(11),
        terms: ['laws', 'node-id', 'free-lan'],
        caption:
          'Names are free, so ten thousand are made and all of them shout at once. Pay is per signed byte and never for being present, so the flood costs the attacker airtime and earns zero.',
      },
    ],
  },
  {
    id: 'economics',
    n: 7,
    title: 'Economics',
    blurb: 'The peg, the price, the operator return and the fee.',
    scenes: [
      {
        id: 'econ-peg',
        module: 'ch07',
        title: 'The peg is construction, not market making',
        duration: ms(12),
        terms: ['kes-peg', 'xkn', 'bridge', 'ukes', 'erc20'],
        caption:
          'There is no trading pool and no listing. Every token was made against a confirmed payment and is destroyed on the way out, so what exists matches the cash held at the bank.',
      },
      {
        id: 'econ-price',
        module: 'ch07',
        title: 'The price is a placeholder, and the floor is a formula',
        duration: ms(14),
        terms: ['price-floor', 'unit', 'ukes', 'backhaul'],
        caption:
          'Five hundred millionths of a shilling per ten kilobytes is a placeholder until it clears measured cost. The floor is cost per megabyte, scaled to the unit, divided by the share the operator keeps, adjusted by how much the cache serves.',
      },
      {
        id: 'econ-roi',
        module: 'ch07',
        title: 'Operator return, with every condition attached',
        duration: ms(14),
        terms: ['node-operator', 'estates', 'price-floor', 'base'],
        caption:
          'The model shows a five month payback in a town block and three at a rural post. Both assume a retail rate, a tenant spend and a cost nobody has measured. Until that measurement exists the honest answer is a range with an unknown floor.',
      },
      {
        id: 'econ-treasury',
        module: 'ch07',
        title: 'The treasury pays one address, and anyone can trigger it',
        duration: ms(13),
        terms: ['treasury', 'safe', 'msisdn', 'settlement'],
        caption:
          'The claim call sweeps the balance to one address and takes no destination, so a stolen owner key can redirect nothing. Changing that address takes seven public days, and the current holder can stop it.',
      },
    ],
  },
  {
    id: 'proof',
    n: 8,
    title: 'The proof matrix',
    blurb: 'What is already proven, by which command.',
    scenes: [
      {
        id: 'proof-matrix',
        module: 'ch08',
        title: 'Six commands anyone can run',
        duration: ms(15),
        terms: ['foundry', 'gateway-api', 'xkp', 'demos'],
        caption:
          'Contracts, gateway, protocol, six simulation runs, seventy-five firmware checks and one full loop against a real chain. Two of the headline numbers come from simulation, and they say so wherever they appear.',
      },
    ],
  },
  {
    id: 'roadmap',
    n: 9,
    title: 'Roadmap',
    blurb: 'Five phases, each with an entry and an exit condition.',
    scenes: [
      {
        id: 'roadmap',
        module: 'ch09',
        title: 'Bench, building, gates, board, factory',
        duration: ms(15),
        terms: ['demos', 'estates', 'cak', 'kebs', 'cbk', 'safe'],
        caption:
          'A phase starts because the one before it finished, not because a date arrived. The legal work runs alongside everything else rather than waiting its turn.',
      },
    ],
  },
  {
    id: 'closing',
    n: 10,
    title: 'Closing',
    blurb: 'What stands between here and a running pilot.',
    scenes: [
      {
        id: 'closing',
        module: 'ch10',
        title: 'Three things stand between here and a pilot',
        duration: ms(12),
        terms: ['demos', 'estates', 'price-floor'],
        caption:
          'A parts order that is already listed and priced. One building whose owner will take the box. And one measurement of what the internet link really costs, which every money claim is waiting on.',
      },
    ],
  },
];

/** Every scene in running order, chapter after chapter. */
export const SCENE_META = CHAPTERS.flatMap((chapter) =>
  chapter.scenes.map((scene) => ({ ...scene, chapter: chapter.id, chapterTitle: chapter.title })),
);

/** The index of the first scene of each chapter, for the chapter strip. */
export const CHAPTER_STARTS = (() => {
  const starts = {};
  let index = 0;
  for (const chapter of CHAPTERS) {
    starts[chapter.id] = index;
    index += chapter.scenes.length;
  }
  return starts;
})();

/** Total running time in milliseconds, with no pause between scenes. */
export function deckDuration() {
  return SCENE_META.reduce((sum, scene) => sum + scene.duration, 0);
}
