# 04. Cost model at 100, 1,000 and 10,000 units

Abstract: The xKoin beta board reaches a factory cost of USD 50.17 for the Node population at 1,000 units and USD 22.74 for the Satellite population, both ex-works China with the enclosure and test included, against a target of USD 52 and USD 25. Landed in Nairobi those become USD 77.50 and USD 36.70 if customs classifies the product under the conservative 25 percent duty line, or USD 62.39 and USD 29.54 under a 0 percent line, and the difference between those two readings is worth more than every component saving in this paper combined. At 10,000 units the Node lands between USD 41.22 and USD 51.20, because enclosure tooling and sea freight both come into range. At 100 units nothing works: the one off engineering and certification spend of USD 33,250 cannot be amortised over 100 boards, and the Node lands between USD 96.85 and USD 120.31 before that spend is counted. Every line below carries an s for sourced or an e for estimate.

Keywords: bill of materials, unit cost, landed cost, Kenya import duty, PVoC, non-recurring engineering, tooling amortisation

## 1. Assumptions

| # | Assumption | Value | Basis |
|---|---|---|---|
| A1 | Exchange rate | 130 KES to 1 USD | The benchmark used in `docs/_drive/03-hardware-bom-and-sourcing-guide.md` |
| A2 | Component prices | Ex-works China, cut tape or reel as the line requires | LCSC and scout listings below |
| A3 | Marking | `s` means a price fetched from a named source this session; `e` means an estimate | Sources in section 9 |
| A4 | Board | 108.00 by 58.00 mm, 4 layer, 1.6 mm, ENIG, two-up panel | [02-pcb-blueprint.md](02-pcb-blueprint.md) sections 2 and 4 |
| A5 | Narrowband PLC route | KQ-130F module at 100 units, discrete ST7540 at 1,000 and above | The crossover is derived in section 3 |
| A6 | Duty classification | Both readings printed: 25 percent and 0 percent | `hardware/bom.md` Kenya import notes state roughly 25 percent for HS chapter 85 while many 8542, 8471 and 8517 lines run 0 to 10 percent |
| A7 | Tax stack | VAT 16 percent on CIF plus duty, Import Declaration Fee 2.25 percent of CIF, Railway Development Levy 1.5 percent of CIF | `hardware/bom.md` Kenya import notes |
| A8 | Satellite cell and panel | Not in this model | `hardware/bom.md` records that loose 18650 cells ship under UN3480 and most couriers refuse them into Kenya, so they are bought in Nairobi |
| A9 | Enclosure | Off-the-shelf OKW plug case at 100 and 1,000; tooled ABS V0 case at 10,000 | Section 5 |
| A10 | Freight | Consolidated air at 100 and 1,000, sea at 10,000, about 0.35 kg boxed per unit | Estimate, section 6 |
| A11 | Quantities | Per variant, not per order. A mixed order of 500 Nodes and 500 Satellites buys components at the 1,000 tier and pays assembly setup once | Standard practice, not quoted |

## 2. Common core, every population

| Line | Part | 100 | 1,000 | 10,000 |
|---|---|---|---|---|
| PCB | 4 layer, 108 by 58 mm, ENIG, two-up | 3.80 e | 2.20 e | 1.45 e |
| U1 | ESP32-S3-WROOM-1-N16R8 | 3.56 s | 3.34 s | 3.10 e |
| U2 | SX1262IMLTRT, QFN-24 | 2.10 e | 1.71 s | 1.55 e |
| Y1 | 32 MHz TCXO, 2 ppm | 0.85 e | 0.62 e | 0.52 e |
| RF | pi match, LPF, IPEX connector | 1.05 e | 0.82 e | 0.70 e |
| Antenna | IPEX to SMA pigtail plus 868 MHz whip | 0.85 s | 0.65 e | 0.52 e |
| J2 | USB-C receptacle plus ESD array | 0.35 e | 0.24 e | 0.19 e |
| 3V3 | buck controller, inductor, capacitors | 0.62 e | 0.44 e | 0.36 e |
| Misc | passives, LEDs, button, test pads, Tag-Connect | 1.60 e | 1.15 e | 0.92 e |
| **Subtotal** | | **14.78** | **11.17** | **9.31** |

The ESP32-S3-WROOM-1-N16R8 figures are LCSC price breaks: USD 3.56 at 100 and USD 3.34 at 1,300, with 20,924 in stock [1]. The SX1262IMLTRT figure at 1,000 is LCSC's from-price of USD 1.71 with 7,723 in stock [2]. The antenna figure at 100 comes from the repo's own sourcing scouts: an IPEX to SMA female bulkhead pigtail at KES 380 for five pieces, so KES 76 each [3], and an 868 MHz 3 dBi SMA whip at KES 22 to 30 depending on the variant picked at checkout [4], which is KES 106 or about USD 0.82 together at the retail single-quantity price. That is a retail AliExpress figure and it is being used as a ceiling rather than a floor, because a factory-direct antenna at 1,000 pieces will not cost more than a two-pack on a marketplace.

## 3. Mains front end, Node and Node-Satellite

| Line | Part | 100 | 1,000 | 10,000 |
|---|---|---|---|---|
| PS1 | Hi-Link HLK-5M12, 12 V 5 W, 3 kV isolation | 1.75 e | 1.61 s | 1.45 e |
| Front end | 13 A fuse, MOV, X2 capacitor, CM choke, inlet pads | 1.30 e | 0.95 e | 0.78 e |
| 5V | buck from the 12 V rail | 0.48 e | 0.34 e | 0.28 e |
| **Subtotal** | | **3.53** | **2.90** | **2.51** |

The HLK figure at 1,000 is LCSC's from-price of USD 1.61 for the HLK-5M05, the 5 V member of the same 5 W series, specified at 100 to 240 VAC in, 5 W out, 3 kV isolation and 38 by 23 by 18 mm [5]. The 12 V member is priced at parity here, which is an assumption, and the quotation will confirm it.

### Narrowband PLC, the two routes priced

| Line | Option A, discrete | 100 | 1,000 | 10,000 |
|---|---|---|---|---|
| U5 | ST7540, TSSOP-28 | 15.19 s | 5.80 e | 4.60 e |
| T1 | 1:1 coupling transformer | 1.20 e | 0.88 e | 0.72 e |
| CY1, CY2 | class Y2, 300 VAC | 0.48 e | 0.34 e | 0.27 e |
| Passives | filters, driver network | 0.55 e | 0.40 e | 0.33 e |
| **Subtotal A** | | **17.42** | **7.42** | **5.92** |

| Line | Option B, module | 100 | 1,000 | 10,000 |
|---|---|---|---|---|
| J5 | KQ-130F on the nine-pin alternate footprint | 13.85 s | 11.00 e | 9.50 e |
| J5 | nine-pin single-row header | 0.12 e | 0.08 e | 0.06 e |
| **Subtotal B** | | **13.97** | **11.08** | **9.56** |

The crossover is the reason the board carries both footprints. LCSC lists the ST7540 at USD 15.19 at quantity one and USD 14.68 at ten, and shows it out of stock [6], so at 100 units the discrete route costs more than the module and cannot be bought anyway. The KQ-130F at KES 1,800 from Pixel Electric in Nairobi is USD 13.85 [7]. From 1,000 units upward the ST7540 volume price, estimated at USD 5.80 and unconfirmed, turns a USD 3.66 penalty into a USD 3.66 saving. That estimate is the second most important unverified number in this paper and it needs a written quotation from ST or an authorised distributor.

## 4. HomePlug block, Node and Node-Satellite

| Line | Part | 100 | 1,000 | 10,000 |
|---|---|---|---|---|
| U3 | Qualcomm QCA7005-AL33, QFN-68 | 14.00 e | 9.50 e | 7.80 e |
| U4 | SPI NOR boot flash, 4 Mbit | 0.22 e | 0.16 e | 0.13 e |
| T2 | line transformer plus driver network | 1.55 e | 1.15 e | 0.94 e |
| CY3, CY4 | class Y2, 300 VAC | 0.48 e | 0.34 e | 0.27 e |
| Support | 25 MHz crystal, 1V2 LDO, decoupling | 0.95 e | 0.70 e | 0.58 e |
| **Subtotal** | | **17.20** | **11.85** | **9.72** |

Every QCA7005 figure is an estimate and this is the single largest unpriced line in the model. Arrow lists the QCA7005-AL33-R and its specification, and Qualcomm publishes the product page, but no price or stock field returned within the fetch timeout during this session, and networking silicon of this class is normally sold under a design-in agreement rather than off a catalogue page [8][9]. The estimates above are anchored on what the part has to beat, which is the USD 46.09 that a finished QCA7420 evaluation board costs [10] and the roughly USD 19 per adapter that a consumer HomePlug pair works out at in `hardware/bom.md`. If the real QCA7005 price at 1,000 units comes back above about USD 14, the bridged commodity adapter wins on cost and the product loses the plug-top form factor. That is the decision this line is guarding.

## 5. Solar block, Satellite only

| Line | Part | 100 | 1,000 | 10,000 |
|---|---|---|---|---|
| U7 | CN3065 solar lithium charger | 0.62 e | 0.47 s | 0.40 e |
| J4 | 18650 holder plus JST connector | 0.55 e | 0.40 e | 0.33 e |
| Protect | DW01A plus FS8205A | 0.28 e | 0.20 e | 0.16 e |
| Input | panel connector, TVS, reverse block | 0.40 e | 0.29 e | 0.24 e |
| **Subtotal** | | **1.85** | **1.36** | **1.13** |

The CN3065 figure at 1,000 is LCSC's from-price of USD 0.469 [11]. The TP4056 the proof of concept uses is cheaper at USD 0.0888 [12] and is the wrong part for the reason given in [01-merged-schematic.md](01-merged-schematic.md#6-power-hlk-5m12-into-a-buck-tree).

## 6. BOM totals by population

| Population | 100 | 1,000 | 10,000 |
|---|---|---|---|
| Node | 49.48 | 33.34 | 27.46 |
| Node-Satellite | 48.98 | 32.94 | 27.14 |
| Satellite | 16.63 | 12.53 | 10.44 |
| Client dongle | 12.68 | 9.77 | 8.34 |

The Node-Satellite is the Node less USD 0.50, USD 0.40 and USD 0.32 for the SMA bulkhead and whip it does not fit. The Client dongle is the common core less the same antenna delta, on a derived outline whose PCB costs USD 2.20, USD 1.20 and USD 0.80 because the mains half of the board is not fabricated. Deriving that outline is a Gerber operation on the same schematic, not a second design.

## 7. Factory cost: assembly, test, enclosure, packaging

| Line | Node and Node-Satellite | Satellite | Client dongle |
|---|---|---|---|
| SMT assembly, 100 / 1,000 / 10,000 | 6.50 / 2.40 / 1.60 e | 4.20 / 1.60 / 1.05 e | 3.60 / 1.35 / 0.90 e |
| Through hole and hand work | 3.00 / 1.30 / 0.85 e | 0.60 / 0.28 / 0.18 e | 0.25 / 0.12 / 0.08 e |
| Two stage test including hipot | 2.20 / 0.90 / 0.55 e | 1.60 / 0.70 / 0.42 e | 1.20 / 0.55 / 0.35 e |
| Firmware flash and key record | 0.35 / 0.18 / 0.12 e | 0.35 / 0.18 / 0.12 e | 0.35 / 0.18 / 0.12 e |
| Conformal coating | 0.70 / 0.35 / 0.22 e | 0.50 / 0.25 / 0.16 e | none |
| Enclosure | 15.00 / 11.00 / 2.80 e | 9.00 / 6.50 / 3.40 e | 3.00 / 2.20 / 1.10 e |
| Packaging | 1.20 / 0.70 / 0.45 e | 1.20 / 0.70 / 0.45 e | 0.80 / 0.45 / 0.30 e |

The enclosure line is the one that changes shape between tiers. At 100 and 1,000 the plug-top case is an off-the-shelf OKW BS 1363 part [13], carried at USD 15.00 and USD 11.00 as estimates because no volume price was fetched. At 10,000 a tooled ABS V0 case costs about USD 1.90 as a moulding with about USD 9,000 of tooling, so USD 2.80 with the tooling amortised over 10,000 units. That is the single biggest per-unit change between the 1,000 and 10,000 tiers, worth USD 8.20 against USD 5.88 for the entire BOM reduction over the same step.

The Satellite enclosure is a different part: an IP54 outdoor box with a cable gland for the panel and no BS 1363 pins.

### Factory cost totals, ex-works China

| Population | 100 | 1,000 | 10,000 |
|---|---|---|---|
| Node | 78.43 | 50.17 | 34.05 |
| Node-Satellite | 77.93 | 49.77 | 33.73 |
| Satellite | 34.08 | 22.74 | 16.22 |
| Client dongle | 21.88 | 14.62 | 11.19 |

Against the target set in [00-compact-board-concept.md](00-compact-board-concept.md#6-the-cost-target-and-the-argument-for-it), USD 52 for the Node and USD 25 for the Satellite at 1,000 units, both clear, by USD 1.83 and USD 2.26 respectively. Neither clears by enough to absorb the QCA7005 line being wrong.

## 8. Landed cost in Nairobi

Freight, as an estimate: consolidated air at about 0.35 kg boxed per unit, USD 7 per kg at 100 units and USD 5.50 per kg at 1,000, giving USD 2.45 and USD 1.93 per unit; sea at 10,000 units at roughly USD 3,700 all-in for the container and local charges, giving USD 0.37 per unit. The Client dongle is lighter and carries USD 1.20, USD 0.90 and USD 0.20.

The tax stack from `hardware/bom.md` gives two multipliers on CIF:

- 25 percent duty: 1 + 0.25 + 0.16 x 1.25 + 0.0225 + 0.015 = **1.4875**
- 0 percent duty: 1 + 0.16 + 0.0225 + 0.015 = **1.1975**

| Population | Tier | Factory | Freight | CIF | Landed at 25 pct duty | Landed at 0 pct duty |
|---|---|---|---|---|---|---|
| Node | 100 | 78.43 | 2.45 | 80.88 | 120.31 | 96.85 |
| Node | 1,000 | 50.17 | 1.93 | 52.10 | 77.50 | 62.39 |
| Node | 10,000 | 34.05 | 0.37 | 34.42 | 51.20 | 41.22 |
| Node-Satellite | 100 | 77.93 | 2.45 | 80.38 | 119.57 | 96.26 |
| Node-Satellite | 1,000 | 49.77 | 1.93 | 51.70 | 76.90 | 61.91 |
| Node-Satellite | 10,000 | 33.73 | 0.37 | 34.10 | 50.72 | 40.83 |
| Satellite | 100 | 34.08 | 2.45 | 36.53 | 54.34 | 43.74 |
| Satellite | 1,000 | 22.74 | 1.93 | 24.67 | 36.70 | 29.54 |
| Satellite | 10,000 | 16.22 | 0.37 | 16.59 | 24.68 | 19.87 |
| Client dongle | 100 | 21.88 | 1.20 | 23.08 | 34.33 | 27.64 |
| Client dongle | 1,000 | 14.62 | 0.90 | 15.52 | 23.09 | 18.58 |
| Client dongle | 10,000 | 11.19 | 0.20 | 11.39 | 16.94 | 13.64 |

The gap between the two duty columns at 1,000 units is USD 15.11 on the Node, which is 30 percent of the factory cost and more than the entire QCA7005 line. Getting a written classification ruling, per line rather than per shipment as `hardware/bom.md` recommends, is worth more engineering time than any component substitution in this paper. The Satellite figures exclude the 18650 cell and the solar panel, which are bought in Nairobi.

## 9. Non-recurring engineering

These are one-off and they are why 100 units is not a business.

| Item | USD | Note |
|---|---|---|
| PCB design and layout: 4 layer, mains barrier, RF island | 12,000 e | Contractor rate, not quoted |
| Stencil and assembly programme setup | 250 e | PCBWay states a free stencil with PCBA [14]; JLCPCB publishes USD 23.57 for a flex assembly fixture and no rigid setup fee [15] |
| Test fixture design and build, two stations | 3,500 e | |
| CE assessment: RED, EN 62368-1, EN 50561-1, EN 50065 | 12,000 e | Test house quotation not obtained |
| CAK type approval | 2,500 e | Fee schedule not fetched; reported processing 4 to 8 weeks |
| First article inspection and pre-compliance scans | 3,000 e | |
| **Subtotal, recurring across all tiers** | **33,250 e** | |
| Enclosure tooling, ABS V0 plug case | 9,000 e | Only incurred at the 10,000 tier |
| **Total at the 10,000 tier** | **42,250 e** | |

Amortised per unit: USD 332.50 at 100, USD 33.25 at 1,000, USD 4.23 at 10,000. The 100-unit column is printed to make the point rather than to be used. A hundred-board run is a pilot paid for out of the programme budget, not a product with a price.

KEBS PVoC is charged per shipment rather than per unit, typically as a percentage of FOB value with a floor, and `hardware/bom.md` records the alternative of destination inspection at 5 percent of customs value if no Certificate of Conformity is presented. At the 1,000 unit tier, 5 percent of a USD 52,100 CIF is USD 2,605, or USD 2.61 per unit, which is the cost of getting the PVoC paperwork wrong.

## 10. What the model is most wrong about

Ranked by how much a wrong answer moves the total.

1. **Duty classification.** Worth USD 15.11 per Node at 1,000 units. Resolvable by a ruling, not by engineering.
2. **QCA7005 price and lead time.** Worth up to USD 9.50 per Node, and if it comes back above about USD 14 the whole plug-top concept is in question.
3. **ST7540 volume price.** Worth USD 3.66 per Node at 1,000 units, and it decides which of the two narrowband footprints is populated.
4. **Enclosure at the 1,000 tier.** USD 11.00 is an estimate against an off-the-shelf case with no volume quotation. A tooled case is cheaper per unit from somewhere between 3,000 and 5,000 units, and finding that crossover needs one moulder's quotation.
5. **Assembly and test rates.** Estimated throughout. The variance between three factories on the same file package is routinely 30 percent, which is why paper 03 sends the package to three.
6. **Freight.** Estimated. Air rates move seasonally and the 10,000 unit sea figure assumes a consolidated container rather than a dedicated one.

## 11. Comparison to what exists

| Reference | Unit price | Source |
|---|---|---|
| xKoin beta Node, 1,000 units, ex-works | 50.17 | This paper |
| xKoin beta Satellite, 1,000 units, ex-works | 22.74 | This paper |
| Proof of concept gateway, modules only, no LTE | about 112 | `hardware/bom.md` gateway subtotal less the SIM7600E-H line |
| Proof of concept gateway, modules only, with LTE | 207 | `hardware/bom.md`, USD 621 for three units |
| Heltec LoRa32 V3, scouted, per unit in a two-pack | 19.64 | KES 2,553 at 130 KES to the dollar [16] |
| Heltec LoRa32 V3, retail | under 30 | Landing page study, section 3 [17] |
| LILYGO T-Beam Supreme | 40 | Landing page study, section 3 [17] |
| Seeed T1000-E | 40 | Landing page study, section 3 [17] |
| ESP32-S3-DevKitC-1 N16R8, scouted | 4.40 | KES 572 [18] |
| RAK WisLink PLC LX200V30 EVB, QCA7420 | 46.09 | [10] |

The Satellite at USD 22.74 sits 16 percent above the scouted Heltec price and below every other Meshtastic-class device in the table, while carrying an SMA bulkhead, a solar charge path and the flash headroom for the receipt ledger. That is the comparison worth making, because a Satellite and a Meshtastic node do the same physical job.

The Node at USD 50.17 has no counterpart in that table and should not be compared to one. The landing page study reaches the same conclusion and states the rule directly: compare on cost per MB delivered, never on unit price [17]. A Node carries a HomePlug modem, a narrowband modem, a mains supply and a captive portal, and the thing it replaces is an adapter pair plus a router plus a billing system.

## 12. References

1. LCSC Electronics, ESP32-S3-WROOM-1-N16R8, part C2913202, USD 3.56 at 100 and USD 3.34 at 1,300, 20,924 in stock. https://www.lcsc.com/product-detail/C2913202.html
2. LCSC Electronics, SX1262IMLTRT, Semtech, part C191341, from USD 1.7113, 7,723 in stock. https://www.lcsc.com/product-detail/C191341.html
3. xKoin repo, `hardware/shopping/parts/ipex-sma-pigtail.json`, chosen listing at KES 380 for five pieces. https://www.aliexpress.com/item/1005009812335103.html
4. xKoin repo, `hardware/shopping/parts/antenna-868-sma.json`, chosen listing at KES 22 to 30 per unit depending on the variant selected at checkout. https://www.aliexpress.com/item/1005002900905329.html
5. LCSC Electronics, HI-LINK HLK-5M05, part C209907, from USD 1.6091, 100 to 240 VAC in, 5 W out, 3 kV isolation, 38 by 23 by 18 mm. https://www.lcsc.com/product-detail/C209907.html
6. LCSC Electronics, ST7540, STMicroelectronics, part C472599, USD 15.19 at one and USD 14.68 at ten, out of stock at the time of writing. https://www.lcsc.com/product-detail/C472599.html
7. Pixel Electric, Nairobi, KQ-130F power cable carrier module, KES 1,800. https://www.pixelelectric.com/sensors/biometric-rotation-current/current-voltage/kq-130f-power-cable-carrier-module/
8. Arrow Electronics, QCA7005-AL33-R, Qualcomm, HomePlug Green PHY 1.1, SPI and UART host interfaces, 4 to 10 Mbps PHY rate, single 3.3 V rail, QFN-68. Price and stock fields did not return within the fetch timeout. https://www.arrow.com/en/products/qca7005-al33-r/qualcomm.html
9. Qualcomm, QCA7005 Powerline and HomePlug chipset product page. https://www.qualcomm.com/products/networking/qca7005
10. RAK Wireless, WisLink PLC LX200V30 EVB, Qualcomm QCA7420, 500 Mbps PHY rate, USD 46.09. https://store.rakwireless.com/products/wisplc-pro-development-board-plc-module-power-line-twisted-pair-ethernet-interface-500mbps-support-network-adapter
11. LCSC Electronics, CN3065, Consonance, part C45284, from USD 0.469. https://www.lcsc.com/product-detail/C45284.html
12. LCSC Electronics, TP4056-42-ESOP8, part C16581, from USD 0.0888, 80,075 in stock. https://www.lcsc.com/product-detail/PMIC-Battery-Management_TOPPOWER_TP4056_TP4056_C16581.html
13. RS Components, OKW ABS plug case, 120 by 65 by 55 mm, BS 1363 approved, flame-retardant PC/ABS UL 94 V-0. https://uk.rs-online.com/web/p/power-supply-cases/0583432
14. PCBWay, PCB assembly, free stencil with PCBA, lead time 3 to 5 days. https://www.pcbway.com/pcb-assembly.html
15. JLCPCB, PCB assembly capabilities, flex assembly fixture at USD 23.57, MOQ and lead time tiers. https://jlcpcb.com/capabilities/pcb-assembly-capabilities
16. xKoin repo, `hardware/shopping/parts/heltec-lora32-v3-868.json`, chosen listing at KES 5,106 for two. https://www.aliexpress.com/item/1005008177147021.html
17. xKoin repo, `docs/_plan/research/02-landing-page-design-study.md`, section 3.
18. xKoin repo, `hardware/shopping/parts/esp32-s3-devkitc-n16r8.json`, chosen listing at KES 572. https://www.aliexpress.com/item/1005008957932920.html
19. xKoin repo, `hardware/bom.md`, Kenya import notes and gateway BOM subtotals.
