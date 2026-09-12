# 03. Rural market hubs

*On market day in Kagio, a kiosk with one Node sells WAN by the hour to traders who want it and carries prices, balances and M-Pesa operations as class C over LoRa for the ones who only need a few hundred bytes.*

## 1. The situation

Kagio market, Kirinyaga County, on the Sagana to Kutus road. Tuesday and
Friday are market days. By 06:00 the tomato lorries are in, by 08:00 the
brokers are working, and by 14:00 most of the money has moved. Alice Njoki runs
a kiosk at the edge of the market: airtime, M-Pesa agency float, phone
charging, sweets, and the informal role of being the person who knows things.

Around her stall, on market day, are perhaps two hundred traders. Most of them
need three pieces of information and one transaction: what tomatoes went for in
Marikiti this morning, whether the buyer's money has arrived, what the broker
in Nairobi is paying, and the M-Pesa confirmation. That is a few kilobytes of
answer each, several times a day, across two hundred people.

The mobile signal at Kagio is adequate in the open and poor between the sheds.
It is also congested on exactly the two days it matters, because two hundred
extra people arrive at once in a cell sized for a quiet town.

## 2. What breaks today

The mismatch is between what a trader needs and what the market sells them.

A trader needs a few hundred bytes and buys a bundle. The smallest useful daily
bundle is priced for browsing, and the trader who wanted one price check pays
for a quantity of data they will never use. They know it, which is why so many
of them do not buy at all and ask someone else instead.

Congestion on market day is the second break, and it is structural. The cell
site's capacity is fixed and the crowd is periodic. The two days a trader most
needs a confirmation are the two days the confirmation is slowest.

Alice's own break is the one that costs her money. Her M-Pesa agency float is
worthless if she cannot complete a transaction, and her transactions queue
behind two hundred people's browsing. On a bad Friday she turns customers away
not for lack of float but for lack of a working data path.

## 3. The xKoin composition

One Node at the kiosk, one Satellite on a pole for the far side of the market,
and traders' own phones.

| Device | Count | Placement | Plane it carries |
|---|---|---|---|
| xKoin-Node | 1 | Inside Alice's kiosk, on her mains | Backhaul in, Wi-Fi attach, LoRa out, admission, metering, settlement |
| xKoin-Satellite | 1 | On the pole at the far end of the sheds, solar | LoRa relay for traders out of Wi-Fi reach |
| xKoin-Node-Satellite | 1 | Neighbouring shop on the same mains segment | HomePlug bulk plane to a second Wi-Fi footprint |
| xKoin-Client | 20 to 60 on a market day | Trader phones | Attach, sign |
| xKoin-Client OTG dongle | 2 | Kept by two brokers who work the far sheds | Direct LoRa reach with no Wi-Fi |

The product sold here is two products, and separating them is the whole point.

**Class C by the transaction.** Prices, balances, messages and kiosk operations
travel as native XKP frames with no IP (spec section 6). A 108-byte receipt
fits one narrowband PLC frame; a price query and its answer fit a LoRa SF7
payload with room left. A trader who only wants this pays a very small amount
and never touches the bulk plane.

**WAN by the hour.** A trader who wants real internet, to look at photographs
of produce, to use a bank app, to watch something while waiting, attaches to
the Wi-Fi and buys metered WAN like any other client. On market day that is a
minority of the crowd, and they are the minority who can afford it.

The Satellite on the pole is what makes the far sheds reachable at all. Wi-Fi
does not cross a market; LoRa does. A trader with the OTG dongle, or with a
phone attached through the pole Satellite's own small Wi-Fi footprint, gets
class C service where a mobile signal is unreliable.

## 4. Internals: which primitives do the work

**The voucher, and why a market is the hard case for admission.** Two hundred
people arrive at once, most of them strangers, many of them buying for the
first time. Admission cannot involve an account, a form or a server round trip.
It is an Ed25519 signature over the buyer's address and amount, verified at the
edge in under 4.5 ms with no network (Law 2). A trader buys, the voucher lands,
and the node admits. There is nothing to sign up for, which is the only model
that works at market speed.

**Receipts sized for the payload.** The receipt is the canonical
`<8s client_id><8s node_id><16s session_nonce><Q cumulative_bytes><I seq>`
signed Ed25519, 108 bytes. It fits one narrowband frame. This is not a detail:
it means that proving a class C transaction costs about as much airtime as the
transaction, rather than dominating it. See
[../papers/03-protocol-xkp.md](../papers/03-protocol-xkp.md).

**Cumulative counters against a congested uplink.** When the cell site is
saturated the Node's backhaul is slow or gone. Receipts accumulate, and only
the latest matters. A whole market day can settle in one batch at 18:00 when
the crowd has gone and the cell has emptied. The network's busiest hour and the
chain's settlement hour do not have to be the same hour, and that decoupling is
worth more here than anywhere else.

**Duty cycle is the binding constraint, and it binds here.** Sustained SF7
service is limited to roughly 1.5 pages per hour per channel at a 1% duty
cycle, about 11.7 across eight channels, with GFSK lifting it around 27 times
(spec section 6). Two hundred traders cannot all browse over LoRa and nobody
should imply they can. They can all send and receive class C transactions,
because a transaction is two orders of magnitude smaller than a page. The
composition works because the product matches the physics.

**The kiosk as the on-ramp.** Alice's kiosk is where fiat enters. A trader with
no smartphone hands her cash or sends M-Pesa, and the kiosk web flow issues the
voucher to an address. Alice earns as the node operator on every byte her node
carries, claimed to her own address and cashed out to her own M-Pesa
([../how-it-works.md](../how-it-works.md) J7).

## 5. A day in the life

A Friday at Kagio.

| Time | Event | Plane | Class |
|---|---|---|---|
| 05:50 | Alice powers the Node. It BEACONs; the pole Satellite joins | LoRa, mains | P0 discovery |
| 06:15 | First lorries. Four brokers attach, present yesterday's vouchers, still inside 24 h | Wi-Fi attach | Voucher |
| 06:30 | A broker pulls the Marikiti opening prices as a class C query | LoRa | C |
| 07:40 | Eleven traders buy 10 to 20 KES of XKN at the kiosk, by STK push | WAN | Bridge mint |
| 08:00 | The mobile cell begins to congest as the crowd builds | n/a | n/a |
| 08:05 | Node backhaul slows. Medium scorer keeps WAN for the clients who bought it and holds the rest on class C | Mixed | A and C |
| 09:30 | A trader in the far sheds checks a payment confirmation through the pole Satellite | LoRa | C |
| 10:00 | A produce buyer streams a video call from the kiosk's own Wi-Fi, on the bulk plane | HomePlug and Wi-Fi | Paid WAN |
| 11:20 | Backhaul drops entirely for eleven minutes. Class C keeps working; the video call does not | LoRa | C only |
| 11:31 | Backhaul returns. Nothing was lost; receipts carried on | Mixed | Cumulative counters |
| 13:00 | Alice completes 30 M-Pesa agency transactions on the node's own path rather than the congested cell | WAN and class C | C |
| 15:30 | Crowd thins. Eight clients remain | Wi-Fi | Paid WAN |
| 18:10 | Node settles the day in one batch: 38 clients, one call | Chain | settleTicketBatch |
| 18:12 | Alice's operator earnings rise. She claims weekly, not daily, to save gas | Chain | claimEarnings |

## 6. Economics, with conditions

Every shilling figure is conditional on the pricing decision, which is
owner-set within an on-chain band for MVP and must clear measured backhaul cost
before it is set (spec section 8). Market-day pricing has a further condition:
we have not measured what a class C transaction costs to serve, and until the
duty-cycle position is settled we cannot state a sustainable transaction rate
per hour.

Structural points that stand without the price:

- The two products have very different cost structures. Class C consumes
  airtime and almost no backhaul. Paid WAN consumes backhaul and is the line
  the price floor is about. Pricing them identically would be a mistake in both
  directions.
- Settlement cost is per batch, not per trader. Thirty-eight clients settling
  in one call at 18:10 means the on-chain cost of a market day is one
  transaction fee, a fraction of a Kenyan cent on Base.
- Alice's capital cost is one Node, one Satellite and one Node-Satellite.
  Indicative module prices are in `hardware/bom.md` and are part costs, not
  installed costs. <!-- TODO: verify -->
- The Drive tokenomics scenario B sketches a rural trading post with twenty
  traders at a fixed daily voucher and a telemetry subscription
  (`docs/_drive/04-tokenomics-and-fiat-roi-financial-model.md`). Both inputs are
  assumptions. Quote the structure, not the payback period.

The revenue risk is honest and specific: on a non-market day, Kagio is a quiet
town and the node earns very little. A market hub's economics are two good days
and five thin ones, and any model that averages them without saying so is
misleading.

## 7. What could go wrong, and what answers it

| Risk | Answer | Mechanism |
|---|---|---|
| Two hundred clients try to attach at once | Admission is offline signature verification at under 4.5 ms; the limit is Wi-Fi association and node RAM, not cryptography. Sizing it is a pilot measurement | Law 2, node session manager |
| Duty cycle makes class C service unusable at crowd scale | Real constraint. Mitigations are GFSK on strong links, channel diversity, and limiting class A entirely. Kenyan rules are unverified | Spec section 6, [../ops/regulatory-brief.md](../ops/regulatory-brief.md) |
| A trader pays and the STK callback is late | The design issues a voucher on confirmed payment. Optimistic pre-issue with a grace buffer is a documented mitigation and carries its own risk; the pilot must choose one | `docs/_drive/02` risk matrix |
| Someone replays a paid session's tickets | Monotonic sequence, cumulative delta, stale sequence reverts | Law 5 |
| A second node appears and claims Alice's traffic | Tickets name the node admin who collected the receipts; a node that did not serve the bytes holds no signed receipts | Law 3, spec section 5 |
| Alice is treated as a licensed reseller | Open question. Selling metered transit at a kiosk is the clearest case of transit resale in the whole set, and counsel's answer on CA licence category decides it | [../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 5 |
| The pole Satellite is stolen | Physical. Mounting, enclosure and the fact that a stolen Satellite holds no funds; identity is a key and the money is on chain | Law 1 |

## 8. What would have to be true to pilot this

1. A measured class C transaction rate under a duty-cycle regime we have
   confirmed with counsel. Without it the market-day capacity claim is
   unfounded.
2. Demo D2 passed: class C traffic through 60 dB of path loss at SF7 with RSSI
   shown, so the pole link is a measurement.
3. A kiosk operator who will hold float, sell vouchers, and be the human face
   of the thing. The whole case rests on Alice existing.
4. An answer on CA licence category for a community network reselling data,
   before money changes hands in public.
5. A measured backhaul cost at the site, which sets the price floor and
   therefore decides whether paid WAN is sellable at Kagio at all.
6. A market committee or county authority that will permit a pole-mounted
   Satellite in the market, in writing.
