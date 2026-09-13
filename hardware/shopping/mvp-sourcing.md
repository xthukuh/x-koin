# MVP sourcing plan: per-device budgets, checkout links, Nairobi shops

Written 2026-09-14. Every figure here was read on the listing page that day,
with the variant selected and the ship-to set to Kenya. Data files:
`mvp-kit.json` (what each device needs), `mvp-checkout.json` (the exact link,
variant, price, shipping and delivery window per line), `local-vendors.json`
(every Nairobi candidate examined, with verdicts). The scout that searched the
Nairobi stores is `scripts/scout/local.mjs`.

## The answer in three lines

Six lines of the kit exist nowhere in Nairobi (Heltec V3, E22-900M22S, Ra-01SH,
SMA attenuators, EMI filter, IPEX to SMA pigtail with a true SMA jack), so one
AliExpress order is unavoidable; the only Nairobi KQ-130F listing (Pixel
Electric, 1,800) was sold out on the day, so that line ships too.

Everything else that is in stock in Nairobi costs two to three times the
AliExpress price, so the local stops are kept to what AliExpress cannot deliver
sensibly (the TP-Link HomePlug kit, the 18650 cell, the mains strip) plus five
small lines whose AliExpress listings ship in mid November (TP4056, cell holder,
AHT20, breadboard and jumpers, console lead), where paying about 1,000 KES more
buys them the same day.

The bare minimum kit that runs every medium and every basic journey is 26,404
KES before AliExpress shipping (635), before VAT on the HomePlug kit (1,440 if
charged) and before customs on the parcel. Stops: one AliExpress checkout,
Brightsource, K-Technics, ASK Electronics, Nerokas, a supermarket.

## What the minimum kit proves

| Medium | Carried by | Demo |
|---|---|---|
| HomePlug AV broadband PLC (bulk data, the HD YouTube bar) | TL-WPA4220KIT between Node and Node-Satellite | D1, D4, D5 |
| KQ-130F narrowband PLC (receipts, control) | one module at the Node, one at the Node-Satellite | D1, D4 |
| LoRa SX1262 (survival plane, distance) | E22-900M22S at the Node, Heltec V3 at the Satellite and the Client dongle, Ra-01SH at the farm node | D2, D4, D6 |
| Wi-Fi client attach and captive portal | the phone on the TL-WPA4220's Wi-Fi | D1, D4, D5 |

Journeys covered: buy and browse over PLC (D1), chat, balance and voucher over
LoRa through 60 dB of path loss (D2), WAN unplugged and settlement on return
(D4), YouTube 720p over the HomePlug path (D5, the success bar Martin set),
farm sensor on the free plane (D6), and the phone-plus-dongle client. Demo D3
(the transformer jump across a PLC filter) is stage two: it needs a third
ESP32-S3, a second SX1262 module, a third KQ-130F, the plain HomePlug pair and
the filter.

## Per-device budgets (KES)

Unit prices for packs are the pack price divided by the pack size: the Heltec
2-pack (5,122) serves the Satellite and the Client; the pigtail 5-pack (389)
and the antenna 2-pack (347) serve the Node and the farm node with spares left.

### xKoin-Node

| Line | Qty | Variant | Unit | Cost | Source | Arrives |
|---|---|---|---|---|---|---|
| ESP32-S3-DevKitC-1 N16R8 | 1 | N16R8 weld | 749 | 749 | AliExpress, MT Technology | Sep 21 to 25 |
| E22-900M22S SX1262 | 1 | single | 556 | 556 | AliExpress, XHCIOT | Sep 21 to 25 |
| IPEX to SMA-K pigtail | 1 of 5 | 15 cm | 78 | 78 | AliExpress, STX Store | Sep 21 to 25 |
| 868 MHz SMA male antenna | 1 of 2 | 11 cm, 3 dBi | 174 | 174 | AliExpress, STX Store | Sep 21 to 27 |
| KQ-130F+ | 1 | single | 2,608 | 2,608 | AliExpress, TILICHIP | Sep 22 to 30 |
| TL-WPA4220KIT | 1 | UK plug | 9,000 | 9,000 | Brightsource, Wabera Street | same day |

Device: 13,165 (AliExpress 4,165, local 9,000). Owned: a USB 5 V charger, the
home router or a phone hotspot as backhaul.

### xKoin-Node-Satellite

| Line | Qty | Variant | Unit | Cost | Source | Arrives |
|---|---|---|---|---|---|---|
| ESP32-S3-DevKitC-1 N16R8 | 1 | N16R8 weld | 749 | 749 | AliExpress, MT Technology | Sep 21 to 25 |
| KQ-130F+ | 1 | single | 2,608 | 2,608 | AliExpress, TILICHIP | Sep 22 to 30 |

Device: 3,357. Owned: a USB 5 V charger; the TL-WPA4220 half of the Node's kit
is the Wi-Fi extractor here.

### xKoin-Satellite

| Line | Qty | Variant | Unit | Cost | Source | Arrives |
|---|---|---|---|---|---|---|
| Heltec WiFi LoRa 32 V3 | 1 of 2 | 868MHz V3 | 2,561 | 2,561 | AliExpress, IoT Hub Store | Sep 21 to 25 |
| TP4056 with protection | 1 | Type-C | 130 | 130 | K-Technics | same day |
| 18650 holder with leads | 1 | 1 cell | 70 | 70 | K-Technics | same day |
| 18650 cell | 1 | INR 2600 mAh | 400 | 400 | Nerokas | same day |
| Solar panel 6 V 2 W | 1 | 55mm | 136 | 136 | AliExpress, DD Best Store | Sep 21 to 26 |

Device: 3,297 (AliExpress 2,697, local 600).

### xKoin-Client OTG dongle

| Line | Qty | Variant | Unit | Cost | Source | Arrives |
|---|---|---|---|---|---|---|
| Heltec WiFi LoRa 32 V3 | 1 of 2 | 868MHz V3 | 2,561 | 2,561 | AliExpress, IoT Hub Store | Sep 21 to 25 |
| USB-C OTG adapter | 1 | White 1pcs | 136 | 136 | AliExpress | Sep 21 to 25 |

Device: 2,697. Owned: the phone.

### LoRa ecosystem farm node

| Line | Qty | Variant | Unit | Cost | Source | Arrives |
|---|---|---|---|---|---|---|
| ESP32-C3 SuperMini | 1 | C3 Super mini | 284 | 284 | AliExpress, TENSTAR | Sep 21 to 25 |
| Ra-01SH | 1 | Ra-01SH Adapter | 226 | 226 | AliExpress, IC components | Nov 14 |
| Capacitive soil moisture | 1 | 1 PCS | 136 | 136 | AliExpress | Sep 21 to 27 |
| AHT20 I2C module | 1 | module | 350 | 350 | ASK Electronics | same day |

Device: 996 (AliExpress 646, local 350). The Ra-01SH takes one spare pigtail
and one spare antenna from the Node's packs. Every Ra-01SH listing found ships
in mid November; the fast alternative is a second E22-900M22S (556, Sep 21 to
25), which is the same SX1262 radio and needs Martin's word because the spec
names the Ra-01SH.

### Bench

| Line | Qty | Variant | Unit | Cost | Source | Arrives |
|---|---|---|---|---|---|---|
| SMA attenuator 30 dB | 2 | 30DB | 521 | 1,042 | AliExpress, China Tool&Life | Sep 21 to 25 |
| Breadboard 830 and 120 jumpers | 1 | MB-102 at ASK, three 40 pc packs at K-Technics | 650 | 650 | ASK and K-Technics | same day |
| USB to TTL, 3.3 and 5 V | 1 | CP2102 6 pin | 400 | 400 | ASK Electronics | same day |
| 4 way UK mains strip | 1 | 13 A | 800 | 800 | supermarket | same day |

Bench: 2,892 (AliExpress 1,042, local 1,850). Owned: USB-C data cables and a
plug-in RCD for the day the KQ-130F goes on mains. The strip price is a budget
figure; no listing was checked.

### Totals

| | KES |
|---|---|
| AliExpress lines | 14,604 |
| AliExpress shipping (KQ-130F 569, Ra-01SH 66; every other line free) | 635 |
| Nairobi lines | 11,800 |
| VAT on the HomePlug kit if Brightsource adds 16 percent at checkout | 1,440 |
| Kit before customs | 26,404 to 28,479 |

Customs on the AliExpress parcel is not in the table: `hardware/bom.md` puts
duty at 0 to 25 percent by HS line plus 16 percent VAT and 3.75 percent of
levies, so budget 3,000 to 7,500 on a 15,000 parcel and treat whatever Posta or
the courier actually charges as the figure.

## Ranked options for the shop count

1. **Recommended: one AliExpress checkout plus four Nairobi stops (this plan).**
   Everything that matters lands Sep 21 to 30, bring-up starts the same day the
   bench lines are collected, and 26,404 KES is the floor for an exact-match
   kit. Cons: four shops in town (Brightsource, K-Technics, ASK, Nerokas) plus
   the supermarket; the KQ-130F+ costs 2,608 each because the cheaper listings
   either photograph a KQ-330 or carry 1,419 shipping.
2. **Two stops: AliExpress plus Brightsource, wait for the slow lines.** Move
   TP4056 (71), holder (62), AHT20 (185), breadboard bundle (312) and console
   lead (100) back to AliExpress: saves about 870 KES and drops K-Technics and
   ASK, but those parts arrive Nov 14 to 22, and the cell still has to be bought
   in town (Nerokas or esp-ke). Consequence: the Satellite and the farm node
   cannot be assembled before mid November.
3. **Local-first for the boards as well.** K-Technics has the ESP32-S3 N16R8 in
   stock at 2,500 (AliExpress 749) and ArduinoTech the ESP32-C3 Super Mini at
   800 (284). Adds about 4,000 KES for having the two MCU lines this week
   rather than on Sep 25. Not worth it unless the AliExpress parcel slips.

Two things only Martin can do: call Pixel Electric about a KQ-130F restock
(1,800 each, genuine pinout on their page, sold out on 2026-09-14), which would
cut 1,616 KES and the 569 shipping; and decide Ra-01SH versus a second
E22-900M22S for the farm node.

## What changed against the scouted list

The session four scout recorded search-card prices, and two of them belonged
to the wrong variant of the listing: the 572 ESP32-S3 was an expansion adapter
board in a listing that never mentions N16R8, and the 22 antenna was a GSM
spring antenna in a listing whose 868 whips cost 96 and ship Nov 14. Both
chosen links in `parts/` are now the verified ones. The KQ-130F choice moved
from the 1,029 listing to the KQ-130F+ listing for the reasons above. The
HomePlug kit moved off AliExpress entirely: no listing there matches the spec
(generic AV500 kits with EU plugs), and Brightsource sells the TP-Link kit with
a UK plug, Kenya warranty and same-day dispatch.

## Nairobi stores examined

| Store | Platform | Useful for | Finding on 2026-09-14 |
|---|---|---|---|
| K-Technics, ktechnics.com | Shopify | ESP32-S3 N16R8 (2,500), TP4056 Type-C with protection (130), 18650 holder with leads (70), capacitive soil (200), 3 W 6 V panel (900), breadboard (250), 40 pc jumper packs (150 each), DHT22 (700) | all in stock; 868 antenna listed with no price; HLK-PM01 out of stock |
| ASK Electronics, askelectronics.co.ke | WooCommerce | AHT20 (350), HLK-PM01 (700), CP2102 with 3.3 and 5 V (400), breadboard 830 (200), DHT22 (500) | in stock; WhatsApp +254795642534 |
| Nerokas, store.nerokas.co.ke | OpenCart | 868 SMA male antenna (600), HLK-5M05 (650), ESP32-S3 N16R8 (4,000), 6 V 2 W panel (800, 2 to 3 days), INR 18650 cell (400) | in stock unless noted; U.FL to SMA cable (200) does not state SMA versus RP-SMA |
| ArduinoTech Kenya, arduinotech.co.ke | custom | ESP32-C3 Super Mini (800), ESP32-S3 N16R8 dual USB-C (1,800, low stock, module not stated), breadboard (200), DHT22 (600) | in stock |
| Pixel Electric, pixelelectric.com | BigCommerce | the only KQ-130F in Kenya (1,800) | every line checked was sold out |
| esp-ke, esp-ke.com | custom | 18650 cells (280 new, unbranded), meters | no modules of interest |
| Brightsource, brighttech.co.ke | WooCommerce | TL-WPA4220KIT (9,000 ex VAT, UK plug, same-day) | in stock |
| Kentique, TDK, VDS | WooCommerce, custom | TL-WPA4220KIT 8,000 (stock and plug unstated), 12,000 ex VAT EU plug, TL-PA4010 KIT quote only US plug | not chosen |

Not found in any of them: Heltec V3 (Pixel lists a V2 class SX1276 board, sold
out), any SX1262 module (only SX1276 and SX1278), Ra-01SH (only Ra-01 and
Ra-02 at 433 MHz), SMA attenuators, mains EMI filters, and a pigtail that
states a true SMA female jack.
