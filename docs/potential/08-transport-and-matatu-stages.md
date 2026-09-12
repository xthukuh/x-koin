# 08. Transport and matatu stages

*A sacco office puts a Node on its own mains and a Satellite on the stage pole; drivers' phones carry fare and float receipts as class C over LoRa, and passengers waiting at the stage buy bulk video over the office HomePlug plane.*

## 1. The situation

A stage in Githurai 45, at the Thika Road end, worked by a sacco of about 90
vehicles on two routes into the city. The sacco has an office on the first
floor of the building behind the stage: a manager, Wilson Mburu, two clerks, a
counter where drivers settle, and a safe.

The stage itself is a strip of tarmac, a line of vehicles, touts calling routes,
and at any moment between forty and three hundred people waiting. Peak is
06:00 to 08:30 inbound and 17:00 to 20:30 outbound. Between those, it is quiet
enough to hear the radio.

Wilson's operational problem is that everything he needs to know lives in a
vehicle that is somewhere else. Which vehicles have departed, how much each
crew has collected, whether a driver has settled today, whether the fuel float
advanced this morning came back. The answers arrive when the vehicle arrives.

## 2. What breaks today

The cash reconciliation is the visible break. A crew collects fares, some of
them in cash and some by mobile money to a number, and settles at the counter
at the end of a shift. The clerk writes it down. Disputes about what was
collected and what was owed are routine and are resolved by seniority rather
than by record.

Digital fare collection has been tried across the sector repeatedly and has
mostly not stuck. <!-- TODO: verify --> The reasons given are usually about
crew incentives, and there is also a plain technical one: a fare device that
needs a data connection to authorise a fare does not work at a stage where two
hundred phones are competing for one cell sector at 07:15.

The passenger's break is simpler. They are standing at a stage for eleven
minutes with a phone and no reason to spend data, and the stage offers them
nothing.

The sacco's own office break is the one Wilson would pay to fix first: his
office internet is a mobile router that is slowest at exactly the hours when
every vehicle is reporting.

## 3. The xKoin composition

| Device | Count | Placement | Plane |
|---|---|---|---|
| xKoin-Node | 1 | Sacco office, on the office mains | Backhaul, admission, metering, settlement, LoRa to the stage |
| xKoin-Node-Satellite | 2 | Office counter area, and the shop at street level on the same mains segment | HomePlug bulk plane, Wi-Fi for the stage frontage |
| xKoin-Satellite | 1 | Stage pole, solar | LoRa coverage over the stage and along the first part of the route |
| xKoin-Client OTG dongle | 90, one per vehicle | Crew phone, on the vehicle's USB | Class C reach along the route with no mobile signal dependency |
| xKoin-Client | passengers | Phones | Attach for paid WAN at the stage |

Two products again, on two planes, and they do not compete.

**Class C for the sacco's own operations.** Fare receipts, float advances,
departure records and settlement confirmations are tens to a couple of hundred
bytes each. They ride native XKP frames with no IP (spec section 6,
[../papers/03-protocol-xkp.md](../papers/03-protocol-xkp.md)), over LoRa
from the vehicle to the stage Satellite to the office Node. A crew phone with
an OTG dongle has a data path along the first kilometres of the route whether
or not the cell sector is congested.

**Bulk video for passengers.** The office's HomePlug plane reaches the street
level shop and the stage frontage, and a passenger waiting eleven minutes can
buy metered WAN and watch something. This is demo D5's capability applied to a
captive, briefly-present audience. It is the revenue line.

The separation matters because the two audiences peak together. At 07:15 the
sacco needs its operational frames to get through and three hundred passengers
want video. Putting operations on the narrowband and LoRa planes and video on
the HomePlug bulk plane means the sacco's own traffic does not queue behind a
passenger's stream.

## 4. Internals: which primitives do the work

**Fare records as class C, and what they are not.** A fare record here is a
signed statement by the crew's client that a collection occurred: amount,
vehicle, route, sequence, signed Ed25519. It is an operational record for the
sacco, on the sacco's own node, and it is not a payment. No money moves on the
chain when a passenger pays a fare in cash. Building a fare payment rail is a
different product with a different regulator, and this composition does not
attempt it.

**Cumulative counters for a shift.** A crew's collections through a shift are a
cumulative counter with a monotonic sequence, exactly the shape the protocol
already uses. A frame lost while the vehicle is between Satellites loses
nothing, because the next frame carries the running total. A crew cannot replay
an earlier total to understate a shift, because sequences are monotonic
(Law 5), and cannot forge one, because the total is inside the signed bytes
(Law 4).

**Identity that survives a phone.** Law 1: the key is the account. A driver who
changes phones restores a seed. A driver who leaves the sacco has their node id
removed from the office's list. There is no account to deprovision at a
provider.

**Admission at the pole.** The stage Satellite verifies vouchers itself, in
under 4.5 ms, with no network (Law 2). A passenger who buys at 07:14 is
admitted at 07:14, not when a server answers.

**Attribution to one operator.** Every receipt collected anywhere in this
composition names the sacco's operator address (spec section 5), so the sacco
earns from passenger WAN traffic on its own hardware and claims it to its own
address ([../how-it-works.md](../how-it-works.md) J7). The sacco is a small
business with a bank account and a committee, which is a better operator
counterparty than most.

**The free LAN plane at a stage.** Route information, fares by destination,
departure order, a lost property notice: all local, all free. A passenger who
will never buy anything still gets something, and the stage gets a screen that
is not a printed board.

## 5. A day in the life

A Tuesday.

| Time | Event | Plane | Class |
|---|---|---|---|
| 05:15 | First vehicles arrive. Crews' dongles join the stage Satellite | LoRa | P0 |
| 05:30 | Clerk issues fuel float to four crews; each acknowledgement is a signed class C frame | LoRa | C |
| 06:00 | Inbound peak. Vehicles depart; each departure is one frame to the office Node | LoRa | C |
| 06:40 | A vehicle 3 km along Thika Road reports its first collections through the stage Satellite | LoRa | C |
| 07:15 | Stage crowded. Mobile sector congested. Sacco frames continue; they were never on the cell | LoRa | C |
| 07:16 | Eleven passengers buy WAN at the stage frontage; four are watching video | HomePlug bulk | Paid WAN |
| 07:30 | The free LAN route board updates: next departures, fares by destination | Free LAN | 0 |
| 09:00 | Quiet. Office uses the WAN for sacco administration | HomePlug, WAN | Paid |
| 12:30 | A crew settles at the counter. The clerk compares the cash against the shift's cumulative signed total | Local | 0 |
| 13:00 | A dispute: the crew says the total is wrong. The office shows the signed sequence. The argument is about the meter, not the memory | Local | Law 4 |
| 17:00 | Outbound peak. Same pattern, larger crowd, more paid WAN | Mixed | C and paid WAN |
| 20:45 | Peak ends. Node settles the day's passenger tickets in one batch | Chain | settleTicketBatch |
| 21:00 | Sacco's daily operational report compiled from signed frames, not from a notebook | Local | 0 |

## 6. Economics, with conditions

Every shilling figure is conditional on the pricing decision: owner-set within
an on-chain band for MVP, floor must clear measured backhaul cost (spec
section 8). This case has a second condition that is specific to it, and it is
the more important one.

**The passenger dwell time is unmeasured and it is the entire revenue
assumption.** How long a passenger waits, what fraction have a phone with
charge, what fraction will buy anything at all, and what they would spend in
eleven minutes: none of it is known. A stage looks like a large audience and
may be a very small market. Before any revenue claim is made for this case,
somebody stands at the stage with a clicker for a week. <!-- TODO: verify -->

Structural points that hold regardless:

- The sacco's operational traffic is free LAN and costs zero XKN at any price.
  Fare records, float, departures and settlement never enter the proof layer.
- The revenue line is passenger WAN only, and it is concentrated in about five
  hours of the day.
- Capital is one Node, two Node-Satellites, one Satellite and 90 dongles. The
  dongle count dominates and its per-unit cost is the number to get right.
  Indicative module prices in `hardware/bom.md` are part costs, not assembled
  dongle costs. <!-- TODO: verify -->
- Settlement is per batch, so a peak with two hundred paying clients costs one
  transaction fee, a fraction of a Kenyan cent on Base.

The sacco is also the most plausible buyer of the operational half on its own
terms. A sacco that would pay a monthly fee for reliable settlement records is a
different business model from selling passenger data, and it may be the better
one. That is a commercial question the pilot should test directly by asking
Wilson what he would pay for the 13:00 row in the timeline.

## 7. What could go wrong, and what answers it

| Risk | Answer | Mechanism |
|---|---|---|
| Crews resist a system that records collections | The oldest failure in this sector and not a technical one. A pilot that does not have crew buy-in before it starts will fail regardless of the protocol | Open, blocking |
| The fare record is presented as a payment rail | It is not one and must not be described as one. Fare payment would be a payment service with its own regulator | Stated position |
| A crew simply does not report a collection | Nothing in the protocol detects an unrecorded cash fare. The system records what is entered and proves it was not altered afterwards. That is a smaller claim than fraud prevention and it is the honest one | Law 4, limits stated |
| Vehicles pass out of LoRa range along the route | Expected beyond the first kilometres. Frames queue on the crew's client and deliver on return; cumulative counters mean nothing is lost | Cumulative counters |
| Duty cycle limits with 90 vehicles reporting | Real. 90 clients on one Satellite at peak is the densest LoRa case in this set, and the 1% duty cycle at SF7 constrains it. Kenyan rules unverified | [../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 2 |
| The stage pole Satellite is stolen or vandalised | Physical. It holds no funds; identity is a key and money is on chain | Law 1 |
| The sacco is treated as a licensed reseller for passenger WAN | Same open question as case 03, and it is the clearest commercial resale in this document. Counsel's answer on CA licence category decides it | [../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 5 |
| County or NTSA permissions for equipment at a stage | Not examined. A pole-mounted device at a public transport stage will need somebody's permission and we do not know whose | Open |

## 8. What would have to be true to pilot this

1. Crew buy-in, obtained before any hardware is installed. Every previous
   attempt in this sector that skipped this step failed at this step.
2. A week of passenger dwell-time observation at the actual stage, before any
   revenue model is built.
3. A LoRa range measurement along the first kilometres of the route from the
   pole position, with an RSSI log per kilometre.
4. TX power capped to the sub-band limit and a duty-cycle position for 90
   clients on one Satellite, confirmed by measurement and by counsel.
5. Written permission for the pole installation from whoever controls the
   stage.
6. A clear written statement to the sacco that fare records are operational
   records, not payments, and that unrecorded cash remains unrecorded.
7. Counsel's answer on CA licence category before passenger WAN is sold in a
   public place.
