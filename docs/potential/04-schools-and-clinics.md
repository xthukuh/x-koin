# 04. Schools and clinics

*A secondary school serves cached curriculum content on the free LAN at zero XKN, gives teachers a metered WAN allowance, and a dispensary a kilometre away pushes its monthly reporting upload at 02:00 when the node's backhaul is idle.*

## 1. The situation

Two institutions on the same feeder in a small town in Machakos County.

Mwanzo Secondary School: 640 students, 22 teachers, a computer room with 18 working machines donated three years ago, and a principal, Mr. Mutiso, whose recurrent budget has no line called internet. The school has a mobile router that a parent donated and a bundle the bursar buys when someone remembers.

The dispensary, a kilometre down the road: two nurses, one clinical officer, and Sister Mueni who is in practice the one who does the reporting. She enters the month's service data into a national health information system of the DHIS2 family and uploads it. When the upload fails she does it again, and when it fails on the last day of the reporting window she travels to the sub-county office with a memory stick. <!-- TODO: verify -->

## 2. What breaks today

The school and the clinic break in opposite directions, which is why they belong in one document.

The school's problem is volume with no money. 640 students want content, the content is largely the same content, and every student who opens it pulls it across a metered backhaul again. A school that buys enough data for a class to work is a school that has bought the same file forty times. So it does not buy enough, the computer room is used for typing practice, and the donated machines depreciate.

The clinic's problem is the opposite: almost no volume, but it must arrive. The monthly return is a few megabytes. The cost is trivial and the reliability is not. Sister Mueni is not short of data; she is short of a connection that works at the hour she is free to use it, which is after the last patient, when the cell is at its busiest.

Both institutions share a third problem. Neither can justify a fixed line for its own use, and neither has anyone whose job is to maintain one.

## 3. The xKoin composition

One Node at the school, one Satellite covering the road between them, one Node-Satellite in the clinic. The school's node is the gateway for both.

| Device | Count | Placement | Role |
|---|---|---|---|
| xKoin-Node | 1 | School admin block, mains, small UPS | Backhaul, cache storage, admission, metering, settlement |
| xKoin-Node-Satellite | 2 | School computer room; school staff room | HomePlug bulk plane from the admin block; Wi-Fi attach |
| xKoin-Satellite | 1 | On the school water tower, solar | LoRa link toward the clinic |
| xKoin-Node-Satellite | 1 | Clinic, on clinic mains | Local Wi-Fi at the clinic, admission for clinic staff |
| xKoin-Client | 22 teachers, 3 clinic staff | Phones and the computer room machines | Attach, sign |

The clinic is a kilometre away, so the mains does not connect the two buildings and HomePlug cannot bridge them. The link between them is LoRa: class C by default, and class B adaptive GFSK when the link score is strong enough (spec section 6, measured at 121.9 kbps goodput at GFSK 150k in simulation). The clinic's Node-Satellite gives the clinic its own local Wi-Fi and its own admission, with the school's Node as the settlement path.

**The cache is the product for the school.** The Node holds a local mirror of curriculum material, past papers, a text encyclopaedia, and whatever else the school chooses to put there. Anything served from that store is free LAN traffic: it never leaves the building, it never enters the proof layer, and it costs zero XKN however many times it is opened. Forty students opening the same revision paper is forty local reads and zero backhaul bytes.

## 4. Internals: which primitives do the work

**The free LAN plane, doing the heavy lifting.** The packet classifier routes local subnet traffic without metering and blocks WAN forwarding until a client presents a valid session. The cache sits on the local side of that boundary. There is no metering code in the path between a student and a cached file, so "free" is a structural fact rather than a price of zero ([../papers/04-settlement-and-economics.md](../papers/04-settlement-and-economics.md)).

**The teacher allowance.** Teachers are ordinary clients with ordinary escrow deposits. The school can fund a teacher's deposit directly using the relayed escrow transfer (option A in [../how-it-works.md](../how-it-works.md) section 5.1): the school signs an EIP-712 authorisation, the kiosk relays it and pays the gas, and value moves between two deposit entries with no ETH anywhere near a teacher. A monthly allowance is one relayed transfer per teacher. When a teacher exhausts it the node throttles and the teacher can top up from their own M-Pesa, which the school neither pays for nor administers.

**Off-peak scheduling for the clinic.** The Node knows its own backhaul cost and its own load. A clinic upload queued as a background job runs at 02:00, when the node has no other clients and the cell site is empty. Nothing in the protocol requires this; it is a node policy that the free and paid planes make possible, because the clinic's traffic is paid WAN and the school's cache is not, so the two are not competing for the same budget at 20:00.

**Receipts and attribution across two buildings.** The clinic's Node-Satellite collects the clinic clients' receipts itself and uses the school's Node as backhaul (spec section 5). If the school and the clinic ever want separate operator addresses, that is a config change, not an architecture change, because attribution follows whoever collected the signed receipts.

**What the clinic must never depend on.** Patient care does not go over this network. The composition carries a monthly statistical return and staff browsing. Anything time-critical or clinical belongs on a path with a service guarantee, and this network offers none.

## 5. A day in the life

A Wednesday in term time.

| Time | Event | Plane | Cost |
|---|---|---|---|
| 02:00 | Clinic's queued monthly return uploads over the LoRa link to the school Node, then to WAN | Class B GFSK, then WAN | Metered, small |
| 02:40 | Node pulls overnight cache refresh: curriculum updates, a news text mirror | WAN | Metered to the school's own operator account |
| 07:30 | Staff room fills. Six teachers attach, present vouchers | HomePlug bulk, Wi-Fi | Voucher verified offline |
| 08:20 | Form 3 double period in the computer room. 18 machines open the same cached past paper | Free LAN | 0 |
| 08:21 | Node WAN counter does not move. Eighteen reads, zero backhaul bytes | Free LAN | 0 |
| 10:00 | A teacher opens a video on the public internet for a lesson | Paid WAN | Metered, receipt signed |
| 11:15 | Clinic: Sister Mueni looks up a drug interaction reference from the local cache | Free LAN, over LoRa | 0 |
| 13:00 | Clinic staff phone checks a supplier price | Paid WAN via the school Node | Metered |
| 14:30 | Students use the cached encyclopaedia for a research task. 40 clients, all local | Free LAN | 0 |
| 16:45 | A teacher's allowance runs out; node throttles, app shows the balance | WAN | J4 |
| 16:50 | She tops up 30 KES from her own M-Pesa. Service restored | WAN, chain | Bridge, escrow |
| 18:00 | School empties. Node idles | none | 0 |
| 21:00 | Node settles the day's tickets in one batch | Chain | One batch fee |
| 23:30 | Clinic queues tomorrow's upload; it will run at 02:00 | Queued | 0 until it runs |

Six paid rows and seven free ones, and the free ones carried most of the users.

## 6. Economics, with conditions

Every shilling figure is conditional on the pricing decision, owner-set within an on-chain band for MVP, with a floor that must clear measured backhaul cost (spec section 8). For an institution the relevant number is not a rate per gigabyte; it is the ratio of cached reads to backhaul bytes, and that ratio is site-specific and must be measured.

What is structural:

- Cached content costs zero XKN and zero gas at any price, because it never enters the proof layer. A school's dominant traffic is therefore outside the pricing question entirely.
- The school's backhaul cost does not scale with student count. It scales with cache misses. That is the single economic claim worth making for this case, and it is testable: run the computer room for a week and read the Node's WAN counter.
- The clinic's monthly upload is a few megabytes. At any price inside the band, its cost is small. Its value is not avoiding a data charge; it is avoiding a journey to the sub-county office.
- A school is a poor node operator by revenue and a good one by utility. It will not earn meaningfully from 640 students who pay nothing. Presenting a school pilot as a revenue case would be dishonest; it is a demonstration case and a community case.

Who pays for the hardware is an open question with no technical answer. A school with no internet line in its budget has no capital line either. Donor funding, a county programme, or the operator carrying the cost against later paid traffic are the three shapes, and none of them has been tested.

## 7. What could go wrong, and what answers it

| Risk | Answer | Mechanism |
|---|---|---|
| Students find a way to reach the public internet through the cache | WAN forwarding is blocked until a valid session exists; the classifier is the boundary, not a filter list | Packet classifier, Law 2 |
| A teacher's key is on a phone that is shared or lost | The key is the account (Law 1). Recovery is the 12 word seed; a school allowance lost with a phone is a real loss until the seed is restored | [../how-it-works.md](../how-it-works.md) J10 |
| The clinic's upload fails silently | Cumulative counters and queue state are on the Node, which can report a failed job; the upload is not fire and forget. The alerting is node software work, not protocol | Node job queue |
| The LoRa link between school and clinic is blocked by terrain | Measured, not assumed. A site survey with an RSSI log before any promise is made to the clinic | Demo D2 method |
| Cached content is copyright infringing | Real and unaddressed by any protocol mechanism. The school chooses the content and the licence position is the school's and ours to settle before a pilot | Open |
| Child safety on a school network | Content filtering is a node policy requirement for any school deployment and is not in the protocol. It must be specified before students attach | Open |
| Health data leaves the clinic over our network | The monthly return is aggregate statistics, not patient records, and the pilot must confirm that with the facility in writing before carrying anything | Open |

## 8. What would have to be true to pilot this

1. A measured cache hit rate at a real school over a real week. It sets both the value claim and the backhaul price floor input.
2. A site survey of the school-to-clinic LoRa path with an RSSI log, before any commitment to the clinic.
3. A content filtering policy and the software to enforce it, agreed with the school before students attach.
4. A written statement from the facility about what data may cross the network, and confirmation that clinical and patient-identifying traffic will not.
5. A funder for the capital cost, because neither institution has one.
6. Counsel's view on whether serving a school and a clinic under a community network arrangement changes the CA licensing position ([../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 5).
7. TX power capped to the sub-band limit before the water tower Satellite is left running.
