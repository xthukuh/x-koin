# Landing page design study (Kickstarter and Meshtastic)

Research agent report, 2026-09-12. Kept as the brief for the landing page,
the papers' figures list and the pledge structure. Every observation was
taken from the live page; Kickstarter blocks plain fetches, so campaign data
came from each page's own project payload.

## Headline finding

The two reference pages solve different halves of the problem. NodeIT (2015)
is a weak layout model but a clean module-family narrative. The pattern that
correlates with money across six campaigns is: one hero product, one heavily
discounted hero tier that takes about 85 percent of backers, and a GIF per
feature showing the device doing the thing. Meshtastic supplies the visual
language for a mesh, but it is a messaging project with no economics, which
is the gap xKoin occupies.

## 1. NodeIT

https://www.kickstarter.com/projects/sweetpeas/nodeit-the-worlds-smallest-and-extendable-iot-syst
SEK 134,902 of 35,000 (385 percent), 227 backers, 30 days, 2015.

Structure: pitch video, sticky reward column; thank-you block; stretch goals
retro-labelled "Reached on the 31st of August"; vision line ("This project
is about Connecting Your Things, nothing more, nothing less"); origin story
naming the enabling chip (ESP8266) and the date; the base module with size;
the +One and WorkStation concept; six expansion boards, one block each
(banner heading, 680x510 render on white, one sentence); software
ecosystem; use cases from the creator's lab; wiki; second video; risks (two
paragraphs). No spec table, no timeline, empty FAQ.

Every section heading is a rasterised PNG strip with no alt text. Tidy to
look at, unsearchable, unreadable by screen readers. Use real h2 elements
styled the same way.

Pledge tiers: nine, no titles. The two that carried the campaign were SEK
220 (base plus one expansion, 96 backers) and SEK 865 (complete set, 59
backers). Ten-packs and the distributor pack drew almost nobody.

Naming morphemes: ESP210 (base, numeric), +One (anything stacking on top),
WorkStation40 (the inversion, a carrier the base plugs into). One sentence
teaches the family.

Reusable patterns:
1. Banner-heading rhythm with real h2 elements.
2. Module grid triplet: heading, one hero image on white, one sentence.
3. One naming morpheme per role.
4. Origin-of-the-idea section before any spec.
5. The concrete throwaway build ("a speed controller for a model train in a
   few hours").
6. Solicit the next SKU from readers.
7. Stretch goals as retro-labelled trophies.
8. Two-video sandwich: pitch at top, demo immediately before Risks.

## 2. Five more campaigns

goTenna Mesh, https://www.kickstarter.com/projects/gotenna/gotenna-mesh-off-grid-people-powered-connectivity
USD 582,473 of 150,000, 2,902 backers, 2016. The minimum purchasable unit is
a pair; rewards run 2/4/6/8 devices. A GIF plus narrated video "because
transmissions are literally invisible". A named protocol metaphor (Aspen
Grove). Risks in three voices: "The Good News", "But You Should Also Know",
"International Backers, Please Read" (radio licensing per country). A tall
progress-tracker infographic.

Flipper Zero, https://www.kickstarter.com/projects/flipper-devices/flipper-zero-tamagochi-for-hackers
USD 4.88M of 60,000, 37,987 backers. One hero tier (USD 119 early bird) took
87 percent of backers; every tier card states the saving twice and lists
contents with quantities. A GIF per capability under a real heading with a
one-line caption. Budget breakdown, shipping, press kit, in-body FAQ
including "Is this legal?", risks under three headings, environmental
commitments. Every component choice states the tradeoff it won (the LCD
over OLED for sunlight and 400 nA).

Mesh Node, https://www.kickstarter.com/projects/harshu/mesh-node
GBP 7,678 of 1,000, 75 backers, 2026, RAK4630. A 13-item annotated component
breakdown, each paragraph saying what the part does for the user. A
three-part mesh explainer (how LoRa mesh works, how LoRaWAN works, how the
device extends range). Opens with a narrative failure on a trek, then "why
does communication disappear where it is needed most?". Weakness: timeline,
rewards and add-ons are flat images.

Lo-Fi and MessengerPi (GBP 12,085 and 14,020 of 500 each): nominal goals for
four-digit percentages from day one; a hard range figure in the tagline
("Messages at 5km, Call at 300m"). A stated distance is the currency of the
category.

GOTOKY (EUR 32,873 of 20,000, 47 days, twelve tiers): the weakest multiple.
Long campaign plus a wide tier ladder plus a feature-stuffed tagline dilutes
momentum. Every strong campaign ran exactly 30 days.

## 3. meshtastic.org

Hero: h2 on three monospace lines "Off-Grid / Communication / For Everyone";
sub-line naming what it is; three CTAs (Get Started, Need Hardware?, Read the
Docs); a stat row (100+ devices, 1,800+ contributors, 26 regions, 39
languages) that counts up on scroll; a simulated device console on the right
with a fake message feed, four-character node names and per-message badges
alternating signal strength ("-72 dBm") and hop count ("3 hops away"),
regenerated per page load. That console is the best idea on the page.

Animation: one fixed canvas behind the page painting a flat dark ground
(pixel hash identical across three seconds). No video, no Lottie, no SVG
animate, no keyframe hero. The only motion is the count-up numbers and the
scripted feed.

Section order: nav, hero, Key Features (three cards), Get Connected (four
client cards), Supported By, Sponsored By, the #hardware panel, footer.

Palette (from the CSS bundle, HSL triples converted):

| Token | Light | Dark |
|---|---|---|
| primary | #1a8a50 | #67ea94 |
| background | #f6f5f3 | #0e1015 |
| foreground | #22201c | #fafafa |
| card | #fbfaf9 | #060a0f |
| surface | #f0eeea | #14171f |
| accent, ring | #127d4b | #69f284 |
| border | #d7d3cc | #303541 |

Light is a warm off-white (hue 40), dark a cool near-black (hue 222); the
green shifts from forest to phosphor. Radius 0.625rem.

Typography: hero and section headings in ui-monospace (60px/700, -1.5px
tracking; 36px; 18px cards), eyebrow and body in system-ui (14px body).
Monospace display over a dark ground with a sans body does most of the
"technical, off-grid" work. Container 1280px.

Hardware catalogue: a panel of seven cards, each with device name, vendor,
and three tag chips (form factor, display, silicon), no price, no photo.
Full catalogue at https://meshtastic.org/docs/hardware/devices/ by vendor
with columns Device / MCU / Radio / WiFi / Bluetooth / GPS.

Devices to know: Heltec LoRa32 V3 (ESP32-S3FN8, SX1262, OLED, under USD 30);
Heltec Wireless Stick Lite V3; LILYGO T-Beam Supreme (USD 40); LILYGO T-Deck;
LILYGO T-Echo (nRF52840, no WiFi); Seeed T1000-E (nRF52840, LR1110, USD 40);
RAK WisBlock kits. ESP32-S3 devices have WiFi and shorter battery life;
nRF52840 devices have no WiFi and far better efficiency. xKoin's ESP32-S3
choice is right for a mains or solar node that must run WiFi client attach,
and the page should say so. A gateway BOM near USD 200 is an order of
magnitude above a Meshtastic node: compare on cost per MB delivered, never
on unit price.

## 4. How Meshtastic explains the mesh

Introduction (https://meshtastic.org/docs/introduction/): no analogy; defines
LoRa and GPS, leaves "node" to context; the illustration is a topology of
real device photos wired together. Technical page
(https://meshtastic.org/docs/overview/mesh-algo/): managed flooding,
SNR-based contention (distant nodes flood first), next-hop routing for
direct messages, a worked example with four numbered nodes, and quantitative
limits (intervals scale above 40 nodes by a published formula). Diagrams are
raster WebP.

Vocabulary it teaches: node, hop, hop limit, rebroadcast, managed flooding,
SNR, contention window, next-hop, channel, PSK, router and client roles,
MQTT gateway, airtime, channel utilisation, duty cycle. Keep node, hop and
mesh; add exactly three words: voucher, receipt, ticket.

Three gaps xKoin fills: Meshtastic carries messages, not internet; it has no
medium but radio (xKoin's second layer is the mains wiring in every
building, with LoRa as the survival plane); and it has no economics, so
nobody is paid to run a node where it is needed.

## 5. Recommended xKoin landing page outline

Direction: Meshtastic's typographic system (monospace display, dark ground,
sans body) with Flipper's content discipline (real headings, a GIF per
capability, every component states the tradeoff it won), goTenna's pledge
structure (pairs, never singles) and its three-voice risks section.

| # | Section | Purpose |
|---|---|---|
| 1 | Hero | Headline on three monospace lines ("Internet / Over Your / Wiring"), sub-line naming the three mediums and the payment, three CTAs, stat row (3 mediums, price per GB, 95 percent to the operator, 8 Laws), live simulated node console (frames with medium badge PLC/LoRa, byte counter, receipts signed, KES ticking) |
| 2 | The problem, in Nairobi | A specific street, price per GB, outage |
| 3 | Free LAN, paid WAN | The economic hook before any hardware |
| 4 | Three mediums, one protocol | HomePlug for bulk, narrowband PLC for receipts, LoRa for survival; ends on the grid-cut line |
| 5 | Pay per verified byte | Voucher, receipt, ticket, settlement: four beats, four visuals |
| 6 | When the grid fails | The measured failover |
| 7 | The node | Annotated callout diagram, spec table, why each part won its slot |
| 8 | For node operators | Earnings per GB, cash-out to M-Pesa, running cost |
| 9 | Security by construction | Eight Laws as one-liners with the test that proves each |
| 10 | Trusted parties, stated plainly | Kiosk root key, bridge hot wallet cap, owner keys, removal roadmap |
| 11 | Get a node | Pairs only |
| 12 | Roadmap and status | Built, in progress, planned, dated |
| 13 | FAQ | Is it legal, lost phone, operator disappears, crypto knowledge, no electricity |
| 14 | Docs and repo | Protocol spec, demo, GitHub, BOM |

Pledges: no single-node tier; the unit is a pair (gateway plus satellite);
ladder 1 pair / 2 pairs / building kit with contents, saving in currency and
percent, scarcity count; name variants by quantity and window only.

Assets, priority five first: A13 page loading over the mesh with byte
counter and KES cost (GIF); A2 three-mediums building cutaway (animated
SVG); A5 four-beat money flow (animated SVG); A8 annotated node callout
(photo plus SVG overlay); A12 M-Pesa purchase GIF. Then: A1 hero console
(HTML+JS), A3 grid-cut animation, A4 frame anatomy (29-byte header), A6
nine-step journey track, A7 settlement split donut, A9 exploded node, A10
and A11 in-situ photos, A14 operator payout GIF, A15 compression comparison,
A16 service class table, A17 coverage map, A18 eight Laws strip, A19 spec
table, A20 roadmap track (editable), A21 operator economics calculator, A22
logo and node silhouette.

Cautions: never rasterise headings; never make the roadmap, rewards or spec
tables into images; keep the copy on what the network does technically and
away from ISP-style service claims until counsel signs off, with a Kenyan
"please read" block on radio and licensing.

## Addendum from a second pass on meshtastic.org

A second agent read the page's own JS chunk rather than sampling pixels:
the fixed canvas behind the homepage draws a hand-coded world-map
silhouette with 24 node cities (Nairobi and Lagos among them) and runs a
managed-flooding ripple animation from node to node within radio range,
capped at six hops, theme-aware. The "Supported By" strip is a CSS marquee.
The docs introduction page carries a separate animated topology built from
device SVG icons (https://flasher.meshtastic.org/img/devices/) labelled
Client or Router with CSS-keyframe pings. The "#hardware" anchor now lives
on /docs/introduction/, and the homepage's "Need Hardware?" button opens a
modal of six device cards (image, name, vendor, tag chips), with no filters
anywhere. Extra prices: Heltec LoRa32 V3 USD 17.90 to 19.90 on heltec.org,
T-Deck Plus USD 77, T-Echo USD 44.61, RAK WisBlock starter kit USD 25 to 61,
Station G2 USD 109. The glossary at https://meshtastic.org/docs/terms/ never
defines "hop"; the overview page does ("marks the hop limit down by one").
