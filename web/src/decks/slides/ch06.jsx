import { AttackSlide } from './parts.jsx';

/**
 * Chapter 6. Ten scenarios, each with the check that catches it.
 *
 * Every scene uses the same template on purpose: the attempt on the left, the
 * check on the right, the Law and its test underneath. The reader learns the
 * shape once and then reads only what changed, which is the point of stating a
 * threat model as invariants rather than as a catalogue.
 */

function Replay({ t }) {
  return (
    <AttackSlide
      t={t}
      n={1}
      title="Replayed receipt"
      lede="An old receipt or an old ticket is presented a second time, in the hope of being paid for the same bytes twice."
      attempt={[
        'capture a signed receipt off the wire, or keep a settled ticket',
        'present it again to the same node, or relay it again to the chain',
      ]}
      defence={[
        'the receiver dedupes by source and sequence at the frame layer',
        'the on-chain sequence must be strictly greater than the channel last',
        'the contract pays the delta over settled units, so the delta is zero',
        'a zero delta reverts rather than paying nothing quietly',
      ]}
      law="Law 5, replay pays nothing"
      test="test_revert_staleSequence, test_revert_noNewUnits"
    />
  );
}

function ForgedSignature({ t }) {
  return (
    <AttackSlide
      t={t}
      n={2}
      title="Forged signature"
      lede="A ticket or a receipt is submitted carrying a signature the named party never produced."
      attempt={[
        'build a ticket naming a wealthy client and a chosen operator address',
        'sign it with any key at all and relay the batch',
      ]}
      defence={[
        'typed-data recovery returns the address that actually signed',
        'it does not match the client named in the ticket, and the call reverts',
        'the whole batch reverts, because one bad ticket on chain is a bug or an attack',
        'at the edge the client id must equal the first 8 bytes of SHA-256 over the verifying key',
      ]}
      law="Law 4, a forged counter is a broken signature"
      test="test_revert_forgedSignature"
      earns="nothing, short of breaking secp256k1"
    />
  );
}

function InflatedCounter({ t }) {
  return (
    <AttackSlide
      t={t}
      n={3}
      title="Inflated byte counter"
      lede="A node claims it carried more bytes for a client than it actually did."
      attempt={[
        'take the client last honest receipt and raise the cumulative figure',
        'settle the higher number and keep the difference',
      ]}
      defence={[
        'the counter is inside the bytes the client signed, so raising it breaks the signature',
        'there is no heuristic, no anomaly threshold and no dispute process',
        'the receipt either verifies against the client public key or it does not',
        'substituting a different key fails too, because the id is derived from the key',
      ]}
      law="Law 4, and Law 3 bounds what is unproven"
      test="the fuzz and tamper suites, zero forgeries accepted"
    />
  );
}

function DoubleSpend({ t }) {
  return (
    <AttackSlide
      t={t}
      n={4}
      title="Double spend across several nodes"
      lede="One deposit is global and readable by every node, so a client attaches to several at once and runs all of them."
      attempt={[
        'attach to three nodes with the same key and the same deposit',
        'consume the full balance on each of them in parallel',
      ]}
      defence={[
        'every settlement is capped at the deposit that actually remains',
        'the ledger cannot go insolvent: the worst case is an underpaid node, never a short contract',
        'the node-side session credit limit turns that worst case into one cap of bytes',
        'the unproven credit bound narrows it again, to twice a receipt interval',
      ]}
      law="Law 6, nobody is owed more than they escrowed"
      test="testFuzz_settleNeverExceedsDeposit, 256 runs"
      earns="one cap of bytes, bounded and tuneable"
    />
  );
}

function RogueRelay({ t }) {
  return (
    <AttackSlide
      t={t}
      n={5}
      title="Rogue relay in the path"
      lede="A device in the middle of the route demands a share of the payment, or fabricates a route to claim one."
      attempt={[
        'sit between a client and the gateway and claim to be part of the path',
        'fabricate a longer path so more parties appear to be owed',
      ]}
      defence={[
        'payment follows the session, not the route: the device that held the session is owed',
        'the escrow verifies no path at all, because a path is the cheapest thing to fabricate',
        'a frame passing through three devices does not split the payment three ways',
        'scenario S3 exercises the case where the satellite, not the gateway, is the party credited',
      ]}
      law="the reward layer, paper 03 section 6"
      test="scenario S3, satellite relay"
    />
  );
}

function KeyCompromise({ t }) {
  return (
    <AttackSlide
      t={t}
      n={6}
      title="Key compromise, bounded in advance"
      lede="Every key in the system is worth a stated maximum, and the maximum is enforced on chain rather than by policy."
      attempt={[
        'steal the bridge hot key from the server and mint without a payment',
        'steal the owner key and redirect the fee, or halt the network',
        'steal the kiosk root key and admit whoever you like',
      ]}
      defence={[
        'the bridge mint is capped per rolling day, and the burn takes no account parameter',
        'the claim call has no destination parameter at all, so fees can only reach the beneficiary',
        'the price moves within a band once a day, and the fee has a ceiling in the contract',
        'a stolen kiosk key gives free admission and moves no funds, because balances need on-chain signatures',
      ]}
      law="the founder-safety layer, paper 10 section 4"
      test="test_mintCap_rollingDay, test_stolenOwnerKeyCannotRedirectFees"
      earns="at most one rolling day of the bridge cap"
    />
  );
}

function FrameFlood({ t }) {
  return (
    <AttackSlide
      t={t}
      n={7}
      title="Frame flood and corruption"
      lede="Garbage is pushed at the codec as fast as the medium allows, to exhaust the verification budget."
      attempt={[
        'transmit random and near-valid frames continuously on any medium',
        'force a signature verification for every one of them',
      ]}
      defence={[
        'magic, then length, then the CRC, all before any cryptography',
        'rejecting a damaged frame costs microseconds; verification costs milliseconds',
        'the fuzz presented 20,000 corrupted and random frames and the codec accepted none',
        'a CRC collision still cannot carry value, because the receipt inside must verify',
      ]}
      law="Law 8, corruption dies at the frame"
      test="scenario S5, 0 of 20,000 accepted"
      earns="airtime and CPU spent, no revenue"
    />
  );
}

function ChainTamper({ t }) {
  return (
    <AttackSlide
      t={t}
      n={8}
      title="Tampering with the settled record"
      lede="The settled state is attacked directly: rewind a channel, inflate earnings, or drain the contract."
      attempt={[
        'replay a settled batch to be credited again',
        'submit a batch whose fee arithmetic does not match its tickets',
        'claim earnings that were never credited',
      ]}
      defence={[
        'channel state keeps the last sequence and the settled unit count, keyed by client and operator',
        'the fee moved is the exact sum of per-ticket amounts, never recomputed on the gross',
        'the escrow balance must equal deposits plus earnings after every call',
        'the invariant is asserted by a 256-run fuzz and again in the end-to-end chain proof',
      ]}
      law="Law 7, the ledger cannot go insolvent"
      test="test_solvencyInvariant, plus the end-to-end assertion"
    />
  );
}

function MacSpoof({ t }) {
  return (
    <AttackSlide
      t={t}
      n={9}
      title="Spoofing another device on the air"
      lede="A frame is sent claiming another device identity, on a medium where anybody can transmit."
      attempt={[
        'copy a node id out of a frame header and send frames under it',
        'find two keys whose truncated hash collides on the same 8 byte id',
      ]}
      defence={[
        'the id is derived from a public key rather than assigned, so there is no registry to fool',
        'anything carrying value is verified against the full public key, not the id',
        'a collision on 8 bytes is a 2^-64 target and buys nothing once found',
        'admission still needs a voucher signed by a key the attacker does not hold',
      ]}
      law="Law 1, identity is the key"
      test="test_receipt_roundtrip_and_tamper"
    />
  );
}

function Sybil({ t }) {
  return (
    <AttackSlide
      t={t}
      n={10}
      title="Sybil nodes and beacon spam"
      lede="Identities are free, so ten thousand are created and all of them announce themselves at once."
      attempt={[
        'generate identities without limit, since there is no registration anywhere',
        'beacon from all of them to look like a large and useful mesh',
      ]}
      defence={[
        'discovery is free and earns nothing, by design rather than by accident',
        'pay is strictly per verified signed byte and never for presence',
        'a flood produces no settlement path, so the cost is the attacker own airtime',
        'the free plane is unaffected, because nothing on it was ever metered',
      ]}
      law="the economic reading of the eight Laws"
      test="scenario S5, and the Law 3 bound"
    />
  );
}

export const SCENES = {
  'attack-replay': Replay,
  'attack-forged-signature': ForgedSignature,
  'attack-inflated-counter': InflatedCounter,
  'attack-double-spend': DoubleSpend,
  'attack-rogue-relay': RogueRelay,
  'attack-key-compromise': KeyCompromise,
  'attack-frame-flood': FrameFlood,
  'attack-chain-tamper': ChainTamper,
  'attack-mac-spoof': MacSpoof,
  'attack-sybil': Sybil,
};
