# 00. The compact merged board: one PCB, four populations

Abstract: The xKoin proof of concept builds four device roles out of five separate development boards wired together on a bench, and the module cost of a single gateway comes to USD 207 before freight or duty. This paper defines the board that replaces it: one 108 by 58 mm four-layer PCB that carries an ESP32-S3-WROOM-1 N16R8, a bare SX1262 at 868 MHz, a Qualcomm QCA7005 HomePlug Green PHY modem on SPI, an ST7540 narrowband FSK transceiver, and a Hi-Link mains supply behind an 8.0 mm isolation barrier, and that becomes a Node, a Node-Satellite, a Satellite or a Client dongle by which parts are fitted. At 1,000 units the Node population reaches an estimated USD 50.17 ex-works and the Satellite population USD 22.74, against a Meshtastic Heltec LoRa32 V3 scouted at USD 19.64. The Satellite is therefore within a fifth of Meshtastic unit cost while carrying the economic layer, and the Node is not comparable on unit price at all, because no Meshtastic device carries a bulk data plane. Seven proof of concept results gate the design.

Keywords: merged PCB, population options, HomePlug Green PHY, narrowband PLC, mains isolation, contract manufacture, unit cost

## 1. Scope

This is the first of five papers describing the xKoin beta hardware, the version built by a contract manufacturer rather than assembled on a bench. The set is:

- 00 (this paper): the goal, the constraints, the variants, the cost target, and what the proof of concept must prove first.
- [01-merged-schematic.md](01-merged-schematic.md): the block schematic, the part choices and the tradeoff each one won, and the signal table.
- [02-pcb-blueprint.md](02-pcb-blueprint.md): the outline, the layer stack, the keep-outs and the DFM notes.
- [03-manufacturing-brief.md](03-manufacturing-brief.md): the file package, the certification path, MOQ and lead time, and the questions for the factories.
- [04-cost-model.md](04-cost-model.md): the numbers, with every source named.

The device lineup and the names come from [../\_plan/revamp-plan.md](../_plan/revamp-plan.md) section 1. The wire formats and the medium table come from [../../protocol/spec.md](../../protocol/spec.md) section 1. Nothing here changes the protocol. The beta board is a packaging and cost exercise on hardware whose behaviour the proof of concept has already fixed.

## 2. The goal

One design, one Gerber set, one stencil, one assembly programme, four saleable products. The proof of concept reaches the same four roles by combining an ESP32-S3-DevKitC-1, a Waveshare Core1262 or Ebyte E22 radio, a KQ-130F module, a TP-Link HomePlug adapter pair and a separate mains supply, and every one of those is a connector, a jumper and a failure mode. The beta board removes the wiring and buys the volume discount on one PCB instead of five.

The population-option approach is the part worth stating plainly. The board is laid out once with every footprint present. A Node is built by fitting all of them. A Satellite is built by skipping the mains front end, the ST7540 and the QCA7005, and fitting the CN3065 solar charger and the cell connector instead. A Client dongle is built by snapping the board along a V-score that runs down the mains isolation slot, which leaves the SELV half as a USB-C stick. One manufacturing file set covers all four, and the factory changes populations by loading a different feeder list, not a different board.

## 3. Constraints

| # | Constraint | Source | Consequence for the board |
|---|---|---|---|
| C1 | Couples to 230 V 50 Hz mains with galvanic isolation | pinmap SAFETY note; drive doc 03 section 2.2 | Isolation barrier across the board, 8.0 mm creepage, Y2 capacitors as the only signal crossing besides transformers |
| C2 | 868 MHz LoRa, SF7 BW125 CR4/5, 226 B frames | spec.md section 1 | Bare SX1262 with a 32 MHz TCXO, a pi match and a low-pass filter, 50 ohm controlled trace |
| C3 | HomePlug AV class bulk plane, about 10 Mbps goodput | spec.md section 1 medium table | QCA7005 Green PHY on SPI, whose 10 Mbps PHY ceiling is the binding limit (section 5) |
| C4 | ESP32-S3 with PSRAM for session state and receipt counters | revamp-plan section 3; bom.md gateway row | ESP32-S3-WROOM-1 N16R8, 16 MB flash and 8 MB octal PSRAM |
| C5 | Wi-Fi access point for client attach and the captive portal | spec.md section 1; drive doc 05 decision point 2 | The module PCB antenna with a 15 mm no-copper keep-out over the board edge |
| C6 | USB-C on the Client dongle variant | revamp-plan section 1 | ESP32-S3 native USB on GPIO19 and GPIO20, plus 5 V input for dongle power |
| C7 | Solar input on the Satellite variant | pinmap doc03; revamp-plan section 3 | CN3065 charger, 6 V panel input, 18650 connector, battery sense on GPIO1 |
| C8 | Enclosure plugs into a UK type G socket | bom.md Kenya notes; Kenya uses BS 1363 | Board sized to an OKW BS 1363 plug case, mains section at one end |

Constraint C1 is the one that sets the board size and half the cost. Every other block would fit a 50 by 40 mm PCB. The mains section, the isolation slot and the creepage that the slot has to carry are what make the board 108 mm long.

## 4. The four populations

| Variant | Role (revamp-plan section 1) | Blocks fitted | Blocks omitted |
|---|---|---|---|
| xKoin-Node | Gateway: backhaul in, mains and radio out, meters every WAN byte | Mains front end, HLK-5M12, ST7540 with T1, QCA7005 with T2, ESP32-S3, SX1262, SMA bulkhead, USB-C | Solar charger, cell connector |
| xKoin-Node-Satellite | Wall-socket relay on the same mains segment | As Node, but IPEX to an internal antenna | SMA bulkhead, solar charger, cell connector |
| xKoin-Satellite | Off-grid LoRa remote: solar, deep sleep, class C service | ESP32-S3, SX1262, SMA bulkhead, USB-C, CN3065, cell connector | Mains front end, HLK-5M12, ST7540, T1, QCA7005, T2 |
| xKoin-Client dongle | User device: OTG AP dongle for direct LoRa reach | ESP32-S3, SX1262, USB-C, IPEX antenna; board snapped at the V-score | Everything on the mains side of the slot, plus the solar block |

The Node and the Node-Satellite are the same population apart from the antenna connector. That is deliberate. Their difference is firmware role and where they sit in the building, not silicon, and building them as one stock-keeping unit halves the inventory the factory has to carry.

The Satellite population does not use the plug-top enclosure. It needs an outdoor box with a panel gland and no BS 1363 pins, so it shares the PCB and not the case. That is the one place where one board does not give one product.

## 5. What the proof of concept must prove first

This board should not be designed until the bench answers seven questions. Each one, answered the wrong way, changes a part choice or deletes a block.

| # | Question | Demo that answers it | What changes if the answer is no |
|---|---|---|---|
| P1 | Does narrowband FSK at 120 to 135 kHz survive a live Kenyan 230 V segment with real loads on it? | D1 and D3 | The ST7540 block and T1 are deleted, and control moves entirely to LoRa |
| P2 | Does HomePlug carry consumer video across a real building's wiring at the 10 Mbps the spec assumes? | D5 | A Green PHY part at a 10 Mbps PHY ceiling is not enough, and the bulk plane needs an AV2 chipset the ESP32-S3 cannot host over SPI |
| P3 | Can one ESP32-S3 run the softAP, the captive portal, admission and metering for the client count a building needs? | D1 | Drive doc 05 decision point 2 wins, a router SoC joins the board, and the cost model in paper 04 is wrong by the price of that SoC |
| P4 | Does SF7 close the link through 60 dB of path loss at the PA setting the regulator allows? | D2 | The RF front end gains an external PA and LNA, and the antenna keep-out grows |
| P5 | What TX power clears the CAK SRD exemption at 868.0 to 868.6 MHz? | Bench measurement plus counsel | At 25 mW ERP the firmware PA config drops from the +22 dBm in `sx1262.h`; above it the product needs CA type approval, which is a schedule item in paper 03 |
| P6 | Does the Satellite hold under 40 mA average across two overcast days? | D6 plus a bench soak | The panel and cell grow, the enclosure grows, and the Satellite stops being the cheap variant |
| P7 | Do cumulative receipts survive a WAN outage and settle correctly on return? | D4 | Flash and PSRAM sizing changes, and the N16R8 choice needs re-checking |

P2 is the one that carries the most cost. The QCA7005 is a HomePlug Green PHY part with an SPI host interface, and Green PHY is specified at 4 to 10 Mbps PHY rate, against the 500 Mbps PHY rate of an AV2 part such as the QCA7420 [4][5]. The spec's medium table already assumes about 10 Mbps of HomePlug goodput, so Green PHY is consistent with the protocol as written, and demo D5 is the test that says whether the protocol as written is enough for the product as sold.

## 6. The cost target and the argument for it

The target for the beta board at 1,000 units is a Node factory cost at or under USD 52 and a Satellite factory cost at or under USD 25, both ex-works China, board and enclosure included, before freight and Kenyan import charges. Paper 04 derives USD 50.17 and USD 22.74 against that target, and every line in it carries its source or is marked as an estimate.

Three reference points make the target meaningful.

**The proof of concept BOM.** `hardware/bom.md` prices three gateways' worth of modules at USD 621, so USD 207 per gateway, parts only, before freight, Kenya duty, VAT, the 2.25 percent Import Declaration Fee, the 1.5 percent Railway Development Levy or PVoC inspection. That figure includes a SIM7600E-H LTE HAT at USD 95 which the beta board does not carry, because the revamp plan defers LTE backhaul and takes backhaul from an existing router or a hotspot. Stripping the LTE line leaves USD 112 per gateway of modules. The beta Node at USD 50.17 is a 55 percent reduction against that, and the reduction comes from replacing breakout boards with bare silicon rather than from any volume discount on the same parts.

**Meshtastic hardware.** The landing page study records Heltec LoRa32 V3 at under USD 30 retail, LILYGO T-Beam Supreme at USD 40 and Seeed T1000-E at USD 40 [6, section 3]. The repo's own sourcing scout found the Heltec V3 at KES 2,553 per unit in a two-pack, which is USD 19.64 at the 130 KES benchmark the drive BOM uses [7]. The xKoin Satellite population at USD 22.74 sits 16 percent above that scouted price, and the gap buys an SMA bulkhead, a solar charge path and the flash headroom for the receipt ledger. That comparison is fair because the Satellite and a Meshtastic node do the same physical job.

**The comparison that is not fair.** A Node at USD 50.17 against a Meshtastic node at USD 19.64 says nothing, because a Meshtastic node carries no bulk plane, no mains coupling and no captive portal. The landing page study reaches the same conclusion from the other direction and states the rule: compare on cost per MB delivered, never on unit price [6, section 3]. A Node that delivers building-wide bulk data over the mains at 10 Mbps is competing with a HomePlug adapter pair plus a router plus a billing system, not with a mesh messenger.

## 7. What this paper does not settle

The QCA7005 has no open distributor price. Arrow lists the QCA7005-AL33-R part and its specification, and the search index carries that listing, but the price and stock fields did not return within the fetch timeout during this session, and Qualcomm networking silicon of this class is normally sold under a design-in agreement rather than off a catalogue page [3][4]. Paper 04 carries USD 9.50 at 1,000 units as an estimate and flags it as the single largest unpriced line. A written quotation from Qualcomm or from an authorised distributor is the first procurement action after the proof of concept closes.

The ST7540 is in the same shape for a different reason. LCSC lists it at USD 15.19 at quantity one and USD 14.68 at ten, and shows it out of stock [2]. At those prices the discrete route loses to the KQ-130F module outright. The design only makes sense at a volume price from ST or an authorised distributor, which paper 04 estimates at USD 5.80 at 1,000 units and marks as an estimate.

Kenyan duty classification is open. `hardware/bom.md` records that HS chapter 85 electronics attract roughly 25 percent under the EAC common external tariff while many lines under 8542, 8471 and 8517 fall between 0 and 10 percent. A finished radio transceiver in an enclosure is a different classification argument from a bare module, and the difference between the two moves the landed Node cost by about USD 15. Paper 04 prints both.

## 8. References

1. Espressif, ESP32-S3 GPIO and RTC GPIO, ESP-IDF Programming Guide. https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/peripherals/gpio.html
2. LCSC Electronics, ST7540, STMicroelectronics, TSSOP-28, price breaks and stock. https://www.lcsc.com/product-detail/C472599.html
3. Arrow Electronics, QCA7005-AL33-R, Qualcomm PHY product listing. https://www.arrow.com/en/products/qca7005-al33-r/qualcomm.html
4. Qualcomm, QCA7005 Powerline and HomePlug chipset product page. https://www.qualcomm.com/products/networking/qca7005
5. RAK Wireless, WisLink PLC LX200V30 EVB, Qualcomm QCA7420, 500 Mbps PHY rate. https://store.rakwireless.com/products/wisplc-pro-development-board-plc-module-power-line-twisted-pair-ethernet-interface-500mbps-support-network-adapter
6. xKoin repo, `docs/_plan/research/02-landing-page-design-study.md`, section 3.
7. xKoin repo, `hardware/shopping/parts/heltec-lora32-v3-868.json`.
8. xKoin repo, `hardware/bom.md`, Kenya import notes and gateway BOM.
9. xKoin repo, `protocol/spec.md`, section 1 mediums.
10. xKoin repo, `docs/_drive/05-architecture-decisions-and-tradeoffs.md`, decision points 1 and 2.
