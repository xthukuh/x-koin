# 11. Regulatory and Safety

Abstract: xKoin touches four regulators at once, and this paper states the
position for each without answering the questions that belong to counsel. On
radio, the Communications Authority of Kenya 2022 short-range device
guidelines exempt devices operating inside their table from type approval, and
the current firmware does not sit inside it: it centres both LoRa and the
150 kbps GFSK mode at 868.1 MHz, where the ceiling is 25 mW e.r.p. with a 1
percent duty cycle, while configuring the SX1262 power amplifier for +22 dBm,
about 158 mW. That is a decision pending, not a defended setting. On
connectivity resale and on the shilling-redeemable token, the licensing and
e-money questions are posed here and left open, because asserting an answer
would be worse than admitting the gap. On electrical safety the rules are
already fixed: the mains coupling network is isolated from the logic side, the
narrowband modem is proven on a 12 V DC line before any mains work, and
mains-side bench testing happens behind a residual current device.

Keywords: spectrum regulation, short range devices, duty cycle, power-line
carrier, electrical safety, type approval, e-money, import compliance

## 1. Scope

This paper covers radio spectrum, conducted mains signalling, electrical and
bench safety, electromagnetic compatibility standards, type approval, import,
and the licensing and money questions that go to counsel. It states facts and
poses questions. It does not give legal advice and does not answer any
question marked for counsel.

Two decisions are named as pending throughout, because both block field trial
rather than merely inform it: the transmit configuration of the radio, and the
licence category for reselling connectivity.

## 2. Radio: 868 MHz LoRa and GFSK

The source is the Communications Authority of Kenya, Guidelines on the Use of
Radiofrequency Spectrum by Short Range Devices, 2022 (Version B Rev 0), Annex
I, the non-specific short-range device table.

| Sub-band | Maximum power | Access rule | Standard |
|---|---|---|---|
| 868.0 to 868.6 MHz | 25 mW e.r.p. | 1 percent duty cycle, or LBT plus AFA | EN 300 220, EN 301 489, EN 60950 |
| 868.7 to 869.2 MHz | 25 mW e.r.p. | 1 percent duty cycle, or LBT plus AFA | same |
| 869.4 to 869.65 MHz | 500 mW e.r.p. | 10 percent duty cycle, or LBT plus AFA | same |
| 869.7 to 870 MHz | 5 mW e.r.p. | no requirement | same |
| 869.7 to 870 MHz | 25 mW e.r.p. | 10 percent duty cycle, or LBT plus AFA | same |
| 865.0 to 868.0 MHz | 500 mW e.r.p. | 4 sub-channels only, adaptive power control, 10 percent for access points and 2.5 percent otherwise | RFID-style rules |

LBT plus AFA is listen-before-talk with adaptive frequency agility. Section 4
of the guidelines exempts short-range devices operating within that table from
type approval, on a non-interference and no-protection basis, with frequency,
power and antenna not altered by the user. Section 4.1 requires that the
manufacturer or importer be able to produce a test report from an
ILAC-accredited laboratory on request.

**Where the firmware currently sits.** `firmware/xkoin-gateway/lib/sx1262/`
centres both the LoRa mode and the 150 kbps GFSK mode at 868.1 MHz, which is
inside the 868.0 to 868.6 MHz sub-band, and configures the power amplifier for
+22 dBm, about 158 mW, which is roughly six times that sub-band's 25 mW
ceiling before any antenna gain is counted. Separately, a gateway that carries
paid traffic through the day cannot live inside a 1 percent duty cycle without
listen-before-talk plus adaptive frequency agility, which the SX1262 is
capable of. Both are firmware settings, not hardware limits.

As configured, the device does not obviously qualify for the section 4
exemption. The engineering decision is pending and has three options, and it
belongs to the founder or to counsel rather than to an assumption in either
direction:

1. Cap transmit power to the sub-band limit and keep 868.1 MHz. Cheapest
   change, largest range penalty.
2. Implement listen-before-talk with adaptive frequency agility at 868.1 MHz.
   Keeps the sub-band and removes the duty-cycle ceiling, at the cost of
   firmware work and a test report that shows the implementation meets the
   standard.
3. Move bulk traffic to 869.4 to 869.65 MHz, where 500 mW and 10 percent
   apply. Most headroom, narrowest band, and a channel plan change.

Every duty-cycle-derived figure in
[03-protocol-xkp.md](03-protocol-xkp.md), section 7, inherits this condition.
The pages-per-hour numbers there are computed at 1 percent and are unverified
for Kenya until counsel confirms which instrument is operative.

Questions for counsel:

1. Are the 2022 SRD guidelines still the operative instrument after the KICA
   Radio Communication and Frequency Spectrum Regulations 2025 and the General
   Licensing Regulations 2026? If either changed the SRD annex or the
   exemption, the new table is needed.
2. Does LBT plus AFA in the CA table carry the ETSI EN 300 220 definition, so
   that an implementation to that standard satisfies the exemption?
3. Is a test report from the module manufacturer, meaning Ebyte or the Semtech
   reference design, enough for section 4.1, or must the assembled xKoin
   device be tested?

## 3. Power-line carrier at 120 to 135 kHz

The KQ-130F narrowband modem signals on the mains between 120 and 135 kHz at
9600 baud over UART, drawing 230 mA on transmit from a 5 V rail, with 3,000 V
of isolation on the module itself.

The CA short-range device table lists 119 to 135 kHz only as an inductive,
RFID-style band at 66 dBuA/m at 10 m under EN 300 330. That is not the same
thing as conducted signalling on a mains conductor. In Europe, mains-conducted
signalling is governed by EN 50065-1, whose CENELEC bands B and C cover 95 to
148.5 kHz, with a carrier-sense rule in band C. The 2022 guidelines mention
energy conducted by a transmitter onto the power lines only as something to be
measured, in section 4.1.

There is a second question underneath the first. Injecting a carrier that
crosses the meter onto a Kenya Power feeder is arguably a use-of-network
question rather than a radio question, and the answer decides whether the
signal may legally leave the premises at all. Nothing in the demonstration
plan needs it to: the demonstrations run within a building's own circuits, and
the transformer-jump demonstration deliberately proves that the power-line
signal does not cross a blocking filter and that the radio carries control
between segments instead.

Questions for counsel:

4. Which Kenyan instrument governs conducted mains signalling between
   premises: the Communications Authority as a radio matter, the Kenya Bureau
   of Standards as a product safety matter, or Kenya Power as a use-of-network
   matter?
5. Does a device that couples to 230 V mains need Kenya Bureau of Standards
   certification before field use in customer homes, independent of any radio
   question?

## 4. Selling connectivity: the licensing question

The network resells mobile data, bought on an Equitel or Safaricom bundle, to
third parties over last-mile infrastructure that xKoin owns. That is the
activity a licence would cover, and it is separate from the short-range radio
rules in section 2.

This paper does not answer which licence applies. The candidate categories are
Network Facilities Provider Tier 3, Application Service Provider, and the
community networks framework the Authority has discussed since 2021. The
choice determines the fee, the obligations and the timeline, and it is on the
critical path before any field trial that carries paying traffic.

Questions for counsel:

6. Which CA licence category covers a community network reselling data, and
   what are the fees and obligations for each candidate?
7. Do the mobile operator's terms for data bundles permit onward resale, and
   what can the operator do if they do not?

## 5. Money: proximity to e-money

XKN is bought with shillings and redeemed for shillings through the bridge. It
is not lent, earns no interest, and is spent on a service xKoin provides. The
bridge holds customer float on bank and mobile money merchant accounts. Node
operators receive shilling payouts for service rendered.

Whether that makes XKN e-money under the National Payment System Act and its
2014 regulations, a prepaid service credit, or a virtual asset, is a question
for counsel and this paper does not answer it. The answer decides whether a
Central Bank of Kenya authorisation or a partner bank holding the float is
required, and it is a gate before mainnet fiat rather than before engineering.

Questions for counsel:

8. Is XKN e-money, a prepaid service credit, or a virtual asset?
9. Does the Virtual Asset Service Providers Act 2025 cover a service that buys
   and sells a token on a public chain for shillings, and which regulator
   supervises it?
10. What are the anti-money-laundering and know-your-customer obligations for
    accepting mobile money payments from the public and paying node operators,
    and what customer identification must be collected and retained?
11. Tax: value-added tax on connectivity sold per byte, digital service tax
    exposure, withholding on payouts to node operators, and whether the
    treasury fee paid to the founder's mobile number is income at receipt.

What counsel does not need to decide is how the money behaves. The
founder-safety and no-custody-of-user-balances properties are enforced in the
contracts and tested, and should be read as facts about the system rather than
as proposals. They are set out in
[10-security-and-trust.md](10-security-and-trust.md), section 4.

## 6. Electrical safety

The narrowband modem couples directly to 230 V mains. Every rule in this
section is a bench rule that applies before any question of certification.

**Isolation.** The mains coupling network is kept fully isolated from the
logic side, with optical or transformer isolation between them. The ESP32
connects to the modem's isolated 5 V side only, on UART2. The KQ-130F module
itself specifies 3,000 V of isolation, and that figure is a property of the
part, not a substitute for the layout rule.

**Coupling capacitors.** Capacitors that bridge the mains side to any
accessible circuit are mains-rated safety capacitors of the Class Y2 type,
because a failed coupling capacitor in that position is a shock path rather
than a signal fault. <!-- TODO: verify --> No document in this repository
currently names the capacitor class for the coupling network; confirm the
class and the voltage rating against the coupling design before any board is
fabricated.

**Bench rule.** The modem is first proven on a 12 V DC line, which the module
supports, and only then on a mains strip behind a residual current device.
That sequencing is the current plan for the proof of concept, and it exists so
that the first time the protocol is debugged is not the first time mains is
present. The hardware bill of materials records the stricter standing rule for
any mains-side bench work: an isolation transformer of at least 300 VA in
line, plus a 30 mA plug-in residual current device. The proof of concept plan
does not buy an isolation transformer, which is exactly why the 12 V DC stage
comes first and why mains-side work waits until one is in the path.

**Power path.** 230 V to a 5 V rail sized for the transmit burst, then a 3.3 V
rail for the logic. The commonly cited 3 W mains modules are undersized for a
gateway that also carries an LTE module, whose peak draw is separate from the
modem's 230 mA transmit burst.

## 7. Electromagnetic compatibility standards

Three standards are named where conducted and radiated emissions have to be
demonstrated.

| Standard | Covers | Status here |
|---|---|---|
| EN 50065-1 | Signalling on low-voltage electrical installations, 3 to 148.5 kHz; CENELEC bands B and C cover 95 to 148.5 kHz, with a carrier-sense rule in band C | The governing European instrument for the narrowband modem's band; the Kenyan equivalent is question 4 above |
| EN 300 220 and EN 301 489 | Short-range device radio and the electromagnetic compatibility of that radio | Named directly in the CA 2022 table for the 868 MHz sub-bands |
| IEC 61000-3-2 | Limits for harmonic current emissions from equipment drawing up to 16 A per phase | <!-- TODO: verify --> Named in the project's patent draft, which is not in this repository; the applicable edition and whether a device of this power class is in scope both need confirming against the standard |

EN 60950 appears in the CA table as the safety standard for short-range
devices. It has been superseded internationally by IEC 62368-1, and which of
the two a Kenyan submission is assessed against is part of question 5.

## 8. Type approval

Devices operating inside the CA 2022 short-range device table are exempt from
type approval, with the accredited-laboratory test report requirement of
section 4.1 standing behind the exemption. On the current firmware
configuration the exemption is not established, which is the decision in
section 2.

An LTE backhaul module is not a short-range device and is on the modem type
approval list regardless of anything in this paper. Before ordering one, check
the CA type-approved equipment register for the specific part.

A Communications Equipment Distributor licence was introduced in July 2026 and
applies to importers and wholesalers of communications equipment, with a
KES 5,000 application fee, a KES 250,000 licence fee, and 0.4 percent of
turnover annually subject to a KES 120,000 floor, with penalties up to
KES 1 million or three years. Whether a handful of development units imported
for a project's own prototyping is distribution is question 12 below, and the
answer is wanted in writing before any parcel ships.

## 9. Import

| Item | Rule | Consequence |
|---|---|---|
| De minimis | Kenya has none | Duty applies at any declared value |
| Duty | Electronics under HS chapter 85 attract roughly 25 percent under the EAC common external tariff, though many bare modules and development boards fall under HS lines 8542, 8471 and 8517 at 0 to 10 percent | Ask the forwarder to classify per line rather than lumping the shipment at 25 percent |
| Taxes | 16 percent VAT on CIF plus duty, 2.25 percent Import Declaration Fee, 1.5 percent Railway Development Levy | Applies on top of duty |
| KEBS PVoC | China-origin shipments from 1 March 2026 need a Certificate of Conformity from Cotecna or Intertek, or face destination inspection at 5 percent of customs value | Goods under USD 100 for personal use are exempt; a consolidated shipment likely exceeds that in aggregate |
| Lithium cells | Loose 18650 cells ship under UN3480 and most couriers refuse them into Kenya | Buy cells in Nairobi, or ship them installed in the enclosure |

The practical shape is one consolidated parcel with a per-line packing list
and HS codes, declared as development boards and radio modules for
prototyping and not for resale, with every invoice kept. One part, the
narrowband modem, is stocked locally in Nairobi, which sidesteps duty, PVoC
and shipping for that line entirely.

Questions for counsel:

12. Does importing about a dozen development boards and modules for our own
    prototyping fall under the Communications Equipment Distributor licence,
    or is that licence limited to commercial distribution?
13. Is an import permit through the Trade Facilitation Platform needed for LTE
    modules in development quantities?
14. Whether PVoC is assessed per line or per shipment.

## 10. The counsel question list, condensed

| # | Topic | Question | Gates |
|---|---|---|---|
| 1 to 3 | Radio | Operative instrument after 2025 and 2026 regulations; the LBT plus AFA definition; whose test report satisfies section 4.1 | Field trial |
| 4 to 5 | Power-line carrier | Which regulator governs conducted mains signalling between premises; whether KEBS certification is needed for a mains-coupled device in homes | Field trial in customer homes |
| 6 to 7 | Connectivity resale | Which CA licence category; whether operator bundle terms permit resale | Any paid field trial |
| 8 to 11 | Money | E-money, prepaid credit or virtual asset; the VASP Act 2025; AML and KYC; tax treatment | Mainnet fiat |
| 12 to 14 | Import | The distributor licence for own-use prototyping; import permits for LTE modules; PVoC per line or per shipment | The first parcel |
| 15 | Structure | Which entity holds the merchant agreements, the CA licences and the customer float | Live bank onboarding, which requires an incorporated company |
| 16 | Documents | Terms of service for users and node operators, and the disclosure that balances live on a public chain | Public launch |

## 11. References

1. Communications Authority of Kenya, Guidelines on the Use of Radiofrequency
   Spectrum by Short Range Devices, 2022 (Version B Rev 0), Annex I and
   sections 4 and 4.1.
2. `docs/ops/regulatory-brief.md`, the brief prepared for counsel on
   2026-09-09, from which sections 2 to 5 and 9 of this paper are drawn.
3. `hardware/bom.md`, the Kenya import notes, the bench and safety kit, and
   the firmware transmit-power flag.
4. `hardware/pinmap.md`, the safety note on mains coupling isolation and the
   power path.
5. `docs/_plan/revamp-plan.md`, section 3: the bench rule proving the
   narrowband modem on 12 V DC before mains.
6. `firmware/xkoin-gateway/lib/sx1262/sx1262.h`, the centre frequency and
   power amplifier configuration referred to in section 2.
7. EN 50065-1, signalling on low-voltage electrical installations in the
   frequency range 3 kHz to 148.5 kHz.
8. `HANDOVER.md`, backlog item 9: the regulatory gates before field trial and
   mainnet fiat.
9. `docs/papers/03-protocol-xkp.md`, section 7, for the duty-cycle-dependent
   service class figures this paper conditions.
10. `docs/papers/10-security-and-trust.md`, section 4, for the contract
    properties counsel should read as facts.
