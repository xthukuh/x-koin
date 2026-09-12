# 01. The problem, and the market for it

Abstract: A Nairobi household that buys data one day at a time pays roughly eight
times per gigabyte what a household on a monthly fibre contract pays, and the
difference is billing granularity rather than bandwidth. This paper states the
problem in concrete Kenyan terms: the bundle prices as the design suite records
them, the grid interruptions that decide whether a mains-carried network is a
product or a demonstration, and the specific people in specific places who are
served badly by both ends of the current market. It then identifies the three
parties who have to say yes for a node to exist, and what each of them gets. It
sizes the opportunity only as ranges built bottom-up from numbers this repository
can name, and marks the top-down inputs that are not yet sourced. It closes with
why the design is buildable now and was not five years ago: the parts, the chain
and the payment APIs all crossed their thresholds recently and separately.

Keywords: Kenya, mobile data pricing, community networks, last mile, node
economics, market sizing, timing

## 1. Scope

This paper is about demand, not mechanism. The mechanism is in
[00-x-koin-concept.md](00-x-koin-concept.md) and
[02-system-architecture.md](02-system-architecture.md). Every price here carries
its source and its date, and the retail tariffs in particular are volatile enough
that they are marked for re-verification rather than presented as current.

## 2. What a gigabyte costs in Nairobi

The design suite records four reference points, all in KES, all as stated in that
document on 2026-09-12. Re-verify before quoting any of them publicly.

| Provider and model | Tier | Cost (KES) | Allowance | Effective rate |
|---|---|---|---|---|
| Safaricom, Tunukiwa daily | 24-hour pass | 20.00 | 250 MB | KES 80.00 per GB |
| Airtel Kenya, daily pack | 24-hour pass | 20.00 | 500 MB | KES 40.00 per GB |
| Safaricom Home Fiber, standard | Monthly, 10 Mbps | 2,999.00 | unlimited under fair use | about KES 10.00 per GB |
| xKoin micro-voucher (target) | per-voucher | 10.00 | 1,000 MB | KES 10.00 per GB |
| xKoin 24-hour pass (target) | daily pass | 30.00 | 5,000 MB | KES 6.00 per GB |

The two xKoin rows are targets from the same design suite document and are
conditional on the per-unit price clearing measured backhaul cost, which has not
yet been measured. The protocol's placeholder price of 500 micro-KES per 10 KB
unit works out to 0.05 KES per MB, which is KES 50 per GB, five times the KES 10
target row. The gap between the placeholder and the target is exactly the
question that backhaul measurement and cache hit rate have to answer, and no
figure in this set should be read as though it were already settled.

The shape of the table matters more than any single row. A fibre subscriber pays
about one eighth per byte of what a daily-pass buyer pays. The daily-pass buyer is
not buying worse bandwidth. They are paying for the right to buy in KES 20
increments, because KES 2,999 in one payment is not available to them. A network
that can sell in KES 10 increments without the eight-times penalty is selling the
same bytes at a price the incumbent's billing model cannot reach down to.

## 3. Outages, and why the radio plane is not optional

A network that carries data on mains wiring inherits the availability of the
mains. Kenya Power interruptions, both scheduled maintenance and unplanned, are a
routine feature of service in Nairobi and much more so outside it.

<!-- TODO: verify. This repository contains no sourced outage statistic. Before
     publication, cite either the Kenya Power planned-interruption notices or the
     Energy and Petroleum Regulatory Authority annual SAIDI/SAIFI figures, and
     replace this paragraph's qualitative claim with a number and a year. -->

The design consequence is decided rather than hedged. LoRa is not a feature of
the product, it is the plane the product falls back to, and the fall is measured:
about 0.8 seconds from grid failure to LoRa carrying control traffic, in the
protocol's discrete-event simulation. What survives a grid cut is stated exactly
in [02-system-architecture.md](02-system-architecture.md): cumulative receipts
keep accumulating, admission keeps working because vouchers verify offline, and
settlement lands when the backhaul returns. Demo D4 in the proof-of-concept plan
exists to show this on a bench with the WAN unplugged.

## 4. Who is underserved

Three groups, each in a place, each with a different reason.

**Tenants in walk-up apartment blocks in Roysambu, Kasarani and parts of
Westlands.** A twelve-flat block may have one or two fibre subscriptions and ten
households on daily passes. The building has mains wiring to every room and no
data infrastructure at all. Each household is paying the KES 40 to KES 80 per GB
rate for want of a way to share the KES 10 rate that already terminates in the
same building.

**Traders at rural market centres, and the farms around them.** The design suite
models a trading post in Kiambu or Murang'a with about 20 traders buying Wi-Fi at
roughly KES 15 a day and five farms paying a telemetry subscription. The traders
need enough connectivity for M-Pesa, prices and messaging, which is class C
traffic measured in kilobytes, and are currently paying for it in units of a
daily bundle. The farms need telemetry that costs nothing per reading, which is
what the free LAN plane is.

**Anyone whose service disappears with the grid or the tower.** Schools, clinics
and small businesses lose connectivity in an outage even when they have their own
power, because the last-mile radio does not. A mesh with a solar-powered radio
plane and cumulative counters keeps its local half working and keeps its accounts
straight through the interruption.

## 5. The three buyers

A node exists only if three different people each get something. They are not the
same person and they do not want the same thing.

| Buyer | Pays | Gets | What would make them say no |
|---|---|---|---|
| The user | KES 10 to KES 30 per voucher, by M-Pesa or Equitel | A rate per GB well under the daily-pass rate, free local traffic, one balance spendable at any node, service that degrades rather than stops | Setup friction, or a balance they cannot get back |
| The node operator | CapEx for the hardware, monthly backhaul and about 15 W of electricity | 95 percent of every settled byte, paid in a KES-pegged token cashed out to their own mobile wallet | Payback that does not clear the backhaul bill, or a device that needs attention |
| The building owner | Socket space, a place to mount the node, and permission | A building amenity that costs them nothing to run, a share arrangement with the operator if they are not the operator | Anything that risks their wiring or their tenants' equipment |

The user's side is the simplest: one purchase, usable at every node, refundable
because an unspent escrow deposit can be withdrawn at any time.

The operator's side is where the numbers have to work. The design suite models an
urban landlord with one Node and three relays at KES 29,050 of CapEx and KES 3,850
a month of operating cost, ten tenants averaging KES 1,000 a month, giving KES
5,650 of monthly profit and a 5.1 month payback; and a rural trading post at KES
23,300 of CapEx with a 3.1 month payback. Both figures are conditional on the
per-unit price clearing measured backhaul cost, on that tenant count and on those
CapEx lines, and neither should be quoted without all three conditions. The
independent check available today is the BOM: the field-kit hardware in
`hardware/bom.md` totals about USD 1,170 for seven units plus a bench and safety
kit, before Kenyan duty, VAT, the 2.25 percent import declaration fee and the 1.5
percent railway levy, which is a different basis from the design suite's KES
15,500 per Node and needs reconciling before either number is used in a pitch.

The building owner's side is mostly about risk, which is why the mains coupling
is done through certified commodity adapters rather than a custom mains circuit,
and why the narrowband module is proven on a low-voltage DC line before it is put
on a mains strip behind a residual current device.

## 6. Sizing, as ranges

The honest position is that this repository holds no sourced top-down market
data, so what follows is a bottom-up construction from numbers it does hold, plus
a list of the inputs that have to be sourced before any total is claimed.

One building is the unit. At the design suite's assumptions, one Node with three
relays serves ten paying tenants at about KES 10,000 gross a month, of which the
operator keeps KES 9,500 and the protocol keeps KES 500. One rural trading post
is about KES 10,500 gross a month across traders and telemetry subscriptions.
Protocol revenue at 5 percent is therefore in the range of KES 500 to KES 525 per
active site per month under those assumptions.

That per-site figure is the only number this repository can defend. Turning it
into a market requires three inputs it does not have:

1. The number of multi-dwelling buildings in Nairobi with mains wiring, a
   plausible backhaul and tenants buying daily bundles. Source to obtain: Kenya
   National Bureau of Statistics housing census tabulations.
2. Mobile data subscriptions and average revenue per user, to establish the
   spending the network would be competing for. Source to obtain: the
   Communications Authority of Kenya quarterly sector statistics report.
3. Electrification rate and interruption frequency by county, which decides how
   much of the country is addressable by a mains-carried plane at all. Source to
   obtain: EPRA and Kenya Power annual reports.

<!-- TODO: verify. None of the three sources above has been consulted. Any
     addressable-market figure derived before they are is fabrication, and this
     section is deliberately left without a total. -->

Until those land, the defensible statement is a per-site one: a site pays back
its hardware in months rather than years if the per-unit price clears backhaul
cost, and the protocol's own revenue per site is small enough that the business
is in the number of sites, not in the margin on any one of them.

## 7. Why now

Four thresholds were crossed independently, and the design is only cheap because
all four happened.

**The radio and the compute got cheap enough to be disposable.** An
ESP32-S3-DevKitC-1 N16R8 board is about USD 12 at retail and the bare
ESP32-S3-WROOM-1 module is well under that; the chip itself is quoted at about
USD 4.50 in the design suite. An SX1262 breakout is USD 7.88 at Sunsky-online and
USD 13.49 on AliExpress for the Waveshare Core1262-868M, both verified in the
BOM's sourcing pass. That is a dual-core 240 MHz part with Wi-Fi, enough RAM for
a captive portal, and a radio that does both LoRa and 150 kbps GFSK, for the cost
of a few daily bundles. Ed25519 verification lands under 4.5 ms on it, which is
what makes per-client signature checking at the edge possible at all.

**Broadband power-line adapters became a commodity.** A TP-Link TL-PA4010 AV600
kit is about USD 38 for a pair from Amazon UK, verified in the same sourcing
pass. The significance is not the price, it is that the mains-coupling problem
has been solved, certified and mass-produced by someone else. The node injects
into a certified adapter rather than into the mains directly, which moves the
hardest safety and compliance question out of the design.

**L2 settlement became cheaper than the thing being settled.** Settling a
one-ticket batch on Base measured 191,698 gas, which was 0.35 KES on 2026-09-09
at a Base gas price of 0.006 gwei, ETH at 2,468.58 USDT and USDT at 123.29 KES.
Each additional ticket in the batch is estimated at about 0.12 KES. Chain gas is
therefore not a cost centre for this network, which was not true on any L1 and
was marginal on L2s before blob-based data availability. What is a cost centre is
the fiat leg: a Jenga charge appears on every payment in and every payout out,
tens to hundreds of times the chain gas per operation.

**Mobile money became programmable on both rails.** Safaricom's Daraja API
provides STK push and B2C payouts, and Equity's Jenga API covers merchant
payments and remittance. Together they reach the whole Kenyan market: Equitel
alone is recorded in the design suite at roughly 3 to 5 percent of consumer
mobile subscriptions, so an Equitel-only path would turn away most urban users,
while Equitel bulk bundles are the cheaper backhaul for the node itself. The
contracts do not care which bridge minted an XKN, so supporting both rails costs
one integration each and no design change.

## 8. References

1. `docs/_drive/04-tokenomics-and-fiat-roi-financial-model.md`, retail pricing
   benchmark and both ROI scenarios, exported 2026-09-12.
2. `docs/_drive/05-architecture-decisions-and-tradeoffs.md`, decision points 1 to
   4 including Equitel market share and the chip cost, exported 2026-09-12.
3. `hardware/bom.md`, sourced part prices, kit totals and Kenyan import notes.
4. `docs/ops/critical-accounts/03-budget-and-sustainability.md`, measured Base gas
   price and per-operation costs, 2026-09-09.
5. `protocol/spec.md` section 8, the price floor formula and the condition on all
   payback figures.
6. `docs/_plan/revamp-plan.md`, the demo matrix including D4, last network
   standing, 2026-09-12.
7. `docs/ops/regulatory-brief.md`, regulatory and import questions, 2026-09-09.
