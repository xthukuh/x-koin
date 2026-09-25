# 14. References

Abstract: This paper consolidates every source cited across papers 00 to 13 into one deduplicated list, grouped by what kind of thing the source is: standards and regulation, datasheets and supplier listings, chain and contract sources, prior art and comparable projects, market and press, and this repository's own proof artifacts with their file paths. Two things are recorded here that a plain bibliography would hide. The first is retrieval status: several sources are named in the papers and have not been retrieved as primary documents, and each one says so rather than appearing as though it had been read. The second is the list of citations the set still owes, in section 7, which is the shortest honest summary of where the set is thinner than it looks.

Keywords: references, bibliography, sources, retrieval status, citations owed

## 1. How to read this list

Access date is 2026-09-13 for every source retrieved while this set was written. Where a source was retrieved earlier by a sourcing scout or a research pass, the earlier date is given instead and labelled, because that is when the content being relied on was actually seen.

Each entry carries a retrieval status.

| Status | Meaning |
|---|---|
| retrieved | The document was fetched and read during this work, and the papers quote it |
| retrieved, not extractable | The document was fetched and its content could not be read in the form it arrived |
| named, not retrieved | The papers cite the document by name and no copy was fetched. Figures drawn from it are marked as assumptions |
| repository artifact | A file in this repository, readable at the path given |

Citation format is issuing body, title, the part relied on, the locator, then the retrieval status and date.

## 2. Standards and regulation

1. Communications Authority of Kenya. *Guidelines on the Use of Radiofrequency Spectrum by Short Range Devices, 2022* (Version B Rev 0). Annex I non-specific short-range-device table; section 4 on the type-approval exemption; section 4.1 on ILAC-accredited test reports. https://www.ca.go.ke/sites/default/files/2023-06/Guidelines-on-the-Use-of-Radiofrequency-Spectrum-by-Short-Range-Devices-2022.pdf Retrieved 2026-09-09 into `docs/ops/regulatory-brief.md` section 2, from which papers 02, 03, 07, 08, 11 and 13 quote the sub-band table.

2. ETSI. *EN 300 220*, short-range devices in the 25 MHz to 1000 MHz frequency range. Named in the Communications Authority table above as the applicable standard for the 868 MHz sub-bands, and relied on for the meaning of listen-before-talk with adaptive frequency agility. Named, not retrieved. Counsel question 2 in `docs/ops/regulatory-brief.md` asks whether the Authority's table carries this standard's definition.

3. ETSI. *EN 301 489*, electromagnetic compatibility for radio equipment. Named in the same Authority table. Named, not retrieved.

4. *EN 60950*, safety of information technology equipment. Named in the same Authority table. Named, not retrieved. Note for counsel: this standard has been superseded in most jurisdictions by EN 62368-1, and the Authority's 2022 table names the older one, which is part of counsel question 1 on whether the 2022 guidelines are still the operative instrument.

5. *EN 50065-1*, signalling on low-voltage electrical installations in the frequency range 3 kHz to 148.5 kHz, part 1: general requirements, frequency bands and electromagnetic disturbances. The band the KQ-130F occupies at 120 to 135 kHz sits inside this standard's scope. Named, not retrieved. Cited by paper 11.

6. Republic of Kenya. *National Payment System Act* and the *National Payment System Regulations 2014*, on e-money issuer authorisation. Named, not retrieved. Counsel question 10 in `docs/ops/regulatory-brief.md`. Cited by papers 11 and 13.

7. Republic of Kenya. *Virtual Asset Service Providers Act 2025*. Named, not retrieved. Counsel question 11 asks whether a service that buys and sells a token on a public chain for Kenyan shillings falls inside it and which regulator supervises. Cited by papers 11 and 13.

8. Republic of Kenya. *KICA Radio Communication and Frequency Spectrum Regulations 2025* and *General Licensing Regulations 2026*, published on ict.go.ke. Named, not retrieved. Counsel question 1 asks whether either changed the short-range-device annex or the exemption. Cited by papers 11 and 13.

9. USB Implementers Forum. *Universal Serial Bus Specification*, revision 2.0. The 500 mA default host current allocation used as the dongle's power budget ceiling. Named, not retrieved. Cited by paper 08 section 8.

10. United Nations. *Recommendations on the Transport of Dangerous Goods, Model Regulations*, UN 3480, lithium-ion batteries shipped alone. The reason cells are bought in Nairobi rather than imported. Named, not retrieved. Recorded in `hardware/bom.md`. Cited by papers 07, 09 and 13.

11. East African Community. *Common External Tariff*, HS chapter 85 electronics and the lines under 8471, 8517 and 8542. Named, not retrieved. Recorded in `hardware/bom.md` Kenya import notes and relied on by papers 01 and 13 for the statement that classification moves the landed Node cost by about USD 15.

12. Kenya Bureau of Standards. Certification requirements for a device coupling to 230 V mains in customer premises. No instrument identified yet; this is an open question rather than a citation, and it is precondition 4 in `docs/potential/02-apartment-estates.md`. Named, not retrieved.

## 3. Datasheets, hardware documentation and supplier listings

### 3.1 Silicon and module documentation

13. Semtech. *SX1261/2 datasheet*, DS.SX1261-2. Transmit and receive current tables, the register map, and the GFSK receive-bandwidth and packet parameters. Named, not retrieved. Every SX1262 current figure in papers 07, 08 and 09 is drawn from this document's class values and is marked TODO: verify; the register values carrying VERIFY tags in `firmware/xkoin-gateway/lib/sx1262/sx1262.h` are checked against it at bring-up, which is `HANDOVER.md` backlog item 4.

14. Meshtastic project. Firmware board variant header for the Heltec V3, `variants/esp32s3/heltec_v3/variant.h`, repository `meshtastic/firmware`, default branch. https://raw.githubusercontent.com/meshtastic/firmware/master/variants/esp32s3/heltec_v3/variant.h Retrieved 2026-09-13 through the GitHub contents API after the raw host returned HTTP 503. Source of the SX1262 pin assignments (`LORA_SCK 9`, `LORA_MISO 11`, `LORA_MOSI 10`, `LORA_CS 8`, `LORA_RESET 12`, `SX126X_BUSY` at 13, `SX126X_DIO1` at 14), the DIO2 radio-frequency switch and 1.8 V DIO3 TCXO settings, the battery pin at GPIO1 on ADC channel 0, the ADC control pin at GPIO37 active low, the 2.5 dB attenuation and the 4.9 by 1.045 multiplier. Cited by papers 07, 08 and 09.

15. Espressif Systems. Arduino core board variant header, `variants/heltec_wifi_lora_32_V3/pins_arduino.h`, repository `espressif/arduino-esp32`, default branch. Retrieved 2026-09-13 through the GitHub contents API. Source of the named board pins: `Vext = 36`, `LED = 35`, `RST_OLED = 21`, `SCL_OLED = 18`, `SDA_OLED = 17`, `RST_LoRa = 12`, `BUSY_LoRa = 13`, `SS = 8`, `MOSI = 10`, `MISO = 11`, `SCK = 9`, `SDA = 41`, `SCL = 42`. Cited by papers 07 and 08.

16. Heltec Automation. *WiFi LoRa 32 V3 schematic*, HTIT-WB32LA_V3.2. https://resource.heltec.cn/download/WiFi_LoRa_32_V3/HTIT-WB32LA_V3.2.pdf Retrieved 2026-09-13, not extractable: the file is 1.2 MB over 16 pages with embedded CID-encoded fonts, and the net names could not be read as text in this session. The pin assignments in papers 07 and 08 therefore rest on entries 14 and 15 instead, which agree with each other. The open question this document would have settled is whether the board's USB-C connector reaches the ESP32-S3 native USB peripheral or a USB-to-UART bridge, recorded as an open item in paper 08 section 4.

17. Espressif Systems. *ESP32-S3 GPIO and RTC GPIO*, ESP-IDF Programming Guide. https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/peripherals/gpio.html Retrieved 2026-09-12 for `docs/x-koin-beta/00-compact-board-concept.md`. Relied on for deep-sleep wake constraints and pin capability.

18. LCSC Electronics. ST7540 (STMicroelectronics, TSSOP-28), price breaks and stock. https://www.lcsc.com/product-detail/C472599.html Retrieved 2026-09-12. The USD 15.19 at quantity one figure that paper 13 quotes reaches it through `docs/x-koin-beta/00-compact-board-concept.md`.

19. Arrow Electronics. QCA7005-AL33-R, Qualcomm product listing. https://www.arrow.com/en/products/qca7005-al33-r/qualcomm.html Retrieved 2026-09-12; the price and stock fields did not return within the fetch timeout, which is why paper 13 records the part as unpriced.

20. Qualcomm. QCA7005 power-line and HomePlug chipset product page. https://www.qualcomm.com/products/networking/qca7005 Retrieved 2026-09-12.

21. RAK Wireless. WisLink PLC LX200V30 evaluation board, Qualcomm QCA7420, 500 Mbps PHY rate. https://store.rakwireless.com/products/wisplc-pro-development-board-plc-module-power-line-twisted-pair-ethernet-interface-500mbps-support-network-adapter Retrieved 2026-09-12. The comparison point for HomePlug Green PHY against AV2 PHY rates.

### 3.2 Supplier listings for scouted parts

Every listing below was recorded on 2026-09-12 by a sourcing scout, with the store, its sold count and rating, the price in Kenyan shillings and the gallery image URLs captured in the matching JSON file under `hardware/shopping/parts/`. The photo strips in papers 05 to 09 reference the first gallery image of the chosen candidate; no product image is downloaded or committed.

| Part | Chosen listing | Record |
|---|---|---|
| Heltec WiFi LoRa 32 V3, 868 MHz | https://www.aliexpress.com/item/1005008177147021.html | `hardware/shopping/parts/heltec-lora32-v3-868.json` |
| ESP32-S3-DevKitC-1 N16R8 | https://www.aliexpress.com/item/1005008957932920.html | `hardware/shopping/parts/esp32-s3-devkitc-n16r8.json` |
| ESP32-C3 SuperMini | https://www.aliexpress.com/item/1005006406538478.html | `hardware/shopping/parts/esp32-c3-supermini.json` |
| SX1262 SPI module 868 MHz (E22-900M22S) | https://www.aliexpress.com/item/1005007265763652.html | `hardware/shopping/parts/sx1262-module-868.json` |
| Ai-Thinker Ra-01SH (SX1262) | https://www.aliexpress.com/item/1005003087292795.html | `hardware/shopping/parts/ra-01sh-sx1262.json` |
| 868 MHz antenna, SMA male | https://www.aliexpress.com/item/1005002900905329.html | `hardware/shopping/parts/antenna-868-sma.json` |
| IPEX to SMA bulkhead pigtail | https://www.aliexpress.com/item/1005009812335103.html | `hardware/shopping/parts/ipex-sma-pigtail.json` |
| SMA fixed attenuator 30 dB | https://www.aliexpress.com/item/1005008423745338.html | `hardware/shopping/parts/sma-attenuator-30db.json` |
| KQ-130F narrowband PLC module | https://www.aliexpress.com/item/1005007367356882.html | `hardware/shopping/parts/kq-130f-plc-module.json` |
| HLK-PM01 5 V mains module | https://www.aliexpress.com/item/1005007958278787.html | `hardware/shopping/parts/hlk-pm01-5v-psu.json` |
| USB-C male to USB-A female OTG adapter | https://www.aliexpress.com/item/1005007791455111.html | `hardware/shopping/parts/usb-c-otg-adapter.json` |
| USB to TTL serial adapter, CH340 | https://www.aliexpress.com/item/1005004824108230.html | `hardware/shopping/parts/usb-ttl-ch340.json` |

Named parts with no scouted listing, which appear in the hardware papers as `<!-- photo: ... -->` markers and as "price pending scout": the TP4056 solar charge board, the 18650 cell and holder, the 6 V 2 W and 10 W solar panels, the capacitive soil moisture sensor v2.0, the DHT22 or AHT20, the HC-SR04 ultrasonic sensor, the HomePlug AV kit with a Wi-Fi extender, the plain HomePlug pair, the mains blocking filter, the HT7333 low-quiescent regulator, USB-C data leads and the breadboard consumables.

Suggested suppliers recorded in `hardware/bom.md` that are not scouted listings: Pixel Electric, Nairobi (pixelelectric.com) for the KQ-130F at KES 1,800 in local stock; Waveshare for the Core1262-868M; The Pi Hut for the SIM7600E-H HAT; TP-Link for the TL-PA4010 AV600 kit in a type G plug variant.

## 4. Chain and contracts

22. Ethereum Improvement Proposals. *EIP-712*, typed structured data hashing and signing. The form every on-chain ticket takes, with the domain `xKoinEscrow` version 1. Named, not retrieved; canonical text at eips.ethereum.org. Cited by papers 03, 04, 08 and 12.

23. Ethereum Improvement Proposals. *EIP-2612*, permit extension for ERC-20 signed approvals. What makes the deposit step gasless for the user. Named, not retrieved. Cited by papers 02 and 04.

24. Ethereum Improvement Proposals. *EIP-20*, the ERC-20 token standard. XKN is an ERC-20 with 6 decimals, where one base unit is a micro-KES. Named, not retrieved. Cited by papers 00, 02 and 04.

25. Base. Layer 2 public RPC endpoint, `https://mainnet.base.org`. Used with `cast gas-price` on 2026-09-09 to measure the 0.006 gwei layer 2 gas price and the 0.062 gwei layer 1 price that sets the data fee. Retrieved 2026-09-09; recorded in `docs/ops/critical-accounts/03-budget-and-sustainability.md`. Cited by papers 01, 02, 04 and 13.

26. Binance. ETHUSDT ticker, read 2026-09-09 at 2,468.58 USDT, and the implied shilling rate of 123.29 from Martin's own peer-to-peer trade of 900 KES for 7.30001286 USDT. Retrieved 2026-09-09; recorded in the same budget document. The basis of every shilling figure derived from gas.

27. Foundry. The `forge` test runner and `cast` command-line tool, as used by the 28-test contract suite, the 256-run solvency fuzz and the end-to-end chain proof. Named, not retrieved as documentation; the runs themselves are repository artifacts in section 6.

28. Safe (formerly Gnosis Safe). Multisignature wallet, the 2-of-3 configuration required as contract owner before any mainnet deployment. Named, not retrieved. `HANDOVER.md` backlog item 10. Cited by papers 10 and 13.

29. Safaricom. Daraja API, the M-Pesa STK push and business-to-customer payout interfaces. Named, not retrieved as documentation; the integration and its nine mocked tests are repository artifacts. Cited by papers 04, 11 and 13.

30. Equity Group, Finserve. Jenga API, merchant payment and send-to-mobile payout, and the onboarding requirements of a certificate of incorporation, a current CR12 and director identity documents. Retrieved during onboarding and recorded in `docs/ops/jenga-onboarding.md`. Cited by papers 04, 11 and 13.

## 5. Prior art and comparable projects

31. Meshtastic. Project site and documentation. https://meshtastic.org , https://meshtastic.org/docs/introduction/ , https://meshtastic.org/docs/overview/mesh-algo/ and https://meshtastic.org/docs/hardware/devices/ . Retrieved 2026-09-12 into `docs/_plan/research/02-landing-page-design-study.md` sections 3 and 4. Source of the managed-flooding description, the vocabulary the set borrows (node, hop, hop limit, rebroadcast, signal-to-noise ratio, contention window, airtime, channel utilisation, duty cycle), the device catalogue with the Heltec LoRa32 V3 at under USD 30, and the rule that a gateway and a mesh messenger are compared on cost per megabyte delivered rather than on unit price. Cited by papers 00, 02, 07, 09 and 13.

32. Helium. Incentivised wireless coverage network. Named in paper 00 section 3 as the closest economic prior art, on the point that rewarding presence invites fabricated coverage. Named, not retrieved. Citation owed: see section 7.

33. Althea. Pay-per-forward routing with per-hop price discovery. Named in paper 00 section 3 on the point that per-hop pricing requires an internet-protocol path at every hop. Named, not retrieved. Citation owed.

34. Kenya Power (KPLC) automated meter reading over the distribution network. Named in paper 00 section 3 as the incumbent use of Kenyan mains wiring for data. Named, not retrieved. Citation owed.

35. Kickstarter and Crowd Supply campaign pages for NodeIT and five comparable hardware campaigns. Retrieved 2026-09-12 into `docs/_plan/research/02-landing-page-design-study.md` sections 1 and 2. Relied on for page structure and presentation discipline rather than for any technical or economic claim in papers 00 to 13.

## 6. Market and press

36. Safaricom. Tunukiwa daily bundle, 24-hour pass at KES 20.00 for 250 MB, and Safaricom Home Fiber standard at KES 2,999.00 a month for 10 Mbps. Reached paper 01 through `docs/_drive/04-tokenomics-and-fiat-roi-financial-model.md` as a retail pricing benchmark. The operator's own tariff page is named, not retrieved. Citation owed.

37. Airtel Kenya. Daily pack, 24-hour pass at KES 20.00 for 500 MB. Same route and same status. Citation owed.

38. Kenya Power. Planned-interruption notices, and Kenya Power and EPRA annual reports, as the sources paper 01 names for outage frequency and duration and for connection counts. Named, not retrieved. Paper 01 carries this as an explicit instruction to obtain them before publication. Citation owed.

39. `docs/_drive/04-tokenomics-and-fiat-roi-financial-model.md`. The design suite's operator models: an urban landlord at KES 29,050 of capital expenditure and KES 3,850 a month of operating cost with a 5.1 month payback, and a rural trading post at KES 23,300 with a 3.1 month payback. Repository artifact, exported 2026-09-12. Every figure from it is conditional on the per-unit price clearing measured backhaul cost, on the stated tenant count and on its capital expenditure lines, and no paper in this set quotes one without all three conditions.

## 7. This repository's proof artifacts

These are the sources the set relies on most heavily, because they are the ones anyone can re-run or re-read.

### 7.1 Specification and design

| Path | What it carries |
|---|---|
| `protocol/spec.md` | XKP v1 draft: the medium table (section 1), the frame format and type list (section 2), the phases (section 3), the proof layer and canonical receipt (section 4), the reward layer (section 5), the service classes (section 6), the eight Laws (section 7), trusted parties and the price floor formula (section 8), and founder control without founder risk (section 8.1) |
| `HANDOVER.md` | Section 0 the mission, section 1 the proof matrix and headline numbers, section 2 the nine locked decisions, section 3 the invariants that must not drift, section 4 the open backlog with acceptance criteria, section 5 the sharp edges, section 6 the working agreements |
| `docs/how-it-works.md` | Primitives (section 2), decisions and reasoning (section 4), the transfer options and the companion app (section 5), journeys J1 to J12 (section 6), first MVP scope (section 7). Dated 2026-09-11 |
| `docs/_plan/revamp-plan.md` | Device lineup, the Heltec V3 decision, the demo matrix D1 to D6, the parts list and the bench safety rule. Dated 2026-09-12 |
| `docs/_plan/papers-brief.md` | The brief this set is written to: voice, skeleton, figure styles, the hardware paper checklist, banned words and the ASCII punctuation rule |
| `docs/_plan/research/02-landing-page-design-study.md` | Meshtastic facts, campaign page patterns and the recommended landing page outline. Dated 2026-09-12 |
| `docs/x-koin-beta/00-compact-board-concept.md` | The four board populations, the seven proof points a breadboard must settle, the USD 52 and USD 25 unit cost targets and the two unpriced silicon lines |
| `docs/potential/*.md` | Nine use cases; papers 09 and 13 cite `01-large-scale-farm-iot.md` and `02-apartment-estates.md` |

### 7.2 Hardware

| Path | What it carries |
|---|---|
| `hardware/pinmap.md` | The xKoin-Gateway doc 02 pin table, the xKoin-Satellite table with its doc 03 power rows and the proposed GPIO1 battery sense, and the mains coupling safety note |
| `hardware/bom.md` | Field kit sizing, per-role module lists with indicative prices and gotchas, the bench and safety kit, the consolidated ordering summary, the approximate USD 1,170 total before duty, and the Kenya import notes |
| `hardware/shopping/parts/*.json` | Twelve scouted part records with chosen and alternate listings, prices in shillings, store, sold count, rating and gallery image URLs. Recorded 2026-09-12 |
| `hardware/shopping/README.md` | The scout schema behind those records |
| `hardware/xkoin-gateway.svg`, `hardware/xkoin-satellite.svg` | Signal-name schematics generated from the pin map, which the blueprint drawings in papers 05 and 07 agree with |

### 7.3 Code and the proofs it passes

| Path | Proof | Command | Result |
|---|---|---|---|
| `contracts/src/xKoinToken.sol`, `xKoinEscrow.sol`, `xKoinTreasury.sol` and `contracts/test/` | 35 Foundry tests including a 256-run solvency fuzz and a stolen-owner-key drill | `cd contracts && forge test` | 35 passed |
| `gateway-api/` including `app/payout` | 9 pytest with HTTP fully mocked | `cd gateway-api && pytest` | 9 passed |
| `protocol/xkp/frames.py`, `proofs.py`, `settle.py` | 11 pytest protocol unit tests | `cd protocol && pytest` | 11 passed |
| `protocol/xkp/sim.py`, `protocol/run_sim.py` | Discrete-event simulation, scenarios S1 to S6, deterministic seeds | `cd protocol && python3 run_sim.py` | all scenarios passed |
| `firmware/xkoin-gateway/test/host/` | 75 host checks: a Python-signed Ed25519 receipt verified in C, byte-exact codec both directions, a full one-byte corruption sweep | `cd firmware/xkoin-gateway/test/host && make run` | 75 checks |
| `protocol/e2e_chain_proof.sh` | anvil, forge deploy, simulation-derived EIP-712 tickets settled on a real escrow, stranger-triggered founder payout | `protocol/e2e_chain_proof.sh` | digest parity, solvency and payout property all asserted |
| `protocol/gen_vectors.py` | The generator that keeps the Python reference, the C firmware and the Solidity side byte-identical | run after any codec change | invariant, HANDOVER section 3 |
| `firmware/xkoin-gateway/src/main.c`, `platformio.ini`, `lib/sx1262/sx1262.h` | The ESP-IDF glue written to the doc 02 pin map, compile-untested; 868.1 MHz, SF7 BW125 CR4/5, GFSK 150 kbps, and the VERIFY-tagged register values | `pio run` | pending, HANDOVER backlog item 3 |
| `scripts/gas_budget.py` | Recomputes the gas cost table from live prices and reports wallet runway | `.venv/Scripts/python.exe scripts/gas_budget.py` | measured 2026-09-09 |
| `scripts/docker-proofs.sh` | The whole matrix above in a container, with no local toolchain | `scripts/docker-proofs.sh` | same results |
| `demo/` and `demo/dist/` | The replay page, the landlord page and the one-stack build that serves them | `demo/README.md` | built |

### 7.4 Operations

| Path | What it carries |
|---|---|
| `docs/ops/regulatory-brief.md` | Eight sections and fifteen numbered questions for counsel, covering spectrum, power-line carrier, import, connectivity resale, money, structure and what counsel need not decide. Dated 2026-09-09 |
| `docs/ops/critical-accounts/01-registrations.md` to `06-vps-xkoin.thuku.dev.md` | Registrations, one address per wallet role, the measured gas budget and self-funding loop, the security list and incident table, the test plan and the gateway host |
| `docs/ops/key-management.md` | Key storage and rotation |
| `docs/ops/jenga-onboarding.md` | The Finserve onboarding path and its document requirements |
| `docs/_drive/01` to `05` | The verbatim Drive design suite exports: the patent specification, the MVP end-to-end plan, the hardware sourcing guide, the tokenomics and return model, and the architecture decisions and tradeoffs. Exported 2026-09-12, read-only |

## 8. Citations the set still owes

Seven claims in papers 00 to 13 are carried by a named source that has not been retrieved as a primary document. Each is listed here with the paper that carries it and the document that would close it, so the list can be worked through rather than rediscovered.

| Claim | Paper | Document that closes it |
|---|---|---|
| Helium rewards coverage rather than delivered bytes | 00 section 3 | The Helium improvement proposal that defines data-transfer rewards |
| Althea prices per hop and needs an internet-protocol path at each one | 00 section 3 | The Althea whitepaper on per-hop billing |
| Kenya Power automated meter reading uses narrowband power-line carrier | 00 section 3 | A Kenya Power or EPRA source on the deployment |
| Safaricom and Airtel retail bundle prices | 01 section 2 | The operators' own current tariff pages |
| Kenya Power outage frequency and duration, and connection counts | 01 sections 3 and 6 | Kenya Power planned-interruption notices; Kenya Power and EPRA annual reports |
| SX1262 transmit and receive currents | 07, 08, 09 power budgets | Semtech DS.SX1261-2, which also closes the VERIFY-tagged register values |
| Nairobi peak sun hours | 07 section 7 | A sourced irradiance dataset for the pilot site |

Two further items are not missing citations but unresolved facts, and they are recorded in the papers that depend on them: whether the Heltec V3's USB-C connector reaches the ESP32-S3 native USB peripheral or a bridge chip, which a board on a bench answers in ten seconds (paper 08 section 4); and whether the BEACON frame's Meshtastic discovery compatibility holds between two physical radios, which demo D6 can demonstrate on the same bench (paper 09 section 5.2).

## 9. Sources cited by paper 15

Paper 15 grades seventeen extensions that the rest of the set does not cover, so its sources are listed separately here rather than folded into sections 2 to 6, which would renumber entries that other papers cite by number. The retrieval-status convention of section 1 applies unchanged, and paper 15's own section 11 carries the twenty-four facts it marks TODO: verify with the document or test that closes each one.

### 9.1 Coding and transport

1. Luby, M. *LT Codes*. Proceedings of the 43rd Annual IEEE Symposium on Foundations of Computer Science, 2002. The degree distribution and the rateless-encoder construction relied on in paper 15 section 4.1. Status: named, not retrieved.
2. Luby, M., Shokrollahi, A., Watson, M., Stockhammer, T. and Minder, L. *RaptorQ Forward Error Correction Scheme for Object Delivery*. RFC 6330, Internet Engineering Task Force, 2011. The decode-failure probabilities at zero, one and two overhead symbols quoted in paper 15 section 4.1. Status: named, not retrieved. This is TODO: verify item 12.
3. Reed, I. S. and Solomon, G. *Polynomial Codes over Certain Finite Fields*. Journal of the Society for Industrial and Applied Mathematics, 1960. The fixed-rate block code described in paper 15 section 4.1. Status: named, not retrieved.
4. Semtech. *LoRa Modem Design Guide and the time-on-air formula*, as applied to SF7 BW125 CR4/5 with an 8-symbol preamble and explicit header to yield the 358.6 ms figure in paper 15 sections 4.2 and 7.1. Status: named, not retrieved; the arithmetic is reproduced in the paper so it can be checked without the document.

### 9.2 Data over the cellular voice channel

5. Dhananjay, A., Sharma, A., Paik, M., Chen, J., Kuppusamy, T. K., Li, J. and Subramanian, L. *Hermes: Data Transmission over Unknown Voice Channels*. Proceedings of MobiCom, 2010. The roughly 1.2 kbit/s figure in paper 15 section 3.4. Status: named, not retrieved. This is TODO: verify item 6.
6. Rowe, D. *Codec 2: open source speech coding at 700 to 3200 bit/s*. Project documentation. Cited in paper 15 section 3.4 as the vocoder-matched signalling reference. Status: named, not retrieved. This is TODO: verify item 7.
7. 3GPP. *TS 26.071, Mandatory speech codec: AMR speech codec, general description*, and *TS 06.60, Enhanced Full Rate speech transcoding*. The codec rates and the code-excited linear prediction construction that defeats generic voiceband modems, paper 15 section 3.4. Status: named, not retrieved.
8. 3GPP. *TS 23.038, Alphabets and language-specific information*. The 140-octet 8-bit user-data limit and the 160-septet GSM 7-bit alphabet relied on for the one-ticket-per-message result in paper 15 section 3.2. Status: named, not retrieved.

### 9.3 Embedded storage, compression and radio

9. Espressif Systems. *ESP32-S3 Technical Reference Manual*, external memory and cache chapters, and *ESP-IDF Programming Guide*, the wear-levelling and non-volatile storage components. The PSRAM latency caution and the wear-levelling behaviour in paper 15 section 5. Status: named, not retrieved.
10. Grabowski, S. *heatshrink: an embedded data compression library*. Project documentation. The small-window LZSS codec in paper 15 section 6.3. Status: named, not retrieved.
11. Collet, Y. *LZ4* and *Zstandard, including dictionary training*. Project documentation. The codec footprints and the dictionary argument in paper 15 section 6.3. Status: named, not retrieved. The measured ratios are TODO: verify item 14.
12. IEEE. *802.11ah-2016, Sub 1 GHz license-exempt operation*. The rates and channel plan in paper 15 section 7.6, against which the Kenyan allocation question is posed. Status: named, not retrieved.
13. Morse Micro. *MM6108* and Newracom, *NRC7292* module documentation. The named 802.11ah parts in paper 15 section 7.6. Status: named, not retrieved; pricing is TODO: verify item 24.

### 9.4 Satellite internet-of-things

14. Lacuna Space. *Service description and LoRa uplink from low earth orbit*. The candidate that would reuse the SX1262 already in the bill of materials, paper 15 section 7.4. Status: named, not retrieved. Coverage, pricing and the uplink licensing position are TODO: verify item 20 and the single question that decides whether the idea is free or impossible.
15. SpaceX and Swarm Technologies. *Announcements following the Swarm acquisition*. The basis for paper 15 section 7.4's instruction not to design for Swarm. Status: named, not retrieved. This is TODO: verify item 19.
16. Iridium. *Short Burst Data service description*, the 340-byte mobile-originated message size in paper 15 section 7.4. Status: named, not retrieved; pricing is TODO: verify item 21.

### 9.5 Proofs and identity

17. Groth, J. *On the Size of Pairing-based Non-interactive Arguments*. EUROCRYPT, 2016. The 128 to 192 byte proof size in paper 15 section 7.8. Status: named, not retrieved.
18. Bunz, B., Bootle, J., Boneh, D., Poelstra, A., Wuille, P. and Maxwell, G. *Bulletproofs: Short Proofs for Confidential Transactions and More*. IEEE Symposium on Security and Privacy, 2018. The range-proof size in paper 15 section 7.8. Status: named, not retrieved.
19. Republic of Kenya. *Data Protection Act, 2019*. The instrument that decides whether an xKoin attestation about a key becomes an attestation about a person, paper 15 section 7.9. Status: named, not retrieved; the line itself is a counsel question recorded in paper 15 section 8.

### 9.6 Additions to the citations owed

Section 8 of this paper lists seven claims carried by a named but unretrieved source. Paper 15 adds four that belong on the same list because they change a design decision rather than a figure.

| Claim | Paper | Document that closes it |
|---|---|---|
| RaptorQ recovers with near-certainty at two overhead symbols | 15 section 4.1 | RFC 6330 |
| Data over a GSM voice channel reaches about 1.2 kbit/s with forward error correction | 15 section 3.4 | The Hermes paper and one retrieved survey |
| Lacuna Space can be reached from Kenya with an SX1262 | 15 section 7.4 | Lacuna's own service description, then counsel on the uplink |
| Swarm hardware and service are no longer a design option | 15 section 7.4 | SpaceX and Swarm announcements |
