# 00. Start here: a reading guide to the xKoin paper set

Abstract: This guide is the entry point to the xKoin whitepaper set. xKoin is a hybrid power-line and LoRa mesh for Kenya in which a user pays per cryptographically verified byte of wide-area traffic and pays nothing at all for traffic that stays inside the local mesh. The set is written for five readers who need different halves of the same system: an investor, an engineer, a node operator, a regulator and a contract manufacturer. This paper states what each numbered paper contains, the shortest path through the set for each reader, a glossary of the vocabulary the other papers assume, the conventions every paper follows (figures, tables, numbers that carry a condition, plain ASCII punctuation), the mapping between the device names used in this repository and the names used in the original patent draft, and the three-value status legend that marks every claim in the set as built, partial or proposed.

Keywords: xKoin, mesh networking, power-line communication, LoRa, state-channel settlement, Kenya, reading guide

## 1. What the set is

The set is one document in sixteen files. It describes a network that sells internet transit over infrastructure that already exists in a Kenyan building, which is the mains wiring, and over a radio plane that survives when the mains does not. Payment is metered in a KES-pegged token on the Base L2 chain and bought with M-Pesa or Equitel.

```xk-anim frame-hop
A frame hops from the client to a satellite to the node and out to the internet, and one signed receipt goes back to the device that served it.
```

```xk-compare
title: The two planes, and which one costs anything
Free LAN plane | Paid WAN
Price | 0 XKN, always | metered in 10 KB units against a deposit
Proof needed | none at all | one Ed25519 receipt the client signed
Backhaul down | still works | pauses, and settles when the link returns
Examples | neighbour chat, files on the Node, farm sensors | a web page, an app sync, a video call
```

| File | Contains | Primary reader |
|---|---|---|
| `00-START-HERE.md` | This guide: glossary, conventions, status legend | Everyone |
| `00-x-koin-concept.md` | Field, background, prior art, the invention in one figure, the eight Laws, draft claims | Investor, regulator, patent counsel |
| `01-problem-and-market.md` | Kenyan prices and outages, the three buyers, market ranges, why now | Investor, operator |
| `02-system-architecture.md` | Tiers, device archetypes, the three mediums plus Wi-Fi, topology, failure modes | Engineer |
| `03-protocol-xkp.md` | Frame format, phases, proof layer, reward layer, service classes | Engineer |
| `04-settlement-and-economics.md` | Token, escrow, tickets, fees, operator unit economics | Investor, operator |
| `05-hardware-node.md` | The gateway device: wiring, pin map, BOM slice, power budget, bring-up | Engineer, manufacturer |
| `06-hardware-node-satellite.md` | The mains relay device | Engineer, manufacturer |
| `07-hardware-satellite.md` | The off-grid solar LoRa device | Engineer, manufacturer |
| `08-hardware-client-and-otg-dongle.md` | The client side and the USB dongle | Engineer |
| `09-lora-ecosystem-devices.md` | Third-party sensors and Meshtastic interoperation | Engineer |
| `10-security-and-trust.md` | The Laws, the threat model, trusted parties, key management | Engineer, regulator |
| `11-regulatory-and-safety.md` | CA spectrum rules, mains safety, CBK and import questions | Regulator, counsel |
| `12-proof-of-concept-plan.md` | The six demos and their acceptance tests | Engineer, investor |
| `13-roadmap.md` | What ships when, and what each stage unblocks | Investor |
| `14-references.md` | The consolidated source list | Everyone |
| `15-hidden-gems-and-fallback-channels.md` | A graded brainstorm of sixteen extensions: cellular fallbacks, erasure coding, on-chip storage, compression, and ten more, each with its cost, bit rate and legality | Engineer, investor |

## 2. Reading order by audience

**Investor.** `00-x-koin-concept.md` for the thesis, then `01-problem-and-market.md` for the prices that make it a business, then `04-settlement-and-economics.md` section on operator unit economics, then `12-proof-of-concept-plan.md` to see what will actually be demonstrated and `13-roadmap.md` for the dates. Read the status legend in section 6 below first; about half of the set describes work that is proven in software and not yet in a building.

**Engineer.** `02-system-architecture.md`, then `03-protocol-xkp.md`, then the hardware papers `05` to `09` in order. `10-security-and-trust.md` before writing any code that touches a receipt or a ticket. The protocol source of truth is `protocol/spec.md` in this repository; where a paper and the spec disagree, the spec wins and the paper is a bug.

**Node operator.** `01-problem-and-market.md` section on the three buyers, then `04-settlement-and-economics.md`, then `05-hardware-node.md` and `06-hardware-node-satellite.md` for what has to be installed and what it draws.

**Regulator or counsel.** `00-x-koin-concept.md` sections on trusted parties and claims, then `11-regulatory-and-safety.md`, then `10-security-and-trust.md`. The standing brief to counsel is `docs/ops/regulatory-brief.md`, which carries the open questions in the form a lawyer can answer.

**Contract manufacturer.** `docs/x-koin-beta/` rather than this set: the beta folder holds the merged-board version, the PCB outline and the manufacturing brief. Use `05` to `07` here for the function each block must perform.

## 3. Glossary

| Term | Meaning in this set |
|---|---|
| node | Any device that relays frames and can be addressed by an 8-byte id |
| hop | One relay of a frame; the frame header carries a TTL decremented per hop |
| mesh | The set of nodes reachable over any of the mediums, independent of medium |
| medium | One physical carrier: HomePlug AV, narrowband PLC, LoRa or Wi-Fi |
| medium score | `goodput_ewma * (1 - loss_ewma)`; the sender picks the highest |
| frame | The 29-byte-overhead medium-agnostic unit defined in `protocol/spec.md` section 2 |
| free LAN plane | Traffic that stays inside the mesh; costs zero XKN and needs no voucher |
| voucher | A kiosk-signed Ed25519 certificate proving an address paid recently; verified offline at the edge, 24 h expiry |
| receipt | An Ed25519-signed cumulative byte counter from the client to the node, 108 bytes, sized to fit one narrowband PLC frame |
| ticket | The EIP-712 secp256k1 form of the final receipt, settled on chain |
| cumulative counter | A counter that only ever increases, so losing an intermediate value loses nothing and the contract pays the delta |
| escrow | `xKoinEscrow`, the single prepaid meter: one deposit number per user address, readable by every node |
| settlement | `settleTicketBatch`: escrow moves value from a deposit to operator earnings and the treasury fee |
| relayer | Whatever submits ticket batches on chain; holds no privilege, so anyone may run one |
| treasury | `xKoinTreasury`, which receives the protocol fee and pays only its beneficiary |
| bridge | The allow-listed gateway-api key that mints XKN against a confirmed fiat receipt and burns only its own balance |
| XKN | The ERC-20 on Base, 6 decimals, base unit one micro-KES |
| KES peg | 1 XKN = 1 KES by construction: every XKN was minted against a bank confirmation and burned on payout |
| kiosk root key | The Ed25519 key that signs vouchers; its public half is compiled into node firmware |
| node operator | The `nodeAdmin` address named in every ticket a node collects; an address, never a device |
| client | A phone, the companion app or the OTG dongle: whatever holds the user's keys |
| captive portal | The node's Wi-Fi landing page for buying without the app |
| backhaul | The node's upstream link to the internet: LTE, fibre or a phone hotspot |
| mains segment | The stretch of wiring a power-line carrier can cross before a transformer, phase change or filter stops it |
| HomePlug AV | Broadband power-line carrier, 2 to 68 MHz OFDM; the bulk plane, modelled at ~10 Mbps goodput |
| narrowband PLC | The KQ-130F 120 to 135 kHz carrier over UART at 9600 baud, ~960 B/s; the control and receipt plane |
| LoRa | The SX1262 868.1 MHz chirp modulation; the discovery and survival plane |
| SF7 | Spreading factor 7 at BW125 CR4/5: the fastest LoRa setting used here, ~5.4 kbps |
| GFSK | The same SX1262 switched to frequency-shift keying at 150 kbps for strong links |
| duty cycle | The fraction of an hour a transmitter may occupy a sub-band under CA short-range-device rules |
| class A service | Distilled web: a page reduced in the cloud proxy and delivered as text |
| class B service | Adaptive modulation: the link switches between LoRa and GFSK by score |
| class C service | Transactional: native frames, no IP, for balances, messages and kiosk operations |
| Law 1, Identity is the key | Node id is `SHA-256(Ed25519 pubkey)[:8]`; there are no accounts |
| Law 2, No admission without a fiat-backed voucher | Verified offline at the edge |
| Law 3, Only signed bytes are owed | A node extends at most twice the receipt interval of unproven credit |
| Law 4, A forged counter is a broken signature | Ed25519 over canonical receipt bytes |
| Law 5, Replay pays nothing | Dedupe by `(src, seq)`, monotonic on-chain sequence, cumulative delta |
| Law 6, Nobody is owed more than they escrowed | Settlement caps at the deposit |
| Law 7, The ledger cannot go insolvent | Escrow balance equals deposits plus earnings, fee-exact |
| Law 8, Corruption dies at the frame | Magic, length and CRC16-CCITT below the cryptography |

## 4. Conventions

Figures are SVG in `assets/`, named `<paper>-figNN-<slug>.svg`, in one of two styles: blueprint for hardware drawings, schematic for topologies, money flows and state. Every figure is referenced from the text before it appears, carries a numbered caption inside its alt text, and repeats that caption as an italic line underneath. Tables carry anything with three or more parallel rows. Wire formats and code sit in fenced blocks.

Cross-references are relative links to the sibling file and section, for example `[03-protocol-xkp.md, section 4](03-protocol-xkp.md#4-proof-layer)`.

Numbers that carry a condition keep the condition in the same sentence. Three conditions recur across the set and are never dropped:

1. The per-unit price is a placeholder at 500 micro-KES per 10 KB unit (0.05 KES/MB) until it clears measured backhaul cost. Every payback and margin figure derived from it is conditional on that measurement.
2. The payback periods in the Drive tokenomics document are conditional on the same price and on its CapEx and tenant-count assumptions, which are stated wherever the figure appears.
3. Kenyan 868 MHz duty-cycle and power rules are read from the CA 2022 short-range-device guidelines, and whether those guidelines survive the 2025 and 2026 regulations is unconfirmed until counsel answers.

"Zero-trust" is used only of the peer relay layer, where Laws 1 to 8 mean no peer must trust any other peer. The fiat boundary has named custodians and they are listed in `protocol/spec.md` section 8 and repeated in the concept paper.

Punctuation is plain ASCII throughout: hyphens, straight quotes, no dashes of any other kind and no ellipsis characters.

## 5. Device names

Martin's names are authoritative. The patent draft used a different set, and both appear in the older material, so the mapping is fixed here.

| This set | Patent draft (Drive doc 01) | Role in one line |
|---|---|---|
| xKoin-Node | xKoin-Node | The gateway: backhaul in, mains and radio out, meters every WAN byte |
| xKoin-Node-Satellite | xKoin-Satellite | Wall-socket relay on the same mains segment; regenerates Wi-Fi and enforces admission |
| xKoin-Satellite | xKoin-LoRa | Off-grid solar LoRa remote; deep sleep, class C service, relays to the nearest Node |
| xKoin-Client | (client) | The user: phone with the companion app, or the OTG dongle for direct LoRa reach |
| LoRa ecosystem devices | (AgTech sensors) | Third-party nodes on the free LAN plane: farm sensor, tank level, Meshtastic handset |

## 6. Status legend

Every capability claim in the set carries one of three marks. Nothing in the set is written as shipped when it is not.

| Mark | Meaning | Example |
|---|---|---|
| built | Implemented and covered by a named passing test or a measured run | The escrow solvency invariant, 256-run fuzz |
| partial | Implemented in one place and not yet in another, or built but not yet exercised on hardware | The ESP-IDF glue, written to the fixed pin map and compile-untested |
| proposed | Designed and specified, not implemented | The Android companion app |

## 7. References

1. `protocol/spec.md`, XKP: xKoin Protocol v1 (draft), sections 1 to 8.
2. `docs/how-it-works.md`, primitives, decisions and journeys, 2026-09-11.
3. `docs/_plan/revamp-plan.md`, device lineup and demo matrix, 2026-09-12.
4. `docs/_plan/papers-brief.md`, the brief this set is written to.
5. `docs/ops/regulatory-brief.md`, regulatory questions for counsel, 2026-09-09.
6. `docs/ops/critical-accounts/03-budget-and-sustainability.md`, measured gas costs, 2026-09-09.
7. `HANDOVER.md`, sections 0 to 3, locked decisions and invariants.
8. `docs/_drive/`, the verbatim Drive design suite exports, 2026-09-12.
