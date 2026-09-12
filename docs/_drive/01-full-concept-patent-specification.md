# **PATENT SPECIFICATION & FULL CONCEPT DISCLOSURE**

  

|  |  |
| :-: | :-: |
| Document Identifier | XK-PAT-2026-01 |
| Filing Territory Reference | Kenya Industrial Property Institute (KIPI) / African Regional Intellectual Property Organization (ARIPO) / Patent Cooperation Treaty (PCT) |
| Title of Invention | DECENTRALIZED HYBRID POWERLINE CARRIER (PLC), SUB-GHZ WIRELESS MESH, AND CELLULAR GATEWAY NETWORK WITH CRYPTOGRAPHIC STATE-CHANNEL MICRO-SETTLEMENT FOR LOCAL RESOURCE SHARING AND PUBLIC WAN ROUTING |
| Inventors | Martin Thuku et al. (Nairobi, Kenya) |
| Classification (IPC) | H04L 12/28, H04L 9/32, H04B 3/54, H04W 84/18, G06Q 20/06, G06Q 20/38 |

## **1. ABSTRACT**

A decentralized physical infrastructure network (DePIN) and communication protocol are disclosed, comprising a multi-tier hybrid physical mesh and an autonomous cryptographic micro-settlement engine. The network utilizes existing alternating current (AC) and direct current (DC) electrical powerline conductors via Power Line Communication (PLC) transceivers in combination with sub-gigahertz (Sub-GHz) radio frequency (LoRa) transceivers and local wireless access points (Wi-Fi 802.11). An edge gateway device ("xKoin-Node") and client relay units ("xKoin-Satellite") negotiate local network routing without fees (zero-gas Local Area Network) while cryptographically enforcing pay-as-you-go micro-voucher redemption for wide area network (WAN) internet transit. Cryptographic state channels utilizing public-key signature verification (Ed25519/ECDSA) validate user requests and bandwidth consumption offline at the hardware edge. Batched claims are settled on an EVM-compatible distributed ledger, and liquidity is bridged bi-directionally with telecommunications mobile money and banking application programming interfaces (APIs) such as M-Pesa (Daraja) and Equitel (Finserve Jenga API).

## **2. FIELD OF THE INVENTION**

The present invention relates generally to decentralized computer networks, edge computing, Internet of Things (IoT) infrastructure, and telecommunications. More particularly, the invention pertains to a hybrid physical topology combining Power Line Communications (PLC), Long Range (LoRa) radio frequency mesh, and cellular backhaul, governed by zero-trust cryptographic micro-payment state channels for sovereign, resilient, and ultra-low-cost internet and resource distribution.

## **3. BACKGROUND & PRIOR ART DIFFERENTIATION**

### **3.1 Deficiencies in Current Infrastructure**

In emerging markets and rural communities across sub-Saharan Africa, centralized Internet Service Providers (ISPs) suffer from prohibitive capital expenditures (CapEx) in laying last-mile fiber-optic cables. Consequently, mobile network operators (MNOs) charge premium retail rates for cellular mobile data, leaving large populations underserved. Furthermore, centralized telecommunications grids are single points of failure susceptible to power outages, fiber cuts, and economic extortion.

### **3.2 Prior Art and Technical Distinctions**

Prior decentralized and mesh communication networks have attempted to solve aspects of connectivity, but each suffers from critical operational bottlenecks:

1\. **Helium Network (CBRS / LoRaWAN):**

Limitation: Helium relies on "Proof of Coverage" (PoC), incentivizing passive radio beaconing rather than actual payload transit or deterministic local bandwidth delivery. Helium requires proprietary hotspot hardware, high upfront staking costs, and centralized bridge architectures. It does not interface with building electrical wiring.

xKoin Distinction: xKoin implements a "Proof of Work/Relayed Bytes" (PoW-B) state-channel model where nodes are compensated strictly for cryptographically verified bytes delivered. xKoin directly modulates data over existing building AC wiring (PLC), eliminating new indoor cabling.

2\. Althea Network (EVM Pay-Per-Forwarding Wi-Fi Mesh):

Limitation: Althea relies on directional line-of-sight Wi-Fi antennas and expensive x86/OpenWrt routers running complex Babel routing daemon extensions. It possesses no sub-GHz non-line-of-sight off-grid emergency signaling layer and no powerline integration.

xKoin Distinction: xKoin couples high-throughput Broadband PLC (HomePlug AV/G.hn) for indoor zero-cable distribution with sub-GHz LoRa (868 MHz) for long-range cross-valley telemetry/control, while utilizing embedded low-cost microcontrollers (ESP32-S3) for edge hardware-accelerated signature validation.

3\. Meshtastic / Disaster Radio (Open-Source Sub-GHz Mesh):

Limitation: Meshtastic provides peer-to-peer packet flooding strictly over LoRa for text and GPS coordinates. Due to LoRa bandwidth physical constraints (<21 kbps), it is physically incapable of broadband data transport, possesses zero economic settlement layer, and cannot provide consumer internet or video streaming.

xKoin Distinction: xKoin adopts Meshtastic-compatible framing exclusively for network discovery, health heartbeats, zero-gas telemetry, and off-grid state-channel challenge settlement, while delegating high-throughput data (such as HD video streaming) to its Broadband PLC and Wi-Fi pipelines.

4\. KPLC Smart Meters & Grid AMR/AMI Infrastructure:

Limitation: Utility automated meter reading (e.g., Kenya Power & Lighting Company token meters) utilizes Narrowband FSK/OFDM PLC (such as DLMS/COSEM standard over 50-150 kHz). These meters are locked proprietary silos providing unidirectional, ultra-low-speed (<2.4 kbps) telemetry back to utility substations, offering zero local peer-to-peer relay, zero open consumer internet, and no cryptographic gas vouchers.

xKoin Distinction: xKoin turns every electrical wall outlet into a sovereign, bidirectional, peer-to-peer telecommunications node, providing broadband bridging and decentralized monetizable internet access.

## **4. DETAILED SYSTEM ARCHITECTURE & EMBODIMENTS**

  
  

           +----------------------------------------+

           |     Global Internet / Web2 Backbone    |

           +----------------------------------------+

                     ^                    ^

           (HTTPS)   |                    | (WireGuard)

                     v                    v

      +----------------------+    +--------------------+

      | Web3 Settlement      |    | Private VPS Proxy  |

      | - EVM Smart Contract |    | - Oracle Cloud     |

      | - M-Pesa / Equitel   |    | - Traffic Metering |

      +----------------------+    +--------------------+

                 ^                         ^

  (API / JSON)   |                         | (4G / Starlink)

                 v                         v

  ======================================================

                 xKoin-Node (Edge Gateway)

    - ESP32-S3 Dual LX7 @ 240MHz + Hardware Crypto

    - WAN Backhaul: Equitel / 4G LTE Modem (SIM7600E)

    - Backbone: Broadband PLC (HomePlug AV 100-500M)

    - Signaling: Semtech SX1262 LoRa Radio (868 MHz)

    - Access Point: Wi-Fi 802.11 Captive Portal

  ======================================================

               |                           |

    (AC Powerline PLC)            (Sub-GHz LoRa RF)

    (100 - 500 Mbps)              (5 - 15 km Range)

               |                           |

               v                           v

  +-------------------------+  +------------------------+

  | xKoin-Satellite Unit    |  | xKoin-LoRa Remote Node |

  | - Wall-Socket Receiver  |  | - Off-Grid Solar Power |

  | - Local Wi-Fi Hotspot   |  | - AgTech Farm Sensors  |

  | - Free LAN Packet Mesh  |  | - Emergency Vouchers   |

  +-------------------------+  +------------------------+

               |                           |

               v                           v

  +-------------------------+  +------------------------+

  | Consumer Devices (HD)   |  | Remote Farm / Community|

  +-------------------------+  +------------------------+

### **4.1 Device Archetypes**

1\. **xKoin-Node (Primary Gateway Transceiver):**

   The primary network hub deployed by a Node Administrator. It hosts the upstream backhaul interface (Equitel 4G LTE SIM7600E module, Starlink satellite Ethernet, or fixed terrestrial ISP), a high-speed PLC interface injecting modulated RF into the local building mains, an 868 MHz LoRa transceiver for wide-area mesh communication, and an ESP32-S3 processor running FreeRTOS with hardware-accelerated SHA-256 and Ed25519 cryptographic engines.

2\. **xKoin-Satellite (Client Relay & Wi-Fi Extender):**

   A cost-optimized plug-in unit deployed in consumer rooms or adjacent structures. It extracts data modulated over the AC mains via PLC, regenerates an 802.11 b/g/n Wi-Fi local access point, and enforces cryptographic challenge-response validation for client devices.

3\. **xKoin-LoRa (Off-Grid Remote Transceiver):**

   A low-power, solar-powered unit deployed in remote, agricultural, or disaster-affected zones. It relays lightweight zero-gas sensor telemetry, asynchronous text messages, and signed cryptographic micro-vouchers back to the nearest connected xKoin-Node.

## **5. THE ZERO-TRUST CRYPTOGRAPHIC STATE-CHANNEL PROTOCOL**

### **5.1 Identity & Key Derivation**

Every node and user possesses an asymmetric cryptographic keypair (Ed25519 or ECDSA secp256k1).

\- **Public Key ($PK$):** Serves as the user's permanent sovereign network identity and on-chain address.

\- Private Key ($SK$): Retained exclusively inside the client's secure element or hardware keystore. No centralized passwords or accounts exist.

### **5.2 The Economic Duality: LAN vs. WAN Routing**

1\. **Intra-LAN Free Routing (Zero Gas):**

   Packets addressed to destinations within the same local network subnet or local mesh identifier (e.g., local file storage, camera feeds, farm sensors, community chat) are processed with \*\*zero gas deduction\*\*. Nodes forward these packets cooperatively.

2\. **Inter-WAN Paid Routing (Gas Burning):**

   Packets destined for external public IPv4/IPv6 addresses beyond the local gateway require an accompanying cryptographic \*\*Micro-Voucher Ticket\*\*.

### **5.3 State-Channel Micro-Ticket Mechanism**

To eliminate on-chain transaction latency and gas fees during active web browsing, xKoin operates off-chain probabilistic state channels:

1\. **Escrow Lock:** The client deposits funds (e.g., 50 KES via M-Pesa or Equitel) into the xKoin Escrow Smart Contract, minting an equivalent credit balance $B\_{client}$.

2\. Ticket Generation: For every chunk of data (e.g., 10 Megabytes) or HTTP session burst, the client's device generates a signed micro-ticket:

   $$\\sigma = \\text{Sign}\_{SK\_{client}}\\Big(\\text{NodeID} \\parallel \\text{SequenceNumber} \\parallel \\text{CumulativeBytes} \\parallel \\text{Timestamp} \\parallel \\text{ContractAddress}\\Big)$$

3\. **Hardware Edge Verification:** The xKoin-Node's ESP32-S3 receives the packet header and verifies $\\sigma$ using its cryptographic co-processor in under 5 milliseconds. If valid, the gateway routes the outbound packet to the WAN proxy.

4\. Batched Settlement: The xKoin-Node aggregates the highest sequence tickets from all active clients over an epoch (e.g., 24 hours or upon reaching 500 KES threshold) and submits a single batched multi-call to the Smart Contract. The contract validates signatures, deducts the client balances, retains a 5% protocol maintenance fee, and credits the Node Admin's payout balance.

## **6. LEGAL & REGULATORY COMPLIANCE SPECIFICATIONS (KENYA & REGIONAL)**

### **6.1 Communications Authority of Kenya (CAK) Compliance**

\- **Spectrum Utilization:** LoRa transceivers operate strictly within the authorized unlicensed ISM band (868.0-868.6 MHz) under the maximum allowable Effective Isotropic Radiated Power (EIRP < 25 mW / 14 dBm) and a 1% duty-cycle ceiling, fully compliant with CAK Guidelines for Short Range Devices (SRD).

\- ISP Licensing: Local node admins operate within closed-user-group (CUG) private networks. Commercial gateway hubs aggregating public multi-tenant traffic operate under the CAK Class License for Application Service Providers (ASP) and Internet Service Providers (Class ISP).

\- Type Approval: All RF hardware modules (ESP32-S3, SX1262, SIM7600E) carry international CE/FCC and CAK Type Approval certifications.

### **6.2 Electrical Safety & Grid Coupling (KPLC Guidelines)**

\- **Galvanic Isolation:** The PLC coupling circuitry utilizes high-voltage Class-Y2 ceramic safety capacitors (rated at 300V AC, 2.5kV impulse withstand) and a 1:1 high-frequency isolation transformer (e.g., 100 kHz - 30 MHz passband).

\- EMC & Harmonics: The powerline modulation conforms to IEC 61000-3-2 and CENELEC EN 50065 standards for signaling on low-voltage electrical installations, preventing electromagnetic interference (EMI) with utility smart meters or domestic appliances.

### **6.3 Financial Compliance (CBK NPS Act & AML/KYC)**

\- **National Payment System (NPS) Compliance:** The xKoin WebKiosk functions strictly as a non-custodial technological routing interface. Fiat conversion is executed directly through licensed commercial bank settlement gateways (Equity Bank Jenga API) and licensed mobile money operators (Safaricom Daraja API).

\- Anti-Money Laundering (AML): Micro-transaction vouchers are hard-capped at statutory daily limits (e.g., max 250,000 KES/day per Safaricom/CBK guidelines).

## **7. PATENT CLAIMS (CLAIMS 1-10)**

**Claim 1.** A decentralized communications network system, comprising:

   - a plurality of edge gateway transceiver devices, each comprising an edge processor, a powerline communication (PLC) physical interface configured to couple data signals onto an electrical conductor, a sub-gigahertz radio frequency transceiver, and a wide area network (WAN) uplink interface;

   - an autonomous cryptographic routing protocol executed by said edge processor, configured to allow unmetered packet forwarding for local area network (LAN) destinations, and to require a cryptographically signed micro-voucher for forwarding packets to said WAN uplink interface; and

   - a distributed ledger smart contract configured to verify batched micro-vouchers and settle monetary value transfers between client identities and gateway transceiver identities.

  

**Claim 2.** The system of claim 1, wherein said PLC physical interface comprises a Broadband PLC transceiver operating in accordance with HomePlug AV or G.hn specifications, delivering throughput exceeding 50 megabits per second over alternating current (AC) electrical lines.

Claim 3. The system of claim 1, wherein said sub-gigahertz radio frequency transceiver operates in the 868 MHz band using LoRa modulation, configured to transmit network heartbeats, routing tables, and cryptographic vouchers off-grid over distances exceeding two kilometers.

Claim 4. The system of claim 1, wherein said micro-voucher comprises a message payload containing a gateway public identifier, a monotonic sequence number, an accumulated byte count, and a cryptographic signature verified at the hardware edge via public key cryptography.

Claim 5. The system of claim 1, further comprising an automated fiat bridge communicatively coupled to a telecommunications mobile money API and a commercial banking API, configured to mint cryptographic gas vouchers upon receipt of fiat currency and execute fiat disbursements to gateway operators upon redemption of settled micro-vouchers.

Claim 6. The system of claim 1, wherein said edge processor comprises an ESP32-S3 microcontroller featuring hardware cryptographic acceleration for hashing and asymmetric signature verification.

Claim 7. The system of claim 1, further comprising a client satellite transceiver unit configured to be inserted into an electrical wall socket, receive data modulated over power wiring, and broadcast an IEEE 802.11 wireless local area network access point.

Claim 8. A method for zero-trust decentralized resource sharing, comprising:

   - receiving, at an edge gateway device via an alternating current powerline carrier or wireless interface, an inbound data packet and a signed micro-payment ticket;

   - validating, using hardware cryptographic engines on the edge gateway device, the signature of said ticket against an escrowed state-channel balance;

   - routing the data packet to a wide area network backhaul if the ticket is valid; and

   - periodically submitting aggregated valid tickets to an on-chain smart contract to disburse earned compensation to the edge gateway operator.

**Claim 10.** The method of claim 8, wherein packets transmitted between nodes within a common local mesh identifier are exempt from micro-payment ticket verification and are forwarded free of gas charges.

Claim 9. The method of claim 8, wherein said smart contract automatically deducts a protocol maintenance fee of between 2 percent and 10 percent of transaction value to fund blockchain transaction gas subsidies and protocol development.

  