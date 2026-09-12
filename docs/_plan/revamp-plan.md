# xKoin revamp plan (session four, 2026-09-12)

Working plan for the change request Martin filed on 2026-09-12. It fixes the
device lineup, the demo matrix, the document tree and the order of work so
every subagent and every resumed session builds against the same picture.
Decisions marked "Martin" are open until he answers; the recommended option
is what the work assumes in the meantime.

## 1. Device lineup

Martin's names win over the patent draft's names. The mapping is recorded so
the Drive documents and the repo can be read together.

| Martin's name | Patent draft (docs/_drive/01) | Role in one line | Bare-minimum PoC build |
|---|---|---|---|
| xKoin-Node | xKoin-Node | The gateway: backhaul in, mains and radio out, meters every WAN byte | ESP32-S3 DevKitC N16R8 + SX1262 + KQ-130F + HomePlug AV injector; backhaul from the existing router or a phone hotspot (LTE modem deferred) |
| xKoin-Node-Satellite | xKoin-Satellite | Wall-socket relay on the same mains segment: pulls the PLC signal, regenerates Wi-Fi, enforces admission | HomePlug AV extractor with Wi-Fi + ESP32-S3 + KQ-130F |
| xKoin-Satellite | xKoin-LoRa | Off-grid LoRa remote: solar, deep sleep, class C service, relays to the nearest Node | ESP32-S3 + SX1262 + TP4056 + 18650 + small panel |
| xKoin-Client | (client) | The user: phone with the companion app over Wi-Fi, or the OTG AP dongle for direct LoRa reach | ESP32-S3 (native USB) + SX1262 on a USB-C OTG lead |
| LoRa ecosystem devices | (AgTech sensors) | Third-party style nodes that ride the free LAN plane: farm sensor, tank level, Meshtastic handset for interop | ESP32-C3 + RA-01SH + soil moisture + DHT22; one Heltec V3 flashed with Meshtastic |

Martin: confirm the mapping of "Node-Satellite" (mains relay) versus
"Satellite" (off-grid LoRa). The work assumes this reading.

Martin: LoRa-bearing boards. Recommended: Heltec WiFi LoRa 32 V3 (ESP32-S3,
SX1262, OLED, 868 MHz, about 15 to 20 USD) for Satellite, Client dongle and
the farm node, because it removes SPI wiring, is standard Meshtastic
hardware, and the OLED carries state on camera. The Node and Node-Satellite
stay on DevKitC N16R8 with a separate SX1262 module on the doc 02 pins so the
proven firmware pin map does not move. Alternative: E22-900M22S modules on
every board (cheaper per radio, more wiring, no display).

## 2. Demo matrix

Each demo names the hardware, the observable, and what it proves.

| # | Demo | Hardware | Observable | Proves |
|---|---|---|---|---|
| D1 | Local LAN over PLC | Node, Node-Satellite, one extension strip | Phone on Node-Satellite Wi-Fi opens the captive portal, buys, browses; receipts tick on the Node | Bulk plane over mains, admission, metering |
| D2 | Air-gapped LoRa over simulated distance | Node, Satellite, two 30 dB SMA attenuators | Class C traffic (chat, balance, voucher) at SF7 through 60 dB of path loss; RSSI shown | Survival plane, offline admission, distance |
| D3 | Transformer node jump | Node on strip A, second Node-Satellite plus SX1262 on strip B behind a PLC filter | PLC does not cross the filter; LoRa carries control between segments; each segment keeps local bulk | Mesh continuity where the mains segment ends |
| D4 | Last network standing | D1 setup, WAN unplugged | Free LAN keeps working, class C over LoRa keeps working, receipts accumulate, settlement lands when WAN returns | Cumulative counters, no loss, degrade not die |
| D5 | High-speed internet | D1 setup, real backhaul | YouTube 720p and a TikTok Live session through the HomePlug path; speed test screenshot | Broadband PLC carries consumer video |
| D6 | Farm IoT on the free plane | Satellite, farm sensor node | Soil moisture and temperature arrive at the Node dashboard, zero XKN spent | LAN is free, LoRa ecosystem compatibility |

## 3. Parts to source (bare minimum, one kit)

Quantities are the minimum that runs every demo above once. Scouring agents
price each line with the exact listing, the store's sold count and rating,
and at least two candidate listings.

| Line | Qty | Notes for the scout |
|---|---|---|
| ESP32-S3-DevKitC-1 N16R8 | 2 | Title must say N16R8; WROOM-1 PCB antenna variant |
| Heltec WiFi LoRa 32 V3, 868 MHz | 3 | With antenna; V3 not V2 |
| SX1262 module 868 MHz (E22-900M22S or Waveshare Core1262) | 2 | SPI, 22 dBm, IPEX or SMA |
| 868 MHz antenna, SMA or IPEX | 3 | Match the module connector |
| SMA attenuator 30 dB, DC to 3 GHz | 2 | Fixed, 2 W is fine |
| IPEX to SMA pigtail | 3 | For boards with IPEX only |
| HomePlug AV kit with Wi-Fi extender (AV600 or AV1000 class) | 1 kit | TP-Link TL-WPA4220 KIT or equivalent generic; must be a pair |
| HomePlug AV plain pair (cheapest) | 1 pair | Optional, for demo D3 segment B |
| KQ-130F narrowband PLC module | 3 | Genuine KQ-130F with coupling network on board |
| Mains EMI or PLC blocking filter | 1 | For demo D3 |
| TP4056 solar charge board | 1 | With protection |
| 18650 cell plus holder | 1 | Buy the cell locally if shipping forbids it |
| Solar panel 6 V 2 W | 1 | Bare minimum for a bench demo |
| Capacitive soil moisture sensor v2.0 | 1 | |
| DHT22 or AHT20 | 1 | |
| ESP32-C3 SuperMini | 1 | Farm node |
| RA-01SH (SX1262) module | 1 | Farm node radio |
| USB-C OTG adapter | 1 | For the Client dongle |
| USB to TTL CH340 | 1 | |
| HLK-PM01 5 V mains module | 2 | Or USB chargers |
| Breadboard, jumpers, extension strips | as needed | |

Optional, decided later: W5500 Ethernet modules if the ESP32 must sit in the
HomePlug data path (doc 05 decision point 2 recommends the dual-tier design
instead; the PoC uses the HomePlug adapter's own Wi-Fi for bulk and the
ESP32 for admission and metering).

Safety rule for the bench: KQ-130F is first proven on a 12 V DC line, which
the module supports, and only then on a mains strip behind an RCD. No
isolation transformer is bought for the PoC.

## 4. Document tree

    docs/papers/                 the whitepaper set (rewrite)
      00-START-HERE.md           reading order, glossary, conventions
      00-x-koin-concept.md       abstract, field, background, prior art, the invention in one figure
      01-problem-and-market.md
      02-system-architecture.md  tiers, device archetypes, topology figures
      03-protocol-xkp.md
      04-settlement-and-economics.md
      05-hardware-node.md
      06-hardware-node-satellite.md
      07-hardware-satellite.md
      08-hardware-client-and-otg-dongle.md
      09-lora-ecosystem-devices.md
      10-security-and-trust.md
      11-regulatory-and-safety.md
      12-proof-of-concept-plan.md   the demo matrix above with acceptance tests
      13-roadmap.md
      14-references.md
      assets/                    SVG diagrams, blueprints, product photos
    docs/potential/              one use case per file, composition and internals
    docs/x-koin-beta/            the compact merged-board version for contract manufacture
    docs/_drive/                 verbatim Drive exports (source, read-only)
    docs/ops/                    critical-accounts, jenga, regulatory brief, key management (moved)

Paper conventions: abstract and keywords at the top, numbered sections,
figures with numbered captions, tables for anything with three or more
rows, a references section, plain ASCII punctuation. Each hardware paper
carries a photo strip of the real parts, a block diagram, a blueprint-style
wiring drawing with a title block, the pin map, its BOM slice, a power
budget and an enclosure note.

## 5. Order of work

1. Research lands: simulator choice, page patterns, slide library.
2. Decisions wizard to Martin.
3. Simulator container on the VPS; import files per device; live test.
4. Node SPA and Docker wrap (running now); repo reorganisation.
5. Papers, potential, beta, blueprints.
6. Shopping list: one scout per part line, then the HTML page.
7. Wireframes, slides.
8. Resume point, memory, board update at every milestone.
