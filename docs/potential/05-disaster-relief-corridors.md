# 05. Disaster relief corridors

*After a landslide closes a valley in Murang'a, a response team drops solar Satellites along the road, hops class C traffic across the break, and works on pre-issued vouchers whose settlement waits until somebody has a connection again.*

## 1. The situation

The Mathioya valley, Murang'a County, after three weeks of long rains. A hillside above the road gives way overnight. The road is cut in two places, a section of the low-voltage distribution line comes down with it, and the small town on the far side of the break loses power and its usable mobile signal within the day, because the site that serves it is fed from the line that fell.

Joseph Kariuki is a Kenya Red Cross branch volunteer coordinator. He has done this before: floods along the Tana, a bus off the road at Sagana, a building collapse. His working problem in the first 48 hours is never a shortage of people. It is that the people are distributed along a corridor, out of contact with each other, and every piece of information has to travel by somebody driving or walking it.

## 2. What breaks today

The first 48 hours of a response are dominated by coordination, and coordination is exactly what a broken corridor removes.

Terrestrial coverage is gone in the places the response needs it. Cell sites run on their own reserve and then stop. Where the backhaul to the site was carried on the same infrastructure that failed, the site is useless even while it has power.

Satellite terminals exist and work and are slow to arrive, expensive per deployment, and limited in number. A branch coordinator does not have one in the boot of his car.

Handheld VHF radios cover the voice case and nothing else. They do not carry a beneficiary list, a stock count, a photograph, or a payment.

The money breaks with everything else. Cash-based response, which is now the default instrument in Kenyan emergencies, needs a working payment rail. Mobile money without a network is a promise. <!-- TODO: verify -->

## 3. The xKoin composition

Nothing in this composition is installed. Everything is carried, dropped and retrieved.

| Device | Count | How it is deployed | Plane |
|---|---|---|---|
| xKoin-Satellite | 5 to 8 | Dropped on high ground along the corridor at LoRa spacing; solar panel and 18650, no mains | LoRa survival plane, relay |
| xKoin-Node | 1 | At the forward base, on a generator or a vehicle supply, with whatever backhaul exists there | Backhaul, admission, metering, settlement queue |
| xKoin-Node | 1 | On the far side of the break, if a working backhaul exists there instead | Second settlement path |
| xKoin-Client OTG dongle | 6 to 12 | One per team, on a responder's phone | Direct LoRa reach, no Wi-Fi, no mains |
| xKoin-Client | per responder | Phones | Attach, sign, message |

The deployment procedure is the product. A Satellite is a sealed box with a panel and a magnet or a strap. A volunteer places it where a phone shows a line of sight along the valley, switches it on, and it BEACONs. The next Satellite placed within range joins. The mesh grows by walking.

Frames carry a TTL decremented at each relay (spec section 2), so a chain of Satellites across the valley is a chain of hops with a bounded depth, not a broadcast storm.

**Pre-issued vouchers.** Before a deployment, the kiosk root key signs vouchers for the responders' addresses. A voucher is an offline-verifiable Ed25519 signature over address, amount, reference, issue time and expiry. A responder who has never had a connection since leaving Nairobi is admitted at a Satellite in the valley, because admission asks nothing of the internet (Law 2). The standard expiry is 24 hours; a response deployment needs a longer one, which is a field in the voucher and a policy decision, not a code change.
<!-- TODO: verify -->

## 4. Internals: which primitives do the work

**Class C is the whole service.** Native XKP frames with no IP ([../papers/03-protocol-xkp.md](../papers/03-protocol-xkp.md)). A team position report, a stock count, a beneficiary identifier, a short message, a request for fuel: each is tens to a couple of hundred bytes. They fit LoRa SF7 payloads directly. Class A distilled web is technically available at roughly 21.9 seconds per page on SF7 and is not what a corridor is for. Video is not offered.

**Settlement waits, and nothing is lost.** The Node holds one latest receipt per client and one settlement queue. During a deployment there may be no backhaul at all for days. Receipts accumulate, tickets map from the latest receipt, and the first time any Node in the chain reaches the internet, one `settleTicketBatch` call carries every client's final cumulative counter. Law 5 makes replay worthless and Law 6 caps every payment at what was actually escrowed, so a long offline period creates no reconciliation work and no exposure beyond the offline cap per client.

**Attribution across a moving mesh.** A Satellite that serves a client collects that client's receipts itself (spec section 5), so a corridor whose topology changes daily as boxes are moved still attributes correctly. The relay path is irrelevant to who is owed.

**Meshtastic interoperability.** LoRa BEACONs keep Meshtastic framing for discovery (spec section 2). Responders who already carry Meshtastic handsets, which is not unusual in Kenyan search and rescue circles, can discover the mesh. Full protocol interoperability is not claimed; discovery is.
<!-- TODO: verify -->

**The honest limit.** This composition carries coordination traffic. It does not carry a video call from a collapsed building, it does not replace a satellite terminal, and it is not an emergency communications system in any regulated sense. Its claim is narrower: a corridor of cheap solar boxes that keeps text-sized information moving when nothing else does, and that bills correctly afterwards without anyone keeping a ledger.

## 5. A day in the life

Day two of a response.

| Time | Event | Plane | Primitive |
|---|---|---|---|
| 05:30 | Forward base set up at the near end of the break. Node on the generator, backhaul intermittent on one bar | Mixed | P0 discovery |
| 06:10 | Two volunteers walk the road placing Satellites 1 and 2; each BEACONs and joins | LoRa | Frame relay, TTL |
| 07:00 | Satellite 3 placed on the ridge; the far side of the break is now two hops away | LoRa | Medium scorer |
| 07:20 | Assessment team on the far side is admitted on a pre-issued voucher, no connection ever needed | LoRa | Law 2 |
| 07:45 | First structured report crosses the break: households affected, road status, water status | Class C | XKP DATA, receipts |
| 09:00 | Generator fuel request goes back the other way | Class C | DATA_ACK |
| 10:30 | Base backhaul drops entirely. Nothing on the corridor changes | LoRa only | Cumulative counters |
| 12:00 | A team's phone battery dies; their OTG dongle moves to a colleague's phone. Same mesh, new client key | LoRa | Law 1 |
| 14:00 | Beneficiary list for a cash transfer is relayed in chunks as class C, signed at each stage | Class C | Receipts, Law 4 |
| 16:40 | Satellite 2's battery is low after an overcast day; the mesh reroutes via 1 and 3 | LoRa | Medium score, quarantine |
| 19:00 | Still no backhaul. 1,400 frames carried today, nothing settled, nothing lost | LoRa | Settlement queue |
| Day 4, 11:00 | A team reaches a town with signal. Its Node drains the queue in one batch | Chain | settleTicketBatch |
| Day 4, 11:01 | Every responder's cumulative counter settles once. No duplicates, no arguments | Chain | Laws 5 and 6 |

## 6. Economics, with conditions

This is the case where the economics should be stated most carefully, because the temptation to oversell is largest.

Every shilling figure is conditional on a pricing decision that has not been made (spec section 8). Beyond that, a relief corridor has a further condition: it is not clear that responders should be metered at all. The protocol requires signed receipts for WAN service; it does not require that anyone bill a volunteer. Three shapes are possible and only one is recommended:

1. **Pre-funded organisational deposit, recommended.** The responding organisation funds one escrow deposit and relays transfers into each responder's deposit before deployment (option A in [../how-it-works.md](../how-it-works.md) section 5.1). Responders never see a price. The organisation sees one settlement statement afterwards, on a public chain, which is exactly the accountability an audited body wants.
2. **Free corridor, no metering.** Configure the corridor as free LAN only: class C messaging between responders never leaves the mesh, so no WAN service is provided and nothing is metered. Simplest, and it works whenever the corridor does not need the public internet.
3. **Responders pay individually.** Not recommended. Billing volunteers in an emergency is the wrong product.

Capital cost is five to eight Satellites, one or two Nodes and a set of dongles. Indicative module prices are in `hardware/bom.md`, are part costs rather than field-ready kit costs, and a field-ready sealed enclosure with a mount has not been costed. <!-- TODO: verify -->

The one hard economic statement: on-chain cost for a four-day offline deployment is one batch settlement, a fraction of a Kenyan cent on Base, because only the latest counter per client ever mattered.

## 7. What could go wrong, and what answers it

| Risk | Answer | Mechanism |
|---|---|---|
| The network is presented to an authority as emergency communications | It must not be. It is a coordination mesh with no service guarantee, no priority access, and no regulatory status. This has to be stated in writing before any deployment | Open, policy |
| Vouchers pre-issued with a long expiry become a standing free-admission set | Blast radius of the kiosk root key is free admission, never fund theft. Long-expiry response vouchers widen that window and should be a separate key or a separate batch that can be retired | Spec section 8 |
| A Satellite is lost, stolen or buried | It holds no funds. Identity is a key; the money is in the escrow on chain | Law 1 |
| Frames are corrupted by the relay chain | Magic, length and CRC16 at the frame, crypto above it; 0 of 20,000 garbage frames accepted in test S5 | Law 8 |
| A responder's client stops signing receipts | Node extends at most twice the receipt interval of unproven credit. In a relief context the node should be configured to serve regardless, which means configuring it as free LAN, not as unmetered WAN | Law 3 |
| Duty cycle rules are breached by a busy corridor | Real. A corridor carrying continuous class C over several hops is exactly the sustained-transmission case the 1% limit constrains. Kenyan rules are unverified and TX power is currently above the 25 mW sub-band ceiling | [../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 2 |
| An organisation's deployment data crosses our infrastructure | Frames can be encrypted (flag bit1 in the frame header). What the organisation's data protection obligations require of us is an open question for their counsel and ours | Spec section 2, open |

## 8. What would have to be true to pilot this

1. A humanitarian partner who will run a tabletop exercise first, then a planned-event deployment such as a marathon or a county exercise, before any real emergency.
2. A field enclosure: sealed, mountable in a minute by a volunteer, with a visible state indicator and a battery that survives an overcast week.
3. Demo D2 passed, then a real multi-hop range test in a valley, with an RSSI log at each hop.
4. TX power capped to the sub-band limit and a duty-cycle position confirmed by counsel, because a relief corridor is the deployment most likely to be noticed and the least defensible if it is non-compliant.
5. A written statement, agreed with the partner, that the mesh is not an emergency service and carries no guarantee.
6. A decision on which economic shape applies, with option 1 or option 2 above configured before deployment, never left to be decided in the field.
