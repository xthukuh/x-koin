/*
 * Threat scenarios. Each card says what the attacker sends, which Law or check
 * catches it, what the system does about it, and where the evidence lives.
 *
 * Where the repository holds no evidence for a claim, the card says so in its
 * `gap` field rather than borrowing a number from somewhere else.
 */

import {
  CHAIN,
  SET_BRIDGE_TX,
  SRC,
  SETTLE_TX,
  TRACE,
  kes,
  num,
} from './data.js';

const s1 = TRACE.scenarios.s1;
const s2 = TRACE.scenarios.s2;

export const VERDICTS = {
  refuse: { label: 'refuses', tone: 'critical' },
  defend: { label: 'defends', tone: 'warn' },
  permit: { label: 'permits, bounded', tone: 'good' },
};

export const THREATS = [
  {
    id: 'replay-receipt',
    title: 'Replay a receipt that was already settled',
    attack:
      'The attacker captures a signed receipt off the wire and presents it again, or a node re-submits a ticket it already cashed.',
    payload: {
      ticket: SETTLE_TX.args.tickets[0],
      note: 're-sent unchanged, with the same valid client signature',
    },
    law: 'Law 5, replay pays nothing.',
    mechanism:
      'The frame layer dedupes on (src, seq). The escrow keeps a channel record of the last sequence and the settled units, and pays only the delta over what it already paid.',
    verdict: 'refuse',
    response:
      'The call reverts with StaleSequence, or NoNewUnits if a sequence is bumped without new units. The contract refuses loudly rather than paying zero quietly, so a relayer bug cannot hide.',
    evidence: [
      `${SRC.escrow}: "if (t.sequenceNumber <= ch.lastSequence) revert StaleSequence(i);" and "if (t.cumulativeUnits <= ch.settledUnits) revert NoNewUnits(i);"`,
      `${SRC.tests}: test_revert_staleSequence, test_revert_noNewUnits`,
      `${SRC.chain}: the settled channel state, sequence ${SETTLE_TX.args.tickets[0].sequenceNumber} and ${num(SETTLE_TX.args.tickets[0].cumulativeUnits)} units, is what a replay would have to beat`,
    ],
  },
  {
    id: 'forged-receipt',
    title: 'Forge a receipt with the wrong key',
    attack:
      'A node fabricates a receipt for a client that never signed one, signing it with a key of its own and setting the client id to the victim.',
    payload: {
      canonical_bytes: '<8s client_id><8s node_id><16s session><Q cumulative_bytes><I seq>',
      signature: '<64 bytes, produced by the attacker key rather than the client key>',
    },
    law: 'Law 4, a forged counter is a broken signature. Law 1, identity is the key.',
    mechanism:
      'receipt_from_wire verifies the Ed25519 signature over the 44 canonical bytes with the client public key, then checks that the client id inside the receipt equals the first 8 bytes of SHA-256 of that same key.',
    verdict: 'refuse',
    response:
      'ValueError("receipt signature invalid") if the signature does not verify, ValueError("client id does not match key") if a key is substituted to make it verify. There is no heuristic, no anomaly threshold and no dispute process.',
    evidence: [
      `${SRC.proofs}: receipt_from_wire, node_id_from_verify_key`,
      `${SRC.protoTests}: test_receipt_roundtrip_and_tamper`,
      `${SRC.paperSecurity} section 2, Law 4: fuzz and tamper tests, zero forgeries accepted`,
    ],
  },
  {
    id: 'inflated-counter',
    title: 'Inflate the cumulative counter',
    attack:
      'A node edits the cumulative_bytes field of a receipt the client really did sign, claiming more traffic than it carried.',
    payload: {
      before: { cumulative_bytes: s1.events[1][4] },
      after: { cumulative_bytes: s1.events[1][4] * 10 },
      signature: 'unchanged, because the attacker cannot produce a new one',
    },
    law: 'Law 4.',
    mechanism:
      'The signature covers the canonical bytes, and cumulative_bytes is one of them. Changing it changes the message the signature was made over.',
    verdict: 'refuse',
    response:
      'Verification fails at the node and, if the number reached a ticket instead, ECDSA.recover returns an address that is not the client and the batch reverts with BadSignature.',
    evidence: [
      `${SRC.proofs}: the receipt struct, RECEIPT_STRUCT, packs cumulative_bytes into the signed bytes`,
      `${SRC.escrow}: "if (ECDSA.recover(digest, sig) != t.client) revert BadSignature(i);"`,
      `${SRC.tests}: test_revert_forgedSignature`,
    ],
  },
  {
    id: 'double-spend-ticket',
    title: 'Double spend a ticket across two batches',
    attack:
      'The relayer submits the same ticket in two batches, or two relayers race with the same ticket, hoping the escrow pays twice.',
    payload: {
      batch_1: SETTLE_TX.args.tickets[0],
      batch_2: SETTLE_TX.args.tickets[0],
    },
    law: 'Law 5 and Law 7, the ledger cannot go insolvent.',
    mechanism:
      'Settlement writes ch.lastSequence and ch.settledUnits before it pays, inside a nonReentrant function. The second attempt sees its own first write.',
    verdict: 'refuse',
    response:
      'The second call reverts with StaleSequence. A ticket is worth its delta exactly once, whoever relays it.',
    evidence: [
      `${SRC.escrow}: channels mapping keyed by keccak256(client, nodeAdmin); ReentrancyGuard on settleTicketBatch`,
      `${SRC.tests}: test_settle_cumulativeDeltaAcrossBatches, test_settle_skippedIntermediateTicketLosesNothing, test_solvencyInvariant`,
      `${SRC.chain}: summary.solvency, "${CHAIN.summary.solvency}"`,
    ],
  },
  {
    id: 'rogue-satellite',
    title: 'A rogue Node-Satellite claims someone else earnings',
    attack:
      'A satellite in the relay path rewrites nodeAdmin to its own address so the transit it merely forwarded pays it instead of the node that held the session.',
    payload: {
      relayed_ticket: SETTLE_TX.args.tickets[1],
      tampered_field: 'nodeAdmin',
    },
    law: 'Law 4 applied to attribution.',
    mechanism:
      'nodeAdmin is inside the struct the client signs. Changing it changes the EIP-712 digest, so the recovered signer stops being the client. The escrow has no idea a mesh exists: it sees two addresses, a sequence and a unit count.',
    verdict: 'refuse',
    response:
      'BadSignature. The honest case is in the proof run: the satellite served a client over LoRa and earned ' +
      kes(CHAIN.escrow_state.earnings.satellite) +
      ' because the client signed a ticket naming it, not because it sat in the path.',
    evidence: [
      `${SRC.escrow}: TICKET_TYPEHASH includes nodeAdmin; earnings credit goes to t.nodeAdmin only after recovery matches t.client`,
      `${SRC.trace} scenarios.s3.summary.earner: "${TRACE.scenarios.s3.summary.earner}"`,
      `${SRC.chain}: tickets[1], the satellite channel, ${num(SETTLE_TX.args.tickets[1].cumulativeUnits)} units`,
    ],
    gap:
      'There is no test in the repository named for this attack. The mechanism is the same signature check that test_revert_forgedSignature covers, applied to a different field; a dedicated rogue relay test does not exist.',
  },
  {
    id: 'hot-key',
    title: 'The bridge hot key is stolen',
    attack:
      'An attacker takes the server and the bridge private key with it, then mints unbacked XKN and tries to burn balances belonging to users.',
    payload: {
      call: 'bridgeMint(attacker, <as much as possible>, <any fiatRef>)',
      second_call: 'bridgeBurn on a victim balance',
    },
    law: 'Bounded hot keys. The blast radius table in the security paper.',
    mechanism:
      'bridgeMint is capped per rolling day per bridge, and the cap is on chain. bridgeBurn burns from the caller balance only, so third party balances are unburnable by construction. Owner revokes with setBridge(addr, false, 0).',
    verdict: 'permit',
    response: `At most ${kes(SET_BRIDGE_TX.args.dailyMintCap)} of unbacked XKN in a rolling day, then MintCapExceeded. Not one user balance can be destroyed. Separately, the escrow caps every settlement at the client remaining deposit, so no amount of minting lets anyone be paid more than was escrowed.`,
    evidence: [
      `${SRC.chain}: setBridge args.dailyMintCap = ${num(SET_BRIDGE_TX.args.dailyMintCap)} micro-KES`,
      `${SRC.token}: the BridgeInfo rolling window, MintCapExceeded, and _burn(msg.sender, amount)`,
      `${SRC.tests}: test_mintCap_rollingDay, test_bridgeMintBurn_selfOnly, testFuzz_settleNeverExceedsDeposit (256 runs)`,
    ],
  },
  {
    id: 'frame-flood',
    title: 'Flood the node with malformed frames',
    attack:
      'Garbage and bit-flipped frames are poured onto the power line and the radio to exhaust the node verification budget.',
    payload: {
      mutated_frames: 20000,
      random_blobs: 20000,
      mutation: '1 to 4 random bit flips in a valid DATA frame',
    },
    law: 'Law 8, corruption dies at the frame.',
    mechanism:
      'Magic, version, type, length and CRC16-CCITT are checked in that order before any cryptography runs. Rejecting a damaged frame costs microseconds; verifying a signature does not.',
    verdict: 'defend',
    response:
      'Zero of 20,000 garbage frames accepted. The stated limit is honest: CRC16 has a residual collision probability, so a corrupted frame can in principle pass the frame check, and it still carries no value because the receipt inside has to verify under Law 4.',
    evidence: [
      `${SRC.runSim}: s5_fuzz(n=20_000) mutates valid frames and then feeds 20,000 random blobs, counting false_accepts and garbage_accepts`,
      `${SRC.frames}: unpack rejects on bad magic, unsupported version, unknown frame type, length mismatch, crc mismatch`,
      `${SRC.paperSecurity} section 2 and ${SRC.paperProtocol} section 12: 0 of 20,000 accepted`,
    ],
    gap:
      'The 0 of 20,000 figure is reported in the papers and produced by the function named above. The repository ships no results file for the S5 run, so this page cites the source and the papers rather than a machine-readable artifact.',
  },
  {
    id: 'grid-cut',
    title: 'The grid or the backhaul is cut',
    attack:
      'Not an attacker at all, but the failure that matters most: mains power drops and the broadband power line carrier dies mid transfer.',
    payload: {
      scenario: s2.title,
      cut_at_s: s2.events.find((event) => event[1] === 'cut')[0],
      recovered_at_s: s2.events.find((event) => event[1] === 'recovered')[0],
    },
    law: 'Degrade, do not die. Medium scoring and quarantine.',
    mechanism:
      'Senders score live mediums by goodput and loss and fail over to the LoRa survival plane. Receipts keep flowing because a 108 byte receipt fits the slowest medium in the system.',
    verdict: 'defend',
    response: `The transfer completed. Failover took ${(s2.summary.failover_ms / 1000).toFixed(2)} s, post-blackout goodput was ${s2.summary.post_blackout_goodput.toFixed(0)} bps, ${num(s2.summary.lora_app_bytes)} bytes moved over LoRa, ${s2.summary.heartbeats_acked} heartbeats were acknowledged, ${s2.summary.receipts_verified} receipts verified and ${num(s2.summary.delivered_bytes)} bytes delivered.`,
    evidence: [
      `${SRC.trace} scenarios.s2.summary and its cut and recovered events`,
      `${SRC.sim}: medium scoring, goodput_ewma * (1 - loss_ewma), quarantine after 3 consecutive failures`,
      `${SRC.paperArch}: backhaul down row, free LAN continues and admission continues because vouchers verify offline`,
    ],
  },
  {
    id: 'chain-tamper',
    title: 'Tamper with the settled record',
    attack:
      'Someone with the owner key, or the server, tries to rewrite what a channel already settled, redirect the fee, or halt settlement.',
    payload: {
      attempted: ['rewrite channels[client, nodeAdmin]', 'claim(token) to an address of choice', 'pause settlement'],
      available_functions: ['setPricePerUnit within band and cooldown', 'setFeeBps under the cap', 'setBridge', 'queueBeneficiary'],
    },
    law: 'The contracts are the final arbiter.',
    mechanism:
      'There is no setter for channels, deposits or earnings anywhere in the escrow. claim() takes a token and no destination. Governance is banded: price between PRICE_MIN and PRICE_MAX with a one day cooldown, fee under a 1000 bps ceiling, beneficiary behind a 7 day timelock the current beneficiary can veto.',
    verdict: 'refuse',
    response:
      'A stolen owner key yields bounded griefing and nothing else: expensive within the band, once a day, never halted, never redirected. In the proof run a claim was triggered and moved ' +
      kes(CHAIN.summary.founder_claimed_ukes) +
      ' to the beneficiary, which is the only place it could go.',
    evidence: [
      `${SRC.escrow}: the only state writers are deposit, withdrawDeposit, settleTicketBatch, claimEarnings and setPricePerUnit`,
      `${SRC.treasury}: claim(IERC20 token) sweeps to beneficiary, "the destination is not a parameter by design"`,
      `${SRC.tests}: test_stolenOwnerKeyCannotRedirectFees, test_claim_anyoneCanPayOnlyTheFounder, test_setPricePerUnit_bandAndCooldown, test_revert_feeAboveCeiling`,
      `${SRC.chain}: summary.claim_property, "${CHAIN.summary.claim_property}"`,
    ],
  },
  {
    id: 'mac-spoof',
    title: 'Spoof another client MAC address to get in free',
    attack:
      'A device copies an admitted client MAC or IP on the local network and tries to ride its admission out to the WAN.',
    payload: {
      spoofed: 'link layer address of an admitted client',
      not_spoofable: ['the client Ed25519 key', 'the session nonce issued in JOIN_ACK', 'the client EVM key that signs tickets'],
    },
    law: 'Law 1 and Law 2. Identity is the key, and admission needs a fiat-backed voucher.',
    mechanism:
      'Admission binds to a voucher naming a client address and to an Ed25519 key whose hash is the node id in every frame. Receipts must verify against that key, and the session nonce fixed at admission is inside every receipt.',
    verdict: 'refuse',
    response:
      'A spoofed link layer address buys nothing, because the thing that keeps traffic flowing is a stream of receipts only the real key can sign. The gate stops passing WAN traffic within two receipt intervals.',
    evidence: [
      `${SRC.proofs}: the client id check inside receipt_from_wire`,
      `${SRC.classifier}: xkp_gate_allow_wan requires admitted and a bounded unproven balance`,
      `${SRC.paperSecurity} section 2, Laws 1 and 2`,
    ],
    gap:
      'No test in the repository exercises link layer spoofing, and the captive portal that would perform the local association is marked compile-untested in firmware/xkoin-gateway/lib/wifi_ap. The argument here is structural, from the code above, and is not backed by a run.',
  },
  {
    id: 'no-receipts',
    title: 'Take the service and never sign a receipt',
    attack: 'A client attaches, pulls traffic, and simply never returns a signed receipt.',
    payload: {
      delivered_bytes: 'rising',
      proven_bytes: 'frozen at the last signed value',
      gate: 'unproven <= 2 * receipt_interval',
    },
    law: 'Law 3, only signed bytes are owed.',
    mechanism:
      'The node extends at most twice the receipt interval of unproven credit, then throttles and drops. The exposure is set in bytes, not in trust.',
    verdict: 'permit',
    response: `Bounded theft of at most two intervals. Scenario S1 measures the real high water mark at ${num(s1.summary.max_unproven_bytes)} bytes against a ${num(1000000)} byte interval, with ${s1.summary.receipts_verified} of ${s1.summary.receipts_sent} receipts verified.`,
    evidence: [
      `${SRC.classifier}: xkp_gate_allow_wan`,
      `${SRC.trace} scenarios.s1.summary.max_unproven_bytes`,
      `${SRC.paperProtocol} section 5, the 2x interval credit rule`,
    ],
  },
  {
    id: 'sybil',
    title: 'Flood the mesh with Sybil beacons',
    attack: 'Hundreds of fake node identities beacon constantly, hoping presence alone earns something.',
    payload: {
      frames: 'BEACON, type 0, broadcast destination 0xFF * 8',
      cost_to_attacker: 'airtime and power',
    },
    law: 'Pay is per verified signed byte, never for presence.',
    mechanism:
      'Discovery earns nothing by design. There is no reward path that a beacon can reach: value moves only when a client-signed ticket settles.',
    verdict: 'defend',
    response:
      'Exactly zero revenue for the attacker. The cost is airtime on the attacker side and frame filtering on the node side, which is the cheap half of the work.',
    evidence: [
      `${SRC.frames}: FrameType.BEACON carries presence and medium hints only`,
      `${SRC.escrow}: the only path to earnings is settleTicketBatch with a valid client signature`,
      `${SRC.paperSecurity} section 2, the economic summary, and section 7 Sybil beacons row`,
    ],
  },
];
