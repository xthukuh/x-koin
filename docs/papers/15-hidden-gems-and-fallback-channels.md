# 15. Hidden gems and fallback channels: a graded brainstorm

Abstract: This paper grades seventeen extensions to xKoin that are not in the proof-of-concept plan, on five axes: engineering feasibility, bit rate, cost in Kenyan shillings with a basis, legality in Kenya, and whether the proof-of-concept kit can carry the idea today. The strongest results are cheap and unglamorous. A KES 100 optoisolated zero-crossing detector gives every mains-powered device a common clock and, more usefully, tells the narrowband power-line modem when the mains noise burst is not happening. A signed time beacon over LoRa costs nothing and closes a gap the ticket format already has. A compact settlement ticket is 137 bytes and therefore fits one 140-byte binary SMS, which makes short message service a complete settlement channel rather than a partial one. The weakest results are the ones that sound best: data over a GSM voice channel is defeated by the vocoder and by the existence of general packet radio service on the same SIM, and offline zero-knowledge proofs of balance solve a problem the 96-byte voucher already solves while adding a pairing check to a microcontroller. Twenty-four facts in this paper are marked TODO: verify rather than guessed, and section 11 lists every one with the document or test that closes it.

Keywords: fallback channels, erasure coding, data over voice, short message service, power-line noise, embedded storage, compression, grading

## 1. Scope and how each idea is graded

This paper is a brainstorm held to the same evidence standard as the rest of the set. Every idea below is examined against what the repository already proves rather than against what would be nice, and an idea that loses to something simpler is recorded as losing. Seven of the seventeen graded rows come from the founder's four seed ideas; the other ten are added here.

The grading axes:

| Axis | What it means | How it is decided |
|---|---|---|
| Feasibility | Can it be built with parts that exist and firmware a small team can write | A named part, a named algorithm, or a published result |
| Bit rate | What it actually carries, in the units the medium uses | Computed from the medium models in [03-protocol-xkp.md, section 2](03-protocol-xkp.md#2-mediums), or marked TODO: verify |
| Cost | Kenyan shillings of additional hardware per device, with the basis named | The sourcing records in `hardware/shopping/`, or marked TODO: verify |
| Legality | Whether it is lawful in Kenya as designed, and which instrument governs | [11-regulatory-and-safety.md](11-regulatory-and-safety.md), or a counsel question |
| MVP readiness | Whether the kit in `hardware/shopping/mvp-kit.json` can demonstrate it | The kit contents, checked below |

The five verdicts used in the ranked table in section 10 are: **now** (the kit can demonstrate it and the work is firmware), **pilot** (needs one part the kit does not have, or a building), **later** (sound but the return does not arrive until scale), **check first** (a single question decides whether it is worth any work at all), and **weak** (the physics, the law or a cheaper alternative defeats it).

Two conventions carry through. Every number that has a condition keeps the condition in the same sentence. Where a fact would need a source this repository does not hold, it is written `TODO: verify` with the document that would close it, because a plausible invented figure here would propagate into the roadmap.

## 2. The baseline: what the system already carries

The four mediums in the design are in the table below, with the compact settlement ticket derived in section 3.2 added as a fifth row so the fallback channels in this paper can be compared against the real ladder rather than against an impression of it.

| Rung | Medium | Rate | Frame payload | Present in the kit |
|---|---|---|---|---|
| 1 | HomePlug AV, broadband power line | about 10 Mbps modelled, 9.768 Mbps reached in simulation | 1400 B | Yes |
| 2 | SX1262 in GFSK at 150 kbps | 121.9 kbps goodput measured in scenario S6 | 226 B | Yes |
| 3 | KQ-130F narrowband power line, UART at 9600 baud | about 960 B/s, which is 7.7 kbps | 128 B | Yes |
| 4 | SX1262 LoRa, SF7 BW125 CR4/5 | about 5.4 kbps before the duty-cycle rule | 226 B | Yes |
| 5 | Short message service, 8-bit data coding | 140 B per message | 140 B | No modem in the kit |

The three facts that shape everything in this paper follow from that table.

**The receipt already fits the worst medium.** The 108-byte signed receipt was sized to fit one 128-byte narrowband frame ([03-protocol-xkp.md, section 5](03-protocol-xkp.md#5-the-proof-layer)). The proof layer therefore does not need a new channel; it needs the channels it has to stay alive.

**The receipt is a cumulative counter, so it repairs itself.** Losing four receipts in a row costs the node nothing as long as the fifth arrives, because the fifth contains everything the earlier four said. Any scheme in this paper that offers to make receipt delivery more reliable is offering something the protocol already has, and is graded accordingly.

**The kit has no cellular modem.** `hardware/shopping/mvp-kit.json` contains no GSM, LTE or NB-IoT part, and `docs/_plan/revamp-plan.md` records the Node's backhaul as the existing router or a phone hotspot with the LTE module explicitly deferred. The roadmap's bill-of-materials comparison names the same deferral: USD 207 of modules per gateway, or USD 112 once the deferred LTE module is stripped out ([13-roadmap.md, section 6](13-roadmap.md#6-phase-4-the-beta-compact-board)). Every cellular idea in section 3 is therefore a part purchase before it is an engineering task, and none of them can appear in demos D1 to D6.

## 3. The cellular fallbacks: short message service and voice

The founder's first idea is that a module with a subscriber identity module turns two ordinary consumer services into air-gapped data channels that stay inside lawful use: settlement tickets and device recovery over short message service, and bulk data over the voice channel by audio modem. The two halves grade very differently, and the difference is worth stating before the arithmetic: the short message half is a complete channel, and the voice half is defeated by the vocoder and, more decisively, by the existence of packet data on the same subscriber identity module.

### 3.1 What a settlement ticket costs in bytes

The on-chain ticket is defined in `contracts/src/xKoinEscrow.sol` as

```
Ticket(address client, address nodeAdmin, uint64 sequenceNumber,
       uint128 cumulativeUnits, uint256 epochExpiry)
```

Settled as EIP-712 typed data, that struct is hashed and the client's secp256k1 signature is recovered against it. The struct as declared occupies 20 + 20 + 8 + 16 + 32 bytes when each field is carried at its declared width. But the wire form does not have to be the storage form: `epochExpiry` is a Unix second and fits a uint64, which brings the canonical compact ticket to 72 bytes, and a secp256k1 signature in the 65-byte r-s-v form brings the complete self-contained settlement message to **137 bytes**. The relayer reconstructs the full EIP-712 struct from those 137 bytes before calling `settleTicketBatch`, so nothing about the contract changes.

137 bytes is the number that decides the cellular question, and it lands just under a threshold that matters.

### 3.2 Settlement tickets over short message service

A short message in 8-bit data coding carries 140 octets of user data. A compact ticket is 137 bytes. **One ticket fits one short message with three bytes to spare**, and the fit is not a coincidence in the way the 108-byte receipt fitting a 128-byte narrowband frame is a coincidence; it is luck, and it is three bytes of luck, so any future field added to the ticket breaks it.

Two conditions sit on that result.

The first is that the end-to-end path must pass 8-bit binary short messages unaltered. Networks and aggregators sometimes transcode, and a gateway that insists on text will mangle binary payloads. The fallback is base64 in the GSM 7-bit alphabet: 137 bytes becomes 184 characters, which is two concatenated messages at 153 septets per part, so the safe transport costs twice the unsafe one. TODO: verify that Safaricom and Airtel pass 8-bit data-coding-scheme short messages end to end to an ordinary subscriber number.

The second is cost. TODO: verify the current retail price of one short message on Safaricom and on Airtel Kenya, on-net and off-net, from the operators' own tariff pages. Without that number the channel cannot be compared against anything, which is why it is not estimated here. What can be said without it: a ticket is settled once per client per session, not once per receipt, so the message volume is sessions rather than bytes, and a Node serving ten tenants in an apartment block generates on the order of tens of settlement messages a day rather than thousands.

**Where this is genuinely strong.** A Node that has lost backhaul entirely has delivered bytes it cannot collect for. The receipts are safe in flash. But the receipts are worth nothing until a ticket reaches the chain, and short message service is the only channel in this paper that works with no data bundle, no Wi-Fi, no internet protocol stack and no counterparty other than the mobile network. It is the channel of last resort for the one thing that cannot be deferred indefinitely, which is the operator getting paid.

**Where it is dangerous.** A rack of Nodes, each with a subscriber identity module, sending machine-generated messages at volume to one gateway number is application-to-person traffic arriving on person-to-person subscriptions, and it has the exact traffic signature of a subscriber-identity-module box. SIM boxing is prosecuted in Kenya and operators run detection against precisely this pattern. The lawful shape is an aggregator arrangement or a short code taken out with the operator, which is a licensed commercial relationship rather than a firmware decision. TODO: verify which Communications Authority licence category covers inbound application-to-person short messaging for a private network operator, and whether an aggregator agreement with each mobile network operator is required before the first message. This is counsel question material and it belongs in `docs/ops/regulatory-brief.md`.

**Legality of the ordinary case.** One device, one subscriber identity module, sending its own data to a number its owner controls, is ordinary subscriber use and is what the service is for. The problem above is volume and shape, not purpose. TODO: verify the Communications Authority position on machine-to-machine short messaging on consumer subscriptions.

Grade: **pilot**. Feasibility high, bit rate exactly sufficient, cost dominated by a part that is not in the kit, legality clear for one device and open for a fleet.

### 3.3 Device recovery commands over short message service

The same modem carries the reverse direction: a signed command to a Node that has become unreachable. Reboot, drop to a known-good firmware slot, report the last settled sequence number, re-open the free plane.

This is the cheaper half of the cellular idea and it has no bit-rate problem at all. A command is a verb, a monotonic counter and a signature: 1 byte, 8 bytes and 64 bytes for Ed25519, which is 73 bytes, comfortably one message. The command key is the kiosk root key that is already compiled into node firmware ([00-START-HERE.md, section 3](00-START-HERE.md#3-glossary)), so no new trust relationship is created.

Two rules make it safe and both are non-negotiable. The counter must be strictly monotonic per device, or an old reboot command becomes a replayable denial of service against a node that carried the operator's revenue. And the command set must contain nothing that can move value: recovery commands may restart, roll back and report, and may not settle, mint, sign a receipt or change a `nodeAdmin` address. A remote command channel that can reach the money is a remote command channel an attacker wants, and Law 6 stops the loss at the deposit but does not stop the disruption.

Grade: **pilot**, same part dependency as 3.2, and the cheapest real use of the modem once it exists.

### 3.4 Data over the voice channel

The founder's proposal is to encode, transmit, receive and decode data through an ordinary voice call. The examination below is the reason this idea is graded weak, and it fails on three separate grounds, any one of which is sufficient.

**The vocoder.** A GSM voice channel does not carry audio. It carries the parameters of a model of the human vocal tract, reconstructed at the far end. The adaptive multi-rate narrowband codec runs at 4.75 to 12.2 kbit/s and enhanced full rate at 12.2 kbit/s, and both are code-excited linear prediction coders tuned to speech. A generic voiceband modem waveform of the V.32 or V.34 kind is quadrature amplitude modulation on a carrier, which is exactly what a vocoder is built to discard, so those modems do not survive the channel at any rate. Anything that works has to be built out of things the vocoder preserves, which means speech-like signalling rather than data-like signalling.

**The published rates.** Systems built the right way do work, and they work slowly. The literature on data over the cellular voice channel reports figures in the region of 1.2 kbit/s with forward error correction, with individual results above and below that depending on codec, network and coding scheme. TODO: verify each of the following against the primary papers: the Hermes system's reported throughput over a GSM voice channel; the rate achieved by Codec2-style vocoder-matched signalling; and the general range reported in the data-over-voice literature. None of these has been retrieved for this repository and the 1.2 kbit/s figure is carried as a named claim, not a measured one.

**The arithmetic, taken at face value.** At 1.2 kbit/s, a 137-byte ticket is 1,096 bits and needs 0.91 seconds of established call. Call setup on a GSM network takes several seconds. TODO: verify typical call setup time on Safaricom and Airtel. So a single ticket over voice is dominated entirely by setup, and the channel only makes sense batched: a 60-second call at 1.2 kbit/s carries about 9,000 bytes, which is about 65 compact tickets. TODO: verify the current per-minute voice tariff in Kenya, on-net and off-net. If a minute costs KES 4 and a message costs KES 1, then voice carries 65 tickets for KES 4 and short message service carries one ticket for KES 1, which is a 16-fold advantage to voice, conditional on both tariffs and on the modem working at all.

**The ground that actually settles it.** A subscriber identity module that can place a voice call can, in almost every real Kenyan cell, also open a general packet radio service or enhanced data rates for GSM evolution session, which gives tens of kilobits per second of ordinary internet protocol at a fraction of the engineering. The voice modem is therefore only reachable in the narrow case where voice works and packet data does not: an operator that has retired second generation data but kept voice, a congested cell that admits circuit-switched calls and refuses packet contexts, or a subscription with airtime and no data bundle where out-of-bundle rates are punitive. TODO: verify the status of Safaricom and Airtel second and third generation network retirement in Kenya. That case is real but it is thin, and the engineering cost is a vocoder-matched modem, which is a research project rather than a sprint.

Grade: **weak**. The right decision is to specify the ticket wire format so that it could ride such a channel, which section 3.1 already does by making it 137 self-contained bytes, and to build nothing.

## 4. Erasure coding and cross-medium striping

The founder's second idea is to duplicate packets across mediums and repair the result at the receiver. The name for the general technique is erasure coding, and the correct form of it here is a fountain code.

### 4.1 What the codes are, in one paragraph each

**Reed-Solomon** is a fixed-rate block code over a finite field. Take k source symbols, produce n encoded symbols, recover the original from any k of them. Over GF(256) the block is limited to 255 symbols, which suits a frame-sized unit and does not suit a megabyte. It is the oldest and the most predictable, and its encoder is cheap enough for a microcontroller.

**LT codes** (Luby, 2002) are the first practical fountain code: the encoder produces an unbounded stream of encoded symbols, each the exclusive-or of a random subset of source symbols chosen by a degree distribution, and the decoder recovers the k source symbols from slightly more than k received symbols, whichever ones arrive. There is no rate to choose in advance, which is the property that matters on a channel whose loss rate is unknown.

**RaptorQ** (RFC 6330) is the standardised production fountain code. Its published decode failure probability is about 10^-2 with zero overhead symbols, about 10^-4 with one, and about 10^-6 with two, for any k in its supported range. TODO: verify those three figures against RFC 6330 section 1 directly; they are carried here from the specification's summary and the document has not been retrieved for this repository. If they hold, the practical reading is that two spare symbols buy near-certain recovery regardless of which symbols were lost.

### 4.2 Sized for the real frames

For a 12 KB class A distilled page delivered over LoRa ([03-protocol-xkp.md, section 7](03-protocol-xkp.md#7-wan-service-classes-over-lora)), the natural symbol is one 226-byte LoRa payload minus the 29 bytes of XKP overhead, so 197 bytes of source data per symbol and k = 63 symbols. Two repair symbols is 3.2 percent overhead. For the narrowband plane, the symbol is 128 minus 29 = 99 bytes, so the same page is k = 125 symbols, and two repair symbols is 1.6 percent overhead.

Compare that against plain retransmission on the same link. One 226-byte LoRa frame at SF7 BW125 CR4/5 occupies 358.6 ms of air, computed from the Semtech airtime formula with an 8-symbol preamble, explicit header and low-data-rate optimisation off. A lost frame under automatic repeat request costs the round trip to discover the loss plus a full 358.6 ms retransmission, and the round trip is itself two frame airtimes plus processing. Under the duty-cycle rule the cost is worse than the airtime suggests: at 1 percent, one 358.6 ms frame obliges 35.5 seconds of silence before the next one, so a retransmission is not 0.36 seconds late, it is 36 seconds late.

**The gain, stated precisely.** At a 10 percent frame loss rate and k = 63, plain retransmission delivers the page in an expected 70 transmissions and at least one extra round trip, with a variable tail that the duty-cycle scheduler cannot plan for. Fountain coding at 8 repair symbols delivers 71 transmissions with no round trip and no tail, and the probability that fewer than 63 of 71 arrive at p = 0.1 is small enough to ignore against the 10^-6 figure above. The saving is not in bytes; the two are within two percent of each other. **The saving is in round trips and in scheduling determinism**, and on a duty-cycle-limited band determinism is the scarce resource, because a fixed 12 percent overhead can be booked into an airtime budget and a retransmission tail cannot.

### 4.3 Where it does not pay

Two honest limits.

The proof layer gains nothing. Receipts are cumulative, so the fifth receipt repairs the loss of the first four at zero cost. Adding a fountain code to the receipt path would add encoder state to a microcontroller in exchange for a property the counter design already provides.

Cross-medium striping is for control, not bulk. Striping k data symbols across HomePlug and the repair symbols across LoRa sounds attractive until the rates are compared: 10 Mbps against 5.4 kbps is a ratio of about 1,850 to 1, so the survival plane can carry repair symbols for roughly one two-thousandth of the bulk plane's traffic. Striping is worth doing for the things that must survive a plane going dark, which are control frames, firmware images and class A pages, and it is not a way to make the bulk plane outage-proof.

The strongest single use is firmware distribution. A 1 MB image at SF7's 5.4 kbps is 1,480 seconds of air at full duty and about 41 hours at 1 percent. Broadcasting a fountain-coded stream to many Satellites at once, with each one decoding as soon as it has collected enough symbols and none of them sending an acknowledgement, is the use case RaptorQ was standardised for, and it is the difference between a firmware update that is possible over the survival plane and one that is not.

Grade: **pilot** for firmware broadcast and class A pages, **weak** for receipts, **later** for cross-medium striping of bulk traffic.

## 5. Using the chip: flash journals, PSRAM and power-loss safety

The founder's third idea is to use the ESP32-S3's own memory harder. The board in the kit is an ESP32-S3-DevKitC-1 N16R8: 16 MB of quad SPI flash and 8 MB of octal SPI pseudo-static random access memory.

### 5.1 What actually needs to survive a power cut

The protocol paper is specific that the node stores one receipt per client and not a log ([03-protocol-xkp.md, section 5](03-protocol-xkp.md#5-the-proof-layer)), and that this is deliberate: there is no receipt history to protect, corrupt or subpoena at the edge. A receipt journal is therefore a change to the design rather than an optimisation of it, and it should be argued for on its own terms if it is wanted.

Two things do need to survive a power cut, and they are small.

The per-client cumulative counters, because a node that forgets them after an outage re-serves bytes it has already been owed for and cannot prove the earlier ones. At 8 bytes of counter, 8 bytes of client id and a sequence number, a few dozen clients is under a kilobyte.

The queue of tickets that have been formed and not yet relayed, because those are the operator's unpaid invoices. At 137 bytes each, a thousand queued tickets is 137 KB.

Both fit in a couple of flash sectors, which changes the engineering question from storage to atomicity.

### 5.2 Endurance is not the limit; atomicity is

Serial NOR flash of the class used on the DevKitC is typically specified at 100,000 erase cycles per sector and 20 years of retention. TODO: verify against the datasheet of the exact flash part on the board in hand, which varies by batch between GigaDevice and Winbond devices; the board silkscreen does not say and the part must be read off the package or queried over the SPI JEDEC identifier.

Taking 100,000 cycles at face value: a 4 KB sector holds 29 compact tickets, and an append-only log erases the sector once per 29 appends. Across the 16 MB device that is 4,096 sectors, and ESP-IDF's wear-levelling layer spreads writes across them. The resulting append budget is on the order of 10^10 writes, which no node in this system will approach. Flash endurance is not a constraint at xKoin's write rates and should not be treated as one.

What does bite is losing power in the middle of a write. The standard answer is cheaper than a journal: two slots, ping-pong between them, each carrying a monotonic sequence number and a CRC, and on boot take the slot with the higher sequence number that passes its CRC. A write that is interrupted corrupts the slot being written, the other slot is intact and one generation old, and one generation old is exactly what a cumulative counter tolerates. This is a write-ahead log in the sense that matters and it costs two sectors and about eighty lines of C.

### 5.3 PSRAM

8 MB of octal PSRAM is a large buffer by microcontroller standards and a small one by the standards of a 10 Mbps link. At 1400-byte HomePlug frames and 10 Mbps, the bulk plane moves about 893 frames per second, so a 1 MB ring buffer holds about 1.1 seconds of traffic at full rate. That is the right size for the job it should be given, which is absorbing a backhaul stutter without dropping a session, and it is the wrong size for store-and-forward of bulk data, which needs the flash or nothing.

One caution worth recording because it is easy to design around too late: PSRAM on the ESP32-S3 sits behind the external memory cache, so access is materially slower than internal static random-access memory and a cache miss in an interrupt handler is a latency spike. Frame buffers in PSRAM, hot path state in internal SRAM.

Grade: **now** for the two-slot power-loss-safe counter and ticket queue, which is firmware only, costs nothing, and removes a real failure mode from demo D4. **Later** for a receipt journal, which is a design change with a privacy cost.

## 6. Compression: what compresses and what cannot

The founder's fourth idea is high compression. The examination turns on a single distinction that decides most of it.

### 6.1 The incompressible fraction

An Ed25519 signature is 64 bytes and a secp256k1 signature is 65, and both are indistinguishable from random to any compressor. In a 108-byte receipt, 64 bytes are signature. In a 137-byte compact ticket, 65 bytes are signature. **The best possible general-purpose compressor saves nothing on 59 percent of a receipt and 47 percent of a ticket.** Encrypted payloads have the same property for the same reason. Any claimed compression ratio on xKoin control traffic that ignores this is wrong.

### 6.2 What the compressible fraction actually wants

The other 44 bytes of a receipt are `client_id`, `node_id`, `session_nonce`, `cumulative_bytes` and `seq`. Within one session the first three are constant and both endpoints already know them: 8 + 8 + 16 = 32 bytes of the 44 are information the receiver has. Sending a session-scoped 2-byte handle in their place leaves 14 bytes of changing data, so the receipt on the wire falls from 108 bytes to about
78. That is a 28 percent saving on the whole receipt and it is delta coding against session state, not compression.

This generalises: for small structured messages on a channel where both sides hold session context, delta coding beats every general-purpose codec, because the redundancy is between the message and the state rather than inside the message. A 128-byte narrowband frame has no history for a compressor to reference.

The real prize in this area is signature aggregation rather than compression: if many receipts could be settled under one signature, the incompressible fraction would collapse. Ed25519 supports batch verification, which is a speed property, and not aggregation, which is a size property. A BLS scheme aggregates but changes the curve, the verification cost and the on-chain verifier, so it is a phase 4 question at the earliest. Recording it here so it is not rediscovered.

### 6.3 Candidate codecs where compression does apply

Compression does earn its place on telemetry batches, class A page text and log bundles, which are redundant and sizeable.

| Codec | Footprint on the ESP32-S3 | Fit |
|---|---|---|
| heatshrink | A few hundred bytes of state at a small window, no dynamic allocation | The Satellite and anything memory-starved; designed for exactly this |
| LZ4 | Compression wants a hash table of about 16 KB; decompression needs no state | The Node, where PSRAM makes the table free; fast enough to sit in the data path |
| zstd with a trained dictionary | Tens of KB for decode, more for encode, affordable on a Node with 8 MB PSRAM and not on a Satellite | The highest ratio on small structured messages, because the dictionary supplies the history a 128-byte message lacks |

The architecture already uses the dictionary technique on the server side: the cloud proxy's class A path reduces a 2.5 MB page to about 12 KB by text extraction plus shared-dictionary zstd, and that paper states the condition loudly, which is that the ratio holds for text-dominated pages and not for arbitrary bytes ([03-protocol-xkp.md, section 7](03-protocol-xkp.md#7-wan-service-classes-over-lora)). Extending the same trained dictionary down to the node is the increment this idea is really proposing.

Expected ratios: TODO: verify by training a zstd dictionary on a captured corpus of XKP telemetry and class A payloads and measuring all three codecs against it. The figure worth predicting rather than measuring is the shape: on messages of a few hundred bytes, a plain codec typically achieves close to 1.0 and a dictionary-trained one can achieve several times that, and the gap between them is larger than the gap between any two codecs. The measurement is one afternoon and it should be done before any codec is chosen.

Grade: **now** for delta coding of receipts against session state, which is firmware only and worth 28 percent of the receipt. **Pilot** for a trained dictionary on telemetry and class A. **Weak** for general-purpose compression of signed or encrypted traffic, which cannot work.

## 7. Moving devices, shared clocks and sealed enclosures

### 7.1 Opportunistic store-and-forward by moving devices

Matatus and boda riders pass Nodes all day. Fitting a Satellite to a vehicle turns it into a data mule that collects tickets and telemetry at one stop and delivers them at another.

The physics decides how good this is, and the duty-cycle rule decides it harshly. Take a 300 m LoRa radius in a built-up area, so a 600 m chord, and a vehicle at 40 km/h, which is 11.1 m/s: the contact window is 54 seconds. At 1 percent duty that is 540 ms of permitted air, which is one 226-byte frame at 358.6 ms and no second frame. **A matatu passing a Node at speed carries exactly one settlement ticket per pass.** Without the duty-cycle rule, meaning with listen-before-talk and adaptive frequency agility implemented as option 2 in [11-regulatory-and-safety.md, section 2](11-regulatory-and-safety.md#2-radio-868-mhz-lora-and-gfsk), the same 54 seconds at 5.4 kbps carries about 36 KB, and on the GFSK plane at the measured 121.9 kbps it carries about 820 KB, conditional on a link strong enough for GFSK, which at vehicle distances is not the way to bet.

The version that works is the stage, not the road. A matatu standing at a stage for three minutes on Wi-Fi moves hundreds of megabytes, and the transport case is already worked through in `docs/potential/08-transport-and-matatu-stages.md`.

**The gem inside this idea is a security property rather than a bit rate.** A mule carries tickets it cannot forge, cannot inflate and cannot profit from replaying: Law 4 makes a forged counter a broken signature, Law 5 makes a replayed ticket pay a delta of zero, and Law 6 caps everything at the deposit. Sneakernet is therefore trustless by construction in this system, with no new mechanism at all. That is worth writing down because it means the mule can be a stranger.

Cost: one Satellite per vehicle. TODO: verify the per-Satellite build cost against `hardware/shopping/mvp-kit.json` and the Satellite bill of materials in [07-hardware-satellite.md](07-hardware-satellite.md).

Grade: **later** for moving vehicles, **pilot** for stages, and the trustlessness finding applies now and costs nothing.

### 7.2 Signed time beacons over LoRa

The ticket carries `epochExpiry` and the voucher expires in 24 hours, so both depend on a node knowing what time it is. A node with backhaul gets that from network time protocol. A node without backhaul is running on an internal oscillator and drifting.

The mechanism is small: a node that has time broadcasts a beacon carrying the current second, signed with the kiosk root key whose public half is already compiled into node firmware. Accuracy is limited by airtime and processing, so tens of milliseconds, against a requirement measured in hours. The margin is six orders of magnitude, which means the design can be lazy and still correct.

One attack must be closed or the mechanism is worse than no mechanism: a signed beacon replayed later rolls a node's clock backwards and revives expired vouchers. The fix is that the beacon carries a monotonic counter and a node refuses any beacon whose counter is not greater than the last one it accepted, which makes replay inert in the same way Law 5 makes ticket replay inert.

Cost: zero hardware, one frame type, and it uses a key that already exists.

Grade: **now**. This is the cheapest item in the paper that closes a real gap.

### 7.3 Acoustic or light coupling for a sealed kiosk

A kiosk with no aperture cannot be tampered with through an aperture. The question is what talks through a sealed window.

**Near-field communication first**, and it should be said plainly because the exotic options are more interesting and worse. NFC at 13.56 MHz runs at 106 to 424 kbit/s, is standardised, is present on every mid-range Android, and a PN532 module costs very little. TODO: verify the Nairobi retail price of a PN532 module. It works through a plastic window. Unless there is a reason NFC cannot be used, the rest of this subsection is unnecessary.

**QR codes are the surprising runner-up.** A version 40 code in binary mode at low error correction carries 2,953 bytes, and a 137-byte ticket fits a much smaller version comfortably. TODO: verify the minimum QR version that holds 137 bytes at medium error correction. A camera behind the kiosk window reading a code on the customer's phone screen, and a display in the window read by the customer's camera, gives a bidirectional sealed channel at hundreds of bytes per exchange with no radio, no licence and no new protocol. TODO: verify the retail price of an OV2640 camera module, which the ESP32-S3 can drive directly.

**Acoustic** coupling through a sealed window works at roughly 300 to 1,200 bit/s with chirp-style signalling, needs only a speaker and a microphone, and is the right answer only where an optical path is impossible. It is slow, it is audible, and a noisy market is its worst case.

**Light** coupling by the phone torch to a photodiode is a few hundred bit/s; screen-to-camera reaches kilobits, which is the QR case above done continuously.

Grade: **now** for QR, if a camera is added, at a cost of one camera module. **Pilot** for NFC. **Weak** for acoustic, which loses to both on every axis except the case where the enclosure must be opaque.

### 7.4 Satellite internet-of-things as a settlement channel

If the only thing that truly must escape a disconnected site is a ticket, a satellite internet-of-things link is the channel that works with no terrestrial infrastructure at all.

**Swarm is not the answer and should not be designed for.** Swarm Technologies was acquired by SpaceX and its modem sales and service were subsequently wound down. TODO: verify the current status of Swarm hardware availability and service continuity from SpaceX's own announcements before any further consideration. This is recorded because Swarm's USD 5 per month and USD 119 modem made it the obvious candidate and the obvious candidate has moved.

**Lacuna Space is the one to check, because the radio is already in the design.** Lacuna operates LoRa-based satellites receiving at 868 MHz, which means an SX1262 that is already in the bill of materials for every Node and Satellite is in principle the transmitter. If that holds, the marginal hardware cost of a satellite settlement channel is zero and the cost is entirely service and licensing. TODO: verify Lacuna Space's service availability over Kenya, its per-message pricing, the antenna and power requirements against the SX1262 configuration in `firmware/xkoin-gateway/lib/sx1262/`, and whether transmitting to a satellite from Kenya falls outside the short-range-device exemption in [11-regulatory-and-safety.md, section 2](11-regulatory-and-safety.md#2-radio-868-mhz-lora-and-gfsk), which is the question that could kill it regardless of the technology.

**Iridium Short Burst Data** is the expensive certainty: 340 bytes per mobile-originated message, which carries two compact tickets, global coverage, and a per-message charge plus a monthly line rental. TODO: verify current Iridium Short Burst Data pricing and the Kenyan licensing position for an Iridium transceiver.

Grade: **check first**. One question about Lacuna decides whether this is free or impossible, and asking it costs an email.

### 7.5 Mains frequency as a shared clock and a noise schedule

Every device on the same synchronous grid sees the same zero crossings. An optoisolated zero-crossing detector on the mains gives a Node a 100 Hz tick that every other mains-powered Node in the country shares, for the price of two resistors and an optocoupler. TODO: verify the Nairobi retail price of a PC817 or equivalent optocoupler and the passives, which is expected to be under KES 100.

As a clock it is mediocre and honest about it: grid frequency wanders by tens of millihertz over minutes, and whether the accumulated time error is corrected depends on the operator's practice. TODO: verify whether Kenya Power operates time-error correction on the interconnected grid. Section 7.2's signed LoRa beacon is a better clock and costs less.

**The real value is not timekeeping.** Impulsive noise on a mains circuit is synchronous with the supply: switching-mode power supplies, dimmers and rectifiers all draw in bursts locked to the 50 Hz waveform, producing noise at 100 Hz. The KQ-130F works at 120 to 135 kHz, right where that noise lives. A transmitter that knows the phase can schedule its frames into the quiet window between bursts instead of transmitting blind into them. For the slowest and most important medium in the system, the one that carries receipts when nothing else is alive, this is the single cheapest available reliability improvement.

The safety condition is absolute and governed by [11-regulatory-and-safety.md, section 6](11-regulatory-and-safety.md#6-electrical-safety): anything that senses mains crosses the isolation barrier, so the detector must be optoisolated with the creepage and clearance that section requires, and it must not be built on a breadboard.

Grade: **now**, conditional on the safety build. TODO: verify the improvement by measurement: log narrowband frame error rate against mains phase over an hour on a real circuit, which is the experiment that settles whether the effect is worth the component.

### 7.6 Wi-Fi HaLow

802.11ah gives sub-gigahertz Wi-Fi at 150 kbit/s to tens of megabits with kilometre-class range and a real internet protocol stack, from parts that exist: the Newracom NRC7292 and the Morse Micro MM6108. On the engineering axis it would replace both LoRa and, in some buildings, HomePlug.

The blocker is spectrum, not silicon. HaLow needs a sub-gigahertz allocation wide enough for its channels. The Communications Authority's short-range-device table gives 868.0 to 868.6 MHz at 25 mW with a 1 percent duty cycle, and 869.4 to 869.65 MHz at 500 mW with 10 percent, neither of which supports a HaLow access point serving a building. The United States 902 to 928 MHz plan that HaLow was designed around does not apply in Kenya. TODO: verify whether the Communications Authority has made any 802.11ah-specific allocation, and what applies in 915 to 928 MHz in Kenya. TODO: verify the low-quantity price of an MM6108 or NRC7292 module.

Grade: **check first**, and it is one counsel question rather than an engineering effort. If the band exists, this changes the architecture; if it does not, it is dead and no work should be spent discovering that slowly.

### 7.7 Grid-outage sensing as a public good

A Node is mains-powered, holds a battery, and knows the second the mains failed at its own address. A hundred Nodes across a suburb produce a live outage map at zero marginal cost, because the hardware and the connectivity already exist for another reason.

This rides the free LAN plane, costs no XKN, is telemetry class C, and strengthens demo D4 by giving the last-network-standing story an output that a non-technical observer immediately understands. It is also the most persuasive thing the system could offer a landlord, a county government or Kenya Power in exchange for goodwill it currently has no way to buy.

Two cautions, and neither is technical. A live map of which buildings have no power and no lights is a burglary map, so the public form must aggregate to the transformer or the estate and never to the meter. And publishing operational information about a utility invites a conversation with that utility, which is better had before publication than after. TODO: verify with counsel whether publishing aggregated outage observations engages any obligation under the Energy Act or the Data Protection Act 2019.

Cost: zero hardware, firmware only.

Grade: **now** as a demo output, **later** as anything public.

### 7.8 Offline zero-knowledge proofs of balance

The problem this is meant to solve is real: a node that cannot reach gateway-api cannot read a client's deposit, so it serves against the voucher alone up to an offline cap, recommended at KES 5 in [13-roadmap.md, section 4](13-roadmap.md#4-phase-2-the-pilot-one-building). A proof that "my escrow balance is at least X", verifiable offline, would raise that cap.

Zero-knowledge machinery does not provide it, and the reason is worth stating because the idea is attractive.

A succinct proof proves a statement about a state root at a block height. It does not prove that the block height is current. An offline node cannot know the current block, so a proof of balance at block N is exactly as stale as a voucher signed at block N. **The missing property is freshness, and a proof system does not supply freshness.** Meanwhile the voucher is 96 bytes and verifies with one Ed25519 check in well under a millisecond, whereas a Groth16 proof is 128 to 192 bytes and needs a pairing over a curve like BN254. TODO: verify a BN254 pairing benchmark on an ESP32-S3; the expectation is hundreds of milliseconds to seconds, which on the admission path is the difference between a working kiosk and a queue.

Where the technique would earn its cost is privacy of amounts rather than freshness: a range proof would let a client prove sufficiency without revealing the balance to the node. A Bulletproofs range proof is on the order of 700 bytes with verification in the hundreds of milliseconds on a microcontroller. TODO: verify both figures. That is a defensible feature and it is not an MVP feature.

Grade: **weak** for the stated purpose, and the honest summary is that the voucher already is the offline proof of balance.

### 7.9 Identity attestation as a product in itself

The dead-internet thesis says that the scarce thing online is evidence that a counterparty cost something to create. xKoin generates exactly that evidence as a byproduct, and it is worth being precise about what it does and does not prove.

**What a signed xKoin history can prove.** That the holder of a key obtained a voucher, which is minted only against a confirmed fiat receipt, so real shillings passed through a named custodian. That the key consumed metered bytes through a particular node, which has a physical location, at a particular time, with the node's signature on the other side of the receipt. That the same key has been doing so for a period. Every one of those facts is non-replayable, costs money to manufacture and cannot be produced at scale without producing the money at scale.

**What it cannot prove, and this is the part that must never be blurred.** Who the person is. That one human holds one key. That the key was not sold, rented or farmed. That the entity behind the key is human at all rather than a script with a funded wallet. It is proof of cost and proof of metered presence. It is not proof of personhood.

That distinction sets the honest product: a relying party can require an attestation of metered presence instead of a phone number, and thereby set a price floor on a Sybil attack denominated in shillings and tunable by the relying party. Compare the alternatives on the axis that matters, which is what they cost an attacker: a phone number costs a SIM, and Kenya's mandatory SIM registration raises that cost but SIM farms exist regardless (TODO: verify the current enforcement position on SIM registration in Kenya); a biometric proof of personhood scheme buys a much stronger property at a much heavier privacy cost and a hardware network xKoin does not have.

Legality is the reason to design this carefully now even though the product is later. An attestation about a key is a statement about a key. An attestation linked to a national identity number is personal data processing under the Data Protection Act 2019, with a registration obligation and a lawful-basis question attached. TODO: verify with counsel where the line sits and whether an attestation tied to a payment record already counts as personal data by virtue of the payment record.

The recommendation is narrow: reserve the frame type and fix the attestation format now, because it costs nothing and cannot be retrofitted cheaply, and build no product until a relying party asks for one.

Grade: **later** as a product, **now** for reserving the format.

### 7.10 Public disaster mode

The free LAN plane already costs zero XKN. Disaster mode opens the paid plane for a declared emergency, for a bounded time.

The mechanism is easy and the governance is the whole problem, because a remote switch that opens the paid plane is a remote switch that destroys an operator's revenue, and therefore a target. The design that survives that observation does three things.

The declaration is a signed message from a named authority key, ideally a threshold of the kiosk root key holders rather than one key, so that one compromised holder cannot declare an emergency.

The declaration carries an expiry and nodes refuse to honour one past a firmware ceiling, so a stuck or captured declaration ends by itself.

And, most importantly, **metering does not stop**. Nodes keep signing receipts and tag them as relief traffic. The user is not charged, and the operator's tickets still exist and can be reimbursed from the treasury under a policy decided in advance. This is a much better design than switching the meter off, because it preserves the accounting, it produces a record of what relief was actually delivered, and it gives the operator a reason not to resist it.

Cost: firmware plus a treasury policy. Legality: nothing prohibits a private network from serving people for free during an emergency. The care needed is in what is said about it in public, because a published commitment to a disaster mode is a service promise, and this repository is deliberately careful not to make service offers before the questions in [11-regulatory-and-safety.md](11-regulatory-and-safety.md) are answered.

Grade: **now** for the signed flag and the relief receipt tag, **later** for the treasury reimbursement policy, which needs a number that does not exist yet.

## 8. What this changes about the roadmap

Nothing in this paper displaces a phase in [13-roadmap.md](13-roadmap.md). Four items are firmware-only and cost nothing, so they belong inside phase 1 rather than after it: the two-slot power-loss-safe counter (section 5.2), the signed time beacon (section 7.2), receipt delta coding (section 6.2), and the relief receipt tag (section 7.10). One item is a component purchase of under KES 100 that should ride the next order because it improves the medium the whole proof layer depends on: the optoisolated zero-crossing detector (section 7.5).

Two items are single questions that should be asked before any engineering: Lacuna's coverage and licensing position over Kenya (section 7.4), and whether any sub-gigahertz allocation in Kenya supports 802.11ah (section 7.6). Both belong in `docs/ops/regulatory-brief.md` alongside the existing fifteen.

Everything else waits for the pilot or for scale, and the voice modem and the offline proof system should wait indefinitely.

## 9. The one experiment that settles each idea

An idea that cannot be settled by a bounded experiment is an opinion. Each row of the table in section 10 names one, and the five that could be run on the existing bench in an afternoon each are listed here because they are the cheapest evidence available anywhere in this set: log narrowband frame error rate against mains phase for one hour on a real circuit; train a zstd dictionary on a captured XKP corpus and measure three codecs against it; measure a BN254 pairing on an ESP32-S3; read the flash part number off the DevKitC and look up its endurance; and send one 137-byte binary short message between two Kenyan handsets to see whether it arrives unaltered.

## 10. Ranked table

Ranked by value returned per shilling and per week of work, best first. Cost is additional hardware per device over the existing design, and every cost with a basis this repository does not hold is marked rather than estimated.

| # | Idea | Verdict | Cost, KES, with basis | Bit rate | Legality in Kenya | Section | The one experiment that settles it |
|---|---|---|---|---|---|---|---|
| 1 | Mains zero-crossing detector for narrowband noise scheduling | now | under 100; basis is one optocoupler and two passives, TODO: verify at a Nairobi vendor | Improves the 960 B/s narrowband plane rather than adding one | Clear; mains isolation governed by paper 11 section 6 | 7.5 | Log narrowband frame error rate against mains phase for one hour on a real circuit |
| 2 | Signed time beacon over LoRa with a monotonic counter | now | 0; uses the kiosk root key and the SX1262 already present | One frame per beacon interval | Clear; inside existing radio use | 7.2 | Free-run two nodes for 24 hours, measure drift, then beacon one and re-measure |
| 3 | Two-slot power-loss-safe counter and ticket queue in flash | now | 0; firmware only | Not applicable | Clear | 5.2 | Cut power 500 times mid-write and assert no counter regression |
| 4 | Receipt delta coding against session state | now | 0; firmware only | 108 B falls to about 78 B, a 28 percent saving | Clear | 6.2 | Byte-count a scenario S1 run before and after |
| 5 | Relief receipt tag and signed disaster declaration | now | 0; firmware plus a treasury policy later | Not applicable | Clear; do not publish it as a service promise | 7.10 | Declare, expire, and assert the ceiling holds and the tickets still form |
| 6 | QR code as the sealed-kiosk channel | now, if a camera is added | one OV2640 camera module, TODO: verify Nairobi price | 137 B ticket per code, hundreds of bytes per exchange | Clear; no radio | 7.3 | Read a 137-byte binary QR off a phone screen through the intended window material |
| 7 | Grid-outage sensing on the free plane | now as a demo | 0; firmware only | Telemetry class C | Clear privately; TODO: verify counsel position on publishing | 7.7 | Cut a breaker and time the map update across three nodes |
| 8 | Settlement tickets over binary short message service | pilot | a GSM or LTE module, not in the kit, TODO: verify Nairobi price of a SIM800L and an A7670 | Exactly one 137-byte ticket per 140-byte message | Ordinary for one device; TODO: verify the licence category for fleet application-to-person traffic, and note the SIM-box detection risk | 3.2 | Send one 137-byte binary message between two Kenyan handsets and check it arrives unaltered |
| 9 | Signed device recovery commands over short message service | pilot | shares the module in row 8 | 73 B per command, one message | Same as row 8 | 3.3 | Brick a node's backhaul and recover it by message, then replay the same message and assert it is refused |
| 10 | Trained zstd dictionary for telemetry and class A | pilot | 0; PSRAM on the Node already pays for it | TODO: verify by measurement; the shape is that the dictionary matters more than the codec | Clear | 6.3 | Train on a captured corpus and measure heatshrink, LZ4 and dictionary zstd against it |
| 11 | RaptorQ firmware broadcast and class A pages over LoRa | pilot | 0; firmware only | Same bytes as retransmission, no round trips, deterministic airtime | Clear | 4.2, 4.3 | Broadcast a 1 MB image to three Satellites at 10 percent induced loss with no acknowledgements |
| 12 | Trustless sneakernet, vehicles as mules | later for moving, pilot at stages | one Satellite per vehicle, TODO: verify the Satellite build cost | One 226 B frame per pass at 1 percent duty; hundreds of megabytes at a stage on Wi-Fi | Clear; the mule needs no trust by Laws 4, 5 and 6 | 7.1 | Drive a Satellite past a Node at 40 km/h and count delivered frames |
| 13 | Identity attestation of metered presence | later as a product, now for the format | 0 | Not applicable | TODO: verify with counsel where the Data Protection Act 2019 line sits | 7.9 | None; reserve the frame type and stop |
| 14 | Satellite settlement channel over Lacuna on the existing SX1262 | check first | possibly 0 hardware if the SX1262 suffices, TODO: verify | TODO: verify per-message size and price | TODO: verify whether transmitting to a satellite leaves the short-range-device exemption | 7.4 | One email to Lacuna asking about coverage over Kenya, pricing and the radio configuration |
| 15 | Wi-Fi HaLow as a replacement in-building plane | check first | TODO: verify module price for MM6108 or NRC7292 | 150 kbit/s to tens of Mbps | Blocked unless a sub-gigahertz allocation exists; TODO: verify with the Communications Authority | 7.6 | One counsel question about 802.11ah allocation in Kenya |
| 16 | Data over the GSM voice channel | weak | shares the module in row 8 | about 1.2 kbit/s claimed, TODO: verify; 65 tickets per minute of call | Ordinary subscriber use; the fleet problem of row 8 applies | 3.4 | None worth running; packet data on the same subscriber identity module wins first |
| 17 | Offline zero-knowledge proof of balance | weak | 0 hardware, large firmware | 128 to 192 B proof against a 96 B voucher | Clear | 7.8 | Measure a BN254 pairing on an ESP32-S3 and compare against the voucher's Ed25519 check |

Two summary readings of that table. The five rows verdicted **now** cost a combined total under KES 100 plus one camera module and are all firmware, which means the highest-value work in this paper competes with nothing on the roadmap. And the two rows verdicted **weak** are the two that sounded most impressive at the start, which is the ordinary outcome of grading a brainstorm honestly.

## 11. TODO: verify, consolidated

Every unverified fact in this paper, so the list can be worked through rather than rediscovered. There are twenty-four, and the paper states no figure in their place.

| # | What needs verifying | Section | Document or test that closes it |
|---|---|---|---|
| 1 | Safaricom and Airtel pass 8-bit data-coding-scheme short messages end to end | 3.2 | Two handsets and one message |
| 2 | Retail price of one short message, on-net and off-net, both operators | 3.2 | The operators' tariff pages |
| 3 | Communications Authority licence category for inbound application-to-person short messaging by a private network operator | 3.2 | Counsel, then the Authority |
| 4 | Whether an aggregator agreement with each operator is required before the first message | 3.2 | Counsel |
| 5 | Communications Authority position on machine-to-machine short messaging on consumer subscriptions | 3.2 | Counsel |
| 6 | Hermes system reported throughput over a GSM voice channel | 3.4 | The Hermes paper |
| 7 | Rate achieved by Codec2-style vocoder-matched signalling | 3.4 | The Codec2 documentation |
| 8 | The general range reported in the data-over-voice literature | 3.4 | A retrieved survey |
| 9 | Typical GSM call setup time on Safaricom and Airtel | 3.4 | A stopwatch |
| 10 | Current per-minute voice tariff in Kenya, on-net and off-net | 3.4 | The operators' tariff pages |
| 11 | Status of second and third generation network retirement in Kenya | 3.4 | Operator announcements |
| 12 | RaptorQ decode failure probabilities at zero, one and two overhead symbols | 4.1 | RFC 6330 |
| 13 | Endurance and retention of the exact flash part on the DevKitC in hand | 5.2 | The JEDEC identifier read over SPI, then the datasheet |
| 14 | Compression ratios for heatshrink, LZ4 and dictionary zstd on a real XKP corpus | 6.3 | One afternoon on the bench |
| 15 | Per-Satellite build cost for a vehicle mule | 7.1 | The Satellite bill of materials and the sourcing records |
| 16 | Nairobi retail price of a PN532 near-field communication module | 7.3 | A local vendor quote |
| 17 | Minimum QR version holding 137 bytes at medium error correction | 7.3 | The QR specification |
| 18 | Nairobi retail price of an OV2640 camera module | 7.3 | A local vendor quote |
| 19 | Swarm hardware availability and service continuity after the SpaceX acquisition | 7.4 | SpaceX and Swarm announcements |
| 20 | Lacuna Space coverage over Kenya, pricing, antenna and power needs, and the licensing position for uplink | 7.4 | One email to Lacuna, then counsel |
| 21 | Iridium Short Burst Data pricing and the Kenyan licensing position | 7.4 | Iridium partner pricing |
| 22 | Nairobi price of an optocoupler and passives for the zero-crossing detector | 7.5 | A local vendor quote |
| 23 | Whether Kenya Power operates time-error correction on the interconnected grid | 7.5 | Kenya Power or EPRA |
| 24 | Communications Authority allocation for 802.11ah, and the status of 915 to 928 MHz in Kenya | 7.6 | Counsel, then the Authority |

Four further items are open questions for counsel rather than missing documents, and they are listed in section 8 for folding into `docs/ops/regulatory-brief.md`: publishing aggregated outage observations (7.7), the Data Protection Act 2019 line for identity attestations (7.9), the BN254 pairing benchmark on an ESP32-S3 (7.8), and the Bulletproofs range proof size and verification cost on a microcontroller (7.8).

## 12. References

New sources cited by this paper are added to [14-references.md, section 9](14-references.md#9-sources-cited-by-paper-15) in the same format and with the same retrieval status convention as the rest of the set. Sources already consolidated there and relied on here are the Communications Authority short-range-device guidelines, the Semtech SX1262 datasheet, the ESP32-S3 technical reference, and this repository's own artifacts: `protocol/spec.md`, `contracts/src/xKoinEscrow.sol`, `hardware/shopping/mvp-kit.json` and `docs/_plan/revamp-plan.md`.

Cross-references used in this paper: [02-system-architecture.md](02-system-architecture.md), [03-protocol-xkp.md](03-protocol-xkp.md), [07-hardware-satellite.md](07-hardware-satellite.md), [11-regulatory-and-safety.md](11-regulatory-and-safety.md), [12-proof-of-concept-plan.md](12-proof-of-concept-plan.md), [13-roadmap.md](13-roadmap.md), [14-references.md](14-references.md), and `docs/potential/08-transport-and-matatu-stages.md`.
