# 09. Field geology and survey sensors

*A survey firm instrumenting a geothermal field, a quarry slope or a borehole array puts tiltmeters, piezometers and temperature strings on the free LAN plane, logs unattended for weeks when nothing is in reach, and spends zero XKN to get the readings back to camp.*

## 1. The situation

Take Menengai, north of Nakuru, as an example of the kind of site rather than as a deployment anyone has made. A five-person survey firm has a contract to watch ground movement and pore pressure across a few square kilometres of a geothermal field: a dozen instrument points on a caldera floor, spread over tracks that take forty minutes to drive end to end. Josphat Kiprono is the engineering geologist who signs the monthly report. The same shape recurs at Olkaria, on a quarry face outside Athi River, and on a borehole array watching a groundwater abstraction. All four are examples.

The instruments are not the problem. A biaxial tiltmeter, a vibrating-wire piezometer and a string of borehole thermistors are mature parts with decades of practice behind them. What is hard is that they sit where there is no mains, no fixed line, and mobile coverage that depends on which side of a ridge the point happens to be on.

## 2. What breaks today

The default is a logger with a memory card at each point and a person who drives to swap it. That works, and its cost is the driving. It also means faults are found late: a logger whose battery died on the fourth is discovered on the twenty-eighth, and three weeks of a slope-movement record are gone. On a slope being watched because it might move, a three-week hole is the expensive kind of missing data.

A cellular modem per logger fails the way it fails on a farm ([01-large-scale-farm-iot.md](01-large-scale-farm-iot.md), section 2). Coverage fails at exactly the points that are furthest to drive to, a machine-to-machine line rents by the month whether the instrument speaks or not, and twelve instruments become twelve billing relationships to renew.

Satellite internet-of-things terminals answer coverage and are right for one isolated point. They are wrong for a dozen points a kilometre apart, because the cost is per terminal and per message and none of it buys anything at the second instrument. That channel belongs to the one thing that must escape a dead site, which is the case in [../papers/15-hidden-gems-and-fallback-channels.md](../papers/15-hidden-gems-and-fallback-channels.md), section 7.4.

## 3. The xKoin composition

The array is the farm composition with a different sensor on the end of it. That is the point worth making to a geologist: nothing here was built for geology.

| Device | Count | Placement | Power | Plane it carries |
|---|---|---|---|---|
| xKoin-Node | 1 | Site office or camp container | Mains or generator, small UPS | Backhaul in, Wi-Fi at camp, LoRa to the field, metering |
| xKoin-Satellite | 2 | Ridge with line of sight over the array | 10 W panel, 3400 mAh 18650 | LoRa relay and free LAN plane |
| Geology sensor node | 12 | One per instrument point | 6 V 2 W panel, TP4056, 18650 | Class C telemetry only, free LAN plane |
| xKoin-Client OTG dongle | 1 | In the survey vehicle | Vehicle USB | Direct LoRa reach anywhere on site |
| xKoin-Client | 2 | Phone and laptop at camp | Own battery | Attach at camp, paid WAN |

The geology sensor node is the farm sensor node of [../papers/09-lora-ecosystem-devices.md](../papers/09-lora-ecosystem-devices.md), section 3, unchanged above the sensor: an ESP32-C3 SuperMini, an SX1262, the same SPI allocation, the same HT7333 supply path, the same TELEMETRY frame. The radio is an Ebyte E22-900M22S rather than the Ai-Thinker Ra-01SH named in that paper, because the Ra-01SH listings all ship in mid November and the E22 was the substitution Martin recorded on 2026-09-14 (`hardware/shopping/mvp-kit.json`, device `farm-node`). Only the sensor interface and the enclosure change.

## 4. What fits in a LoRa payload, and what does not

An XKP frame costs 29 bytes of overhead ([../papers/09-lora-ecosystem-devices.md](../papers/09-lora-ecosystem-devices.md), section 7) and a LoRa SF7 payload holds 226 bytes ([../papers/03-protocol-xkp.md](../papers/03-protocol-xkp.md), section 2). Take a 20-byte reading as the worked example: four bytes of epoch seconds, two signed 32-bit tilt axes in micro-radians, a 16-bit pore pressure, a 16-bit borehole temperature, a 16-bit cell voltage and two status bytes. That is 49 bytes on air.

| Instrument | Reading | Fits |
|---|---|---|
| Biaxial tiltmeter, MEMS or electrolytic | Two axes, 8 bytes | yes |
| Vibrating-wire piezometer | One scalar per interval, 4 bytes | yes |
| Groundwater level logger | Head pressure and temperature, 6 bytes | yes |
| Borehole thermistor string | 16 depths at 2 bytes | yes, inside one frame |
| Soil gas, CO2, radon or H2S | 2 bytes per channel | yes |
| Low-rate seismic event counter | Trigger time, peak amplitude, duration, about 12 bytes | yes, the summary only |
| Raw seismic waveform | Continuous stream | **no**, see below |
| Raw GNSS observables | Continuous stream, order kilobytes per second <!-- TODO: verify the raw observable rate for a multi-constellation receiver against a receiver datasheet. --> | **no**, though a daily processed position fits |
| Borehole camera imagery | Images | **no**, nothing on this plane is for pictures |

**Raw seismic waveforms fail twice over.** A three-component station at 100 Hz with 24-bit samples is 900 bytes a second, or 3.24 MB an hour. <!-- TODO: verify the sample rate, channel count and word length against a real station specification rather than this class assumption. --> A full 226-byte frame at SF7 takes 358.7 ms of air, so a 1 percent duty cycle permits about 100 frames an hour carrying 197 payload bytes each, which is 19.7 kB. The waveform is about 165 times that. Remove the duty-cycle rule and transmit continuously and the link carries 10,037 frames an hour, or 1.98 MB, still short of 3.24 MB. The waveform does not fit this radio at any duty cycle, and what to send instead is the event summary the detector already computes.

**Spreading factor against readings per hour.** LoRa airtime is `(12.25 + n) * 2^SF / 125000`, with `n = 8 + ceil((8 * PL - 4 * SF + 44) / (4 * (SF - 2 * DE))) * 5` at CR4/5 with the CRC on, `DE` being 1 at SF11 and SF12 and 0 below. The model reproduces the 358.6 ms quoted for a 226-byte SF7 frame in paper 15, section 7.1, which is the check that it is the model the rest of the set uses. For the 49-byte geology frame, with 1 percent of an hour giving 36 seconds of air:

| Setting | Symbol time | Symbols | Airtime | Readings per hour per node at 1 percent |
|---|---|---|---|---|
| SF7 | 1.024 ms | 95.25 | 97.5 ms | 369 |
| SF8 | 2.048 ms | 85.25 | 174.6 ms | 206 |
| SF9 | 4.096 ms | 80.25 | 328.7 ms | 109 |
| SF10 | 8.192 ms | 70.25 | 575.5 ms | 62 |
| SF11 | 16.384 ms | 75.25 | 1,232.9 ms | 29 |
| SF12 | 32.768 ms | 70.25 | 2,302.0 ms | 15 |

SF11 carries more symbols than SF12 because the low-data-rate optimisation changes the divisor at both and the ceiling function does the rest. The column that matters is the last one. Geology wants four readings an hour at its fastest and one a day at its slowest, so even SF12, the longest-range setting here, has four times the headroom a fifteen-minute schedule needs. Duty cycle is the binding constraint on web browsing over this radio ([../papers/03-protocol-xkp.md](../papers/03-protocol-xkp.md), section 7); it is not the binding constraint on geology.

What binds is the array, because twelve nodes share a channel. Twelve nodes at four readings an hour at SF12 is 48 transmissions and 110.5 seconds of air an hour, or 3.07 percent of one channel, which is 0.38 percent each across eight. Drop to SF9 and the same traffic is 15.8 seconds, or 0.44 percent of one channel. The design rule is to pick the lowest spreading factor the link will carry, not the highest.

## 5. Internals: which primitives do the work

**The free LAN plane.** A reading that goes from a tiltmeter, over LoRa, through a Satellite, to the Node at camp is local at every hop, and the Node's classifier routes local traffic with no metering code in the path at all ([../papers/04-settlement-and-economics.md](../papers/04-settlement-and-economics.md)). Twelve instruments reporting for a year cost zero XKN. That is structural, not a tariff.

**Class C, and Law 1.** Class C is native XKP frames with no IP (spec section 6), and everything the array sends is class C. The node emits TELEMETRY and never sends a JOIN_REQ, presents no voucher and signs no receipt, because no wide-area byte was delivered. Its node id is the first eight bytes of the SHA-256 of an Ed25519 public key, so adding an instrument point is flashing a key onto a board, and the renewal failure of the cellular option is removed rather than mitigated.

**Store-and-forward when nothing is in reach.** A point that has lost its Satellite, or was placed beyond one on purpose, journals to flash and drains when a listener appears. The ESP32-C3FH4 carries 4 MB of flash (`hardware/shopping/parts/esp32-c3-supermini.json`); reserve 1 MiB at 32 bytes a record and that is 32,768 records, or 341 days at a fifteen-minute schedule. <!-- TODO: verify the usable journal partition after the application image, and the flash wear behaviour on this part. --> Power-cut atomicity for that journal is paper 15, section 5.

**What draining costs.** Four weeks at four readings an hour is 2,688 records. Nine 20-byte records pack into one 226-byte frame, so the backlog is 299 frames and 107.2 seconds of air at SF7, which under a 1 percent duty cycle is 2.98 hours of elapsed time. A vehicle parked at the point for an afternoon collects a month; a vehicle driving past does not, which agrees with paper 15, section 7.1, where a vehicle at 40 km/h gets one frame per pass. With listen-before-talk and adaptive frequency agility, option 2 in [../papers/11-regulatory-and-safety.md](../papers/11-regulatory-and-safety.md), section 2, the same backlog drains in 107 seconds.

**What the settlement channel does when a Node appears.** For telemetry, nothing: no receipt is signed, no ticket is mapped, no gas is spent. Settlement appears only when data leaves the mesh, which here is the weekly file the geologist pushes to a client in Nairobi over the Node's backhaul. That is paid WAN like anyone else's: a kiosk-signed voucher admits the session offline (Law 2), a cumulative Ed25519 receipt is signed every receipt interval (Law 3), and one ticket closes the session with a monotonic sequence (Law 5) capped at the deposit (Law 6). Tickets carried out on a vehicle instead are just as safe, because a forged counter is a broken signature and a replayed ticket pays a delta of zero, so the carrier can be a stranger.

## 6. A day in the life

A Wednesday, four days before the monthly report is due.

| Time | Event | Plane | Cost in XKN |
|---|---|---|---|
| 00:00 to 06:00 | Twelve points report every fifteen minutes | Free LAN, LoRa | 0 |
| 07:30 | Point nine has been silent since 21:45. The Node flagged the gap, not a person | Free LAN | 0 |
| 08:10 | Josphat drives to point nine instead of point two. The drive was caused by data | none | 0 |
| 08:55 | Out of mobile coverage, the OTG dongle gives his laptop the mesh. The node is alive, the panel lead is off, eleven hours of journal waiting | Free LAN, LoRa | 0 |
| 11:40 | Tilt at point four crosses the contract threshold; the Node raises it to the phone | Free LAN | 0 |
| 12:05 | He reads points three and five from the vehicle before deciding whether the movement is local | Free LAN, LoRa | 0 |
| 15:00 | The week's file, twelve points at four readings an hour for seven days, 8,064 readings and about 160 kB packed, goes to the client in Nairobi | Paid WAN | Metered, receipt signed |
| 18:30 | Point nine finishes draining. The record has no hole in it | Free LAN, LoRa | 0 |
| 21:00 | Node settles the day in one batch: one client, one operator | Chain | One batch fee |

One settled row. The rest is instruments talking for free, which is the ratio the farm case reports and for the same reason.

## 7. Economics, with conditions

Prices are the checkout figures verified in Martin's own browser session on 2026-09-14, ship-to Kenya, in KES, before duty, VAT and import levies (`hardware/shopping/mvp-checkout.json`). They differ from paper 09, section 3.4, which was recorded on 2026-09-12 and predates both the E22 substitution and the pack-price corrections. Pack lines are divided by pack size. No assembly, enclosure, mounting, labour or instrument is in them.

| Line | Unit KES | Basis |
|---|---|---|
| ESP32-C3 SuperMini | 284 | Verified listing, C3 variant, not the PLUS at 368 |
| E22-900M22S (SX1262) | 556 | Verified listing; substituted for the Ra-01SH per `mvp-kit.json` |
| IPEX to SMA pigtail | 77.8 | 389 for a five-pack |
| 868 MHz antenna, 3 dBi | 173.5 | 347 for a two-pack |
| TP4056 with protection | 130 | ktechnics, local |
| 18650 holder | 70 | ktechnics, local |
| 18650 cell | 400 | nerokas, local; cells do not ship |
| Solar panel 6 V 2 W | 136 | Verified listing |
| HT7333 LDO | price pending scout | 4 uA quiescent; an AMS1117 would dominate the budget |
| The geology instrument | price pending scout | <!-- TODO: verify tiltmeter, piezometer and water level logger prices from a Kenyan or regional instrument supplier. --> |

Eight scouted lines total KES 1,827 per node platform. Two are unpriced and one of them is the instrument, which on a vibrating-wire piezometer is very likely the largest line in the table, so no device total is claimed and nobody should read 1,827 as the cost of a monitoring point.

The structural facts do not move with the prices. Telemetry costs zero XKN and zero gas at any price, because the free plane never enters the proof layer. The recurring cost of a twelve-point array is one backhaul subscription at camp rather than twelve machine-to-machine lines, and that saving grows with the number of points while the alternative's cost grows with them in the wrong direction. Against a memory-card array the saving is not a subscription at all: it is the driving, and the three-week holes.

The power budget is the farm node's, inherited unchanged at about 2.43 mAh a day on a fifteen-minute schedule, dominated by the board's power indicator LED if that is not removed first ([../papers/09-lora-ecosystem-devices.md](../papers/09-lora-ecosystem-devices.md), section 3.5). Those figures rest on datasheet class currents, not measurements. <!-- TODO: verify the SX1262 transmit and receive currents on the bench, which paper 09 section 9 item 5 already has open. --> An instrument with its own excitation, a vibrating-wire piezometer above all, adds a load that is not in that budget. <!-- TODO: verify the excitation energy per reading for the chosen piezometer interface. -->

**What is proven today: nothing in the field.** No geology node exists and no array has been deployed. Every figure above is arithmetic over the protocol's own frame sizes or a price read off a listing, and the protocol scenarios and the simulation are what stand behind the frame and settlement claims.

## 8. What could go wrong, and what answers it

| Risk | Answer | Mechanism |
|---|---|---|
| A spoofed tilt reading triggers an evacuation, or suppresses one | An array can require signed telemetry from known ids. This is firmware policy, not a Law, and a monitoring contract is the case that must set it | Law 1 plus node config |
| Frames are corrupted by a wellhead, a generator or a crusher | Magic, length and CRC16 drop the frame below the cryptography; the next interval reports | Law 8 |
| Someone treats the array as a safety system | It is not one, and the pilot terms must say so in the words used for tenants in [00-last-network-standing.md](00-last-network-standing.md) | Stated in the pilot terms |
| A node runs out of journal before anyone visits | 341 days on a 1 MiB partition, and the node reports its own journal depth in the status bytes, so the gap is visible before it is a loss | Flash journal, paper 15 section 5 |
| The array quietly exceeds the duty-cycle rule as points are added | Occupancy is linear in node count and computable in advance, per section 4; the limiter is in the node and the channel plan is the lever | Section 4 arithmetic |
| Sustained transmission breaches the Kenyan 868 MHz rules | Real and unresolved. The Communications Authority 2022 short-range device table gives 25 mW e.r.p. with a 1 percent duty cycle, or listen-before-talk with adaptive frequency agility, for 868.0 to 868.6 MHz, and the firmware sits at 868.1 MHz and +22 dBm, about 158 mW, roughly six times that ceiling before antenna gain | [../papers/11-regulatory-and-safety.md](../papers/11-regulatory-and-safety.md) section 2, open |
| H2S and acid condensate at a geothermal field eat the enclosure and the antenna | Not answered by anything in this repository <!-- TODO: verify enclosure and connector materials against a geothermal field exposure specification. --> | Open |

## 9. What would have to be true to pilot this

1. **The one bench experiment that settles the claim.** One geology sensor node and one Satellite on the bench, with the two 30 dB SMA attenuators from the demo kit giving the 60 dB of simulated distance demo D2 already uses. The node emits a 49-byte TELEMETRY frame at each of SF7 through SF12, logging measured airtime, RSSI and SNR against the table in section 4, then drains a synthetic 2,688-record backlog under the duty-cycle limiter. The escrow balance of every address involved is read on chain before and after. It passes when measured airtime is within 5 percent of the table, the drain completes within 10 percent of the 2.98 hour prediction, and no deposit moved, which is what turns free from a claim into a measurement.
2. A measured link budget on the actual ground. A caldera floor and a quarry face are terrain questions, and the answer is a site survey with an RSSI log.
3. Transmit power capped to the sub-band limit, or listen-before-talk with adaptive frequency agility implemented, before a node is left on a hillside overnight.
4. A sensor interface board for one real instrument. A vibrating-wire excitation and readout is not an ADC pin, and choosing that instrument first is what turns the platform into a product.
5. An enclosure, a mount and an anti-theft story for a solar panel on a site people walk across.
6. A survey firm willing to run the array alongside its existing loggers for one reporting cycle, so the two records can be compared rather than trusted.
7. Counsel's answer on whether an array carrying only its owner's telemetry sits outside transit-resale licensing. It very likely does, and very likely is not an answer ([../ops/regulatory-brief.md](../ops/regulatory-brief.md) section 5).
