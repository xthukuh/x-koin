# xKoin MVP Field Kit - Bill of Materials

Procurement list for the first field-test kit: 2 gateways, 3 satellites, 2 client-side
test nodes, plus a shared bench/safety kit. Every module carries a 20 percent spare
allowance (rounded up), and the SX1262 radio carries one extra bench spare on top of
that, because a dead radio during a field trip in Nairobi cannot be next-day shipped in.

## Kit sizing

| Role | Units in kit |
|---|---|
| Gateway (ESP32-S3, SX1262 + KQ-130F PLC + LTE backhaul) | 2 |
| Satellite (ESP32-S3, SX1262, solar/battery, off-grid) | 3 |
| Client test node (ESP32-S3 dev kit + SX1262 only, bench radio testing) | 2 |
| **Total field units** | **7** |

Spare policy: every module line below is (role count x qty per unit), inflated 20
percent and rounded up to a whole part. The SX1262 radio additionally gets +1 unit
kit-wide as a known-good bench reference, listed under Bench and safety.

Read for this BOM: `hardware/pinmap.md` (pins and part identity), `HANDOVER.md`
section 3 (wire-format and pin invariants) and section 4 items 3, 4, 6 (ESP-IDF
compile-untested, SX1262 register VERIFY flags, satellite firmware pending),
`firmware/xkoin-gateway/platformio.ini` (board id `esp32-s3-devkitc-1`), and
`firmware/xkoin-gateway/lib/sx1262/sx1262.h` (LoRa and GFSK both run at 868.1 MHz,
PA config is +22 dBm - see the regulatory flag in the Kenya import section below).

## Gateway (2 units, 3 incl. spares per module)

| Part | Exact spec / part number | Qty per unit | Total qty incl. spares | Indicative unit price USD | Suggested source | Gotcha |
|---|---|---|---|---|---|---|
| MCU dev board | ESP32-S3-DevKitC-1, N16R8 (16 MB flash / 8 MB PSRAM), ESP32-S3-WROOM-1 module (PCB antenna, not the -1U U.FL variant) | 1 | 3 | 12.00 | Amazon / DigiKey (part ESP32-S3-WROOM-1-N16R8) | Confirm N16R8 in the listing title; sellers mix N8R8 and N16R8 under the same photo. `platformio.ini` targets board id `esp32-s3-devkitc-1`; any N16R8 DevKitC-1 board matches it. |
| LoRa/GFSK radio | SX1262 module, SPI, 868 MHz TCXO, 2.54 mm header breakout - Waveshare Core1262-868M (Core1262-HF) | 1 | 3 | 10.00 | Waveshare / Sunsky-online / AliExpress | Do NOT buy Ebyte E22-900T22S - that is the UART variant and cannot do the SPI register-level control this firmware uses (`lib/sx1262/sx1262.h`). Bare Ebyte E22-900M22S is the same chip but needs a carrier board; the Core1262-868M is bench-ready out of the box. |
| Radio antenna | 868 MHz whip/dipole antenna, SMA, plus IPEX-to-SMA pigtail to match the module's connector | 1 | 3 | 6.00 | AliExpress / Amazon | Confirm connector sex before ordering (module is IPEX/u.FL, most whip antennas are SMA female - the pigtail bridges this). |
| Narrowband PLC modem | KQ-130F, 120-135 kHz carrier, 9600 baud UART, 5 V, 230 mA TX, 3000 V isolation, 9-pin single row | 1 | 3 | 14.00 (KES 1,800) | Pixel Electric, Nairobi (pixelelectric.com) | Local Nairobi stock at KES 1,800 sidesteps import duty, PVoC and shipping entirely for this part - order this one locally rather than from AliExpress/Amazon UK. Wires to ESP32 UART2 (GPIO17/18 per pinmap) on the isolated 5 V side only; see Bench and safety below before ever powering the mains side. |
| Ethernet-to-HomePlug bridge | W5500 SPI Ethernet module, any common breakout | 1 | 3 | 9.00 | Amazon / HAOYU (hotmcu.com) | `proposed` (not yet Martin-signed-off) pins per pinmap: SCK36/MISO37/MOSI35/CS38/INT39/RST40. |
| HomePlug AV2 adapter pair | TP-Link TL-PA4010 KIT, AV600, UK (type G) plug | 1 kit (2 adapters) | 3 kits | 38.00 | Amazon UK (cheaper than TP-Link's own UK store) | Order the UK-plug SKU specifically - do not order a US/EU-plug kit, Kenya sockets are type G. Confirm with Martin whether to buy this locally in Nairobi instead (see Ask before ordering). |
| LTE backhaul module | SIM7600E-H, LTE-FDD bands 1/3/5/7/8/20 - Waveshare SIM7600E-H 4G HAT | 1 | 3 | 95.00 | The Pi Hut / Waveshare | E-H covers Safaricom/Airtel/Equitel bands (3, 20); do not buy SIM7600A (Americas bands). Confirm E-H vs G-H with Martin - see Ask before ordering. Bare LCSC module (~USD 31.50, part C5338795) is cheaper but needs its own carrier/antenna board; not recommended for a non-engineer buyer on a tight timeline. |
| LTE antenna | 4G/LTE omnidirectional antenna, SMA, to match the HAT's SMA connector | 1 | 3 | 12.00 | Amazon | If the HAT ships with a stub antenna, this is still worth adding for real-world range. |
| 5 V power supply | AC-DC 230 V to 5 V, sized at 3 A / 15 W minimum (e.g. Mean Well IRM-20-5 or HLK-20M05) | 1 | 3 | 10.00 (unverified) | LCSC / Mean Well distributor | The commonly cited HLK-PM01 (3 W / 0.6 A) and Mean Well IRM-10-5 (10 W / 2 A) are undersized and must NOT be used - the KQ-130F TX burst (230 mA) plus SIM7600E peak (2 A) at 5 V needs headroom above 2.6 A. Confirm exact SKU before ordering; price is an estimate, not sourced. |
| 3V3 regulator | AMS1117-3.3 (or small buck) breakout for the SX1262/W5500 3.3 V rail | 1 | 3 | 1.00 | Amazon / AliExpress (bare IC from LCSC is USD 0.10, part C6186) | Linear AMS1117 wastes (5V-3.3V) x current as heat; fine at this light logic load, but do not feed it from anything above 5 V. |

## Satellite (3 units, 4 incl. spares per module)

| Part | Exact spec / part number | Qty per unit | Total qty incl. spares | Indicative unit price USD | Suggested source | Gotcha |
|---|---|---|---|---|---|---|
| MCU dev board | ESP32-S3-DevKitC-1, N16R8, ESP32-S3-WROOM-1 module (PCB antenna) | 1 | 4 | 12.00 | Amazon / DigiKey | Same board as the gateway - firmware shares the SX1262 driver by design (`firmware/xkoin-satellite/README.md`), so one part number covers both roles. |
| LoRa/GFSK radio | SX1262 module, SPI, 868 MHz TCXO, header breakout - Waveshare Core1262-868M | 1 | 4 | 10.00 | Waveshare / Sunsky-online | Same part and same UART-variant warning as the gateway row above. |
| Radio antenna | 868 MHz whip/dipole antenna, SMA, plus IPEX-to-SMA pigtail | 1 | 4 | 6.00 | AliExpress / Amazon | Satellites are field-deployed outdoors; consider a weatherproofed antenna mount, not costed here. |
| Battery charger | TP4056 with protection (overcharge/over-discharge/over-current), USB-C or micro-USB input | 1 | 4 | 1.50 | Amazon / AliExpress | Buy the "with protection" variant specifically - bare TP4056 boards without the protection IC will not disconnect on over-discharge. |
| Solar panel | 10 W monocrystalline panel, 5 V or 6 V nominal (NOT 12 V - wrong voltage for TP4056's charge input) | 1 | 4 | 17.50 | eBay / Amazon | Pinmap doc03 row "5V-IN" is explicit: a 12 V panel will overvoltage the TP4056 charge input without an extra buck stage. |
| 18650 cell | 3400 mAh, Panasonic NCR18650B or Samsung INR18650-35E (35E is 3500 mAh, also acceptable) | 1 | 4 | 7.00 | Buy in Nairobi, not shipped | Lithium 18650 cells ship under UN3480; most couriers refuse loose cells into Kenya. Buy locally or ship pre-installed inside the satellite enclosure. Do not order these online for import. |
| 3V3 regulator | Low-quiescent LDO (HT7333) or small buck, for the deep-sleep budget | 1 | 4 | 1.00 | Amazon / AliExpress | Pinmap doc03 targets under 40 mA average so a 10 W panel plus 3400 mAh cell rides through 2 overcast days; an AMS1117 here (quiescent current ~5 mA) would blow that budget on its own - use HT7333 (quiescent ~4 uA) or a low-Iq buck instead. |

## Client test node (2 units, 3 incl. spares per module)

Bench-only radio testers: ESP32-S3 dev kit plus SX1262, nothing else.

| Part | Exact spec / part number | Qty per unit | Total qty incl. spares | Indicative unit price USD | Suggested source | Gotcha |
|---|---|---|---|---|---|---|
| MCU dev board | ESP32-S3-DevKitC-1, N16R8, ESP32-S3-WROOM-1 module (PCB antenna) | 1 | 3 | 12.00 | Amazon / DigiKey | Same part as gateway/satellite rows; buying one SKU for all three roles simplifies the order. |
| LoRa/GFSK radio | SX1262 module, SPI, 868 MHz TCXO, header breakout - Waveshare Core1262-868M | 1 | 3 | 10.00 | Waveshare / Sunsky-online | Same UART-variant warning as above. |
| Radio antenna | 868 MHz whip/dipole antenna, SMA, plus IPEX-to-SMA pigtail | 1 | 3 | 6.00 | AliExpress / Amazon | Bench use only; no weatherproofing needed. |

## Bench and safety

Mains-coupling safety kit for the KQ-130F. The KQ-130F couples directly onto 230 V
mains (pinmap SAFETY note); it is never bench-tested without every item in this
section in the power path.

| Part | Exact spec / part number | Qty | Indicative unit price USD | Suggested source | Gotcha |
|---|---|---|---|---|---|
| Isolation transformer | Mains isolation transformer, minimum 300 VA | 1 | 40.00 (unverified) | Anatek Instruments / eBay (PHC ISO-300 or equivalent) | Non-negotiable per pinmap SAFETY note. Never connect the KQ-130F mains side to a bench supply without this in line first. |
| Plug-in RCD adapter | 30 mA trip, plug-in inline type | 2 | 30.00 | eBay (Masterplug Inline RCD or equivalent) | Two units so both gateways can be bench-tested on the mains side at the same time without sharing one safety device. |
| Type G to IEC lead | UK 13 A plug to IEC C13/C14 as needed for the transformer and test gear | 2 | 6.00 | Local electrical supplier, Nairobi | Cheap and heavy - buy locally rather than importing. |
| Plug-in energy meter | Basic watt/kWh plug-in meter, type G | 1 | 14.00 | Amazon UK / local | Confirms actual draw against the 230 mA TX-burst spec before trusting any measurement off the KQ-130F itself. |
| SX1262 bench spare | Same part as the field-kit radio (Waveshare Core1262-868M) | 1 | 10.00 | Waveshare / Sunsky-online | The one extra radio requested beyond per-role spares - a known-good reference unit for isolating "is it the radio or the firmware" during bring-up. |

## Programming and misc

| Part | Exact spec / part number | Qty | Indicative unit price USD | Suggested source | Gotcha |
|---|---|---|---|---|---|
| USB-C data cable | USB-C to USB-A or USB-C to USB-C, data-capable (not charge-only) | 10 | 5.00 (unverified) | Amazon | One per ESP32-S3 board (10 boards across all roles, see consolidated table below) - many dev kits ship with no cable at all, and a charge-only cable will not flash firmware. |
| USB-to-serial adapter | CP2102 USB-TTL module, for the KQ-130F bench loopback | 3 | 3.00 | Amazon (HiLetgo or equivalent) | One per bench station plus a spare. |
| Breadboards | Standard full-size solderless breadboard | 4 | 3.00 | Amazon | |
| Jumper wire kit | Assorted M-M / M-F / F-F Dupont jumpers | 2 | 6.00 | Amazon | |
| 2.54 mm header strips | Breakaway male and female header strips, assorted | 1 pack | 8.00 | Amazon | Covers carrier-board work if the team ever moves off the Waveshare breakouts to bare Ebyte SMD modules. |
| Resistor assortment kit | 1/4 W through-hole, common E12 values | 1 | 8.00 | Amazon | Covers the satellite VBAT-sense divider (pinmap doc03, GPIO1/ADC1_CH0) and general bring-up; not worth a dedicated line per satellite. |
| Logic analyzer | 8-channel USB logic analyzer, Saleae-clone (FX2-based, sigrok/DSView compatible) | 1 | 10.00 | AliExpress / eBay | For SPI bring-up against the VERIFY-tagged SX1262 register values (`sx1262.h` GFSK RX_BW code, packet params) - HANDOVER.md section 4 item 4. Not a real Saleae; do not expect protocol-analyzer-grade sample integrity above a few MHz. |

## Consolidated cross-role ordering summary

The MCU board, radio and antenna are the same part across all three roles. Order
these totals rather than re-deriving them from the tables above:

| Part | Gateway | Satellite | Client | Bench spare | Total to order |
|---|---|---|---|---|---|
| ESP32-S3-DevKitC-1 N16R8 | 3 | 4 | 3 | - | 10 |
| SX1262 breakout (Waveshare Core1262-868M) | 3 | 4 | 3 | 1 | 11 |
| 868 MHz antenna + pigtail | 3 | 4 | 3 | - | 10 |
| USB-C data cable | - | - | - | - | 10 (one per board above) |

## Totals (indicative only)

Gateway subtotal (3 units' worth of every module): USD 621.00
Satellite subtotal: USD 220.00
Client test node subtotal: USD 84.00
Bench and safety subtotal: USD 136.00
Programming and misc subtotal: USD 109.00

**Grand total, indicative, parts only, before freight, Kenya duty, VAT, IDF, RDL or
PVoC inspection fees: approximately USD 1,170.00.**

Several line items are marked "unverified" above where no current sourced price was
found this session (the 5 V/3 A supply, the isolation transformer, the USB-C cable).
Confirm those before committing to the total.

## Kenya import notes

- Kenya has no de minimis: duty applies at any declared value. Electronics (HS
  chapter 85) attract roughly 25 percent import duty under the EAC common external
  tariff, though many bare modules and dev boards fall under HS lines 8542 / 8471 /
  8517 that can be 0 to 10 percent - ask the freight forwarder to classify per line
  rather than lump the whole shipment at 25 percent. VAT is 16 percent on CIF plus
  duty, plus a 2.25 percent Import Declaration Fee and a 1.5 percent Railway
  Development Levy. (Kenya Tradex, "Kenya Import Duty Rates 2026"; Stackry, "Duties
  and Taxes: Kenya".)
- KEBS PVoC: China-origin shipments from 1 March 2026 onward need a Certificate of
  Conformity from Cotecna or Intertek, or the consignment faces destination
  inspection at 5 percent of customs value. Goods under USD 100 for personal use are
  exempt - most individual line items in this BOM qualify, but a consolidated
  shipment likely exceeds that threshold in aggregate. Confirm with the forwarder
  whether PVoC is assessed per line or per shipment. (KEBS PVoC Manual v15; Pamoja
  Imports, "Import Electronics from China to Kenya".)
- CA type approval: devices operating inside the CA 2022 SRD guideline table (868.0
  to 868.6 MHz at 25 mW ERP, or 869.4 to 869.65 MHz at 500 mW ERP) are exempt from
  type approval, but the importer must be able to produce an accredited-lab test
  report on request. **Flag:** `firmware/xkoin-gateway/lib/sx1262/sx1262.h` sets the
  SX1262 PA config to +22 dBm (about 158 mW) at 868.1 MHz for both LoRa and GFSK -
  that is inside the 868.0-868.6 MHz sub-band but roughly 6x over its 25 mW ERP SRD
  exemption ceiling. As shipped, this firmware configuration does not obviously
  qualify for the SRD exemption; either the field TX power needs to be reduced in
  firmware before deployment, or the module needs to go through CA type approval.
  This needs a decision from Martin (or Kenyan counsel) before field trial, not an
  assumption either way. The SIM7600E-H LTE module is separately NOT an SRD and is
  on the modem type-approval list regardless - check the CA type-approved equipment
  register for SIM7600 before ordering. The new Communications Equipment Distributor
  licence (July 2026) targets commercial importers and wholesalers; a handful of
  development units for own use is probably not "distribution," but this should go
  to counsel rather than being asserted here. (CA "Guidelines on the Use of
  Radiofrequency Spectrum by Short Range Devices," 2022; Techweez, "Communications
  Equipment Distributor License Kenya," July 2026.)
- Practical: ship as one consolidated parcel with a per-line packing list and HS
  codes, declare "development boards and radio modules for prototyping, not for
  resale," keep every invoice, and do not ship loose 18650 cells (UN3480) - buy
  those in Nairobi instead, per the Satellite table above.

## Ask before ordering

Decisions only Martin can make, ranked by how much they block the rest of the order:

1. **SIM7600E-H vs SIM7600G-H.** E-H is the Africa/EU band-matched variant (bands
   1/3/5/7/8/20, covering Safaricom/Airtel/Equitel on bands 3 and 20); G-H is the
   global variant, easier to find in stock, also covers those bands but carries more
   inventory risk on availability. Pros of E-H: purpose-matched, no band ambiguity.
   Cons: pricier HAT form factor found this session (~USD 95), narrower supplier
   pool. Pros of G-H: wider stock, same band coverage in practice. Cons: broader
   part number invites a wrong-variant order (SIM7600A, Americas-only, must never be
   ordered). This blocks the single most expensive line item in the kit (USD 285
   across 3 gateway units) - confirm first.
2. **Which SX1262 breakout.** Waveshare Core1262-868M (recommended above, in stock,
   header breakout, ~USD 8-13 depending on supplier) versus the bare Ebyte
   E22-900M22S SMD module (cheaper chip, ~USD 6, but needs a carrier board designed
   and fabricated before it is bench-usable - not realistic on an expedited
   timeline). Recommendation is Core1262-868M; confirm before the order for 11 units
   goes out.
3. **Buy HomePlug AV2 adapters locally in Nairobi, or import.** Importing (Amazon UK,
   TL-PA4010 KIT, verified ~USD 38/kit) has confirmed pricing and stock but adds
   freight time plus Kenya duty/VAT/PVoC exposure. Buying locally in Nairobi may be
   faster and duty-free but no current Nairobi retail price was verified this
   session for this exact model. Pros of local: consistent with the KQ-130F
   local-purchase pattern already found (Pixel Electric), likely faster. Cons: price
   and stock unverified, may need a trip or a local contact. This affects 3 kits
   (6 adapters) at stake.
4. **Firmware TX power vs SRD exemption.** See the flagged +22 dBm PA config above
   the CA SRD 25 mW ERP threshold. This does not block procurement (the same
   Core1262-868M module supports both power levels in firmware) but it does need a
   decision before any field trial or import declaration that relies on the SRD
   exemption.
5. **One bench-safety station or two.** This BOM priced one isolation transformer
   and one energy meter but two RCD adapters and two IEC leads, on the assumption
   that only one mains-side test happens at a time even with two people working.
   Confirm if Martin wants a fully duplicated second bench safety station (adds
   roughly USD 54 for a second transformer and meter).

## Sources

Session-verified facts (provided) and their citations:
- [Ebyte E22-900M22S, Ebyte official store](https://ebyteiot.com/products/sx1262-868mhz-module-electronic-components-22dbm-wireless-transceiver-lora-gfsk-iot-long-range-7km-ebyte-e22-900m22s-spi)
- [Waveshare Core1262-868M wiki](https://www.waveshare.com/wiki/Core1262-868M)
- [KQ-130F, Electroslab](https://electroslab.com/products/kq-130f-power-line-carrier-module)
- [KQ-130F, Amazon UK](https://www.amazon.co.uk/KQ-130F-Power-line-Carrier-Distance-Communication/dp/B0947SCRPB)
- [Prepaid Data SIM Card wiki, Kenya](https://prepaid-data-sim-card.fandom.com/wiki/Kenya)
- [Kenya Import Duty Rates 2026, Kenya Tradex](https://kenyatradex.africa/blog/kenya-import-duty-rates-2026.html)
- [Duties and Taxes: Kenya, Stackry](https://www.stackry.com/duties-and-taxes/kenya)
- [KEBS PVoC Manual, version 15](https://kebs.org/wp-content/uploads/2026/03/PVoC-Manual-Version-15.pdf)
- [Import Electronics from China to Kenya, Pamoja Imports](https://pamojaimports.com/import-electronics-from-china-to-kenya/)
- [CA Guidelines on the Use of Radiofrequency Spectrum by Short Range Devices, 2022](https://www.ca.go.ke/sites/default/files/2023-06/Guidelines-on-the-Use-of-Radiofrequency-Spectrum-by-Short-Range-Devices-2022.pdf)
- [Communications Equipment Distributor License Kenya, Techweez, July 2026](https://techweez.com/2026/07/21/communications-equipment-distributor-license-kenya/)

New pricing and sourcing found this session:
- [Waveshare Core1262-868M, Sunsky-online, USD 7.88](https://www.sunsky-online.com/p/DIY0235/Waveshare-Core1262-868M-Anti-Interference-SX1262-LoRa-Module-EU868-Band.htm)
- [Waveshare Core1262-868M, AliExpress, USD 13.49](https://www.aliexpress.com/item/1005003564025296.html)
- [KQ-130F, AliExpress, USD 15.77](https://www.aliexpress.com/item/32732013293.html)
- [KQ-130F, Pixel Electric, Nairobi, KES 1,800](https://www.pixelelectric.com/sensors/biometric-rotation-current/current-voltage/kq-130f-power-cable-carrier-module/)
- [ESP32-S3-DevKitC-1 N16R8, Amazon](https://www.amazon.com/ESP32-S3-DevKitC-1-Development-Dual-Core-Bluetooth/dp/B0GVSHT2Q2)
- [ESP32-S3-WROOM-1-N16R8, DigiKey](https://www.digikey.com/en/products/detail/espressif-systems/ESP32-S3-WROOM-1-N16R8/16162642)
- [W5500 Ethernet module, HAOYU/hotmcu, USD 8.00](https://www.hotmcu.com/w5500-ethernet-module-p-256.html?cPath=7_18)
- [TP-Link TL-PA4010 KIT, Amazon UK](https://www.amazon.co.uk/TL-PA4010KIT-Powerline-Configuration-Required-UK/dp/B01BECPIMC)
- [TP-Link TL-PA4010 KIT, TP-Link UK official](https://www.tp-link.com/uk/home-networking/powerline/tl-pa4010-kit/)
- [Waveshare SIM7600E-H 4G HAT, The Pi Hut, GBP 74.90](https://thepihut.com/products/sim7600e-h-4g-hat-for-raspberry-pi-lte-cat-4)
- [SIM7600E-H bare module, LCSC, from USD 31.50](https://www.lcsc.com/product-detail/C5338795.html)
- [TP4056 charging module with protection, Amazon](https://www.amazon.com/HiLetgo-Lithium-Charging-Protection-Functions/dp/B07PKND8KG)
- [10W 6V monocrystalline solar panel, eBay, from USD 17.54](https://www.ebay.com/itm/206258771159)
- [Panasonic NCR18650B, 18650 Battery Store](https://www.18650batterystore.com/products/panasonic-ncr18650b)
- [Samsung INR18650-35E, IMR Batteries, USD 7.99](https://imrbatteries.com/products/samsung-35e-18650-3500mah-8a-battery)
- [HLK-PM01, LCSC, from USD 1.61](https://www.lcsc.com/product-detail/C209903.html)
- [Mean Well IRM-10-5, LCSC, from USD 4.51](https://www.lcsc.com/product-detail/C2857903.html)
- [AMS1117-3.3, LCSC, from USD 0.10](https://www.lcsc.com/product-detail/C6186.html)
- [4G/LTE omnidirectional antenna, SMA, Amazon](https://www.amazon.com/Antenna-Connector-Omnidirectional-Verizon-Wireless/dp/B07YWHFQ6L)
- [IPEX to SMA 868-915MHz pigtail, Amazon](https://www.amazon.com/JIANGXIAO-Xiaojiang-Antenna-868-915MHz-Connector/dp/B09JKXZCZS)
- [300VA isolation transformer, Anatek Instruments](https://anatekinstruments.com/products/isolation-transformer-unit-300va)
- [Masterplug Inline RCD 30mA adapter, eBay, GBP 24.00](https://www.ebay.de/itm/204023944838)
- [Plug-in energy meters, Amazon UK, GBP 9.52-15.00 range](https://www.amazon.co.uk/plug-energy-meter/s?k=plug+in+energy+meter)
- [CP2102 USB-TTL module, HiLetgo, Amazon](https://www.amazon.com/HiLetgo-CP2102-Converter-Adapter-Downloader/dp/B00LODGRV8)
- [8-channel Saleae-clone logic analyzer, hands-on test, Atadiat](https://atadiat.com/en/e-hands-on-test-saleae-usb-logic-analyzer-24mhz-8ch-clone/)
