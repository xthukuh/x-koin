# **xKoin Hardware Bill of Materials (BOM) & Sourcing Guide**

Target Deployment Location: Nairobi, Kenya  
Currency Benchmark: 1 USD ≈ 130 KES  
Sourcing Strategy: Prioritize local Nairobi suppliers for immediate rapid prototyping (same-day / 24-hr turnaround) with AliExpress/global links for low-cost volume scaling.

  

\---

  

## **1. COMPLETE BILL OF MATERIALS (BOM)**

  

### **Category A: xKoin-Node (Primary Gateway Transceiver)**

The flagship node that connects to the internet backhaul (cellular/broadband), injects data into building powerlines, manages LoRa long-range mesh signals, and validates cryptographic tickets.

  
  

|  |  |  |  |  |  |
| :-: | :-: | :-: | :-: | :-: | :-: |
| \*\*#\*\* | \*\*Component\*\* | \*\*Functional Role\*\* | \*\*USD\*\* | \*\*KES\*\* | \*\*Preferred Sourcing\*\* |
| A1 | \*\*ESP32-S3-WROOM-1 N16R8\*\* | Edge compute, Wi-Fi AP captive portal, hardware Ed25519 crypto signer | $4.50 | 1,650 | [Nerokas (Local)](https://store.nerokas.co.ke/SKU-3981) / [AliExpress (Global)](https://www.aliexpress.com/item/1005005889758734.html) |
| A2 | \*\*Waveshare SX1262 LoRa Module\*\* | Long-range resilient RF telemetry, network heartbeats, and emergency vouchers | $18.00 | 2,850 | [RobotShop](https://www.robotshop.com/products/sx1262-lora-node-module-rpi-pico-lorawan-frequency-band-915m-902930mhz-1) / [eBay](https://www.ebay.com/itm/318180119965) |
| A3 | \*\*Broadband PLC Adapter Kit\*\* | High-speed intra-building data transport over AC mains | $35.00 | 5,500 | [Ubuy Kenya](https://www.ubuy.ke/en/product/D1BZJEE-tp-link-av600-powerline-starter-kit-simple-reliable-network-expansion-tl-pa4010-kit) |
| A4 | \*\*SIM7600E 4G LTE HAT\*\* | Cellular WAN internet backhaul (Equitel/Airtel/Safaricom) | $48.00 | 6,950 | [Nerokas](https://store.nerokas.co.ke/SKU-3697) / [Ivyliam](https://shop.ivyliam.com/product/sim7600e-lte-hat-for-raspberry-pi-3g-2g-gnss/) |
| A5 | \*\*GL.iNet GL-MT300N-V2 (Mango)\*\* | Dedicated routing, NAT, Wi-Fi isolation, WireGuard | $29.00 | 4,200 | [Whizz Kenya](https://www.whizz.co.ke/product/1531239/gl-inet-gl-mt300n-v2-mango-portable-mini-travel-wireless-pocket-vpn-wifi-router-2x-ethernet-ports-usb-2-0-openwrt-openvpn-wireguard-for-public-hotel-wi-fi-easy-to-set-up-via-admin-panel/) / [GL.iNet](https://www.gl-inet.com/products/gl-mt300n-v2) |

  

\---

  

### **Category B: xKoin-Satellite / Client (Wall-Socket Extender & Client AP)**

A compact receiver plugged into an electrical socket in a tenant's room or office, delivering Wi-Fi directly from the building's powerline backbone.

  
  
  

|  |  |  |  |  |
| :-: | :-: | :-: | :-: | :-: |
| \*\*Item #\*\* | \*\*Component\*\* | \*\*Purpose\*\* | \*\*Est. Cost (KES)\*\* | \*\*Sourcing Link\*\* |
| \*\*D1\*\* | \*\*MB-102 Solderless Breadboard (830 points)\*\* | Component layout & testing | 350 | [Nerokas Store](https://store.nerokas.co.ke/) |
| \*\*D2\*\* | \*\*Dupont Jumper Wires (65 pcs Male-to-Male, Male-to-Female)\*\* | Interconnecting modules | 250 | [Nerokas Store](https://store.nerokas.co.ke/) |
| \*\*D3\*\* | \*\*USB to TTL CP2102 / CH340 Serial Converter\*\* | UART debugging & console logging | 450 | [Nerokas Store](https://store.nerokas.co.ke/) |
| \*\*D4\*\* | \*\*Digital Multimeter with Continuity Buzzer\*\* | Voltage verification & safety testing | 1,200 | [Local Hardware / Nerokas](https://store.nerokas.co.ke/) |

  

|  |  |  |  |  |
| :-: | :-: | :-: | :-: | :-: |
| \*\*#\*\* | \*\*Component\*\* | \*\*Functional Role\*\* | \*\*KES\*\* | \*\*Sourcing\*\* |
| B1 | \*\*ESP32-C3 / S3 Mini Node\*\* | Client token verification, local Wi-Fi AP | 650 | [Nerokas](https://store.nerokas.co.ke/SKU-3981) |
| B2 | \*\*PLC Endpoint\*\* | Receives modulated AC signal | 2,750 | [Ubuy Kenya](https://www.ubuy.ke/en/product/D1BZJEE-tp-link-av600-powerline-starter-kit-simple-reliable-network-expansion-tl-pa4010-kit) |

  

\---

  

### **Category C: xKoin-LoRa (Off-Grid Remote & Agricultural Node)**

Zero-grid transceiver powered by solar, serving remote rural households, farms, or emergency setups.

  
  

|  |  |  |  |  |
| :-: | :-: | :-: | :-: | :-: |
| \*\*#\*\* | \*\*Component\*\* | \*\*Functional Role\*\* | \*\*KES\*\* | \*\*Sourcing\*\* |
| C1 | \*\*ESP32-S3 + SX1262 LoRa\*\* | Low-power telemetry relay | 2,900 | [Nerokas](https://store.nerokas.co.ke/SKU-3981) |
| C4 | \*\*10W Solar Panel\*\* | Off-grid power generation | 1,400 | [Jumia Kenya](https://www.jumia.co.ke/) |

  

\---

  

### **Category D: Benchtop Prototyping Essentials**

Everything needed on the workbench for assembling and debugging the first test unit.

  
  

\---

  

## **2. BEGINNER-FRIENDLY HARDWARE WIRING & PINOUT GUIDE**

  

### **2.1 ESP32-S3 to Semtech SX1262 LoRa (SPI Connection)**

Connect the SX1262 module to the ESP32-S3 development board using the following pin map:

  
  

SX1262 Pin     ESP32-S3 GPIO     Description

  
  

VCC            3V3               3.3V Regulated Power

GND            GND               Common Ground

MISO           GPIO 13           SPI Master-In-Slave-Out

MOSI           GPIO 11           SPI Master-Out-Slave-In

SCK            GPIO 12           SPI Clock

NSS (CS)       GPIO 10           SPI Chip Select

DIO1           GPIO 14           Interrupt

BUSY           GPIO 21           RF Busy Status

RST            GPIO 9            Hardware Reset

  

### **2.2 ESP32-S3 to Narrowband PLC (KQ-130F) (UART Connection)**

If testing low-baud telemetry carrier transmission:

  

KQ-130F Pin    ESP32-S3 GPIO     Description

  
  

Pin 1 (AC/DC)  AC Mains / DC     Power line coupling

Pin 2 (AC/DC)  AC Mains / DC     Power line coupling

Pin 3 (+5V)    VIN (5V)          Module logic power

Pin 4 (GND)    GND               Ground

Pin 5 (TXD)    GPIO 18           UART1 Receive from PLC

Pin 6 (RXD)    GPIO 17           UART1 Transmit to PLC

  

**CRITICAL ELECTRICAL SAFETY PROTOCOL**  
**1. Never work on energized AC mains:** Always unplug the device before touching jumper wires.  
**2. Start on low-voltage DC:** Test PLC modules across unpowered cables first.  
**3. Use Galvanic Isolation:** Always use certified adapters like the TP-Link TL-PA4010 for physical line interface.

  