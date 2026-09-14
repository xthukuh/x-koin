/*
 * The six journeys, each one a list of stages with the evidence attached.
 *
 * Rule for this file: a value shown as proof is read from the proof JSON, from
 * a contract, from the protocol reference implementation or from a paper, and
 * every step names the file. Where a field does not exist in the repository it
 * is described in words inside angle brackets rather than invented, and the
 * step says so.
 */

import { ms } from '../player/index.js';

import {
  BATCH_SETTLED,
  CHAIN,
  CLAIM_TX,
  DEPLOY_GAS,
  DEPLOY_TXS,
  DEPOSIT_TX,
  GAS_TXS,
  KIOSK,
  MINT_TX,
  S1,
  S1_RECEIPTS,
  S1_UNITS,
  SET_BRIDGE_TX,
  SETTLE_TX,
  SRC,
  TICKET_SETTLED,
  kes,
  num,
} from './data.js';

export const LAYERS = {
  device: {
    label: 'device',
    color: 'var(--xk-ink)',
    note: 'Hardware at the edge: the handset, the gateway board, the satellite.',
  },
  protocol: {
    label: 'protocol',
    color: 'var(--xk-accent)',
    note: 'XKP frames, vouchers, signed receipts. Works with the backhaul down.',
  },
  chain: {
    label: 'chain',
    color: 'var(--xk-money)',
    note: 'Contracts, calls and events. The only place value actually moves.',
  },
  fiat: {
    label: 'fiat',
    color: 'var(--xk-good)',
    note: 'M-Pesa Daraja and Equitel Jenga. The layer name kiosk.json uses.',
  },
  kiosk: {
    label: 'kiosk',
    color: 'var(--xk-faint)',
    note: 'The gateway-api service itself: vouchers, pending orders, ledger rows.',
  },
};

export const MEDIUMS = [
  {
    id: 'homeplug',
    label: 'HomePlug AV',
    color: 'var(--xk-plc)',
    note: 'Broadband power line, about 10 Mbps, 1400 B payload.',
  },
  {
    id: 'kq130f',
    label: 'KQ-130F',
    color: 'var(--xk-nbplc)',
    note: 'Narrowband power line, about 960 B/s, 128 B payload. A receipt fits one frame.',
  },
  {
    id: 'lora-sf7',
    label: 'LoRa SF7',
    color: 'var(--xk-lora)',
    note: 'Radio survival plane, about 5.4 kbps, 226 B payload.',
  },
];

const daraja = KIOSK.journeys.find((journey) => journey.id === 'buy_gas_mpesa_daraja');
const payout = KIOSK.journeys.find((journey) => journey.id === 'fee_payout');
const voucherBundle = daraja.steps[4].evidence.response.body.voucher;

const CLASSIFIER_CODE = `bool xkp_ip_is_lan(uint32_t ip) {
    if ((ip >> 24) == 10) return true;                       // 10/8
    if ((ip >> 24) == 127) return true;                      // loopback
    if ((ip >> 20) == 0xAC1) return true;                    // 172.16/12
    if ((ip >> 16) == 0xC0A8) return true;                   // 192.168/16
    if ((ip >> 16) == 0xA9FE) return true;                   // 169.254/16 link-local
    if ((ip >> 28) == 0xE) return true;                      // 224/4 multicast
    if (ip == 0xFFFFFFFFu) return true;                      // broadcast
    return false;
}

bool xkp_gate_allow_wan(const xkp_session_t *s) {
    if (!s->admitted) return false;
    uint64_t unproven = s->delivered_bytes - s->proven_bytes;
    return unproven <= (uint64_t)2 * s->receipt_interval;
}`;

const FRAME_CODE = `offset size  field
0      2     magic 0x4B58 ("XK")
2      1     version (high nibble) | type (low nibble)
3      1     flags: bit0 ACK_REQ, bit1 ENCRYPTED, bit2 FRAGMENT
4      1     ttl (hops remaining, decremented per relay)
5      8     src node id  (first 8 bytes of SHA-256 of the Ed25519 pubkey)
13     8     dst node id  (0xFF * 8 = broadcast)
21     4     seq (per-src monotonic)
25     2     payload length N
27     N     payload
27+N   2     CRC16-CCITT (poly 0x1021, init 0xFFFF) over bytes 0 .. 27+N-1`;

const RECEIPT_CODE = `RECEIPT_STRUCT = struct.Struct("<8s8s16sQI")  # 44 bytes
RECEIPT_WIRE_SIZE = RECEIPT_STRUCT.size + 64   # 108 bytes on the wire

def node_id_from_verify_key(vk: bytes) -> bytes:
    """8-byte node id = first 8 bytes of SHA-256 of the Ed25519 public key."""
    return hashlib.sha256(vk).digest()[:8]`;

const TICKET_CODE = `TICKET_TYPES = {
    "Ticket": [
        {"name": "client", "type": "address"},
        {"name": "nodeAdmin", "type": "address"},
        {"name": "sequenceNumber", "type": "uint64"},
        {"name": "cumulativeUnits", "type": "uint128"},
        {"name": "epochExpiry", "type": "uint256"},
    ]
}

domain = {"name": "xKoinEscrow", "version": "1",
          "chainId": ${CHAIN.chain_id}, "verifyingContract": "${CHAIN.contracts.escrow}"}`;

const SETTLE_CHECKS_CODE = `if (t.epochExpiry < block.timestamp) revert ExpiredTicket(i);

bytes32 channelId = keccak256(abi.encodePacked(t.client, t.nodeAdmin));
Channel storage ch = channels[channelId];
if (t.sequenceNumber <= ch.lastSequence) revert StaleSequence(i);
if (t.cumulativeUnits <= ch.settledUnits) revert NoNewUnits(i);
...
if (ECDSA.recover(digest, sig) != t.client) revert BadSignature(i);

uint128 deltaUnits = t.cumulativeUnits - ch.settledUnits;
uint256 owed = uint256(deltaUnits) * pricePerUnit;
uint256 available = deposits[t.client];
paid = owed <= available ? owed : available;`;

/* -------------------------------------------------- kiosk journey adapter */

/**
 * Turns a kiosk.json journey into page steps. The action text and the payload
 * are the file's own; the annotations argument adds the field notes, the
 * crypto check and the contract call for each step number.
 */
function fromKiosk(journey, annotations) {
  return journey.steps.map((step) => {
    const extra = annotations[step.n] ?? {};
    return {
      n: step.n,
      actor: step.actor,
      layer: step.layer,
      action: step.action,
      proof: {
        payload: step.evidence,
        fields: extra.fields ?? [],
        check: extra.check ?? null,
        contract: extra.contract ?? null,
        source: extra.source ?? `${SRC.kiosk} journeys[${journey.id}].steps[${step.n}].evidence`,
      },
    };
  });
}

/* ------------------------------------------------------------- journey 1 */

const nodeSetup = {
  id: 'node-setup',
  title: 'A node is set up',
  lede:
    'Before a single byte is sold: one key per role, three contracts, a bridge allowlisted with a daily ceiling, and a firmware gate that separates free local traffic from metered transit.',
  animation: {
    duration: ms(10),
    actors: [
      { id: 'founder', label: 'Founder', layer: 'device' },
      { id: 'chain', label: 'Base chain', layer: 'chain' },
      { id: 'node', label: 'Gateway node', layer: 'device' },
    ],
    hops: [
      { from: 'founder', to: 'chain', label: 'deploy token, treasury, escrow', check: 'owner set, price 500, fee 500 bps' },
      { from: 'founder', to: 'chain', label: 'setBridge(bridge, true, cap)', check: 'BridgeSet, 50,000 KES per day' },
      { from: 'founder', to: 'chain', label: 'fund relayer and client with gas', check: '1 ETH each' },
      { from: 'founder', to: 'node', label: 'kiosk root public key into firmware', check: 'offline admission ready' },
      { from: 'founder', to: 'node', label: 'LAN free, WAN metered, 2x credit bound', check: 'gate armed' },
    ],
  },
  steps: [
    {
      n: 1,
      actor: 'founder',
      layer: 'device',
      action: 'One address per role is generated. A key that does two jobs has two ways to be lost.',
      proof: {
        payload: { contracts: CHAIN.contracts, actors: CHAIN.actors, chain_id: CHAIN.chain_id },
        fields: [
          ['actors.owner', 'Governs price, fee and the bridge allowlist. Cannot touch deposits.'],
          ['actors.bridge', 'Hot key. Mints against confirmed fiat, burns only its own balance.'],
          ['actors.relayer', 'Hot key with no privilege at all. Submits ticket batches and pays gas.'],
          ['actors.beneficiary', 'The only address treasury.claim() can pay. Cold key.'],
          ['chain_id', 'The proof run is a local chain. The production target is Base.'],
        ],
        check: {
          verifies:
            'The mesh identity is separate from all of these. A node id is the first 8 bytes of SHA-256 of an Ed25519 public key, so there is no account table to enrol in and nothing to register.',
          tamper:
            'Sharing one key across roles is the failure this step exists to prevent; the relayer is split from the bridge so a leaked relayer key costs only the gas in it.',
        },
        source: `${SRC.chain} (contracts, actors) and ${SRC.paperSecurity} section 5, key hierarchy`,
      },
    },
    {
      n: 2,
      actor: 'deployer',
      layer: 'chain',
      action: `Token, treasury and escrow deploy in blocks 1 to 3, ${num(DEPLOY_GAS)} gas including the bridge call.`,
      proof: {
        payload: DEPLOY_TXS.map((tx) => ({
          block: tx.block,
          fn: tx.fn,
          gas_used: tx.gas_used,
          hash: tx.hash,
          events: tx.logs.map((log) => ({ event: log.event, args: log.args, contract: log.contract })),
        })),
        fields: [
          ['fn', 'create: the constructor run. Three contracts, three blocks.'],
          ['events.FeeBpsSet', `${CHAIN.params.fee_bps} basis points, which is 5 percent, set in the treasury constructor.`],
          ['events.PricePerUnitSet', `${CHAIN.params.price_per_unit_ukes} micro-KES per ${num(CHAIN.params.unit_bytes)} byte unit, set in the escrow constructor.`],
          ['events.BeneficiaryChanged', 'The address claim() will pay for the life of the contract unless a 7 day timelock moves it.'],
        ],
        contract: {
          call: 'constructor(token, treasury, pricePerUnit, initialOwner)',
          event: 'OwnershipTransferred, FeeBpsSet, BeneficiaryChanged, PricePerUnitSet',
          reverts: 'PriceOutOfBand if the price is outside 1 to 50,000; FeeTooHigh above 1000 bps; ZeroAddress for a null beneficiary.',
        },
        source: `${SRC.chain} txs blocks 1 to 3; ${SRC.escrow}, ${SRC.token}, ${SRC.treasury}`,
      },
    },
    {
      n: 3,
      actor: 'owner',
      layer: 'chain',
      action:
        'The bridge is allowlisted with a rolling daily mint cap. This is the ceiling on what a stolen server key can create.',
      proof: {
        payload: {
          block: SET_BRIDGE_TX.block,
          fn: SET_BRIDGE_TX.fn,
          args: SET_BRIDGE_TX.args,
          gas_used: SET_BRIDGE_TX.gas_used,
          event: SET_BRIDGE_TX.logs[0],
        },
        fields: [
          ['args.dailyMintCap', `${num(SET_BRIDGE_TX.args.dailyMintCap)} micro-KES, which is ${kes(SET_BRIDGE_TX.args.dailyMintCap)} of unbacked XKN per rolling day at worst.`],
          ['args.allowed', 'setBridge(addr, false, 0) revokes it in one transaction.'],
        ],
        contract: {
          call: 'xKoinToken.setBridge(address bridge, bool allowed, uint128 dailyMintCap) onlyOwner',
          event: 'BridgeSet(bridge, allowed, dailyMintCap)',
          reverts: 'NotBridge for a mint from any other address; MintCapExceeded once the rolling window total passes the cap.',
        },
        source: `${SRC.chain} txs block 3 index 1; ${SRC.token} setBridge and bridgeMint`,
      },
    },
    {
      n: 4,
      actor: 'deployer',
      layer: 'chain',
      action: 'The client and the relayer are funded with native gas so they can transact at all.',
      proof: {
        payload: GAS_TXS.map((tx) => ({
          block: tx.block,
          to: tx.to,
          value_wei: tx.value_wei,
          gas_used: tx.gas_used,
        })),
        fields: [
          ['value_wei', '1 ETH each on the local proof chain. On Base the same two wallets hold days of gas, not months.'],
          ['to.name', 'The client is funded here only because this run has the client call approve and deposit directly. Production relays an EIP-2612 permit so the client needs no gas.'],
        ],
        source: `${SRC.chain} txs blocks 4 and 5; ${SRC.escrow} depositWithPermit`,
      },
    },
    {
      n: 5,
      actor: 'node',
      layer: 'device',
      action:
        'The metering gate is compiled into the node: local traffic is free, transit is metered, and unproven credit is bounded at twice the receipt interval.',
      proof: {
        code: { lang: 'c', text: CLASSIFIER_CODE },
        fields: [
          ['xkp_ip_is_lan', 'Everything inside RFC 1918, loopback, link local, multicast and broadcast is free. Neighbours talking to neighbours costs nobody anything.'],
          ['xkp_gate_allow_wan', 'Transit requires admission and requires the client to be current on receipts. This is Law 3 in eleven lines.'],
          ['2 * receipt_interval', 'The whole exposure a node carries to a dishonest client, measured in bytes rather than in trust.'],
        ],
        check: {
          verifies: 'The gate runs on the node with no network access. A node whose backhaul is down still enforces it.',
          tamper:
            'A client that stops signing receipts crosses the bound within two intervals and is throttled, then dropped.',
        },
        source: `${SRC.classifier}`,
        gap:
          'The brief expected an iptables rule set. There is none in this repository. The enforcement that exists is the C gate above, compiled into the ESP32-S3 firmware. An OpenWrt tier where the co-processor tells iptables or nftables which client may reach the WAN is recorded as a design decision only, in ' +
          SRC.decisions +
          ', decision point 2. Nothing in the repository implements it yet.',
      },
    },
    {
      n: 6,
      actor: 'node',
      layer: 'chain',
      action:
        'The node is not registered anywhere. A node admin is an address that appears in a client-signed ticket, and that is the whole enrolment.',
      proof: {
        payload: {
          registry_contract: null,
          node_admin_of_record: TICKET_SETTLED.map((log) => log.nodeAdmin),
          becomes_real_at: 'the first settleTicketBatch that carries the address',
        },
        fields: [
          ['registry_contract', 'There is no register function and no node table in any of the three contracts.'],
          ['node_admin_of_record', 'These two addresses earned in this run purely because clients signed tickets naming them.'],
        ],
        check: {
          verifies:
            'The escrow reads nodeAdmin out of a ticket the client signed. A node cannot write itself into a channel; only a client signature can put an address there.',
        },
        source: `${SRC.escrow} (no registry exists) and ${SRC.chain} tickets`,
        gap:
          'The brief asked for a node registration step. There is no such transaction in the proof run and no contract function to make one, so this step states the absence instead of showing a payload.',
      },
    },
  ],
};

/* ------------------------------------------------------------- journey 2 */

const onboard = {
  id: 'onboard',
  title: 'A client onboards and attaches',
  lede:
    'Admission is offline by requirement, not by optimisation. The node verifies a kiosk-signed voucher against a public key held in its own firmware, with no network of any kind.',
  animation: {
    duration: ms(9),
    actors: [
      { id: 'client', label: 'Client', layer: 'device' },
      { id: 'node', label: 'Gateway node', layer: 'device' },
    ],
    hops: [
      { from: 'client', to: 'node', label: 'BEACON heard on LoRa and PLC', check: 'discovery is free and earns nothing' },
      { from: 'client', to: 'node', label: 'JOIN_REQ carries the gas voucher', check: '96 B on the wire in the simulator' },
      { from: 'node', to: 'node', label: 'Ed25519 verify against the firmware key', check: `admission measured at ${S1.summary.admission_ms.toFixed(2)} ms` },
      { from: 'node', to: 'client', label: 'JOIN_ACK with a 16 byte session nonce', check: 'every receipt in the session binds to it' },
    ],
  },
  steps: [
    {
      n: 1,
      actor: 'client',
      layer: 'device',
      action:
        'The client holds two keys derived from one seed: an EVM key that signs tickets, and an Ed25519 key whose hash is its mesh identity.',
      proof: {
        code: { lang: 'python', text: RECEIPT_CODE },
        fields: [
          ['node_id_from_verify_key', 'Identity is the key. There is no account table anywhere in the system, which is Law 1.'],
          ['client EVM address', `In this run ${CHAIN.actors.client}, the address every ticket in the batch was signed by.`],
        ],
        check: {
          verifies:
            'A lost phone costs nothing. Restoring the seed restores the same address, the same escrow deposit and the same voucher validity, because the money was never in the phone.',
        },
        source: `${SRC.proofs}; client address from ${SRC.chain}; the lost phone row in ${SRC.paperSecurity} section 7`,
      },
    },
    {
      n: 2,
      actor: 'client',
      layer: 'protocol',
      action: 'JOIN_REQ carries the gas voucher the kiosk signed when the shillings confirmed.',
      proof: {
        payload: voucherBundle,
        fields: [
          ['voucher.client_address', 'The buyer address the credit and the admission both bind to.'],
          ['voucher.amount_ukes', `${kes(voucherBundle.voucher.amount_ukes)} paid, in micro-KES.`],
          ['voucher.fiat_ref', 'The M-Pesa receipt number. The audit link back to the shillings.'],
          ['voucher.expires_at', '24 hours after issue. The verifier rejects a voucher past this.'],
          ['signature', 'Base64 Ed25519 over the canonical sorted-key JSON of the voucher object.'],
        ],
        check: {
          signs: 'The kiosk root key signs the compact sorted-key JSON serialisation of the voucher fields.',
          key: 'Kiosk root key, Ed25519, held server side in gateway-api.',
          verifies: 'Firmware holds only the 32 byte public key and verifies the signature and the expiry.',
          tamper:
            'Any change to any field breaks the signature: verify_voucher raises "Voucher signature invalid". A stale one raises "Voucher expired".',
        },
        source: `${SRC.kiosk} buy_gas_mpesa_daraja step 5 response.voucher; ${SRC.vouchers}`,
      },
    },
    {
      n: 3,
      actor: 'node',
      layer: 'protocol',
      action:
        'The node verifies the voucher offline and admits the client. Asking the chain at every join would make the mesh depend on the internet it exists to provide.',
      proof: {
        code: { lang: 'text', text: FRAME_CODE },
        fields: [
          ['type 1', 'JOIN_REQ, client to node, carrying the voucher.'],
          ['type 2', 'JOIN_ACK, node to client, carrying the 16 byte session nonce.'],
          ['src node id', 'First 8 bytes of SHA-256 of the sender Ed25519 public key.'],
          ['CRC16-CCITT', 'Checked before any signature verification. Corruption dies here, which is Law 8.'],
        ],
        check: {
          signs: 'Nothing new is signed at this step; the voucher signature made earlier is the thing verified.',
          key: 'The 32 byte kiosk root public key compiled into the firmware.',
          verifies: `Ed25519 over the voucher bytes, then expiry. The simulator models the wire cost with a 96 byte voucher-lite; production sends the full JSON bundle shown above.`,
          tamper: 'A forged voucher fails verification and the node never replies JOIN_ACK. Test: test_join_voucher, test_voucher_roundtrip_and_tamper, test_voucher_expiry_enforced.',
        },
        source: `${SRC.paperProtocol} section 3 and 4; ${SRC.frames}; ${SRC.protoTests}`,
      },
    },
    {
      n: 4,
      actor: 'node',
      layer: 'protocol',
      action: 'JOIN_ACK returns a session nonce, and the simulation records the join with the time it took.',
      proof: {
        payload: {
          join_event: { t_seconds: S1.events[0][0], kind: S1.events[0][1], node: S1.events[0][2], session_tag: S1.events[0][3] },
          admission_ms: S1.summary.admission_ms,
          scenario: S1.title,
        },
        fields: [
          ['join_event.t_seconds', 'When the join completed in simulated time.'],
          ['join_event.session_tag', 'The simulator tag for the session. The 16 byte nonce itself is not carried in trace.json.'],
          ['admission_ms', `${S1.summary.admission_ms.toFixed(4)} ms against the under 4.5 ms target for the ESP32-S3.`],
        ],
        source: `${SRC.trace} scenarios.s1.events[0] and scenarios.s1.summary.admission_ms`,
        gap:
          'trace.json records a session tag, not key material. No public key, node id or session nonce from a real admission exists anywhere in this repository, so this page describes those fields rather than printing bytes for them.',
      },
    },
  ],
};

/* ------------------------------------------------------------- journey 3 */

const buy = {
  id: 'buy',
  title: 'A client buys at the kiosk with shillings',
  lede:
    'Eight steps recorded by the gateway-api dry run: the STK push, the customer PIN, the callback, the mint against the confirmed payment, and the offline voucher. HTTP is mocked; the code path is the production one.',
  animation: {
    duration: ms(11),
    actors: [
      { id: 'user', label: 'Customer', layer: 'device' },
      { id: 'kiosk', label: 'Kiosk', layer: 'kiosk' },
      { id: 'daraja', label: 'Daraja', layer: 'fiat' },
      { id: 'chain', label: 'Chain', layer: 'chain' },
    ],
    hops: [
      { from: 'user', to: 'kiosk', label: 'POST /buy-gas, 50 KES', check: 'order accepted' },
      { from: 'kiosk', to: 'daraja', label: 'OAuth token, then STK push', check: 'ResponseCode 0' },
      { from: 'daraja', to: 'user', label: 'STK prompt on the handset', check: 'customer enters the PIN' },
      { from: 'daraja', to: 'kiosk', label: 'callback: ResultCode 0, receipt TIH3TRACE1', check: 'payment confirmed' },
      { from: 'kiosk', to: 'chain', label: 'bridgeMint(client, 50,000,000, fiatRef)', check: '1 KES in, 1 XKN out' },
      { from: 'kiosk', to: 'user', label: 'signed gas voucher, 24 hour expiry', check: 'verifiable with no backhaul' },
    ],
  },
  steps: fromKiosk(daraja, {
    1: {
      fields: [
        ['request.body.amount_kes', 'Shillings the customer is spending. The mint later is exactly this, in micro-KES.'],
        ['request.body.client_address', 'Where the XKN goes and what the voucher binds to.'],
        ['request.body.rail', 'daraja is the only rail the /buy-gas route wires to an M-Pesa STK push today.'],
        ['response.body.order_key', 'The CheckoutRequestID becomes the key of the pending order.'],
      ],
      check: {
        verifies:
          'Nothing is signed here and nothing is credited. The request only opens a pending order; a customer who never enters a PIN leaves no trace on chain.',
      },
    },
    2: {
      fields: [
        ['request.authorization_header_present', 'Basic auth with the Daraja consumer key and secret.'],
        ['response.body.expires_in', 'Token life in seconds. Fetched per push in the dry run.'],
      ],
    },
    3: {
      fields: [
        ['request.body.AccountReference', 'The first bytes of the buyer address, which is what appears on the customer statement.'],
        ['request.body.CallBackURL', 'Where Daraja will post the result. The callback is the only thing that credits anyone.'],
        ['response.body.CheckoutRequestID', 'Matches the order key. The pending order is stored under it.'],
        ['pending_order', 'Held in memory by the gateway until the callback arrives or the order is abandoned.'],
      ],
    },
    4: {
      fields: [
        ['order_key', 'The pending order waiting for a result.'],
        ['phone', 'The handset that sees the STK prompt. This step happens off system.'],
      ],
      check: {
        verifies: 'The PIN never reaches xKoin. Safaricom holds it; the callback is what the kiosk trusts.',
      },
    },
    5: {
      fields: [
        ['request.body.Body.stkCallback.ResultCode', '0 is success. Any other value leaves the order pending and mints nothing.'],
        ['CallbackMetadata.Item.MpesaReceiptNumber', 'TIH3TRACE1, the fiat reference carried into the mint and the voucher.'],
        ['response.body.mint', 'The bridgeMint call the bridge would send, captured because the run is in dry run mode.'],
        ['response.body.voucher', 'Issued in the same handler, so the customer can attach before the mint confirms.'],
      ],
      check: {
        verifies:
          'The amount credited comes from the callback metadata, not from the original request, so a customer who paid less than they asked to pay is credited what they actually paid.',
      },
    },
    6: {
      fields: [
        ['mint.args[1]', `${num(50000000)} micro-KES, which is 50 KES. XKN is 1:1 with the shilling by construction.`],
        ['mint.args[2]', 'The M-Pesa receipt, stored on chain as fiatRef for audit.'],
        ['mint.dry_run', 'true: this run captured the transaction instead of sending it.'],
        ['mint.chain_id', '84532 is Base Sepolia, the target for the kiosk dry run.'],
      ],
      contract: {
        call: 'xKoinToken.bridgeMint(address to, uint256 amount, bytes32 fiatRef) onlyBridge',
        event: 'Transfer(0x0, to, amount) and BridgeMint(to, amount, fiatRef)',
        reverts: 'NotBridge if the caller is not allowlisted; MintCapExceeded past the rolling daily cap.',
      },
      check: {
        verifies:
          'The mint is the only place XKN comes into existence, and it happens only after a bank says the shillings arrived.',
      },
      source: `${SRC.kiosk} buy_gas_mpesa_daraja step 6; ${SRC.token} bridgeMint; ${SRC.bridge}`,
    },
    7: {
      fields: [
        ['voucher.ttl_seconds', '86400. A voucher is good for a day of attaching, not forever.'],
        ['voucher.signature_verified', 'The issuer verified its own signature before handing it over.'],
        ['voucher.amount_kes', 'The shilling view of amount_ukes, for the receipt the customer sees.'],
      ],
      check: {
        signs: 'The kiosk root key signs the canonical sorted-key JSON of the voucher fields.',
        key: 'Kiosk root key, Ed25519.',
        verifies: 'Any gateway or satellite, offline, against the public key in its firmware.',
        tamper: 'Editing any field invalidates the signature. The voucher carries no value, so a stolen kiosk root key buys free admission and nothing else.',
      },
      source: `${SRC.kiosk} buy_gas_mpesa_daraja step 7; ${SRC.vouchers}`,
    },
    8: {
      fields: [['still_pending', 'false: the order is closed. A replayed callback finds nothing to credit.']],
      check: {
        verifies: 'Removing the pending order is what makes a repeated callback a no-op rather than a second mint.',
      },
    },
  }),
};

/* ------------------------------------------------------------- journey 4 */

const browse = {
  id: 'browse',
  title: 'A client browses: local free, transit metered',
  lede:
    'Scenario S1 of the simulation: 25 MB across the mesh, a signed receipt every megabyte, and a hard ceiling on how many bytes the node will extend before the next signature arrives.',
  animation: {
    duration: ms(11),
    actors: [
      { id: 'client', label: 'Client', layer: 'device' },
      { id: 'node', label: 'Gateway node', layer: 'device' },
      { id: 'wan', label: 'WAN', layer: 'protocol' },
    ],
    hops: [
      { from: 'client', to: 'node', label: 'traffic to 192.168.0.0/16', check: 'LAN, free, never metered' },
      { from: 'client', to: 'wan', label: 'traffic to the internet', check: 'admitted, so it passes' },
      { from: 'client', to: 'node', label: 'RECEIPT: cumulative 1,001,000 bytes', check: 'Ed25519 verified, 108 B on the wire' },
      { from: 'node', to: 'client', label: 'RECEIPT_ACK', check: 'node replaces the one receipt it holds' },
      { from: 'client', to: 'node', label: `${S1_RECEIPTS.length} receipts, ${num(S1.summary.proven_bytes)} proven bytes`, check: `unproven never above ${num(S1.summary.max_unproven_bytes)} B` },
    ],
  },
  steps: [
    {
      n: 1,
      actor: 'node',
      layer: 'device',
      action: 'Traffic that stays inside the building is free. Nothing about it is counted, signed or settled.',
      proof: {
        code: { lang: 'c', text: CLASSIFIER_CODE },
        fields: [
          ['10/8, 172.16/12, 192.168/16', 'Private ranges. A neighbour sharing a file with a neighbour is free by classification, not by policy.'],
          ['224/4 and broadcast', 'Discovery and local service announcements cost nobody.'],
        ],
        check: {
          verifies: 'The classifier runs before the meter. A byte that is LAN never reaches the accounting path at all.',
        },
        source: `${SRC.classifier}; ${SRC.paperArch} section on free LAN`,
      },
    },
    {
      n: 2,
      actor: 'client',
      layer: 'protocol',
      action: `Every ${num(1000000)} acknowledged bytes the client signs a cumulative receipt and sends it as one frame.`,
      proof: {
        payload: {
          canonical_struct: '<8s client_id><8s node_id><16s session><Q cumulative_bytes><I seq>',
          canonical_bytes: 44,
          signature_bytes: 64,
          wire_bytes: 108,
          example_from_trace: {
            t_seconds: S1_RECEIPTS[0][0],
            node: S1_RECEIPTS[0][2],
            session_tag: S1_RECEIPTS[0][3],
            cumulative_bytes: S1_RECEIPTS[0][4],
            client_id: '<8 bytes, first 8 of SHA-256 of the client Ed25519 public key>',
            node_id: '<8 bytes, the serving node id>',
            session: '<16 byte nonce fixed at admission>',
            signature: '<64 byte Ed25519 over the 44 canonical bytes>',
          },
        },
        fields: [
          ['wire_bytes', '108 bytes, which fits inside one 128 byte KQ-130F narrowband frame. Proofs must flow on the slowest medium in the system.'],
          ['cumulative_bytes', 'Total for the session, not a delta. Losing four receipts in a row costs the node nothing as long as the fifth arrives.'],
          ['seq', 'Monotonic per session. The receiver dedupes on it.'],
          ['example_from_trace.cumulative_bytes', `${num(S1_RECEIPTS[0][4])} bytes at the first receipt of scenario S1.`],
        ],
        check: {
          signs: 'The client signs the 44 canonical bytes.',
          key: 'The client Ed25519 key. Its public form hashes to the client_id inside the receipt.',
          verifies:
            'receipt_from_wire checks the size, verifies the signature, and then checks that client_id equals the first 8 bytes of SHA-256 of the verifying key.',
          tamper:
            'A tampered counter raises "receipt signature invalid". A substituted key raises "client id does not match key". Test: test_receipt_roundtrip_and_tamper.',
        },
        source: `${SRC.proofs}; ${SRC.trace} scenarios.s1.events; ${SRC.protoTests}`,
        gap:
          'The client_id, node_id, session nonce and signature are described rather than printed. trace.json records timings and counters only, and no captured receipt exists in the repository.',
      },
    },
    {
      n: 3,
      actor: 'node',
      layer: 'protocol',
      action:
        'The node extends at most twice the receipt interval of unproven credit. Past that the client is throttled, then dropped.',
      proof: {
        payload: {
          receipts_sent: S1.summary.receipts_sent,
          receipts_verified: S1.summary.receipts_verified,
          proven_bytes: S1.summary.proven_bytes,
          max_unproven_bytes: S1.summary.max_unproven_bytes,
          goodput_bps: S1.summary.goodput,
          overhead_pct: S1.summary.overhead_pct,
          transfer_s: S1.summary.transfer_s,
        },
        fields: [
          ['receipts_verified', `${S1.summary.receipts_verified} of ${S1.summary.receipts_sent}. Every receipt sent was verified.`],
          ['max_unproven_bytes', `${num(S1.summary.max_unproven_bytes)} bytes, the highest the node was ever exposed. The bound is two intervals, ${num(2000000)} bytes.`],
          ['goodput_bps', `${(S1.summary.goodput / 1e6).toFixed(3)} Mbps of a 10 Mbps model, so the proof discipline costs about ${S1.summary.overhead_pct.toFixed(2)} percent.`],
        ],
        check: {
          verifies:
            'This is the whole tit-for-tat. The node risks a bounded quantity of bytes, the client risks nothing, and a client that stops signing has bought at most two intervals of free service.',
        },
        source: `${SRC.trace} scenarios.s1.summary; the bound in ${SRC.classifier}`,
      },
    },
    {
      n: 4,
      actor: 'node',
      layer: 'protocol',
      action: `Bytes become billable units at ${num(CHAIN.params.unit_bytes)} bytes per unit, which is what the ticket will carry.`,
      proof: {
        payload: {
          proven_bytes: S1.summary.proven_bytes,
          unit_bytes: CHAIN.params.unit_bytes,
          units: S1_UNITS,
          price_per_unit_ukes: CHAIN.params.price_per_unit_ukes,
          gross_if_settled_ukes: S1_UNITS * CHAIN.params.price_per_unit_ukes,
          ticket_in_proof_run: TICKET_SETTLED[0],
        },
        fields: [
          ['units', `${num(S1_UNITS)} units, which is exactly the cumulativeUnits the gateway ticket carries in the chain run.`],
          ['price_per_unit_ukes', `${CHAIN.params.price_per_unit_ukes} micro-KES per unit, which is 0.05 KES per MB. A placeholder, not a decided price.`],
          ['gross_if_settled_ukes', `${kes(S1_UNITS * CHAIN.params.price_per_unit_ukes)} for 25 MB of transit.`],
        ],
        check: {
          verifies:
            'The simulation and the chain run agree on the number: 25 MB of proven bytes is 2,500 units, and the settled ticket says 2,500.',
        },
        source: `${SRC.trace} scenarios.s1.summary.proven_bytes; ${SRC.chain} params and tickets; ${SRC.paperMoney} section 5`,
      },
    },
  ],
};

/* ------------------------------------------------------------- journey 5 */

const settle = {
  id: 'settle',
  title: 'Settlement: a session of receipts collapses into one ticket',
  lede:
    'The only phase that leaves the mesh. Two channels, two tickets, one transaction, and a digest the Python side and the contract computed independently and agreed on.',
  animation: {
    duration: ms(11),
    actors: [
      { id: 'node', label: 'Node', layer: 'device' },
      { id: 'client', label: 'Client', layer: 'device' },
      { id: 'relayer', label: 'Relayer', layer: 'protocol' },
      { id: 'escrow', label: 'Escrow', layer: 'chain' },
    ],
    hops: [
      { from: 'node', to: 'client', label: 'latest receipt becomes an EIP-712 Ticket', check: 'cumulative units, not a delta' },
      { from: 'client', to: 'node', label: 'client signs the ticket with its EVM key', check: 'secp256k1 over the 712 digest' },
      { from: 'node', to: 'relayer', label: 'ticket handed to the relayer', check: 'relayer holds no privilege' },
      { from: 'relayer', to: 'escrow', label: 'settleTicketBatch(tickets, signatures)', check: `${num(SETTLE_TX.gas_used)} gas` },
      { from: 'escrow', to: 'escrow', label: 'expiry, sequence, delta, signature', check: 'four checks before a shilling moves' },
      { from: 'escrow', to: 'relayer', label: `BatchSettled gross ${kes(BATCH_SETTLED.gross)}`, check: `fee ${kes(BATCH_SETTLED.fee)}, net ${kes(BATCH_SETTLED.net)}` },
    ],
  },
  steps: [
    {
      n: 1,
      actor: 'client',
      layer: 'chain',
      action: 'The client funds the channel first: approve, then deposit into the escrow.',
      proof: {
        payload: {
          mint: { block: MINT_TX.block, fn: MINT_TX.fn, args: MINT_TX.args, gas_used: MINT_TX.gas_used },
          deposit: { block: DEPOSIT_TX.block, fn: DEPOSIT_TX.fn, args: DEPOSIT_TX.args, gas_used: DEPOSIT_TX.gas_used, logs: DEPOSIT_TX.logs },
        },
        fields: [
          ['mint.args.amount', `${kes(MINT_TX.args.amount)} minted against the fiat reference in args.fiatRef.`],
          ['deposit.args.amount', `${kes(DEPOSIT_TX.args.amount)} moved into the escrow. The rest of the balance stays with the client.`],
          ['deposit.logs.Deposited', 'The event a node watches to decide whether a client is worth serving.'],
        ],
        contract: {
          call: 'xKoinEscrow.deposit(uint256 amount) nonReentrant',
          event: 'Transfer(client, escrow, amount) and Deposited(client, amount)',
          reverts: 'ZeroAmount for a zero deposit. The ERC-20 transfer reverts if the approval is short.',
        },
        source: `${SRC.chain} txs blocks 6 to 8; ${SRC.escrow} deposit`,
      },
    },
    {
      n: 2,
      actor: 'node',
      layer: 'protocol',
      action: 'The node maps its latest receipt onto an EIP-712 Ticket and the client signs it.',
      proof: {
        code: { lang: 'python', text: TICKET_CODE },
        fields: [
          ['client', 'Who pays. The signature must recover to this address or the batch reverts.'],
          ['nodeAdmin', 'Who earns. Signed by the client, so a relay cannot redirect the earnings.'],
          ['sequenceNumber', 'Monotonic per channel. A stale one reverts.'],
          ['cumulativeUnits', 'Total for the channel, not the delta. The contract pays the difference.'],
          ['epochExpiry', 'A ticket that sat too long is refused rather than paid late.'],
          ['domain.verifyingContract', 'Binds the signature to this escrow on this chain. The same ticket is worthless against any other deployment.'],
        ],
        check: {
          signs: 'The client signs the EIP-712 digest of the Ticket struct under the xKoinEscrow domain.',
          key: 'The client secp256k1 EVM key, the chain native scheme. Ed25519 stays at the mesh edge.',
          verifies: 'The contract recomputes the digest and recovers the signer with ECDSA.recover.',
          tamper: 'Any changed field changes the digest, so recovery returns a different address and the call reverts with BadSignature. Test: test_revert_forgedSignature.',
        },
        source: `${SRC.settle}; ${SRC.escrow} TICKET_TYPEHASH and hashTicket`,
      },
    },
    {
      n: 3,
      actor: 'relayer',
      layer: 'chain',
      action: 'Anyone may relay. The relayer submits both tickets in one batch and pays the gas.',
      proof: {
        payload: {
          block: SETTLE_TX.block,
          hash: SETTLE_TX.hash,
          from: SETTLE_TX.from,
          to: SETTLE_TX.to,
          fn: SETTLE_TX.fn,
          gas_used: SETTLE_TX.gas_used,
          args: SETTLE_TX.args,
        },
        fields: [
          ['args.tickets[0]', `The gateway channel: ${num(SETTLE_TX.args.tickets[0].cumulativeUnits)} units, sequence ${SETTLE_TX.args.tickets[0].sequenceNumber}.`],
          ['args.tickets[1]', `The satellite channel: ${num(SETTLE_TX.args.tickets[1].cumulativeUnits)} units, sequence ${SETTLE_TX.args.tickets[1].sequenceNumber}. The satellite served the client and keeps the attribution.`],
          ['args.signatures', 'One 65 byte secp256k1 signature per ticket, in the same order.'],
          ['gas_used', `${num(SETTLE_TX.gas_used)} gas for the whole batch.`],
        ],
        contract: {
          call: 'xKoinEscrow.settleTicketBatch(Ticket[] tickets, bytes[] signatures) nonReentrant',
          reverts: 'EmptyBatch, LengthMismatch, then per ticket ExpiredTicket, StaleSequence, NoNewUnits, BadSignature. An invalid ticket reverts the whole batch on purpose, so a bug is loud.',
        },
        check: {
          verifies:
            'A leaked relayer key costs the gas sitting in the wallet and nothing else. Signatures and monotonic counters gate everything it could do.',
        },
        source: `${SRC.chain} txs block 9; ${SRC.escrow} settleTicketBatch`,
      },
    },
    {
      n: 4,
      actor: 'escrow',
      layer: 'chain',
      action: 'Four checks run per ticket before any value moves, and the payment is capped at what the client actually deposited.',
      proof: {
        code: { lang: 'solidity', text: SETTLE_CHECKS_CODE },
        fields: [
          ['ExpiredTicket', 'Law 5 in part: an old ticket cannot be held and cashed later.'],
          ['StaleSequence and NoNewUnits', 'Replay pays nothing. Re-presenting a settled ticket produces a zero delta and the call reverts rather than silently paying nothing.'],
          ['ECDSA.recover', 'Law 4 on the chain side. Forgery is a broken signature, not a detection problem.'],
          ['paid = owed <= available ? owed : available', 'Law 6. Nobody is owed more than they escrowed, and the node takes a partial payment rather than losing the ticket.'],
        ],
        check: {
          verifies: 'Tested by test_revert_staleSequence, test_revert_noNewUnits, test_revert_expiredTicket, test_revert_forgedSignature, test_settle_partialWhenDepositShort and the 256 run testFuzz_settleNeverExceedsDeposit.',
        },
        source: `${SRC.escrow} _settleOne; ${SRC.tests}`,
      },
    },
    {
      n: 5,
      actor: 'escrow',
      layer: 'chain',
      action: 'The events are the receipt. Two tickets settled, the fee forwarded, the batch closed.',
      proof: {
        payload: SETTLE_TX.logs,
        fields: [
          ['TicketSettled[0].paidAmount', `${kes(TICKET_SETTLED[0].paidAmount)} for ${num(TICKET_SETTLED[0].deltaUnits)} units to the gateway.`],
          ['TicketSettled[1].paidAmount', `${kes(TICKET_SETTLED[1].paidAmount)} for ${num(TICKET_SETTLED[1].deltaUnits)} units to the satellite.`],
          ['Transfer', `${kes(BATCH_SETTLED.fee)} moved from the escrow to the treasury in the same transaction.`],
          ['BatchSettled', `gross ${kes(BATCH_SETTLED.gross)}, fee ${kes(BATCH_SETTLED.fee)}, net ${kes(BATCH_SETTLED.net)}. The fee is 5 percent, set at deploy.`],
        ],
        contract: {
          call: 'xKoinTreasury.feeOn(uint256 gross) view',
          event: 'TicketSettled, Transfer, BatchSettled',
        },
        check: {
          verifies: `Solvency is asserted by the run itself: "${CHAIN.summary.solvency}".`,
        },
        source: `${SRC.chain} txs block 9 logs; ${SRC.escrow}; ${SRC.treasury} feeOn`,
      },
    },
    {
      n: 6,
      actor: 'escrow',
      layer: 'chain',
      action: 'Escrow state after the batch: what is left of the deposit, and what each node is owed.',
      proof: {
        payload: CHAIN.escrow_state,
        fields: [
          ['deposits.client', `${kes(CHAIN.escrow_state.deposits.client)} left of the ${kes(DEPOSIT_TX.args.amount)} deposited. The client can withdraw it at any time.`],
          ['earnings.gateway', `${kes(CHAIN.escrow_state.earnings.gateway)} claimable by the gateway node admin.`],
          ['earnings.satellite', `${kes(CHAIN.escrow_state.earnings.satellite)} claimable by the satellite node admin.`],
        ],
        contract: {
          call: 'xKoinEscrow.claimEarnings(address to, uint256 amount) and withdrawDeposit(uint256 amount)',
          event: 'EarningsClaimed, DepositWithdrawn',
        },
        check: {
          verifies: 'Deposits plus earnings equals the escrow token balance, asserted at the end of the run and covered by test_solvencyInvariant.',
        },
        source: `${SRC.chain} escrow_state and summary`,
      },
    },
  ],
};

/* ------------------------------------------------------------- journey 6 */

const payoutJourney = {
  id: 'payout',
  title: 'Payout: XKN burned, shillings sent',
  lede:
    'The fee leaves the chain and arrives as money on a phone. The destination number is pinned by a signature the beneficiary key made, so a compromised server can delay the payout and never redirect it.',
  animation: {
    duration: ms(11),
    actors: [
      { id: 'beneficiary', label: 'Beneficiary', layer: 'chain' },
      { id: 'worker', label: 'Payout worker', layer: 'kiosk' },
      { id: 'daraja', label: 'Daraja B2C', layer: 'fiat' },
      { id: 'chain', label: 'Token', layer: 'chain' },
    ],
    hops: [
      { from: 'worker', to: 'chain', label: 'read treasury.beneficiary()', check: 'pinned number signature checked first' },
      { from: 'beneficiary', to: 'worker', label: 'Transfer(beneficiary -> bridge) observed', check: 'any other sender is ignored' },
      { from: 'worker', to: 'daraja', label: 'B2C 65 KES to the pinned number', check: 'dust stays in the bridge' },
      { from: 'daraja', to: 'worker', label: 'result callback, receipt QBTRACE01', check: 'only now is anything burned' },
      { from: 'worker', to: 'chain', label: 'bridgeBurn(65,000,000, receipt)', check: 'burns its own balance, never a user balance' },
    ],
  },
  steps: fromKiosk(payout, {
    1: {
      fields: [
        ['msisdn', 'The founder phone number the payout may reach, and the only one.'],
        ['beneficiary', 'Read from the chain, not from config.'],
        ['signature_valid', 'An EIP-191 signature by the beneficiary key over the number, checked against treasury.beneficiary() before the worker will start.'],
      ],
      check: {
        signs: 'The beneficiary key signs the destination number.',
        key: 'Beneficiary cold key, secp256k1.',
        verifies: 'The worker recovers the signer and compares it to the on-chain beneficiary at start.',
        tamper: 'Editing the number in config makes the signature fail and the worker refuses to start. Test: test_event_fields_cannot_choose_the_destination.',
      },
    },
    2: {
      fields: [
        ['event.from', 'Must be the beneficiary address. A transfer from anyone else is ignored entirely.'],
        ['event.to', 'Must be the bridge. The bridge is the only account whose balance bridgeBurn can touch.'],
        ['event.value', `${num(65123456)} micro-KES, which is 65.123456 KES.`],
      ],
      check: {
        verifies: 'Tested by test_transfers_not_from_beneficiary_or_not_to_bridge_are_ignored.',
      },
    },
    3: {
      fields: [
        ['b2c_request.body.Amount', '65 KES. Floored to whole shillings, because the rail does not carry cents.'],
        ['b2c_request.body.PartyB', 'The pinned number. The event fields are never consulted for a destination.'],
        ['msisdn_in_request_matches_pin', 'Asserted by the run itself.'],
      ],
      check: {
        verifies: 'Tested by test_beneficiary_transfer_fires_b2c_to_pinned_msisdn_and_defers_burn.',
      },
    },
    4: {
      fields: [
        ['ledger_row.status', 'b2c_sent. Nothing is burned at this point.'],
        ['ledger_row.dust_ukes', `${num(123456)} micro-KES stays in the bridge rather than being rounded away.`],
        ['ledger_row.burn_tx', 'null until the bank confirms.'],
      ],
    },
    5: {
      fields: [
        ['Result.ResultCode', '0 is success. A failure keeps the tokens and retries up to a cap.'],
        ['ResultParameters.TransactionReceipt', 'QBTRACE01, the reference the burn will carry.'],
      ],
      check: {
        verifies: 'A failed payout never destroys XKN. Test: test_failed_b2c_keeps_tokens_and_retries_up_to_cap.',
      },
    },
    6: {
      fields: [
        ['burn.args[0]', `${num(65000000)} micro-KES, exactly the amount paid out. Not the dust, not the original transfer.`],
        ['burn.args[1]', 'The Daraja receipt, carried on chain as fiatRef.'],
      ],
      contract: {
        call: 'xKoinToken.bridgeBurn(uint256 amount, bytes32 fiatRef) onlyBridge',
        event: 'BridgeBurn(from, amount, fiatRef)',
        reverts: 'NotBridge for any other caller. The burn is from the caller balance only, so no key in the system can destroy a user balance.',
      },
      check: {
        verifies: 'Tested by test_confirmed_b2c_burns_exactly_the_paid_amount and test_bridgeMintBurn_selfOnly.',
      },
      source: `${SRC.kiosk} fee_payout step 6; ${SRC.token} bridgeBurn`,
    },
    7: {
      fields: [
        ['ledger_row.status', 'settled, with the bank receipt and the burn transaction attached.'],
        ['payouts_endpoint_row_count', 'The operator view is read only. It can see this row and cannot move a shilling.'],
      ],
    },
  }),
};

export const JOURNEYS = [nodeSetup, onboard, buy, browse, settle, payoutJourney];

/** The claim transaction, shown in the authority section rather than a journey. */
export const CLAIM_EVIDENCE = {
  block: CLAIM_TX.block,
  from: CLAIM_TX.from,
  to: CLAIM_TX.to,
  fn: CLAIM_TX.fn,
  gas_used: CLAIM_TX.gas_used,
  logs: CLAIM_TX.logs,
};
