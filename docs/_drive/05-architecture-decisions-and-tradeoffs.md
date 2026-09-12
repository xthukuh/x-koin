# **xKoin Architectural Decisions, Tradeoffs & Interactive Recommendations**

Purpose: To present optimal architectural choices for the xKoin MVP, highlighting concrete engineering pros, cons, and downstream consequences so the project direction is grounded in physical reality and maximum ROI.

## **DECISION POINT 1: Powerline Communication (PLC) Physical Layer**

### **The Dilemma**

How should xKoin transmit data over the electrical grid? Can we use low-cost UART modules, or must we support commercial broadband powerline adapters?

Option 1A: Narrowband FSK Carrier (e.g., KQ-130F / KQ-330)

  -  Injects low-frequency FSK/ASK carrier waves (120 kHz - 135 kHz) via UART serial at 9,600 baud.
  -  ~$7.50 USD (KES 975).
  -  Ultra-cheap, extremely simple microcontroller wiring (direct UART RX/TX), highly resilient over noisy long-distance electrical lines.
  -  Bandwidth is strictly limited to ~1.2 kbps to 9.6 kbps.
  -  COMPLETELY IMPOSSIBLE to stream video (YouTube or TikTok requires minimum 1.5 to 3.0 Mbps). It can only be used for smart-meter telemetry, text chat, and cryptographic voucher exchange.

Option 1B: Broadband PLC (BPL / HomePlug AV2 / Qualcomm AR7420, e.g., TP-Link TL-PA4010)

  -  Injects high-frequency OFDM carriers (2 MHz - 68 MHz) yielding physical link rates between 100 Mbps and 500 Mbps.
  -  ~$17.50 - $35.00 USD (KES 2,250 - 4,500).
  -  Delivers true broadband speeds (50-200 Mbps real-world throughput) over indoor AC mains. Fully supports multi-user 1080p/4K video streaming, web browsing, and downloads without running any Ethernet cables.
  -  Higher module cost, requires Ethernet/MII interface to the router.

Recommendation (Path of Least Resistance): Adopt Option 1B for the core consumer product. Use Broadband HomePlug AV modules for the primary residential data backbone, and retain Option 1A (KQ-130F) exclusively for low-cost off-grid utility metering and telemetry sub-nodes.

## **DECISION POINT 2: Edge Node Compute & Routing Architecture**

### **The Dilemma**

Should a single microcontroller handle all networking, Wi-Fi, NAT routing, captive portal, and cryptography, or should compute be split?

Option 2A: Monolithic Single ESP32-S3 Node

  -  A single ESP32-S3 microcontroller runs the Wi-Fi softAP, manages the captive portal, acts as an IP NAT router, drives the SX1262 LoRa module via SPI, controls the PLC module, and executes Ed25519 signature checks.
  -  Lowest hardware CapEx (~$4.50 chip cost), smallest physical enclosure footprint.
  -  The ESP32-S3 Wi-Fi stack has an effective real-world throughput ceiling of ~15-20 Mbps under heavy load. Handling multiple simultaneous TCP connections for HD video streaming while servicing cryptographic verification interrupts will lead to packet drops, RAM exhaustion, and watchdog resets.
  -  Fragile user experience during multi-user peak hours.

Option 2B: Dual-Tier Architecture (OpenWrt Router + ESP32-S3 Cryptographic Co-Processor)

  - Mechanism:
      
      -  A low-cost OpenWrt mini-router (e.g., GL.iNet GL-MT300N-V2 Mango, cost KES 3,500 - 4,200) handles high-speed 802.11n Wi-Fi, NAT table management, WireGuard VPN tunneling, and upstream traffic throttling.
      -  An ESP32-S3 acts as a secure co-processor connected via UART/USB to the router. It manages the Semtech SX1262 LoRa radio, handles Ed25519 signature checks, verifies gas vouchers, and tells the OpenWrt firewall (iptables / nftables) which client MAC/IP addresses are authorized to pass traffic to the WAN.
  -  Rock-solid stability, handles 30+ simultaneous streaming clients, full OpenWrt software ecosystem (WireGuard, Squid caching, QoS traffic shaping).
  -  Slightly higher initial CapEx (+KES 3,500 per primary gateway).

Recommendation: Adopt Option 2B for commercial xKoin-Nodes, while using Option 2A for lightweight satellite repeaters and remote solar units.

## **DECISION POINT 3: Distributed Ledger & Smart Contract Settlement Layer**

### **The Dilemma**

Which blockchain environment should host the xKoin Escrow, Token Ledger, and Automated Payout smart contracts?

Option 3A: Ethereum L1 or Polygon PoS

  -  Low fees (~$0.01 - $0.03), but experienced high gas volatility and re-orgs during peak traffic.
  -  Unusable due to prohibitive $2 - $20 gas fees per transaction.

Option 3B: Optimistic EVM Layer 2 (Base or Arbitrum One)

  -  Settle state-channel batches on Base (Coinbase L2) or Arbitrum One.
  -  Ultra-low transaction fees ($0.001 - $0.005 per batch settlement post-EIP-4844 blobs). Deep USDC/fiat off-ramp liquidity. Native support for Account Abstraction (ERC-4337) and EIP-2612 gasless permits.
  -  7-day fraud-proof window for native L1 bridge withdrawals (mitigated by using instant liquidity providers / centralized exchange off-ramps).

Recommendation: Deploy on Base L2. Sub-cent fees ensure that a 5% protocol fee on a 50 KES voucher leaves over 95% net operating margin.

## **DECISION POINT 4: Backhaul & Mobile Money Integration Strategy**

### **The Dilemma**

Should we exclusively integrate with Equitel (Equity Bank) or include Safaricom M-Pesa?

Option 4A: Pure Equitel / Finserve Jenga API Path

  -  Lower merchant API transaction charges, seamless integration with Equity Bank accounts and Equitel MVNO data bundles. Perfect for rural agricultural hubs where Equity Bank dominates agency banking.
  -  Equitel holds ~3-5% of the consumer mobile subscriber market in Kenya; forcing everyday urban users to have an Equitel SIM creates massive onboarding friction.

Option 4B: Dual-Rail Integration (Safaricom Daraja STK Push + Equitel Jenga API)

  - Mechanism:
      
      -  Support both Safaricom M-Pesa (Daraja STK Push) and Equitel (Jenga API). A user enters their number, receives an instant PIN prompt on their phone, and gets connected immediately.
      -  Equip xKoin-Nodes with Equitel SIM cards to take advantage of low-cost enterprise data bundles on Airtel's national physical infrastructure.
  -  100% addressable market coverage in Kenya (Safaricom for consumer adoption + Equitel/Equity for backhaul savings and banking integration).

Recommendation: Adopt the Dual-Rail Integration. Never turn away a paying customer because of their SIM card provider.

  