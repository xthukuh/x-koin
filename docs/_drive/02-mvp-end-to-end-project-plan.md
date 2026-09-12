# **xKoin MVP - Comprehensive End-to-End Implementation Project Plan**

Target Audience: Autonomous Software Engineers, Systems Architects, and AI Agents (e.g., Claude Code CLI)

Project Repository Structure: Monorepo (xKoin-Core)

Target Deployment Target: Nairobi, Kenya (Equitel / Safaricom networks, 230V 50Hz electrical grid)

Execution Objective: Build, test, and deploy a functioning physical and cryptographic MVP proving hybrid PLC/LoRa routing, zero-trust state-channel micro-settlement, and mobile money fiat integration.

  
  

## **1. SYSTEM ARCHITECTURE & MONOREPO LAYOUT**

  
  
  

xKoin-Core/

├── contracts/        # EVM Solidity (Hardhat/Foundry)

│   ├── xKoinToken.sol      # ERC-20 + ERC-2612

│   ├── xKoinEscrow.sol     # State-channel escrow

│   └── xKoinTreasury.sol   # Protocol fee split

├── firmware/         # C/C++ (ESP-IDF / PlatformIO)

│   ├── xkoin-gateway/      # Gateway node firmware

│   │   ├── crypto/         # Ed25519 & SHA256 engine

│   │   ├── lora/           # SX1262 SPI driver

│   │   ├── plc/            # Broadband & KQ-130F PLC

│   │   ├── wifi_ap/        # Captive portal & HTTP

│   │   └── router/         # LAN vs WAN packet filter

│   └── xkoin-satellite/    # Client repeater firmware

├── kiosk-web/        # Next.js 14 Web3 Frontend

│   ├── buy-gas/            # M-Pesa & Equitel Kiosk

│   ├── admin-dashboard/    # Node earnings & claims

│   └── firmware-verify/    # SHA-256 hash verifier

├── gateway-api/      # FastAPI Backend Service

│   ├── daraja/             # Safaricom M-Pesa webhooks

│   ├── jenga/              # Equitel Jenga API client

│   └── settlement/         # L2 ticket batch relayer

└── cloud-proxy/      # Oracle Free Tier VPS Gateway

    ├── wireguard/          # Encrypted mesh tunnels

    └── proxy/              # Squid caching & metering

  
  

## **2. PHASE-BY-PHASE IMPLEMENTATION ROADMAP**

  

### **PHASE 1: Embedded Firmware & Hardware Virtualization (Weeks 1-3)**

**Objective:** Establish core hardware interfaces, captive portal, and edge cryptographic signature validation.

  

1. Wokwi Virtual Prototyping:

   - Create a Wokwi ESP32-S3 simulation harness verifying Wi-Fi Access Point mode, captive portal DNS hijacking (`192.168.4.1`), and HTTP REST endpoints.

   - Implement benchmark suite measuring Ed25519 public-key signature verification latency on the ESP32-S3 dual-core LX7 running at 240 MHz (Target: < 4.5 ms per signature).

2. **Hardware Driver Implementation:**

   - LoRa Subsystem: Implement Semtech SX1262 driver over SPI (`SCK=GPIO12`, `MISO=GPIO13`, `MOSI=GPIO11`, `CS=GPIO10`, `DIO1=GPIO14`, `BUSY=GPIO21`). Configure 868.1 MHz, Bandwidth 125 kHz, Spreading Factor SF7, Coding Rate 4/5.

   - PLC Subsystem: Implement UART2 driver (`TX=GPIO17`, `RX=GPIO18`, Baud 9600) for telemetry carrier (KQ-130F), and Ethernet RMII/SPI bridge (W5500 or direct MII) for Broadband PLC (HomePlug AV module).

3. Packet Classifier (LAN vs. WAN):

   - Free LAN: Route internal broadcast and local subnet packets (`192.168.x.x`, `.local`, or matching `MeshNetworkID`) directly without metering.

   - Paid WAN: Intercept non-local outbound TCP/UDP SYN packets. Block internet forwarding until client presents a valid signed session ticket.

  

### **PHASE 2: Decentralized Smart Contracts & Gas Engine (Weeks 3-5)**

**Objective:** Deploy zero-trust, gas-efficient escrow smart contracts with automated protocol fee deduction on an EVM Layer 2.

  

1. Contract Development:

   - xKoinToken.sol: Standard ERC-20 with EIP-2612 `permit()` enabling gasless token approvals via signed meta-transactions.

   - xKoinEscrow.sol: Holds user deposits. Implements `settleTicketBatch(Ticket[] calldata tickets, bytes[] calldata signatures)`:

     ```solidity

     struct Ticket {

         address client;

         address nodeAdmin;

         uint64 sequenceNumber;

         uint128 cumulativeUnits;

         uint256 epochExpiry;

     }

     ```

   - **xKoinTreasury.sol:** Automatically deducts a parameterized protocol fee ($5\%$) on every settlement batch. Retained funds fund on-chain relayer gas costs and protocol development.

2. Layer 2 Selection & Deployment:

   - Deploy to Base or Arbitrum One testnet/mainnet to guarantee transaction execution costs under $0.005 per settlement batch.

  

### **PHASE 3: Web3 Kiosk & Telecommunications Fiat Webhooks (Weeks 5-7)**

**Objective:** Connect real-world Kenyan mobile money (M-Pesa and Equitel) to the cryptographic voucher system.

  

1. Fiat On-Ramp Flow:

   - User connects to the xKoin Wi-Fi captive portal and selects "Buy Gas Voucher" (e.g., 20 KES, 50 KES, 100 KES).

   - Enters phone number (Safaricom or Equitel).

   - FastAPI backend triggers an STK Push:

     - Safaricom: Daraja `mpesa/stkpush/v1/processrequest` (Lipa Na M-Pesa Online).

     - Equitel: Finserve Jenga API `/v3-apis/transaction-api/v3.0/merchants/payment`.

   - On payment confirmation callback, backend generates an offline cryptographic Gas Voucher certificate signed by the Kiosk Root Key and transfers equivalent balance to the user's on-chain escrow account.

2. **Fiat Off-Ramp Flow:**

   - When a Node Admin accumulates earnings from verified relayed traffic, they request payout via the Kiosk.

   - The contract settles the batch; backend listens to the `BatchSettled` event and automatically initiates a B2C transfer:

     - Safaricom Daraja B2C Payment Request (`/mpesa/b2c/v1/paymentrequest`) or Equitel Jenga Remittance API directly to the Node Admin's mobile wallet.

  

### **PHASE 4: Cloud Backhaul & Transparent Proxy Engine (Weeks 7-8)**

**Objective:** Bridge edge nodes to the global internet via an authorized, secure proxy tier.

  

1. VPS Gateway Architecture:

   - Deploy on Oracle Cloud Always Free Tier (Ampere A1 ARM 4 OCPU, 24 GB RAM instance located in a low-latency region).

   - Configure WireGuard endpoint terminating VPN tunnels from xKoin-Nodes equipped with 4G LTE modems.

   - Deploy Squid / Dante Transparent Caching Proxy to compress HTTP traffic, cache frequently accessed static assets (reducing upstream cellular data burn by up to 25%), and strictly enforce token-metered bandwidth allowances.

  

### **PHASE 5: Physical Integration, Field Testing & Launch (Weeks 9-10)**

**Objective:** Benchtop assembly, real-world electrical grid testing, and end-to-end user validation in Nairobi.

  

1. Benchtop Circuit Assembly: Wire ESP32-S3, SX1262 LoRa, KQ-130F PLC / HomePlug AV module, and SIM7600E LTE HAT on a test rig.

2. In-Building Electrical Grid Verification: Test data transmission across adjacent rooms through electrical sockets on the same and different circuit breakers. Measure packet loss and throughput.

3. Off-Grid LoRa Test: Test long-range packet relay between Westlands and adjacent elevated positions in Nairobi (aiming for 3-5 km line of sight).

4. End-to-End User Experience Validation:

   - Unauthenticated smartphone joins `xKoin-Community-Mesh` Wi-Fi.

   - Captive portal prompts for M-Pesa top-up.

   - User pays 20 KES via STK push.

   - Portal delivers session gas voucher.

   - User streams 1080p YouTube video for 15 minutes seamlessly.

   - Node admin verifies pending credit and triggers automated B2C payout to their M-Pesa number.

  
  

## **3. MILESTONE SCHEDULE & VERIFICATION CRITERIA**

  
  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| Milestone | Deliverable | Success Criteria | Week |
| M1: Core Crypto & Simulation | Wokwi sim & firmware crypto module | Ed25519 verification \\< 5ms on ESP32-S3; Captive portal serves UI | Week 2 |
| M2: Smart Contract Suite | Deployed L2 contracts on testnet | xKoinEscrow passes Hardhat unit tests with 100% test coverage | Week 4 |
| M3: Fiat Webhook Engine | FastAPI Daraja & Jenga webhooks | End-to-end STK Push triggers local escrow credit within 6 seconds | Week 6 |
| M4: Hardware Lab Prototype | Assembled xKoin-Node & Satellite | PLC socket-to-socket communication established; LoRa packets confirmed | Week 8 |
| M5: End-to-End Field Trial | Field deployment in Nairobi test site | User pays fiat, streams HD video, admin receives automated payout | Week 10 |

  

\---

  

## **4. TECHNICAL RISK MANAGEMENT MATRIX**

  
  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| Risk Factor | Severity | Impact | Mitigation Strategy |
| PLC Attenuation across circuit breakers | High | Speed drops across electrical sub-panels | Use capacitive phase couplers across phases; fall back to LoRa for signaling and Wi-Fi repeater hops. |
| M-Pesa / Jenga Webhook Latency | Med | Delay in voucher delivery to user | Issue immediate local optimistic voucher on STK push initiation with 60-second grace buffer before hard cut-off. |
| Blockchain Gas Spikes | Low | Costly on-chain ticket settlement | Deploy strictly on low-cost L2s (Base / Arbitrum) and enforce dynamic batch aggregation thresholds (min 500 KES batch). |
| High Cellular Data Cost for Gateways | Med | Node admin operational loss | Enforce Squid local caching and negotiate Equitel bulk business data bundles (offering lower rates per GB than retail). |

  