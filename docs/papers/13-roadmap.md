# 13. Roadmap: proof of concept, pilot, beta board, manufacture

Abstract: xKoin today is a working protocol with no building attached to it. The contracts, the gateway, the protocol reference implementation and the portable firmware core all pass named tests, and no xKoin frame has ever crossed a real mains riser or a real radio path. This paper states the five phases that close that gap, each with an entry condition, an exit condition and the thing that would send it backwards. Phase 1 is the bench proof of concept, six demos with acceptance tests. Phase 2 is one building with one landlord and thirty days. Phase 3 is the regulatory and corporate work that has to clear before money moves at scale, and it is a gate on phase 2's end rather than a phase that waits its turn. Phase 4 is the compact merged board. Phase 5 is contract manufacture. Funding is given as ranges with the basis of each range named and the lines this repository cannot price listed rather than guessed. The dated table at the end is a plan and not a commitment.

Keywords: roadmap, proof of concept, pilot, regulatory gates, contract manufacture, funding, phase criteria

## 1. How to read this paper

Three rules govern everything below.

A phase does not start because a date arrived. It starts because the previous phase's exit condition was met, and the exit conditions are written so that a reasonable person can tell whether they were met.

Every number that carries a condition keeps the condition in the same sentence. The per-unit price is a placeholder at 500 micro-KES per 10 KB unit until it clears measured backhaul cost, so every revenue, payback and margin figure anywhere in this set is conditional on that measurement.

The dated table in section 9 is a plan. It is what the work would look like if nothing went wrong, and something will.

## 2. What is built today

The proof matrix below is `HANDOVER.md` section 1, re-verified from the handover tarball. Every row is a command anyone can run.

| Component | Proof | Command | Result |
|---|---|---|---|
| Contracts: token, escrow, treasury | 28 Foundry tests including a 256-run solvency fuzz and a stolen-owner-key drill | `cd contracts && forge test` | 28 passed |
| gateway-api: Daraja, Jenga, vouchers | 9 pytest, HTTP fully mocked | `cd gateway-api && pytest` | 9 passed |
| XKP protocol units | 11 pytest | `cd protocol && pytest` | 11 passed |
| XKP scenarios S1 to S6 | Discrete-event simulation, deterministic seeds | `cd protocol && python3 run_sim.py` | all scenarios passed |
| Firmware portable core, C | 75 host checks including a Python-signed Ed25519 receipt verified in C, byte-exact codec both directions, and a full one-byte corruption sweep | `cd firmware/xkoin-gateway/test/host && make run` | 75 checks |
| Full loop | anvil, forge deploy, simulation-derived EIP-712 tickets settled on a real escrow, and a stranger-triggered founder payout | `protocol/e2e_chain_proof.sh` | digest parity, solvency and payout property all asserted |

The headline measurements that come out of those runs: a two-ticket settlement batch costs 191,698 gas; the protocol reached 9.768 Mbps against a 10 Mbps HomePlug model, which is 97.7 percent of the model and a statement about the protocol rather than about any building's wiring; failover to LoRa on grid failure took about 0.8 seconds; 0 of 20,000 garbage frames were accepted.

What is not built is equally specific. No firmware has run on a board: the ESP-IDF glue is written to the doc 02 pin map and is compile-untested, because the cloud sandbox could not reach Espressif's hosts. The satellite firmware does not exist. The Android companion app does not exist. The relayer loop's batching thresholds are unset. No radio has transmitted and no mains coupling has been energised.

## 3. Phase 1: the bench proof of concept

**Entry.** The parts arrive. That is the whole entry condition, and it is the reason the sourcing work in `hardware/shopping/` came before this paper.

**What it must prove.** Six demos, each naming its hardware, its observable and what it proves. The matrix is [12-proof-of-concept-plan.md](12-proof-of-concept-plan.md); it is reproduced in outline here because the roadmap is unreadable without it.

| # | Demo | Observable | Proves |
|---|---|---|---|
| D1 | Local LAN over power line | A phone on a Node-Satellite's Wi-Fi opens the captive portal, buys and browses; receipts tick on the Node | Bulk plane over mains, admission, metering |
| D2 | Air-gapped LoRa over simulated distance | Class C traffic at SF7 through two 30 dB attenuators, with signal strength shown | Survival plane, offline admission, distance |
| D3 | Transformer node jump | The power-line carrier does not cross a mains filter; LoRa carries control between segments; each segment keeps local bulk | Mesh continuity where the mains segment ends |
| D4 | Last network standing | With the wide-area link unplugged: free LAN keeps working, class C over LoRa keeps working, receipts accumulate, settlement lands when the link returns | Cumulative counters, degradation rather than failure |
| D5 | High-speed internet | 720p video and a live streaming session through the HomePlug path, with a speed test | Broadband power-line carries consumer video |
| D6 | Farm IoT on the free plane | Soil moisture and temperature reach the Node dashboard with zero XKN spent | The LAN is free, and LoRa ecosystem compatibility |

**Exit.** All six demos pass, recorded on video, and four repository claims are either confirmed or corrected against a measurement: the Satellite's average current against the under 40 mA design ceiling ([07-hardware-satellite.md, section 7](07-hardware-satellite.md#7-power-budget)), the SX1262 register values carrying VERIFY tags, the KQ-130F behaviour on a real mains segment, and the HomePlug goodput on real wiring against the 10 Mbps model.

**What sends it backwards.** Demo D5 failing on real wiring is the one that would change the product rather than the schedule, because the bulk plane is what distinguishes this network from a mesh messenger. Demo D2 failing through 60 dB of loss would send the radio front end back to the drawing board with an external amplifier and a low-noise amplifier in it, which is proof point P4 in the beta concept paper.

## 4. Phase 2: the pilot, one building

**Entry.** Phase 1 exit met, plus four things that are not engineering: a company that exists, a landlord who has said yes, counsel's first written opinion, and the companion app in a state a tenant can install.

**Scope.** One building. The design suite's model is an urban block with one Node in the meter room and three relays on the risers above, serving about ten paying tenants. `docs/potential/02-apartment-estates.md` works the case through in full against a 40-unit block in Ruaka.

**The landlord pitch.** The ask is deliberately small and it already exists as a page, `demo/landlord.html`. The landlord gives socket space, a place to mount the Node, permission, and one caretaker who holds a key. In exchange the landlord becomes the node operator, which means their address is the `nodeAdmin` named in every ticket collected in their building and they keep 95 percent of every settled byte. The landlord is not reselling their own bandwidth to tenants and is not becoming an internet service provider, and the pitch says so, because the regulatory position of the two is different. The pilot terms are 30 days, no setup bill, no lock-in, and either side can end it with 30 days notice. The landlord page carries no shilling figures at all and its charts are marked illustrative and unitless, which is the right discipline while the price is undecided.

**The session credit rule.** This is the one protocol rule the pilot has to settle with data rather than argument. A node that cannot reach gateway-api cannot read a client's deposit, so it serves against the voucher alone up to an offline cap; and a user attached to several nodes at once could otherwise run all of them against one deposit. The contract never goes insolvent, because settlement caps at the deposit, but the last node to settle would be underpaid. The recommended MVP values are a 20 KES per-node session credit limit online and 5 KES offline, and the pilot's job is to replace "recommended" with "measured". See [02-system-architecture.md, section 7](02-system-architecture.md#7-failure-modes-and-what-survives).

**The app.** Journeys J2, J3, J5 and J10 all need it and none of them can be demonstrated without it. Scope is fixed in [docs/how-it-works.md section 5.2](../how-it-works.md) and restated in [08-hardware-client-and-otg-dongle.md, section 3](08-hardware-client-and-otg-dongle.md#3-the-phone-half-what-it-holds-signs-and-shows): one seed in the Android Keystore, two derived keys, balance, buy, auto-sign, send, withdraw. Kotlin, Android first.

**Exit.** Thirty consecutive days with paying tenants, and five numbers that did not exist before: measured backhaul cost in KES per MB; the cache hit rate from the proxy; the real per-node CapEx and monthly operating cost against the design suite's KES 29,050 and KES 3,850; the session credit limit that produced no underpaid operator; and a per-unit price derived from the spec section 8 floor formula rather than the 500 micro-KES placeholder. That last one is HANDOVER backlog item 8 and it is the single most consequential open decision in the project, because every economic claim in the set is conditional on it.

**What sends it backwards.** A price that cannot clear measured backhaul cost plus the Jenga and Daraja transaction charges. Those fiat charges are tens to hundreds of times the chain gas per operation, and chain gas is not the cost centre anyone expected it to be.

## 5. Phase 3: the regulatory and corporate gates

These are gates, not a phase that waits its turn. Each one blocks a specific later action and the work on it starts now.

| Gate | Who answers | What it blocks | Present status |
|---|---|---|---|
| Short-range-device spectrum rules at 868 MHz | Counsel, then the Communications Authority | Any transmission outside a bench. The firmware ships at +22 dBm, about 158 mW, which is roughly six times the 25 mW e.r.p. ceiling for the 868.0 to 868.6 MHz sub-band before antenna gain, and a gateway carrying paid traffic all day cannot live inside a 1 percent duty cycle without listen-before-talk and adaptive frequency agility | Open. Both are firmware settings. Counsel question 1 asks whether the 2022 guidelines survived the 2025 and 2026 regulations |
| Type-approval exemption evidence | Counsel, then an ILAC-accredited lab | Selling a device rather than running one | Open. Counsel question 3 asks whether a module manufacturer's test report suffices or the assembled device must be tested |
| Power-line carrier at 120 to 135 kHz | Counsel | Energising the KQ-130F on a mains segment in a customer's building | Open |
| Mains device certification | KEBS | Field use of any device that couples to 230 V in customer premises | Open, and it is precondition 4 in the apartment-estates pilot list |
| Transit resale licensing | Counsel, then the Communications Authority | Selling connectivity to third parties at all. Counsel questions 8 and 9 cover the licence category and whether the mobile operator's own terms permit onward resale | Open |
| XKN's legal character | Counsel, then the Central Bank of Kenya | Mainnet fiat at scale. Counsel questions 10 and 11 ask whether XKN is e-money under the National Payment System Act, a prepaid service credit, or a virtual asset under the Virtual Asset Service Providers Act 2025 | Open. The answer decides whether an authorisation or a partner bank is needed for the float |
| Anti-money-laundering and know-your-customer | Counsel | Accepting public payments and paying node operators | Open, counsel question 12 |
| Tax treatment | Counsel | The treasury payout path | Open, counsel question 13 |
| Company and merchant agreements | Company registry, then Finserve | Jenga live onboarding, which needs a certificate of incorporation, a current CR12 and director identity documents | Open, counsel question 14. The company must exist before this step |
| Multisig owner | Us | Any mainnet deployment | Open, HANDOVER backlog item 10: a 2-of-3 Gnosis Safe as owner before mainnet |

The standing brief is `docs/ops/regulatory-brief.md`, which carries fifteen numbered questions in the form a lawyer can answer. Sending it is the cheapest item on this roadmap and it gates the three most expensive ones.

## 6. Phase 4: the beta compact board

**Entry.** Phase 1 exit met, and specifically the seven proof points the beta concept paper names as the things a breadboard has to settle before a printed circuit board is committed. See [../x-koin-beta/00-compact-board-concept.md](../x-koin-beta/00-compact-board-concept.md).

**Scope.** One printed circuit board with four populations, replacing breakout modules with the bare silicon underneath them. The candidate integrated parts are named and real: an ESP32-S3-WROOM-1 module, an SX1262 with its matching network, a HomePlug chipset in the Qualcomm QCA7005 class, a narrowband power-line transceiver as either a KQ-130F module or a discrete ST7540-style part, and a Hi-Link alternating-current to direct-current module.

**The cost target.** At 1,000 units, a Node factory cost at or under USD 52 and a Satellite at or under USD 25, both ex-works China, board and enclosure included, before freight and Kenyan import charges. The beta concept paper derives USD 50.24 and USD 23.31 against those targets. The comparison that makes the Node target meaningful is the proof-of-concept bill of materials at USD 207 of modules per gateway, or USD 112 once the deferred LTE module is stripped out; the reduction comes from replacing breakout boards with bare silicon rather than from any volume discount.

**Exit.** A board that passes the same six demos the breadboard passed, with the schematic, the layout and the manufacturing brief in a state a Shenzhen contract manufacturer can quote against.

**What sends it backwards.** Two unpriced parts. The QCA7005 has no open distributor price and Qualcomm networking silicon of that class is normally sold under a design-in agreement; the ST7540 is listed at USD 15.19 at quantity one and out of stock, at which price the discrete route loses to the KQ-130F module outright. A written quotation for both is the first procurement action after phase 1 closes, and either quotation coming back high moves the cost model rather than the design.

## 7. Phase 5: contract manufacture

**Entry.** Phase 4 exit met, phase 3's device gates cleared, and a written quotation against the manufacturing brief.

**Scope.** The manufacturing brief in `docs/x-koin-beta/` states what a contract manufacturer expects: the file set, the certifications, the minimum order quantity and the design-for-manufacture points. Kenyan duty classification is open and moves the landed Node cost by about USD 15, because a finished radio transceiver in an enclosure is a different tariff argument from a bare module.

**Exit.** Units landed in Nairobi at a known landed cost, with the import classification settled rather than assumed.

## 8. Funding, as ranges

Each range names its basis. Lines this repository cannot price are listed rather than estimated, because an invented number here would propagate into every later total. The United States dollar to Kenyan shilling basis is the 130 KES benchmark the design suite's bill of materials uses; the measured rate on 2026-09-09 from Martin's own peer-to-peer trade was 123.29 KES to the dollar.

**Range A, roughly KES 25,000 to KES 60,000 (about USD 190 to USD 460). The bench proof of concept.** Buys one kit that runs all six demos once.

Basis: twelve of the roughly twenty-one lines in the revamp plan's parts list are scouted and total about KES 15,300, dominated by three Heltec V3 boards at about KES 7,700 and three KQ-130F modules at about KES 3,100. The unscouted lines are the HomePlug AV kit with a Wi-Fi extender, a plain HomePlug pair, a mains blocking filter, the TP4056 charge board, the cell and its holder, the solar panel, the soil and temperature sensors and the breadboard consumables. A Nairobi supplier carries the KQ-130F at about KES 1,800, which is above the scouted import price and sidesteps duty and inspection for that line, so the two routes are worth comparing before ordering. The top of the range covers freight, Kenyan duty, value added tax, the 2.25 percent import declaration fee, the 1.5 percent railway development levy and a replacement for whatever arrives dead.

What the top of the range buys over the bottom: spares of the two parts most likely to fail on a bench, which are the radio and the narrowband module, and the bench safety items that `hardware/bom.md` lists as non-negotiable for mains work.

**Range B, roughly KES 250,000 to KES 900,000. One building, thirty days.**

Basis, priced: field hardware for one Node and three relays at KES 29,050 from the design suite's urban model, conditional on that model's component lines; three months of operating cost at KES 3,850 a month; chain gas, which is negligible and measured, at about 8 KES a day at pilot volume.

Basis, unpriced, and these dominate the range: counsel's first written opinion against the fifteen questions; company incorporation and the documents Jenga live onboarding requires; and one developer quarter for the Android companion app. The repository holds no quotation for any of the three, which is why the range is wide and why its top is nearly four times its bottom.

What the top of the range buys: the app built rather than prototyped, and counsel's opinion covering the Central Bank questions as well as the spectrum ones.

**Range C, unpriced in this repository. The beta board and a first run.**

The beta concept paper gives unit costs at 1,000 units and no non-recurring engineering, tooling or certification figure, because none has been quoted. A 1,000-unit Node run is USD 50,240 of unit cost alone at the derived figure, and a first engineering run of twenty to fifty boards carries a far higher per-unit cost plus stencil and assembly setup. The manufacturing brief in `docs/x-koin-beta/` is the document that turns this range into a quotation, and until it comes back this paper prints no number.

## 9. The dated plan

This table is a plan, not a commitment. It assumes each phase's entry condition is met before its quarter begins, and no quarter below has been committed to anyone.

| Quarter | Phase | What happens | Gate that must have cleared first |
|---|---|---|---|
| 2026 Q4 | 1 | Parts land. Firmware compiles on hardware for the first time. The per-board pin map split for the Heltec V3 is signed off. Demos D1, D2 and D6 pass on a bench. The regulatory brief goes to counsel | None. This is the entry state |
| 2027 Q1 | 1 to 2 | Demos D3, D4 and D5 pass. Transmit power is capped to the short-range-device ceiling and listen-before-talk is implemented or the bulk traffic moves sub-band. Company incorporated. Android app started. Counsel's first opinion received | Parts landed; counsel engaged |
| 2027 Q2 | 2 | One building, one landlord, thirty days with paying tenants. Backhaul cost measured. The per-unit price decided from the floor formula. Session credit limits tuned from data. A 2-of-3 Safe owns the contracts before any mainnet fiat | KEBS position on mains devices; counsel on transit resale; Jenga live onboarding |
| 2027 Q3 | 3 to 4 | Central Bank position on XKN settled or a partner bank engaged. Beta schematic and layout. Written quotations for the two unpriced silicon lines | Pilot exit met; the price decided |
| 2027 Q4 | 4 | Beta boards fabricated and assembled in a small engineering run. The same six demos re-run on the board | Design-in quotations received |
| 2028 Q1 | 5 | Manufacturing brief quoted, tariff classification settled, first production run ordered | Beta exit met; device certifications in hand |

Two dependencies in that table are worth pulling out because they are the ones most likely to move it. Counsel's first opinion gates three separate rows, and it is also the cheapest item on the roadmap. And the per-unit price decision in 2027 Q2 gates everything after it, because a price that cannot clear measured backhaul cost plus the fiat transaction charges makes the unit economics of every later phase wrong rather than merely uncertain.

## 10. References

1. `HANDOVER.md` section 1, the proof matrix and the headline measured numbers; section 2, the locked decisions including the deferred price; section 3, the invariants; section 4, the open backlog with acceptance criteria.
2. `docs/_plan/revamp-plan.md`, the device lineup, the demo matrix and the parts list the proof-of-concept kit is built from.
3. `docs/ops/regulatory-brief.md`, all eight sections and the fifteen numbered questions for counsel.
4. `docs/ops/critical-accounts/03-budget-and-sustainability.md`, measured gas costs on 2026-09-09, the settlement break-even, wallet runway thresholds and the note that fiat transaction charges dominate chain gas.
5. `docs/papers/01-problem-and-market.md` section 5, the three buyers, and the design suite's urban and rural operator models with their conditions.
6. `docs/potential/02-apartment-estates.md`, the landlord's position, the pilot terms and the six preconditions for a first pilot.
7. `docs/x-koin-beta/00-compact-board-concept.md`, the four populations, the seven proof points, the cost target and the two unpriced silicon lines.
8. `hardware/bom.md`, the field-kit totals, the bench safety items and the Kenya import notes.
9. `hardware/shopping/parts/*.json`, the twelve scouted part listings and prices, recorded 2026-09-12.
10. `protocol/spec.md` section 8, the price floor formula that the pilot's measured backhaul cost feeds.
11. `docs/how-it-works.md` section 5.2, the companion app scope, and section 6, the journeys the pilot must demonstrate.
