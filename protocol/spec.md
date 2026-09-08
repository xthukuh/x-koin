# XKP: xKoin Protocol v1 (draft)

Proof + reward layered, multi-phase, multi-medium transport for the xKoin mesh.
Reference implementation: `protocol/xkp/` (Python, sandbox). Firmware port
target: ESP32-S3 C per plan doc 02 phase 1.

## 1. Mediums

| Medium | Model | Goodput | Frame payload | Role |
|---|---|---|---|---|
| HomePlug AV (broadband PLC) | Ethernet bridge | ~10 Mbps | 1400 B | Bulk in-building data |
| KQ-130F (narrowband PLC) | UART 9600 baud | ~960 B/s | 128 B | Telemetry, receipts, control |
| LoRa SX1262 | 868.1 MHz SF7 BW125 CR4/5 | ~5.4 kbps | 226 B | Discovery, off-grid survival plane |
| Wi-Fi 802.11 | client access | n/a here | n/a | Client attach (captive portal) |

Every frame is medium-agnostic. Senders pick the live medium with the highest
`score = goodput_ewma * (1 - loss_ewma)`; three consecutive delivery failures
quarantine a medium for 2 s and the next-best medium takes over. Grid failure
therefore degrades the mesh to LoRa instead of killing it.

## 2. Frame format (little-endian, 29 B overhead)

    offset size  field
    0      2     magic 0x4B58 ("XK")
    2      1     version (high nibble) | type (low nibble)
    3      1     flags: bit0 ACK_REQ, bit1 ENCRYPTED, bit2 FRAGMENT
    4      1     ttl (hops remaining, decremented per relay)
    5      8     src node id  (first 8 bytes of SHA-256 of Ed25519 pubkey)
    13     8     dst node id  (0xFF*8 = broadcast)
    21     4     seq (per-src monotonic)
    25     2     payload length N
    27     N     payload
    27+N   2     CRC16-CCITT (poly 0x1021, init 0xFFFF) over bytes 0..27+N-1

Frame types: 0 BEACON, 1 JOIN_REQ, 2 JOIN_ACK, 3 DATA, 4 DATA_ACK, 5 RECEIPT,
6 RECEIPT_ACK, 7 TELEMETRY, 8 SETTLE_NOTIFY. BEACON on LoRa keeps Meshtastic
framing compatibility for discovery only (doc 01 s3.2.3).

## 3. Phases

    P0 DISCOVERY   Gateway/satellite BEACONs (LoRa + narrowband PLC).
    P1 ADMISSION   Client JOIN_REQ carries the kiosk-signed Ed25519 Gas
                   Voucher; node verifies offline (<4.5 ms target) -> JOIN_ACK.
    P2 TRANSFER    DATA/DATA_ACK on the best live medium, per-medium MTU.
    P3 PROOF       Every RECEIPT_INTERVAL acked bytes the client signs a
                   cumulative Receipt (Ed25519). Node stores latest only.
    P4 SETTLEMENT  Node maps the final Receipt to an EIP-712 Ticket signed by
                   the client's EVM key and relays it to xKoinEscrow via
                   gateway-api /settlement/relay.

## 4. Proof layer

Receipt (canonical bytes, signed Ed25519 by client):

    <8s client_id><8s node_id><16s session_nonce><Q cumulative_bytes><I seq>

Cumulative counters make loss harmless: only the latest receipt matters, the
node is paid the delta since last settlement (mirrors xKoinEscrow exactly).
A node that forges a counter fails signature verification; a client that
refuses receipts gets its session throttled then dropped (tit-for-tat window:
node extends at most RECEIPT_INTERVAL bytes of unproven credit).

## 5. Reward layer

Serving node = nodeAdmin in the on-chain channel. A satellite that serves a
client collects that client's receipts itself and uses the gateway purely as
backhaul, so relay topology never dilutes attribution. On-chain unit = 1 MB
(price owner-tunable, pending simulation-informed decision).

## 6. WAN service classes over LoRa

The gateway terminates TCP/TLS upstream and serves clients per class:

| Class | Path | Measured (sim) | Use |
|---|---|---|---|
| C: Transactional | Native XKP frames, no IP | 108 B receipt fits one narrowband frame | M-Pesa/kiosk ops, DNS, messaging, prices |
| A: Distilled web | 2.5 MB page -> ~12 KB (text extraction + shared-dictionary zstd in cloud-proxy) | 21.9 s/page on SF7; 0.86 s on GFSK | Text browsing, news, email |
| B: Adaptive modulation | Same SX1262 switched LoRa<->GFSK per link score | 121.9 kbps goodput at GFSK 150k | Light real internet on strong links |

Duty cycle is the binding constraint for sustained SF7 service (1% -> 1.5
pages/hour/channel, 11.7 across 8 channels). GFSK lifts this ~27x. Kenyan CAK
SRD duty-cycle rules for 868 MHz are UNVERIFIED and must be confirmed before
field trial (doc 01 s7 compliance item).

## 7. The Laws (threat model as invariants)

Every law names its enforcing mechanism and the artifact that proves it.
Breaking a law must cost more than honest participation earns.

| # | Law | Mechanism | Proof artifact |
|---|---|---|---|
| 1 | Identity is the key | node id = SHA-256(Ed25519 pk)[:8]; no accounts | proofs.py, test_receipt_roundtrip_and_tamper |
| 2 | No admission without fiat-backed voucher | kiosk root key signature verified offline at the edge | test_join_voucher; gateway-api voucher tests |
| 3 | Only signed bytes are owed | node extends at most 2x receipt interval of unproven credit | S1 max_unproven_bytes bounded |
| 4 | A forged counter is a broken signature | Ed25519 over canonical receipt bytes | fuzz + tamper tests, 0 forgeries accepted |
| 5 | Replay pays nothing | receiver dedupe by (src, seq); on-chain monotonic sequence + cumulative delta | test_revert_staleSequence, test_revert_noNewUnits |
| 6 | Nobody is owed more than they escrowed | settlement caps at deposit | testFuzz_settleNeverExceedsDeposit (256 runs) |
| 7 | The ledger cannot go insolvent | escrow balance == deposits + earnings, fee-exact transfer | test_solvencyInvariant + e2e chain assert |
| 8 | Corruption dies at the frame | magic + length + CRC16, crypto above it | S5: 0/20000 garbage accepted; residual CRC collisions carry no value without Law 4 |

Economic security: an attacker must break Ed25519 (Law 4) or secp256k1 (chain)
to mint value; everything cheaper (spam, replay, corruption, Sybil beacons)
earns zero because pay is strictly per verified signed byte (PoW-B), never for
presence. Beacon spam costs the attacker airtime and yields no settlement path.

## 8. Trusted parties, stated plainly

"Zero-trust" is true of the peer relay layer (Laws 1-8: no peer must trust any
other peer). It is not yet true of the fiat boundary, which has named
custodians. Anyone reviewing this project should find that here, not discover
it.

| Key | Holder | Power | Blast radius if compromised | Exit path |
|---|---|---|---|---|
| Kiosk Root Key (Ed25519) | Founder | Signs admission vouchers | Free network admission; no fund theft (funds need on-chain ECDSA) | Firmware pubkey rotation now; HSM + threshold signing at scale |
| Bridge hot wallet | gateway-api service | bridgeMint / self-only bridgeBurn | Unbacked XKN up to the ON-CHAIN daily cap (50k KES default); third-party balances unburnable by construction | Hot/cold split; owner revokes via setBridge |
| Owner key (3 contracts) | Founder | Fee (capped 10%), price (banded 1..50000 uKES, 1 change/day), bridge allowlist | Bounded griefing only; cannot halt settlement, cannot touch escrow, cannot redirect fees | Ownable2Step now; Gnosis Safe pre-mainnet |
| Settlement relayer | Anyone | None | None: signatures and monotonic counters gate everything | Already trustless |

Pricing is owner-set and therefore centralized for MVP. Floor discipline: the
per-unit price must clear measured backhaul cost, price_floor = (backhaul
KES/MB from Equitel bulk bundle) x (10 KB / 1 MB) / 0.95 fee retention,
adjusted by measured Squid cache hit rate. Doc 04 payback claims are
conditional on this and are not to be quoted without it.

Regulatory posture, unresolved and named: CAK licensing likely applies to
reselling internet transit (beyond SRD radio rules), and a KES-redeemable
token sits near CBK e-money definitions. Legal review is on the critical path
before mainnet fiat. Risk register: Drive doc 06.

### 8.1 Founder control without founder risk (implemented 2026-09-08)

Requirement: the founder must be paid, must not be able to take the network
down (even under key theft or coercion), and must bear no theft risk on the
fee cut. Mechanisms, all on-chain and all tested:

1. Treasury claim() is callable by anyone and pays ONLY the beneficiary cold
   address. There is no withdraw-to-parameter anywhere. A stolen owner key
   cannot redirect a single micro-KES (test_stolenOwnerKeyCannotRedirectFees).
2. Beneficiary changes take a 7-day public timelock and the founder cold key
   holds a veto. Key theft becomes a 7-day fire alarm, not a loss.
3. Price is banded (PRICE_MIN..PRICE_MAX) with a 1-day cooldown: worst-case
   owner abuse is "expensive within band, once a day", never "halted".
4. bridgeBurn is self-only: no key in the system can destroy user balances.
5. bridgeMint is capped per rolling day per bridge: a fully compromised bridge
   leaks at most one day's cap before setBridge revokes it.
6. Settlement, deposits, withdrawals, and claims run with zero founder
   involvement: the founder disappearing freezes governance at last-known-good
   values and stops nothing else. Remaining liveness dependency: kiosk root
   key for NEW admissions (rotation documented; federation later).

Fiat leg of the fee: beneficiary cold -> transfer to bridge -> B2C to founder
MSISDN -> self-burn. The payout worker fires B2C only for on-chain transfers
originating from the beneficiary address, so a compromised server can at worst
delay the payout, not redirect it. Worker wiring: gateway-api, pending.
