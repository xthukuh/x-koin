# xKoin device pinmaps

Provenance: `doc02` pins are fixed by the MVP plan and must not move; `proposed` pins are this repo's allocation, pending sign-off.


## xKoin-Gateway (ESP32-S3-DevKitC-1)

| ESP32-S3 pin | Peripheral | Signal | Bus | Provenance |
|---|---|---|---|---|
| GPIO12 | SX1262 LoRa 868 MHz | SCK | SPI | doc02 |
| GPIO13 | SX1262 LoRa 868 MHz | MISO | SPI | doc02 |
| GPIO11 | SX1262 LoRa 868 MHz | MOSI | SPI | doc02 |
| GPIO10 | SX1262 LoRa 868 MHz | NSS/CS | SPI | doc02 |
| GPIO14 | SX1262 LoRa 868 MHz | DIO1 (IRQ) | CTRL | doc02 |
| GPIO21 | SX1262 LoRa 868 MHz | BUSY | CTRL | doc02 |
| 3V3 | SX1262 LoRa 868 MHz | VCC | PWR | doc02 |
| GND | SX1262 LoRa 868 MHz | GND | GND | doc02 |
| GPIO17 | KQ-130F narrowband PLC | RX  (ESP TX2) | UART | doc02 |
| GPIO18 | KQ-130F narrowband PLC | TX  (ESP RX2) | UART | doc02 |
| 5V | KQ-130F narrowband PLC | VCC (isolated side) | PWR | doc02 |
| GND | KQ-130F narrowband PLC | GND (isolated side) | GND | doc02 |
| GPIO39 | W5500 Ethernet -> HomePlug AV | SCK | SPI | signed off 2026-09-15 (moved 2026-09-13; GPIO33 to GPIO37 are the octal PSRAM bus on every R8 module) |
| GPIO41 | W5500 Ethernet -> HomePlug AV | MISO | SPI | signed off 2026-09-15 |
| GPIO40 | W5500 Ethernet -> HomePlug AV | MOSI | SPI | signed off 2026-09-15 |
| GPIO42 | W5500 Ethernet -> HomePlug AV | CS | SPI | signed off 2026-09-15 (GPIO38 drives the RGB LED on DevKitC-1 v1.1) |
| GPIO2 | W5500 Ethernet -> HomePlug AV | INT | CTRL | signed off 2026-09-15 |
| GPIO15 | W5500 Ethernet -> HomePlug AV | RST | CTRL | signed off 2026-09-15 |
| 3V3 | W5500 Ethernet -> HomePlug AV | VCC | PWR | signed off 2026-09-15 |
| GND | W5500 Ethernet -> HomePlug AV | GND | GND | signed off 2026-09-15 |
| GPIO4 | SIM7600E LTE (backhaul) | RXD (ESP TX1) | UART | proposed |
| GPIO5 | SIM7600E LTE (backhaul) | TXD (ESP RX1) | UART | proposed |
| GPIO6 | SIM7600E LTE (backhaul) | PWRKEY | CTRL | proposed |
| 5V | SIM7600E LTE (backhaul) | VCC 2A peak | PWR | proposed |
| GND | SIM7600E LTE (backhaul) | GND | GND | proposed |

> SAFETY: KQ-130F couples to 230 V mains. Keep mains coupling network fully isolated from the logic side; opto/transformer isolation per doc 03. Never bench-test the mains side without an isolation transformer and RCD. Power: 230 V -> 5 V/3 A buck (HLK or MeanWell) -> AMS1117/buck 3V3 rail.


## xKoin-Satellite (ESP32-S3, off-grid)

| ESP32-S3 pin | Peripheral | Signal | Bus | Provenance |
|---|---|---|---|---|
| GPIO12 | SX1262 LoRa 868 MHz | SCK | SPI | doc02 (same map as gateway for firmware reuse) |
| GPIO13 | SX1262 LoRa 868 MHz | MISO | SPI | doc02 (same map as gateway for firmware reuse) |
| GPIO11 | SX1262 LoRa 868 MHz | MOSI | SPI | doc02 (same map as gateway for firmware reuse) |
| GPIO10 | SX1262 LoRa 868 MHz | NSS/CS | SPI | doc02 (same map as gateway for firmware reuse) |
| GPIO14 | SX1262 LoRa 868 MHz | DIO1 (IRQ) | CTRL | doc02 (same map as gateway for firmware reuse) |
| GPIO21 | SX1262 LoRa 868 MHz | BUSY | CTRL | doc02 (same map as gateway for firmware reuse) |
| 3V3 | SX1262 LoRa 868 MHz | VCC | PWR | doc02 (same map as gateway for firmware reuse) |
| GND | SX1262 LoRa 868 MHz | GND | GND | doc02 (same map as gateway for firmware reuse) |
| 5V-IN | TP4056 + 10 W solar + 18650 | Solar panel + | PWR | doc03 |
| BAT+ | TP4056 + 10 W solar + 18650 | 18650 + | PWR | doc03 |
| OUT+ | TP4056 + 10 W solar + 18650 | To 3V3 boost/buck | PWR | doc03 |
| GND | TP4056 + 10 W solar + 18650 | Common ground | GND | doc03 |
| GPIO1 | Battery sense | VBAT divider (ADC1_CH0) | CTRL | proposed |

> Deep sleep between beacon windows; SX1262 DIO1 wake. Target < 40 mA avg so a 10 W panel + 3400 mAh 18650 rides through 2 overcast days (doc 03).
