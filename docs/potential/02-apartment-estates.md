# 02. Apartment estates

*A 40 unit block in Ruaka gets one Node in the meter room and a Node-Satellite per floor on the existing mains riser; the copper already in the walls becomes the bulk plane, and the landlord becomes the node operator without becoming an ISP.*

## 1. The situation

Ruaka, Kiambu County, on the Limuru road side. Njeri Kamau owns a five-storey block of 40 one and two bedroom units, built in 2021, fully let, mostly to people in their twenties and thirties who work in Westlands and come home at seven. She has a caretaker, a meter room with 40 prepaid tokens meters and a distribution board, and a WhatsApp group where tenants report problems.

Her tenants' internet is a patchwork. Perhaps a dozen units have a fixed line from one of the two operators who have wired the estate. The rest run on mobile data, buying bundles that end at the wrong moment. Several tenants share a neighbour's router through a wall, which works badly and creates arguments.

Njeri has been approached twice about putting a router in the corridor and selling vouchers. Both times the proposal needed cabling through the stairwell, and both times she said no, because the block is new, the walls are painted, and she is not drilling them.

## 2. What breaks today

Wiring is the binding constraint, and every conventional answer runs into it.

Structured cabling to 40 units means trunking up five floors, a hole through each unit's wall, and a contractor in the building for a fortnight. The cost is real and the disruption is worse. In a fully let block, a fortnight of contractors is a fortnight of complaints.

Wi-Fi repeaters through concrete is the usual shortcut and it degrades exactly as concrete predicts. Each hop halves the throughput and the fifth floor gets the remains.

Per-unit fixed lines work but they are per-unit. Every tenant negotiates their own contract, pays their own installation, and leaves the ONT behind when they move. The building gets nothing and the churn is paid for twice.

The tenant-side failure is sharper than any of these. Bundles expire at inconvenient sizes, a tenant who has spent their last hundred shillings on transport cannot buy fifty shillings of data, and there is no way to spend twenty shillings on exactly the browsing they need this evening.

## 3. The xKoin composition

No new cable. The building's own mains risers carry the bulk plane.

| Device | Count | Placement | What it does |
|---|---|---|---|
| xKoin-Node | 1 | Meter room, on a dedicated circuit | Backhaul termination, admission, metering, settlement, HomePlug AV injection onto the riser |
| xKoin-Node-Satellite | 5 | One per floor, in the landing socket | Extracts the HomePlug signal from the riser, regenerates Wi-Fi for that floor, enforces admission locally |
| xKoin-Client | up to 40+ | Tenant phones and laptops | Attach, hold the key, sign receipts |

Three planes, cleanly separated:

**Bulk plane, HomePlug AV over the riser.** Ethernet bridged over 2 to 68 MHz OFDM on the building's own copper, roughly 10 Mbps of frame-level goodput in the protocol's working model (spec section 1) against a physical link rate that the adapter class advertises much higher. This is the plane that carries YouTube and TikTok. Demo D5 in the matrix exists precisely to prove it: 720p video and a live session through the HomePlug path, with a speed test screenshot.

**Control plane, KQ-130F narrowband PLC.** 120 to 135 kHz, 9600 baud UART, about 960 B/s. A 108-byte receipt fits in one frame. Receipts, telemetry and control ride this rather than competing with video on the bulk plane, and the narrowband carrier survives line conditions that knock HomePlug down.

**Survival plane, LoRa.** One SX1262 in the Node, one in each Node-Satellite. Its job in this building is not range; it is continuity when the bulk plane drops, and it is the path across a segment boundary. Demo D3 covers the case where a PLC filter or a transformer ends the mains segment: the power line does not cross, LoRa carries control between segments, and each segment keeps its own local bulk.

The landlord is the node operator. `nodeAdmin` in every ticket collected in this building is Njeri's address, and she claims earnings to it. Her role is space, power and a key, which is exactly the ask the landlord pitch makes (the `/landlord` page, pilot terms).

## 4. Internals: which primitives do the work

**Admission at the edge, not at the gateway.** A Node-Satellite verifies the voucher itself. It holds the same 32-byte kiosk public key, checks the Ed25519 signature in under 4.5 ms, and admits or refuses without asking the Node. A satellite that serves a client collects that client's receipts itself and uses the Node purely as backhaul, so relay topology never dilutes attribution (spec section 5). The fourth floor does not depend on the third floor being polite.

**The escrow deposit as the meter.** A tenant buys XKN with M-Pesa, deposits it into the escrow through the gasless permit path, and that one number is their balance at every device in the building and at every other xKoin node anywhere. The node grants each session a credit limit, the smaller of the last known deposit and a per-node cap, and settles at half the limit ([../how-it-works.md](../how-it-works.md) section 5.1). The tenant does not have a plan, a contract, or an expiry date.

**Receipts are the billing system.** There is no billing system. Every RECEIPT_INTERVAL of acknowledged bytes the tenant's client signs a cumulative receipt; the Node keeps the latest; the latest becomes an EIP-712 ticket; a batch of tickets settles on Base. Njeri's monthly statement is the sum of settlements to her operator address, and it is checkable by her against a public chain rather than against our word.

**Free LAN, in a block of flats.** Traffic that stays in the building is not metered. A tenant streaming from another tenant's phone, a building notice page, a cached update, a local chat: none of it enters the proof layer. This is also the part that keeps working when backhaul is gone, which is case 00.

**What a landlord is not.** She is not reselling her own bandwidth to tenants under a contract of supply. She is providing space and power for a node that carries metered traffic and earns for the bytes it carries. Whether that distinction survives contact with CA licensing is an open question for counsel and is not settled by phrasing it well ([../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 5).

## 5. A day in the life

A Wednesday in the block.

| Time | Event | Plane | Primitive |
|---|---|---|---|
| 06:20 | Early shift tenants attach on floors 1 and 2; vouchers from last night still valid (24 h) | HomePlug bulk, Wi-Fi attach | Voucher, Law 2 |
| 06:25 | Node reads deposits from the escrow through gateway-api for three clients; grants session credit limits | WAN | Escrow read, node rule |
| 08:00 | Building empties. Two clients remain, one working from home | HomePlug bulk | Receipts each interval |
| 12:40 | A new tenant on floor 4 connects, sees the captive portal, buys 50 KES by STK push | WAN | Bridge mint, voucher issued |
| 12:41 | Portal relays the permit deposit; meter funded with no ETH in the tenant's hands | Chain | Escrow depositWithPermit |
| 12:42 | She browses. Her Node-Satellite collects her receipts; her tickets name Njeri's address | HomePlug bulk | Receipt, ticket |
| 18:30 | Peak. Nineteen clients across five floors, four of them on video | HomePlug bulk | Medium scorer keeps bulk first |
| 18:55 | Floor 3 Node-Satellite sees HomePlug degrade as a welder runs two units away; narrowband PLC keeps receipts flowing | Narrowband PLC | Medium score, quarantine |
| 19:40 | A tenant runs low. Node settles her ticket, re-reads the deposit, sees it near zero, throttles | WAN, chain | J4 in how-it-works |
| 19:41 | Her app shows the balance and a buy button. She tops up 20 KES. Full service restored | WAN | Bridge, escrow |
| 21:10 | A tenant sends 100 KES of XKN to her brother on floor 2, gas paid by the operator | Chain | Relayed escrow transfer, option A |
| 23:30 | Node batches the evening's tickets: one call, many clients | Chain | settleTicketBatch |
| 01:00 | Nightly: the Node pre-caches common updates onto local storage for the free plane | Free LAN | No metering |

## 6. Economics, with conditions

Every figure here is conditional on a pricing decision that has not been made. The per-unit price is owner-set within an on-chain band for MVP, and the floor must clear measured backhaul cost before it is set (spec section 8). The landlord-facing page keeps its charts illustrative and unitless for this reason (the `/landlord` page, "What a month looks like"). The only shilling figures it shows are read straight out of the tracked proof snapshot and labelled as the placeholder price they are. That restraint is deliberate and this document keeps it.

What holds regardless of the price:

- The building's capital cost is one Node and five Node-Satellites, plus enclosure and surge protection. No trunking, no drilling, no contractor in the stairwell.
- The recurring cost is one backhaul subscription plus the node's own electricity draw, which is router-class rather than appliance-class. The landlord page answers the electricity question by offering to size the draw against the meter-room supply during the walkthrough, which is the correct answer because the draw has not been measured in a real installation.
  <!-- TODO: verify -->
- 5% of every settlement goes to the treasury and 95% to the operator, capped at 10% on chain and unable to be redirected by any key ([../papers/04-settlement-and-economics.md](../papers/04-settlement-and-economics.md)).
- The Drive tokenomics scenario A models a 12 unit building at a five-month payback (`docs/_drive/04-tokenomics-and-fiat-roi-financial-model.md`). It assumes a retail rate per gigabyte and an average spend per tenant per month, neither of which has been measured, and it uses an older device cost list. It is an illustration of the mechanism only.

The revenue shape is worth stating honestly. A block of 40 units does not produce 40 paying tenants. Some have fixed lines they are happy with, some will use the free LAN and never buy, and the paying set is the tenants whose current answer is mobile bundles. Sizing that fraction is what a pilot measures.

## 7. What could go wrong, and what answers it

| Risk | Answer | Mechanism |
|---|---|---|
| HomePlug will not cross the building's distribution board | Expected on some boards. LoRa carries control between segments and each segment keeps local bulk; a second Node-Satellite per segment is the fix | Demo D3, medium scorer |
| One tenant saturates the riser at 20:00 | Traffic shaping in the Node, plus per-session credit limits. Shaping policy is a node config decision the pilot must set, not a protocol guarantee | Node QoS, session cap |
| A tenant disputes a charge | Receipts are signed by the tenant's own key and settlements are public on chain. Neither the landlord nor we can inflate a counter | Laws 4 and 5 |
| A tenant attaches at several nodes at once and overspends one deposit | Contract pays each node at most what is deposited; the per-node session cap bounds any node's exposure | Law 6, node rule |
| Mains transients damage a Node-Satellite | Surge protection in the enclosure; bench safety rule is that the narrowband module is proven on 12 V DC first and only then on a strip behind an RCD | `docs/_plan/revamp-plan.md` section 3 |
| A landlord is told the network is an ISP-grade service | It is not offered as one. Service degrades with the mains and with backhaul, and the pilot terms say either side can end it with 30 days notice | the `/landlord` page, pilot terms |
| Conducted mains signalling between premises is regulated | Open. Which instrument governs it, CA, KEBS or Kenya Power, is question 4 for counsel and it matters more here than in any other case, because a block of flats is where a carrier crosses many meters | [../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 3 |

## 8. What would have to be true to pilot this

1. Demo D1 passed on a real riser, not an extension strip: a phone on a Node-Satellite's Wi-Fi opens the captive portal, buys, browses, and receipts tick on the Node.
2. Demo D5 passed on real backhaul: 720p video and a live streaming session through the HomePlug path, with a speed test screenshot.
3. A walkthrough of the actual building: unit count, a photo of the meter room, one contact person. That list is already the ask on the landlord page and it is the right one.
4. A KEBS answer on whether a device coupling to 230 V mains in customer premises needs certification before field use, independent of any radio question.
5. A written tenant-facing statement of what the service is and is not, including that balances live on a public chain.
6. One landlord willing to run a 30-day pilot with no setup bill and no lock-in, and one caretaker who will hold the key.
