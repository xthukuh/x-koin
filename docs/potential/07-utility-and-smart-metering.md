# 07. Utility and smart sub-metering

*The narrowband PLC plane that already carries receipts can carry a landlord's own water and sub-meter readings on the same copper, producing signed tenant statements; it is not an interface to Kenya Power and does not claim to be.*

## 1. The situation

Kasarani, Nairobi. Samuel Ochieng owns a 28 unit block. Each unit has its own
Kenya Power prepaid token meter, so electricity is not his problem. Water is.
The block has one bulk water connection, one storage tank, one borehole pump,
and 28 households whose consumption he recovers through a flat charge in the
rent because he has no way to measure it.

He knows the flat charge is wrong in both directions. The single occupant on
the ground floor subsidises the family of six on the third. He also knows the
bulk bill and the sum of what he imagines people use do not reconcile, and that
the gap is some mixture of a leak, the pump running when it should not, and the
tap in the yard that nobody owns.

He has priced water sub-meters twice. Both quotes were dominated by running a
cable to each unit or by a per-meter radio module with its own battery and its
own commissioning visit.

## 2. What breaks today

Sub-metering breaks on installation cost and on trust, in that order.

Wiring a data cable to 28 meters in a finished building is the same trunking
problem as case 02 and it is the reason most landlords never do it.

Wireless sub-meters remove the cable and add a battery per meter, a
commissioning step per meter, and a proprietary reader that belongs to whoever
sold the system. The landlord is then locked to one supplier for consumables
and firmware.

Trust is the failure that survives the first two. A landlord-owned meter
produces a landlord-controlled number, and a tenant has no way to check it. The
dispute is not technical. It is that one party holds the instrument and the
record, and the other party pays the bill.

Manual reading, the actual default, breaks on labour and on error. Somebody
walks the block with a notebook once a month and transcribes 28 numbers.

## 3. The xKoin composition

The insight is that the copper is already carrying a data plane. The KQ-130F
narrowband carrier that moves receipts and control between the Node and the
Node-Satellites is a 120 to 135 kHz FSK signal at 9600 baud, about 960 bytes
per second, on the building's own wiring (spec section 1). A meter reading is
tens of bytes. The plane is already there and is nowhere near full.

| Device | Count | Placement | Role |
|---|---|---|---|
| xKoin-Node | 1 | Meter room | Already present for case 02. Collects readings, signs statements, backhaul |
| xKoin-Node-Satellite | 3 | Landings | Already present. Relay the narrowband carrier along the riser |
| Meter interface node | 28 | At each unit's water meter, on the unit's own socket | Pulse or encoder input from the meter, KQ-130F out onto the mains |
| Bulk and pump node | 2 | Bulk inlet meter, pump contactor | Bulk reading and pump run hours |

The meter interface node is a small board: an ESP32 class microcontroller, a
KQ-130F, and a pulse input. It has no battery, because it sits on a socket. It
has no radio to commission, because its medium is the wire it is plugged into.
Its identity is an Ed25519 key, so commissioning is powering it on.

**What this is not.** It is not an interface to Kenya Power's metering. It does
not read a KPLC token meter, it does not talk to KPLC's head end, it is not
approved by anyone to do either, and it does not inject anything onto a KPLC
feeder beyond the customer's own installation. Everything in this case happens
on the landlord's side of the point of supply, measuring the landlord's own
water. Saying this once clearly is worth more than any feature in the case.

## 4. How this differs from KPLC AMR

Automated meter reading as a utility runs it and sub-metering as a landlord
runs it are different systems with different owners, and confusing them is the
main risk in this document.

| Dimension | KPLC AMR | xKoin sub-metering |
|---|---|---|
| Who owns the meter | The utility | The landlord |
| What is measured | The billed supply at the point of supply | The landlord's own water, and the landlord's own downstream consumption |
| Regulatory status | Licensed, type-approved metering under EPRA and KEBS rules | No status; a private measurement of a private resource <!-- TODO: verify --> |
| Where the data goes | The utility's head end | The landlord's node, and the tenant's own signed statement |
| Legal effect of the reading | Enforceable for a billed supply | Evidence for a private arrangement between landlord and tenant, no more |
| Communications path | Utility-owned, over the distribution network | Customer-side wiring only, behind the meter |

The comparison matters because a landlord will ask whether this replaces the
KPLC meter. It does not, it cannot, and any implication that it might is both
false and a route to a regulatory problem we would deserve.

## 5. Internals: which primitives do the work

**The narrowband plane, already paid for.** Case 02 puts a KQ-130F in the Node
and in each Node-Satellite for receipts and control. Meter telemetry is the
same frame format on the same carrier (spec section 2), medium-agnostic by
construction. Adding metering adds no new medium and no new protocol
([../papers/06-hardware-node-satellite.md](../papers/06-hardware-node-satellite.md)).

**Free LAN, so metering is never a running cost.** A meter reading travels from
a socket to the meter room. It never leaves the building, so the classifier
never meters it and no receipt, ticket or settlement is created. Sub-metering
costs zero XKN and zero gas, forever, at any price. This is the same structural
property as case 01.

**Law 1 as a commissioning story.** The meter node's identity is the first eight
bytes of the SHA-256 of its Ed25519 public key. There is no pairing, no
address assignment, no installer app. Mapping node id to unit number is one
line in the landlord's configuration, entered once.

**Signed statements, which is the trust answer.** A meter node signs its
reading. The Node stores the signed reading, not a transcribed number. A
tenant's monthly statement can therefore carry the signed readings that produced
it, and a tenant who keeps the meter node's public key can verify that the
landlord did not edit the number. Law 4 applies to a meter reading exactly as
it applies to a receipt: a forged counter is a broken signature.

This does not make the reading true. A signature proves the number came from
that device and was not altered; it says nothing about whether the meter is
accurate or whether somebody put a magnet on it. Physical meter integrity is a
separate problem with separate answers, and we should not let a cryptographic
property stand in for a metrological one.

**Cumulative counters, again.** A water meter is a cumulative counter by nature,
which is the same shape the protocol already uses for bytes. A lost reading
loses nothing, because the next reading carries the running total. There is no
gap to interpolate and no month to re-read.

## 6. A day in the life

A Monday in the block.

| Time | Event | Plane | Cost |
|---|---|---|---|
| 00:05 | All 28 meter nodes report their cumulative reading; the Node stores 28 signed values | Narrowband PLC | 0 |
| 00:06 | Bulk inlet node reports. Node computes bulk minus the sum of units | Narrowband PLC | 0 |
| 05:40 | Pump starts; run-hours counter increments | Narrowband PLC | 0 |
| 06:00 | Morning peak. Readings every 15 minutes during peak hours | Narrowband PLC | 0 |
| 09:30 | Unit 14 shows continuous flow since 02:00 with no peak shape. Node flags a probable leak | Free LAN | 0 |
| 09:35 | Samuel gets the flag on his phone over the building LAN | Free LAN | 0 |
| 10:00 | Caretaker checks unit 14: a cistern valve passing. Fixed in twenty minutes | none | 0 |
| 14:00 | Pump runs a second cycle; run hours and bulk flow reconcile | Narrowband PLC | 0 |
| 18:30 | Evening peak. Receipts for paid WAN traffic share the same narrowband carrier without contention | Narrowband PLC | Metered separately |
| 23:55 | Daily rollup written to the Node's store; nothing goes to the chain | Local | 0 |
| Month end | 28 signed statements generated. Each tenant's shows readings, consumption and the signature | Local, then WAN to deliver | Small |

The row at 09:30 is the one that pays for the installation. A passing cistern
valve at unit 14 is invisible to a flat charge and obvious to a per-unit
cumulative counter with a time series.

## 7. Economics, with conditions

No shilling figures are given here, and the reason is not the usual one. The
usual condition applies: the per-unit price is owner-set within an on-chain band
and its floor must clear measured backhaul cost (spec section 8). But metering
generates no XKN revenue at all, because it is free LAN traffic. Its economics
are the landlord's, not the network's.

What can be stated:

- **Recovery, not revenue.** The value is the gap between the bulk water bill
  and what the landlord currently recovers. Whether that gap is large enough to
  pay for 28 meter nodes is an arithmetic question the landlord can answer from
  his own bills, and it is site-specific. We should ask for those bills rather
  than model them.
- **Marginal hardware only.** The Node and the Node-Satellites are already
  installed for connectivity. The incremental cost is 28 meter interface nodes
  plus the water meters themselves, which in most blocks are the larger line.
  No design or price for the meter interface node exists yet; it is a proposed
  board, not a scouted one. <!-- TODO: verify -->
- **Zero running cost on the data side.** No subscription, no SIM, no battery
  per meter, no reader.
- **Leak detection is the uncosted upside.** A single passing valve on a bulk
  connection can exceed the annual cost of metering that unit. This is a known
  pattern in building services and it should be verified against Samuel's own
  bills before it is used in a pitch. <!-- TODO: verify -->

## 8. What could go wrong, and what answers it

| Risk | Answer | Mechanism |
|---|---|---|
| Someone reads this as a KPLC integration | Section 4 exists for this. No utility interface is claimed, offered or built | Stated position |
| A tenant disputes a reading | The statement carries the meter node's signature over the reading. The tenant can verify the number was not edited | Law 4 |
| A tenant tampers with the physical meter | Not answered by cryptography. Tamper detection is a meter feature and an inspection regime, and must not be conflated with signature verification | Open |
| Narrowband PLC does not cross the distribution board to a unit | Same segment problem as case 02. The fix is a Node-Satellite per segment, or LoRa for control across the boundary | Demo D3 |
| A meter node is unplugged to stop the recording | The Node sees a device stop reporting and flags it. Cumulative counters mean a reconnected node reveals the consumption that happened while it was off | Cumulative counter |
| Conducted signalling on customer wiring is regulated | Open, and this case makes the question sharper than case 02 because more devices are injecting. Which instrument governs it, CA, KEBS or Kenya Power, is question 4 for counsel | [../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 3 |
| Billing tenants for water is itself regulated | Open and not currently in the brief. Landlord recovery of a bulk utility charge through sub-metering has a legal position in Kenya that we have not established, and it must be established before a pilot bills anyone | Open, add to the brief |
| The meter node injects noise that degrades the bulk plane | Narrowband at 120 to 135 kHz and HomePlug AV at 2 to 68 MHz occupy different spectrum, but 28 transmitters on one riser is a load nobody has bench tested | Open, bench test required |

## 9. What would have to be true to pilot this

1. A bench test with more than two KQ-130F transmitters on one segment. Every
   demo in the current matrix uses a handful; 28 is a different problem and no
   measurement exists.
2. A meter interface node design, costed, with a real water meter's pulse or
   encoder output on the input side.
3. Counsel's answer on conducted mains signalling, which is question 4 in the
   regulatory brief and is on the critical path for this case specifically.
4. Counsel's answer on the legal position of landlord water sub-metering and
   recovery in Kenya, which is not currently in the brief.
5. A landlord who will share twelve months of bulk water bills, so the recovery
   claim is arithmetic rather than assertion.
6. A written tenant-facing explanation of what is measured, by whom, and how to
   check it, delivered before the first statement rather than after the first
   dispute.
