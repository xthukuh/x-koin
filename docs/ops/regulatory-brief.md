# xKoin regulatory brief for counsel

Prepared 2026-09-09 from primary sources. Purpose: give the lawyer the exact questions to answer, with the technical facts they depend on, so the first meeting produces decisions rather than a fact-finding round.

## 1. What the system does, in regulator terms

- A mesh of small radios and power-line modems carries internet traffic between households and a gateway with a mobile-data backhaul.
- Users pay per verified byte. Balances are held as a token (XKN, 6 decimals, 1 base unit = 1 micro-KES) on a public blockchain, and are bought and redeemed through Equity (Jenga) and Safaricom (Daraja) APIs.
- Node operators earn XKN for bytes they carry and can cash out to a mobile wallet. A founder-controlled treasury takes a per-ticket fee and pays it to a fixed M-Pesa number.

## 2. Radio: 868 MHz LoRa and GFSK (Communications Authority of Kenya)

Source: CA Guidelines on the Use of Radiofrequency Spectrum by Short Range Devices, 2022 (Version B Rev 0), Annex I table for non-specific SRDs. https://www.ca.go.ke/sites/default/files/2023-06/Guidelines-on-the-Use-of-Radiofrequency-Spectrum-by-Short-Range-Devices-2022.pdf

| Sub-band | Max power | Access rule | Standard |
|---|---|---|---|
| 868.0 - 868.6 MHz | 25 mW e.r.p. | 1% duty cycle, or LBT+AFA | EN 300 220, EN 301 489, EN 60950 |
| 868.7 - 869.2 MHz | 25 mW e.r.p. | 1% duty cycle, or LBT+AFA | same |
| 869.4 - 869.65 MHz | 500 mW e.r.p. | 10% duty cycle, or LBT+AFA | same |
| 869.7 - 870 MHz | 5 mW e.r.p. | no requirement | same |
| 869.7 - 870 MHz | 25 mW e.r.p. | 10% duty cycle, or LBT+AFA | same |
| 865.0 - 868.0 MHz | 500 mW e.r.p. | only 4 sub-channels, adaptive power control, 10% for access points and 2.5% otherwise | RFID-style rules |

Section 4 states the Authority exempts SRDs operating within that table from type approval, on a non-interference, no-protection basis, with frequency, power and antenna not altered by the user. Section 4.1 requires that the manufacturer or importer be able to produce an ILAC-accredited lab test report on request.

Firmware facts counsel should know: the current firmware centres both LoRa and the 150 kbps GFSK mode at 868.1 MHz, which is the 25 mW, 1% duty-cycle sub-band, and configures the SX1262 power amplifier for +22 dBm (about 158 mW), roughly six times that ceiling before antenna gain. A gateway that carries paid traffic all day also cannot live inside 1% without listen-before-talk plus adaptive frequency agility (LBT+AFA), which the SX1262 can do. Both are firmware settings, not hardware limits. The engineering decisions (Martin) are: cap TX power to the sub-band limit, and either implement LBT+AFA or move bulk traffic to 869.4 - 869.65 MHz, where 500 mW and 10% apply. Until both are set the device is outside the exemption.

Questions for counsel:

1. Confirm the 2022 SRD guidelines are still the operative instrument after the KICA Radio Communication and Frequency Spectrum Regulations 2025 and the General Licensing Regulations 2026 (both on ict.go.ke). If the new regulations changed the SRD annex or the exemption, we need the new table.
2. Does "LBT+AFA" in the CA table carry the ETSI EN 300 220 definition, so an implementation to that standard satisfies the exemption?
3. Is a test report from the module manufacturer (Ebyte, Semtech reference design) enough for section 4.1, or must the assembled xKoin device be tested?

## 3. Power-line carrier at 120 - 135 kHz (KQ-130F)

The CA SRD table lists 119 - 135 kHz only as an inductive (RFID) band at 66 dBuA/m at 10 m under EN 300 330. Mains-conducted signalling in Europe is governed by EN 50065-1 (CENELEC bands B and C cover 95 - 148.5 kHz, with a CSMA rule in band C). The 2022 guidelines section 4.1 mentions energy "conducted by the transmitter onto the power lines" only as something to be measured.

Questions for counsel:

4. Which Kenyan instrument governs conducted mains signalling between premises: CA (radio), KEBS (product safety, KS IEC 60950 or 62368), or Kenya Power (use of its distribution network)? Injecting a carrier across the meter onto a Kenya Power feeder may be a use-of-network question.
5. Whether a device that couples to 230 V mains needs KEBS certification before field use in customer homes, independent of any radio question.

## 4. Importing the development kit

- KEBS PVoC: consignments from China shipped on or after 1 March 2026 need a Certificate of Conformity (Cotecna or Intertek) or face destination inspection at 5% of customs value. Personal-use goods under USD 100 are exempt. PVoC Manual v15, February 2026.
- Kenya has no de minimis. Duty, 16% VAT, 2.25% IDF and 1.5% RDL apply at any value.
- CA type approval applies to LTE modems (SIM7600 family). The SRD radios are exempt per section 2 above.
- Communications Equipment Distributor licence (CA, July 2026): applies to anyone importing or wholesaling communications equipment; KES 5,000 application, KES 250,000 licence, 0.4% of turnover annually with a KES 120,000 floor, penalties up to KES 1 million or three years. https://techweez.com/2026/07/21/communications-equipment-distributor-license-kenya/

Questions for counsel:

6. Does importing about a dozen development boards and modules for our own prototyping fall under the CED licence, or is that licence limited to commercial distribution? We need this in writing before the parcel ships.
7. Whether an import permit through the Trade Facilitation Platform is needed for the SIM7600 modules in development quantities.

## 5. Selling connectivity

Backlog item 9 in HANDOVER.md names "CAK transit-resale licensing". The network resells mobile data bought on an Equitel or Safaricom SIM to third parties over our own last-mile infrastructure.

Questions for counsel:

8. Which CA licence category covers a community network reselling data: Network Facilities Provider Tier 3, Application Service Provider, or the community networks framework CA has discussed since 2021? Fees and obligations for each.
9. Whether the mobile operator terms for data bundles permit onward resale, and what the operator can do if they do not.

## 6. Money: XKN, fiat bridging and payouts (Central Bank of Kenya)

Facts: XKN is bought with KES and redeemed for KES through the bridge; it is not lent, does not earn interest, and is spent on a service we provide. The bridge holds customer float on Equity and M-Pesa merchant accounts. Node operators receive KES payouts for service rendered.

Questions for counsel:

10. Is XKN e-money under the National Payment System Act and Regulations 2014 (CBK e-money issuer authorisation), a prepaid service credit, or a virtual asset? The answer decides whether we need a CBK authorisation or a partner bank to hold the float.
11. Virtual Asset Service Providers Act 2025: does a service that buys and sells a token on a public chain for KES fall within it, and which regulator (CBK or CMA) would supervise.
12. AML/KYC obligations for accepting M-Pesa and Equitel payments from the public and paying node operators; what customer identification we must collect and retain.
13. Tax: VAT on connectivity sold per byte, digital service tax exposure, withholding on payouts to node operators, and whether the treasury fee paid to the founder M-Pesa number is income at receipt.

## 7. Structure

14. Which entity should hold the Jenga and Daraja merchant agreements, the CA licences and the customer float. Jenga live onboarding needs a Certificate of Incorporation, current CR12 and all director IDs, so the company must exist before that step.
15. Terms of service for users and node operators, and the disclosure that balances live on a public chain.

## 8. What counsel does not need to decide

The founder-safety and no-custody-of-user-balances properties are enforced in the contracts (HANDOVER.md section 2 item 8). The lawyer should read them as facts about how the system behaves, not as proposals.
