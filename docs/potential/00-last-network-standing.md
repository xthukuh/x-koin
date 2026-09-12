# 00. The last network standing

*When the grid drops, the fibre is cut and the cell site flattens its battery, a network whose admission is an offline signature and whose accounting is a cumulative counter does not stop; it degrades to LoRa, keeps serving, and settles the arrears when backhaul returns.*

## 1. The situation

Kariobangi South, Nairobi. Grace Wairimu is the caretaker of a 36-unit block
on a plot off Outering Road. She holds the meter-room key, she is the person
tenants call at 21:00 when something is dark, and she is the one who walks to
the shop for airtime when a tenant's phone dies mid-transaction. She is not a
network operator and has no interest in becoming one. She is, however, the only
person in the building with a key to the room where an xKoin-Node would live.

The event this case is written against is not exotic. Kenya has had more than
one nationwide loss of supply since 2023, and localised outages on a single
feeder are weekly rather than annual. <!-- TODO: verify --> The pattern is
consistent: the grid goes first, the fixed-line operator's street cabinet
follows within an hour or two as its battery drains, and the mobile site lasts
longest but not indefinitely. What is left is a building full of phones with
charge and nothing to talk to.

## 2. What breaks today

Three failures compound, and they compound in a specific order.

The grid fails, so every mains-powered access point in the building dies at
once. A fibre ONT with no power is a paperweight, so the tenant who pays for a
home line loses it in the same second as the tenant who does not.

The street cabinet fails next. Fixed-line operators size cabinet batteries for
short interruptions, not for a six-hour national event, and a cut cable during
road works has no battery at all.

The cell site is last and partial. It stays up on its own reserve, but every
subscriber in the cell converges on it at once, and the sector that was
comfortable at 18:00 is congested at 18:40. Voice is prioritised, data is not.

Underneath all three sits a fourth failure that is rarely named: the money
stops. Mobile money needs a data path. A tenant who cannot reach the internet
cannot buy the bundle that would let them reach the internet. Every
conventional prepaid model has this circularity, and it bites hardest exactly
when people need to reach someone.

## 3. The xKoin composition

The composition for a building like Grace's is small, and its survival
properties come from how the planes are separated rather than from how much
hardware is installed.

| Device | Count | Where | Power in an outage | Plane it carries |
|---|---|---|---|---|
| xKoin-Node | 1 | Meter room | 12 V SLA or LiFePO4 pack sized for the node alone | Backhaul, admission, metering, settlement queue |
| xKoin-Node-Satellite | 3 | One per floor landing socket | Dead when the mains dies | HomePlug AV bulk plane, Wi-Fi attach |
| xKoin-Satellite | 1 | Roof, solar and 18650 | Independent of the grid entirely | LoRa survival plane, relay to the next block |
| xKoin-Client | per tenant | Phones | The tenant's own battery | Attach, signing |

The point of the table is the third column. The bulk plane and the survival
plane have different power stories on purpose. HomePlug AV rides the building's
own copper, so when the mains is dead the copper carries nothing and the bulk
plane is gone with it. That is expected and it is not a failure: the bulk plane
was always the plane for video. The survival plane is a solar xKoin-Satellite
on the roof and an SX1262 in the Node, and neither of them cares that Kenya
Power is dark.

The Node itself is the only device that must be given backup power, and it is
the cheapest one to back up. A gateway with its LTE modem in a low duty cycle
draws single-digit watts, so a small sealed pack carries it through an evening
rather than through a minute. Sizing that pack against a measured node draw is
pilot work, not a claim we make here. <!-- TODO: verify -->

## 4. Internals: which primitives do the work

**The voucher (spec P1, Law 2).** Admission is an Ed25519 signature over a
small JSON object: the user's address, the amount, the fiat reference, issue
and expiry. The Node firmware holds only the 32-byte kiosk public key and
verifies in under 4.5 ms with no network of any kind. This is the single
design decision that makes the outage case work. A network that asked a chain
or an API "is this user allowed in" would be a network that stops when its own
product stops, which is the circularity described in section 2, reintroduced
inside our own architecture. See
[../papers/03-protocol-xkp.md](../papers/03-protocol-xkp.md) and
[../how-it-works.md](../how-it-works.md) section 2.4.

**Cumulative receipts (spec P3, Laws 3 to 5).** Every RECEIPT_INTERVAL of
acknowledged bytes the client signs a receipt carrying client id, node id,
session nonce, cumulative bytes and a sequence number. The Node keeps only the
latest one. During an outage this matters twice over: the Node is storing one
108-byte object per client rather than a log that grows for six hours, and if
the Node reboots on a flat battery and comes back, the client simply signs the
next cumulative receipt and nothing before it was needed.

**The offline session cap.** With backhaul down the Node cannot read
`deposits[user]` from the escrow, so it cannot know the true balance. It serves
against the voucher alone up to a smaller offline cap, proposed at 5 KES
against 20 KES online in [../how-it-works.md](../how-it-works.md) section 5.1.
The operator's worst case is one cap of unsettled bytes per client, and Law 6
guarantees the contract never pays more than the user actually escrowed, so the
network cannot go insolvent through an outage. It can only underpay a node, by
a bounded amount, and only when a client spent past their own deposit at
several nodes at once.

**The medium scorer (spec section 1).** Senders choose the live medium with the
highest `goodput_ewma * (1 - loss_ewma)`, and three consecutive delivery
failures quarantine a medium for two seconds. Nobody types a command to switch
to LoRa. The HomePlug path scores zero the moment the mains drops and the next
best medium takes the traffic. The frame format is identical across mediums
(spec section 2), so a receipt that would have crossed the power line crosses
the air unchanged.

**Class C service (spec section 6).** On the survival plane the network does
not pretend to be broadband. Class C is native XKP frames with no IP at all:
a 108-byte receipt fits one narrowband PLC frame and sits comfortably inside a
LoRa SF7 payload. Messaging, balances, prices and kiosk operations are class C.
Class A distilled web pages are possible and slow. Video is not offered, and
saying so plainly is more useful to a tenant than a promise that degrades into
a complaint.

## 5. A day in the life

A Thursday. The feeder that serves Kariobangi South trips at 18:42.

| Time | Event | Plane | Primitive at work |
|---|---|---|---|
| 18:00 | Normal evening. 14 tenants attached, two streaming video | HomePlug AV bulk plane over the risers | Receipts every interval, tickets batched |
| 18:41 | Node settles a batch of 9 tickets; escrow debits deposits, credits the operator | WAN | Ticket, escrow, relayer |
| 18:42 | Feeder trips. Node-Satellites dark, bulk plane gone. Node stays up on its pack | none | Medium scorer quarantines HomePlug |
| 18:42 | Roof xKoin-Satellite BEACONs on LoRa; Node and Satellite hold the survival plane | LoRa | P0 discovery |
| 18:45 | Grace's phone reattaches to the Node's own Wi-Fi and is admitted | LoRa control | Voucher verified offline, Law 2 |
| 18:47 | Tenants find the LAN directory: the building's notice page, cached, free | Free LAN | Zero XKN, no metering |
| 18:52 | A tenant sends a signed message to a relative two blocks away via the next Node | Class C over LoRa | Frame relay, ttl decrement |
| 19:30 | LTE backhaul intermittent as the cell site congests; Node marks WAN degraded | WAN | Medium score, session cap drops to the offline cap |
| 20:10 | Backhaul gone entirely. Node keeps admitting; receipts accumulate unsettled | LoRa only | Cumulative counters, offline cap |
| 22:15 | A tenant tries to buy more XKN. Node cannot reach the bridge, says so plainly and keeps serving to the cap | none | Honest failure, no false promise |
| 01:30 | Supply returns. Node-Satellites boot, HomePlug re-links, bulk plane scores highest again | HomePlug AV | Medium scorer |
| 01:34 | Node drains its settlement queue: one `settleTicketBatch` call carrying every client's latest ticket | WAN | Law 5 monotonic sequence, Law 6 deposit cap |
| 01:35 | Operator earnings up, treasury fee taken, no byte double-paid and no byte lost | Chain | Escrow, treasury |

The row that carries the case is 01:34. Six and a half hours of service settle
in one transaction, because only the latest ticket per client ever mattered.
There is no replay of the outage, no reconciliation spreadsheet, and no
argument about who owes what, because the delta is arithmetic on a counter the
client signed.

## 6. Economics, with conditions

Every shilling figure in this section is conditional on a pricing decision that
has not been made. The per-unit price is owner-set for MVP, banded on chain,
and disciplined by a floor: the price must clear measured backhaul cost before
it is set (spec section 8). Until a measured Equitel or Safaricom bulk rate and
a measured Squid cache hit rate exist, any revenue number is an illustration of
a mechanism, not a forecast.

What can be stated without that condition:

- Settlement cost does not rise during an outage. One batch settles many
  clients, and Base gas per settlement is a fraction of a Kenyan cent
  (`docs/ops/critical-accounts/03-budget-and-sustainability.md`). Six hours of
  arrears costs the same on-chain as six minutes.
- The free LAN plane earns nothing and costs nothing. Traffic that never
  leaves the building is never metered, by construction
  ([../papers/04-settlement-and-economics.md](../papers/04-settlement-and-economics.md)).
  Outage traffic is disproportionately local, so an outage is cheap to serve
  and thin on revenue at the same time.
- The marginal cost of the survival plane is a solar xKoin-Satellite and a
  battery pack for the Node. Those are capital items bought once, not a
  recurring line.

The payback periods in the Drive tokenomics document
(`docs/_drive/04-tokenomics-and-fiat-roi-financial-model.md`) are conditional
on a per-unit price that has not cleared the floor discipline above, and are
not to be quoted on their own.

## 7. What could go wrong, and what answers it

| Risk | Answer | Where it is enforced |
|---|---|---|
| A client burns through service everywhere while the Node is blind to their balance | Offline session cap per node; contract pays at most the deposit | Law 6, node session manager |
| A client refuses to sign receipts once it knows settlement is delayed | Node extends at most twice the receipt interval of unproven credit, then throttles and drops | Law 3 |
| A node replays old tickets when backhaul returns, claiming the outage twice | Monotonic sequence and cumulative delta; a stale sequence reverts | Law 5 |
| Someone forges a counter to inflate the arrears | The counter is inside the signed canonical bytes | Law 4 |
| LoRa noise corrupts frames during a long queue | Magic, length and CRC16 at the frame; crypto above it | Law 8 |
| The kiosk root key is stolen during the confusion | Blast radius is free admission, not fund theft; funds need on-chain ECDSA. Rotation is a firmware pubkey change | Spec section 8 |
| The network is described to tenants as an emergency service | It is not one. It carries messages and balances on the survival plane and says so; nobody should place a medical call on it | Stated in the pilot terms |

Two constraints sit outside the Laws and must be named rather than answered.
The 868 MHz duty-cycle rules that govern sustained LoRa service in Kenya are
unverified, and the current firmware centres at 868.1 MHz at +22 dBm, which is
above the 25 mW ceiling for that sub-band before any antenna gain
([../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 2). An outage
is exactly when a node would be tempted to transmit more, and it is exactly
when it must not. Second, whether a community network reselling transit needs a
CA licence category is an open question with counsel, and no outage narrative
changes that.

## 8. What would have to be true to pilot this

1. A measured node power draw, and a battery pack sized from it rather than
   from a datasheet sum. The acceptance test is D4 in the demo matrix: WAN
   unplugged, free LAN and class C keep working, receipts accumulate,
   settlement lands when WAN returns.
2. Demo D2 passed on the bench: class C traffic through 60 dB of attenuation at
   SF7, with RSSI shown, so the survival plane's range is a measurement rather
   than an estimate.
3. TX power capped to the sub-band limit, and either LBT plus AFA implemented
   or bulk control traffic moved to 869.4 to 869.65 MHz where 500 mW and 10%
   apply. Until one of those is done the device is outside the CA exemption.
4. Counsel's answer on transit resale licensing, and on whether XKN is e-money
   under the National Payment System Act.
5. A written statement to tenants that the network degrades to messaging during
   an outage and is not an emergency service.
6. One building where the caretaker will hold the key and call a number when a
   light goes out. Grace is the whole deployment model for this case, and if
   that role is not filled the rest does not matter.
