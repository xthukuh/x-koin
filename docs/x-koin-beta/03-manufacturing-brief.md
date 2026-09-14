# 03. Manufacturing brief for a Shenzhen contract manufacturer

Abstract: This paper is the package a contract manufacturer needs to quote and build the xKoin beta board, and the regulatory work that has to run beside it. The file set is conventional: RS-274X Gerbers, an Excellon drill file, a centroid pick and place file, a BOM carrying manufacturer part numbers and named alternates, an assembly drawing, a written test procedure, a signed firmware image with a flashing jig, and STEP models of the board and the enclosure. The schedule is not conventional. Board assembly is fast, with JLCPCB quoting 1 to 3 days on its Economic line for 2 to 50 pieces and 4 days or more on its Standard line for 2 to 80,000 pieces, and PCBWay quoting 3 to 5 days. Certification is slow: a Kenyan type approval runs 4 to 8 weeks on typical reported timelines, and the mains and powerline parts of the CE assessment need a test house rather than a self-declaration. There is no live HomePlug certification to obtain, because the HomePlug Alliance put its specifications into the public domain in October 2016, so interoperability is proven on the bench against commodity adapters instead.

Keywords: contract manufacture, Gerber, centroid, DFM, CE RED, CAK type approval, KEBS PVoC, HomePlug interoperability

## 1. Scope

The board is defined in [01-merged-schematic.md](01-merged-schematic.md) and [02-pcb-blueprint.md](02-pcb-blueprint.md). This paper assumes both are final and covers what leaves our hands and what comes back. Prices are in [04-cost-model.md](04-cost-model.md).

## 2. The file package

A Shenzhen assembler will quote from three files and build from nine. Sending the three and expecting a build is the most common way to lose a week.

| # | Artefact | Format | Why the factory needs it |
|---|---|---|---|
| 1 | Fabrication data | Gerber RS-274X, one file per layer, plus solder mask, paste and silkscreen | The copper. RS-274X carries apertures inline, so no separate aperture file travels with it |
| 2 | Drill data | Excellon 2 with a tool table, plated and non-plated in separate files | The two mains-side mounting holes are non-plated and will be plated by default if they arrive in one file |
| 3 | Board outline and slot | A dedicated mechanical layer carrying the outline, the 2.00 mm isolation slot and the V-score line | The slot is a routing operation, not a large drill, and the V-score has to be called out or it will not be cut |
| 4 | Centroid | CSV: designator, X, Y, rotation, layer, in millimetres, origin at the panel datum | Pick and place. PCBWay names Gerbers, BOM and centroid as the three required uploads [1] |
| 5 | BOM | CSV or XLSX: designator, quantity, description, manufacturer, manufacturer part number, at least one named alternate per line, and a do-not-substitute flag on the safety-critical lines | Section 3 |
| 6 | Assembly drawing | PDF: top and bottom views, polarity marks, the isolation barrier, the RF keep-outs, the Y2 placement tolerance, the conformal coating mask | Section 5 |
| 7 | Test procedure | PDF plus the fixture drawing: what is probed, what passes, what fails, what gets scrapped rather than reworked | Section 6 |
| 8 | Firmware | A signed binary plus a flashing script, and the jig that holds the board against the Tag-Connect pads | Section 6 |
| 9 | Enclosure | STEP of the PCB assembly and STEP of the case, plus the 2D drawing for the SMA bulkhead hole and any light pipe | The assembler fits the board into the case and screws it shut, and cannot do that from a photograph |

The BOM is where a first-time build usually goes wrong. Every line carries a manufacturer part number, not a description. Every line that the assembler is free to substitute says so explicitly, and every line that it is not free to substitute says that louder.

## 3. Do-not-substitute lines

| Reference | Part | Why no substitution |
|---|---|---|
| PS1 | Hi-Link HLK-5M12 | The safety file names this module and its 3 kV isolation. A different AC-DC module means a new safety assessment |
| CY1, CY2 | Class Y2, 300 VAC | A class X capacitor in a Y2 position fails short rather than open and puts mains on the SELV side |
| T1, T2 | The specified coupling transformers | Their isolation rating is part of the barrier argument |
| U1 | ESP32-S3-WROOM-1 N16R8 | The 8 MB octal PSRAM is the part variant, and an N8R2 in the same footprint would boot and then run out of memory in the field |
| U2 | SX1262IMLTRT | An SX1276 or an LLCC68 fits nothing and does not speak the firmware's register set |
| U3 | QCA7005 | Section 7 |
| F1 | 13 A fuse to the enclosure approval | Part of the plug assembly, not a free choice |

Named alternates are welcome and expected on the passives, the LDOs, the buck controllers and the connectors. The assembler will ask, and a BOM that answers in advance quotes faster.

## 4. MOQ and lead time

Figures below are as stated on the manufacturers' own capability pages at the time of writing. They are quoting-page figures, not a quotation.

| Item | JLCPCB | PCBWay |
|---|---|---|
| Assembly MOQ | Economic PCBA 2 to 50 pcs; Standard PCBA 2 to 80,000 pcs [2] | No hard minimum stated; worked examples from 5 pcs upward [1] |
| Assembly lead time | Economic 1 to 3 days; Standard 4 days or more [2] | 3 to 5 days, with a stated 24 hour option [1] |
| Single board size | Economic 10 by 10 mm to 470 by 500 mm; Standard 70 by 70 mm to 460 by 500 mm [2] | Not stated on the assembly page |
| Panelised size | Economic 10 by 10 mm to 250 by 250 mm; Standard 70 by 70 mm to 250 by 250 mm [2] | Not stated |
| Layer count | Economic 2, 4 and 6 layers; Standard 1 to 32 layers [2] | Not stated on the assembly page |
| Stencil | Charged separately unless stated | Free stencil with PCBA [1] |
| Fixture or setup | Flex assembly fixture quoted at USD 23.57 each; rigid setup fees not published [2] | No setup fee stated |

Two consequences for this board. The board is 108.00 by 58.00 mm, which clears 70 mm in one dimension and not the other, so a Standard PCBA order has to arrive panelised; paper 02 section 8 specifies a two-up panel for exactly this reason. And the quoted lead times cover assembly only. Component procurement for the QCA7005 and, at low volume, the ST7540 is the real schedule driver, and both are covered in section 7.

The realistic first-build schedule, with every step conditional on the one before it clearing:

| Step | Elapsed | Condition |
|---|---|---|
| Quotation from three factories | 1 week | Complete file package sent on day one |
| Component procurement | 2 to 8 weeks | Driven by the QCA7005 lead time, which is unknown until a quotation names it |
| Fab and assembly, 100 pieces | 1 to 2 weeks | Panelised, Standard line |
| First article inspection and bring-up | 1 week | Test fixture already built |
| Safety and EMC pre-scan | 2 weeks | Before, not after, the tooling is cut |
| Full CE assessment | 4 to 8 weeks | Notified body involvement on the mains and PLC parts |
| CAK type approval | 4 to 8 weeks, typical reported | Accredited test report in hand [3][4] |

## 5. DFM points specific to this board

Generic DFM advice is in every factory's own guide. These four are the ones a generic guide will not catch, and each goes on the assembly drawing as well as in the covering note.

1. **Mains clearance is a design rule, not a preference.** The barrier carries 8.00 mm of creepage and 5.50 mm of clearance, and the mains-side traces carry 2.50 mm between line and neutral. Any assembler-side change, a re-spun footprint, a moved fiducial, a widened pad, is a change to the safety file and comes back to us before it is cut. The exact values are confirmed against IEC 62368-1 tables by the test house, which is why the drawing carries them as minimums rather than as nominals.
2. **The RF keep-outs are invisible in copper.** The 15.00 mm Wi-Fi keep-out beyond the ESP32-S3-WROOM-1 antenna and the SX1262 island boundary must stay free of labels, screw bosses, coating overspray, tape and the assembler's own serial-number sticker. None of those appear on a copper layer, so all of them are drawn on the assembly drawing.
3. **The Y2 capacitors carry a tighter placement tolerance than everything else.** CY1 and CY2 sit centred on the isolation slot with their pads symmetric about it. One millimetre of placement drift removes one millimetre of creepage on one side. The assembly drawing calls for plus or minus 0.2 mm on those two positions and normal tolerance everywhere else, and first article inspection measures them.
4. **Conformal coating is masked, not blanket.** Coat the mains section and the SELV section; mask the USB-C receptacle, the IPEX connector, the six test pads, the Tag-Connect pads and the entire Wi-Fi keep-out. Coating inside the antenna zone detunes it, and coating over a test pad turns a two-minute rework into a scrapped board.

## 6. Test and firmware

The factory runs a two-stage test and ships neither stage's failures.

**Stage one, board level, before the case.** The fixture lands on TP1 to TP6 and the Tag-Connect pads. It powers the board from the fixture, not from mains, and checks the 3V3 and 5 V rails, then flashes the production firmware over UART0, then reads back a self-test report over the same link: the SX1262 responds to a register read and reports its silicon version, the QCA7005 completes its flash boot and answers on SPI, the ST7540 asserts carrier detect against a loopback injected by the fixture, and the ESP32-S3 reports its flash and PSRAM sizes so an N8R2 substitution is caught here rather than in Nairobi. TP5 and TP6 carry the pass and fail flags so the fixture can read the result without parsing a log.

**Stage two, mains applied, after the case.** A hipot test across the isolation barrier at the voltage the safety file specifies, then a functional check on a live segment: the board draws its rated current, the HLK output is in tolerance, and the narrowband and broadband modems both see the line. This stage runs behind an RCD on every station.

Firmware ships as a signed binary. The per-device Ed25519 identity is generated on the device at first boot rather than programmed at the factory, so no secret material travels to Shenzhen and a compromised flashing station cannot mint node identities. The factory flashes an image, reads a public key back, and records it against the serial number. That record is the provisioning file that comes home with the shipment.

## 7. Certification path

### 7.1 The radio, under CE RED

The product is radio equipment under Directive 2014/53/EU, which has applied since 13 June 2016 [5]. It carries two radios and both are in scope: the 868 MHz SX1262 path and the 2.4 GHz Wi-Fi in the ESP32-S3 module. The assessment names a set of harmonised standards, each covering one or more essential requirements, and more than one is normally needed [5][6].

| Essential requirement | Standard family | Note |
|---|---|---|
| Efficient spectrum use, 868 MHz | EN 300 220, short range devices 25 to 1000 MHz below 500 mW [6] | The PA setting decides the test limits, and `sx1262.h` currently sets +22 dBm |
| Efficient spectrum use, 2.4 GHz | EN 300 328 [6] | The ESP32-S3-WROOM-1 module carries its own report, which shortens this but does not remove it |
| EMC | EN 301 489 series [6] | Multi-part, selected by radio type |
| Electrical safety | EN 62368-1 [6] | The mains section makes this the long pole |
| RF exposure | The standard the test house nominates for low-power equipment | Named in the test plan rather than asserted here |

### 7.2 The powerline sections

Two separate standards apply to the two PLC paths, and this is the part a radio test house may not raise on its own.

The QCA7005 broadband path transmits between 2 and 30 MHz on the mains, which is the scope of EN 50561-1, the CENELEC standard for radio disturbance from in-home powerline apparatus, associated with the EMC and radio directives including 2014/53/EU [7]. This standard is what forces notching and adaptive transmit power in commodity HomePlug adapters, and the QCA7005 configuration has to be set for it rather than left at a default.

The ST7540 narrowband path transmits between about 120 and 135 kHz, inside the 3 to 148.5 kHz mains signalling band. LCSC's own description of the part states that it is designed for power line communication applications compliant with EN 50065 [8]. That compliance belongs to the silicon; the coupling network, the transmit level and the band chosen are ours to prove.

### 7.3 HomePlug Alliance considerations

There is no certification to buy. On 18 October 2016 the HomePlug Alliance announced that all of its specifications would be placed in the public domain and that other organisations would take on future activity, with a memorandum of understanding with the Wi-SUN Alliance covering the transition of certification testing and a letter of intent from MoCA regarding the nVoy programme [9]. Over 215 HomePlug products had been certified before that transition [9].

The practical consequence is that "HomePlug AV compatible" is a claim we have to substantiate ourselves. The test is an interoperability matrix run on the bench: the beta board against at least three commodity adapter families on a real building circuit, recording association time, PHY rate and goodput in both directions, with the adapters in their factory-default network password. That matrix is a shipping deliverable, not a nice-to-have, because the product is sold into buildings that already contain other people's adapters.

### 7.4 Kenya: CAK and KEBS

Two separate authorities, two separate processes.

**Communications Authority of Kenya.** The CA type approves radio communication equipment intended for use in Kenya, and equipment must be type approved before it is activated [3]. Typical reported processing runs 4 to 8 weeks depending on device category, documentation completeness and laboratory turnaround, with fees set per the CA schedule and differing between personal use and commercial marketing [4]. `hardware/bom.md` records the relevant exemption: devices inside the CA 2022 short range device guideline table, 868.0 to 868.6 MHz at 25 mW ERP or 869.4 to 869.65 MHz at 500 mW ERP, are exempt from type approval, but the importer must be able to produce an accredited laboratory test report on request [10]. The same file flags that the firmware's +22 dBm setting, about 158 mW, is roughly six times the 25 mW ERP exemption ceiling at 868.1 MHz. A product sold commercially, as distinct from a handful of development units, should go through type approval regardless of the exemption argument, and the July 2026 Communications Equipment Distributor licence applies to commercial importers and wholesalers [10].

**Kenya Bureau of Standards.** Imports from China from 1 March 2026 need a Certificate of Conformity from Cotecna or Intertek under the PVoC programme, or the consignment faces destination inspection at 5 percent of customs value [10]. For a commercial production run there is no plausible reading under which the under-USD-100 personal-use exemption applies, so PVoC is a line in the cost model and a step in the schedule, arranged before the goods leave Shenzhen rather than after they arrive in Mombasa.

**Safety for the mains part.** The plug-top form factor means the finished product is a mains-connected appliance with BS 1363 pins, and the pins, the fuse and the case are part of the safety argument rather than accessories to it. The OKW case family is approved to BS 1363 and moulded in UL 94 V-0 material [11], which is the starting point and not the finish; the assessment is on the assembled product.

## 8. Questions to ask three candidate manufacturers

Send the same list to three factories and compare the answers side by side. A factory that answers questions 3, 6 and 9 clearly is worth more than one that is ten percent cheaper.

1. What is your quoted price at 100, 1,000 and 10,000 pieces, split into PCB fab, components, SMT assembly, through-hole and hand work, test, and one-off non-recurring charges?
2. What is your component lead time on the QCA7005 specifically, and will you source it, or do we consign it? If you source it, name your supplier and the authorised chain.
3. Do you have prior build experience with mains-isolated boards carrying a creepage requirement, and will you run a first article inspection that measures the Y2 capacitor placement against the drawing?
4. What is your position on the two-up panel we specify, and would you prefer a different array? What rail width and tooling hole pattern do you want?
5. Can you run the two-stage test in section 6, including hipot across the barrier after casing, and what do you charge per unit for it?
6. Can you flash a signed firmware image, read a public key back over UART, and return a serial-number-to-public-key file with the shipment?
7. Can you fit the board into the OKW plug case, fit the SMA bulkhead, and ship the finished unit boxed, or do you assemble the board only?
8. What conformal coating process do you run, and can you mask to a drawing rather than to a verbal instruction?
9. What is your change control process? If a component goes out of stock mid-build, what happens, and who signs it off?
10. Can you support the PVoC inspection at your premises, and have you worked with Cotecna or Intertek for a Kenya-bound shipment before?
11. What is your rework and scrap policy on a board that fails stage two, given that a board that has seen mains is not a board we want to rework blind?
12. What is your minimum for a repeat order, and how long do you hold the stencil and the programme between runs?

## 9. References

1. PCBWay, PCB assembly: required uploads are Gerbers, parts list and centroid file; PCBA lead time 3 to 5 days, as quick as 24 hours; free stencil. https://www.pcbway.com/pcb-assembly.html
2. JLCPCB, PCB assembly capabilities: Economic PCBA 2 to 50 pcs at 1 to 3 days, Standard PCBA 2 to 80,000 pcs at 4 days or more, board and panel size ranges, layer counts, flex fixture at USD 23.57. https://jlcpcb.com/capabilities/pcb-assembly-capabilities
3. Communications Authority of Kenya, licensing procedures and type approval responsibility. https://www.ca.go.ke/licensing-procedures
4. Type approval in Kenya, reported CA processing times of 4 to 8 weeks and the fee structure. https://www.bizbrokerskenya.com/cak-type-approval.html
5. European Commission, Radio Equipment Directive 2014/53/EU, harmonised standards for radio equipment. https://single-market-economy.ec.europa.eu/single-market/goods/european-standards/harmonised-standards/radio-equipment_en
6. SGS, Radio Equipment Directive 2014/53/EU, standard families EN 300 220, EN 300 328, EN 301 489 and EN 62368-1. https://www.sgs.com/en/services/radio-equipment-directive-2014-53-eu-red
7. CENELEC EN 50561-1, power line communication apparatus used in low-voltage installations, radio disturbance characteristics, apparatus for in-home use. https://standards.iteh.ai/catalog/standards/clc/4e0023ef-9771-4e41-bddf-7c7319565ec2/en-50561-1-2013
8. LCSC Electronics, ST7540 product description, EN 50065 compliance. https://www.lcsc.com/product-detail/C472599.html
9. HomePlug Powerline Alliance, 18 October 2016 announcement placing the specifications in the public domain, the Wi-SUN memorandum of understanding and the MoCA letter of intent. https://en.wikipedia.org/wiki/HomePlug_Powerline_Alliance
10. xKoin repo, `hardware/bom.md`, Kenya import notes: KEBS PVoC, CA short range device exemption, the +22 dBm flag, and the 2026 distributor licence.
11. RS Components, OKW ABS plug case, BS 1363 approval, UL 94 V-0 material. https://uk.rs-online.com/web/p/power-supply-cases/0583432
