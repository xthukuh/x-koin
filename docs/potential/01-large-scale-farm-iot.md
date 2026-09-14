# 01. Large-scale farm IoT

*A 400 acre farm in Laikipia puts soil, tank, pump and gate sensors on the free LAN plane over LoRa, spends zero XKN on telemetry for the life of the deployment, and pays only for the farm manager's WAN traffic.*

## 1. The situation

Segera, Laikipia, twenty minutes off the Nanyuki to Rumuruti road. Peter Kirimi manages 400 acres for an absentee owner: 120 acres under pivot-irrigated wheat, a block of lucerne, grazing for 300 head, four boreholes, two 50,000 litre storage tanks and a network of gate valves that decide which block gets water on which day. He drives between them. His working day is measured in kilometres of farm track, and most of that driving exists to answer questions a sensor could answer: is the tank full, did the pump trip overnight, is block seven dry.

The farmhouse has electricity and a mobile signal that is usable on the veranda and unusable behind the store wall. The far corner of the property, where the third borehole sits, has neither. There is no prospect of either arriving.

## 2. What breaks today

The obvious answer, a cellular IoT SIM per sensor, fails on three counts at once and the third is the one that kills it.

Coverage is the first. A SIM-based sensor at the third borehole has no network, so the exact places where driving costs the most are the places the sensors cannot report from.

Cost is the second. A machine-to-machine SIM carries a monthly line rent whether or not the sensor says anything. Twenty sensors is twenty recurring lines for a payload that totals a few kilobytes a day.

The third is the one operators actually feel: every sensor becomes a billing relationship. Somebody renews twenty SIMs, chases twenty bundle expiries, and explains why block seven went quiet on the 30th. A soil probe that stops reporting because an unrelated bundle lapsed is worse than no soil probe, because the manager stopped driving out to look.

LoRaWAN with a private gateway removes the SIMs and is the right shape, but it answers only the telemetry half. Peter still needs a working internet connection for the co-operative portal, the vet, the weather service and the bank, and a LoRaWAN gateway does not provide one.

## 3. The xKoin composition

One farm, one Node, one Satellite per irrigated field, and third-party class sensors that ride the free plane.

| Device | Count | Placement | Power | Plane it carries |
|---|---|---|---|---|
| xKoin-Node | 1 | Farmhouse office, on mains | Mains, small UPS | Backhaul in, Wi-Fi for the house, LoRa for the fields, metering |
| xKoin-Satellite | 4 | One per irrigated block, on a post | 10 W panel, 3400 mAh 18650 | LoRa survival and free LAN plane, relay for sensors out of Node range |
| LoRa ecosystem devices | 18 | Soil probes, tank floats, pump current sensors, gate position switches | Small panel or primary cell | Class C telemetry only, free LAN plane |
| xKoin-Client | 2 | Peter's phone, the owner's phone when visiting | Phone battery | Attach over Wi-Fi at the house, paid WAN |
| xKoin-Client OTG dongle | 1 | In the pickup | Vehicle USB | Direct LoRa reach from anywhere on the property |

Two planes and one rule. Everything a sensor says travels the free LAN plane and costs nothing, forever. Everything that leaves the farm for the public internet is paid WAN, and on this property that is one manager's phone and a laptop, not twenty sensors.

The dongle in the pickup is the part that changes the working day. It is an ESP32-S3 with native USB and an SX1262 on a USB-C OTG lead ([../papers/08-hardware-client-and-otg-dongle.md](../papers/08-hardware-client-and-otg-dongle.md)), which gives Peter's phone a LoRa radio wherever the pickup is. He reads tank levels at the far borehole without a mobile signal, because the reading is not coming over a mobile network.

## 4. Internals: which primitives do the work

**The free LAN plane, and where the boundary sits.** The Node's packet classifier separates local traffic from WAN traffic. Local traffic is routed without metering; WAN traffic is blocked until the client presents a valid session, then counted. A sensor reading that goes from a probe in block seven, over LoRa, through a Satellite, to the Node's dashboard, is local at every hop and is never counted. This is not a discount or a tariff; there is no metering code in that path at all. See [../papers/04-settlement-and-economics.md](../papers/04-settlement-and-economics.md).

**Class C, and why telemetry is the easy case.** Class C is native XKP frames with no IP (spec section 6). A soil moisture reading plus temperature plus a node id and a sequence is tens of bytes, and a LoRa SF7 payload is 226 bytes. The whole farm's telemetry for an hour fits in a handful of frames. The duty cycle constraint that makes class A web browsing slow is close to irrelevant at this payload size, which is why farm IoT is the demo that passes first (D6 in the demo matrix).

**Identity without an account table (Law 1).** Every device, sensor included, is a node id derived as the first eight bytes of the SHA-256 of its Ed25519 public key. Adding a soil probe to the farm is flashing a key onto it. There is no registration, no provisioning portal, and nothing to renew. Removing a probe is removing it.

**Beacon compatibility.** LoRa BEACONs keep Meshtastic framing for discovery (spec section 2). A farm that already has Meshtastic handsets can see the mesh and be seen by it, which matters on a property where the workers who open the gate valves already carry radios.

**Receipts, absent.** No receipt is generated for LAN traffic, so no ticket is mapped, so no settlement happens, so no gas is spent. The reason the free plane is genuinely free rather than nominally free is that the proof layer is never entered. A design that metered everything and then refunded local bytes would be paying gas to hand money back.

**Where XKN does appear.** Peter's phone browsing the co-operative portal generates receipts like any other client, and those receipts name the farm's own operator address. The farm is its own node operator, so the WAN fee that would otherwise go to a third party goes to the farm's own earnings balance, less the 5% treasury fee. The farm pays its own backhaul in cash and pays itself in XKN, which nets to "the farm buys a bundle", with an audit trail.

## 5. A day in the life

A Tuesday in the dry season.

| Time | Event | Plane | Cost in XKN |
|---|---|---|---|
| 04:30 | Borehole pump three starts on its timer; current sensor reports running | Free LAN, LoRa | 0 |
| 05:10 | Tank two float crosses 80%; Satellite relays to the Node | Free LAN, LoRa | 0 |
| 06:00 | Node dashboard on the farmhouse screen shows overnight soil moisture for all four blocks | Free LAN | 0 |
| 06:40 | Peter's phone, on farmhouse Wi-Fi, opens the weather service | Paid WAN | Metered, receipt signed |
| 07:15 | Pump three draws high current for 90 seconds then drops to zero; sensor reports the trip | Free LAN, LoRa | 0 |
| 07:16 | Node raises an alert on the dashboard and to Peter's phone over the LAN | Free LAN | 0 |
| 07:20 | Peter drives to borehole three instead of block one. The drive was caused by data, not by a schedule | none | 0 |
| 08:05 | At the borehole, out of Wi-Fi and out of mobile coverage, the OTG dongle gives his phone the mesh. He reads the tank and the two neighbouring probes | Free LAN, LoRa | 0 |
| 11:00 | Block seven soil probe reports below the irrigation threshold | Free LAN, LoRa | 0 |
| 11:02 | Gate position sensor confirms the valve opened | Free LAN, LoRa | 0 |
| 14:30 | Peter uploads a stock movement to the co-operative system from the office | Paid WAN | Metered |
| 17:45 | Node settles the day's tickets in one batch: one client, one operator | Chain | One batch fee |
| 22:00 | Eighteen sensors report their evening cycle. Nothing settles, because nothing was owed | Free LAN | 0 |

Two settled rows in a day of forty events. That ratio is the case.

## 6. Economics, with conditions

Shilling figures below are conditional on the pricing decision. The per-unit price is owner-set for MVP within an on-chain band, and the floor must clear measured backhaul cost before it is set (spec section 8). Nothing here should be read as a quotation.

The structural facts do not depend on the price:

- Telemetry cost is zero XKN and zero gas, at any price, because the free LAN plane never enters the proof layer. A price change cannot make eighteen sensors expensive.
- The recurring cost of the deployment is one backhaul subscription and the farm's electricity, not eighteen M2M lines. Removing the per-sensor recurring cost is the saving, and it scales with sensor count while the alternative's cost scales with sensor count in the wrong direction.
- Capital cost is one Node, four Satellites and eighteen sensor nodes. Indicative module prices are in `hardware/bom.md`; they are per-unit part costs from scouted listings, not an installed price, and no assembly, enclosure, mounting or labour is in them. <!-- TODO: verify -->
- The Drive tokenomics document sketches a rural agri-mesh scenario with a three-month payback (`docs/_drive/04-tokenomics-and-fiat-roi-financial-model.md` scenario B). It assumes a telemetry subscription per farm and a retail data price, neither of which is settled. Do not quote it without both conditions.

One honest negative: this composition does not reduce the farm's WAN bill much, because the farm's WAN traffic was small to begin with. The value is in the telemetry the farm could not previously afford to collect and in the driving it removes, and both of those are operational savings that a pilot must measure on the farm rather than assert here.

## 7. What could go wrong, and what answers it

| Risk | Answer | Mechanism |
|---|---|---|
| Someone parks a laptop on the free LAN and expects free internet | The classifier blocks WAN forwarding until a valid session exists. Free means local, and the boundary is code, not policy | Packet classifier, Law 2 |
| A cheap sensor floods the mesh with beacons to earn something | Beacons earn zero. Pay is strictly per verified signed byte of WAN service; presence pays nothing | Spec section 7, economic security |
| A sensor's frames are corrupted by inverter noise near the pump | Magic, length and CRC16 drop the frame at the medium; the next cycle reports | Law 8 |
| Someone spoofs a tank-full reading to stop irrigation | Frames carry a source node id bound to a key, and a farm can require signed telemetry from known ids. This is a firmware policy, not a Law, and the pilot must set it | Law 1 plus node config |
| A Satellite's battery fails during two overcast days | The 10 W panel and 3400 mAh cell are sized for that ride-through at under 40 mA average; the sizing is in `hardware/pinmap.md` and must be confirmed on the bench | Power budget |
| Sustained LoRa transmission breaches Kenyan duty-cycle rules | Real risk. Telemetry duty cycle is low, but the rules are unverified and TX power is currently set above the 25 mW sub-band ceiling | [../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 2, open |

## 8. What would have to be true to pilot this

1. Demo D6 passed: soil moisture and temperature arriving at the Node dashboard from a separate sensor node, with zero XKN spent, shown on a counter that stays at zero.
2. A measured LoRa link budget on the actual property, not on the bench. Four blocks and a borehole in Laikipia is a terrain question, and the answer is a site survey with an RSSI log.
3. TX power capped to the sub-band limit before any device is left on a post overnight.
4. A Satellite enclosure that survives a Laikipia dry season and the rains that follow it: dust ingress, thermal cycling, and something that does not invite theft of a solar panel.
5. A farm owner who will accept that the telemetry is theirs and the mesh is ours during the pilot, with the maintenance obligation written down.
6. Counsel's answer on whether a private farm mesh carrying only its own telemetry sits outside transit-resale licensing entirely. It probably does, and "probably" is not an answer ([../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 5).
