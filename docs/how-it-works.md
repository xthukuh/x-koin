# How xKoin works: primitives, decisions, journeys

Written 2026-09-11 for Martin, after he described the product he had in mind (a crypto balance that lives in a user's own xKoin wallet, an identity derived from the wallet address, usable at any node, shareable between users, with a companion Android app) and asked how the implementation actually works, why it was built this way, and which of his expectations it already meets.

The short version: the implementation is that product, with the parts he listed either built or a small step away. XKN is a real token in the user's own wallet, the user's identity on the mesh is that wallet's address, and the spendable balance is one on-chain number every node can read. What is not built yet is listed plainly in section 6, with the smallest path to each.

Compliance is out of scope for this document by Martin's instruction; counsel owns it and anything they later constrain gets revisited then.

## 1. The picture in one paragraph

A user pays KES by M-Pesa or Equitel. The kiosk backend (gateway-api) sees the bank's confirmation and mints that many XKN, a token on the Base chain, into the user's wallet address, and hands the user a signed admission voucher. The user deposits XKN into the escrow contract, which is the network's shared prepaid meter. Any node that carries the user's traffic collects signed receipts as bytes flow, turns the last receipt into a signed ticket, and settles the ticket on chain in a batch: the escrow moves the owed amount from the user's deposit to the node operator's earnings and 5% to the treasury. Operators and the founder cash out through the same bridge in reverse. The mesh itself (PLC, LoRa, Wi-Fi) only moves frames; every claim about money is a signature checked against a counter, on the node and on the chain.

## 2. The primitives

Each one says what it is, why it is that way, and what it talks to.

### 2.1 Identity: the key is the account

A user is an EVM keypair (secp256k1). The address is the user id everywhere: the mint destination, the escrow deposit key, the field in every ticket, and the name other users will see in chat. There is no account table and no sign-up. On the mesh the client also holds an Ed25519 key for receipts; the node id is the first 8 bytes of the SHA-256 of that public key (spec Law 1). Both keys can derive from one seed, so the companion app stores one thing.

Why two key types: the chain speaks secp256k1 and nothing else, and Ed25519 verifies in under 4.5 ms on the ESP32-S3, which is what a node needs to check thousands of receipts. Using one algorithm for both would either slow the edge or require a signature scheme the chain cannot verify.

Talks to: the app or browser that holds the seed; the voucher (carries the address); tickets and receipts (signed by it).

### 2.2 XKN: the token

An ERC-20 on Base with 6 decimals, 1 XKN = 1 KES, base unit one micro-KES. It is minted only by an allow-listed bridge against a confirmed fiat receipt, and burned only by a bridge from its own balance. It supports permit (EIP-2612), so a user can authorise the escrow to pull tokens by signing a message, without holding any ETH.

Why a KES-pegged token on an existing chain rather than an own coin: a unit of account users already think in, no exchange rate inside the product, and a settlement layer (Base) whose gas costs a third of a Kenyan cent per settlement (docs/ops/critical-accounts/03-budget-and-sustainability.md) with no validators to run. An own chain would cost more than the network earns.

Why 6 decimals: the billing unit is 10 KB, and 0.05 KES per MB is 0.0005 KES per unit, which two decimals cannot express.

Talks to: the bridge (mint and burn), the escrow (deposit and payout), any wallet (plain transfers).

### 2.3 The bridge: fiat in, fiat out

gateway-api holds a hot key that the token contract lists as a bridge with a daily mint cap. On-ramp: `/buy-gas` sends an STK push (Daraja) or a merchant payment or M-Pesa push (Jenga); the bank posts a callback; the handler finds the pending order by reference, mints XKN to the user's address with the bank reference hashed into the event, and issues the voucher. Off-ramp: XKN sent to the bridge address triggers a send-to-mobile payout, then the bridge burns exactly what it paid.

Why a cap and a self-only burn: a stolen bridge key can create at most one day's cap of unbacked XKN and can destroy nothing that belongs to anyone else. That is the whole trust surface of the fiat boundary, and it is bounded on chain, not by policy.

Talks to: Daraja and Jenga; the token contract; the voucher issuer.

### 2.4 The voucher: admission that works offline

On a confirmed purchase the kiosk root key (Ed25519, server side) signs a small JSON voucher: the user's address, the amount, the fiat reference, the rail, issue and expiry times (24 h). Node firmware holds only the 32-byte public key and verifies the voucher without any network.

Why: nodes must admit paying users even when their backhaul is down (Law 2), and the alternative, asking the chain on every join, would make the mesh depend on the internet it is selling. The voucher proves "this address paid recently"; the balance itself lives on chain.

Talks to: the client (holds it), the node (verifies it at JOIN_REQ).

### 2.5 The escrow: one prepaid meter for the whole network

The user deposits XKN into the escrow contract, usually through the gasless permit path relayed by the kiosk. The contract keeps `deposits[user]`, one number per address, with no notion of which node the deposit is for. As nodes settle tickets, the contract moves value from that number to `earnings[nodeAdmin]` and the treasury. The user can withdraw any unspent deposit at any time.

Why a deposit rather than paying from the wallet balance directly: a node serving a client cannot wait for a chain transaction per packet. It needs a guarantee that money exists before the bytes flow, and the escrow deposit is that guarantee. Tickets are promises against it, and the contract caps every settlement at what is actually deposited (Law 6), so no promise can exceed the meter.

Talks to: the token (holds it), the treasury (fee), the relayer (settle), the user (deposit, withdraw), node admins (claim earnings).

### 2.6 Receipts and tickets: pay per verified byte

As data flows, every RECEIPT_INTERVAL of acknowledged bytes the client signs a receipt: client id, node id, session nonce, cumulative bytes, sequence (Ed25519, 108 bytes, fits one narrowband PLC frame). The node keeps only the latest. A node extends at most twice the interval of unproven credit; a client that stops signing gets throttled, then dropped (Law 3).

For settlement the node maps the final receipt to a Ticket: client, node admin, sequence number, cumulative units (10 KB each), epoch expiry, signed by the client's EVM key under EIP-712. The relayer batches tickets from many clients into one `settleTicketBatch` call.

Why cumulative counters: losing any intermediate receipt or ticket loses nothing, because only the latest matters and the contract pays the delta over what it already settled. Replay pays nothing because sequences are monotonic (Law 5). The node is paid for signed bytes and for nothing else, which is why spam, beacons and Sybil nodes earn zero.

Talks to: the client (signs), the node (stores latest, maps to ticket), the relayer and escrow (settle).

### 2.7 The treasury: the founder's cut, unstealable

Every settlement transfers 5% (capped at 10%) to the treasury. Anyone can call `claim`, and it can only pay the beneficiary address. Changing the beneficiary takes seven public days and the current beneficiary can veto.

Why anyone-callable with no destination parameter: the founder must be paid without anyone, including the founder's own stolen key, being able to redirect a micro-KES. Spec 8.1 lists the rest.

Talks to: the escrow (receives fees), the beneficiary (receives claims), the payout worker (turns claims into KES).

### 2.8 The relayer and the node operator

The node operator is the `nodeAdmin` address in every ticket the node collects. The relayer is whatever submits batches; today it is gateway-api, and it holds no privilege: signatures and counters gate everything, so anyone could run one. The operator claims earnings to any address, and the same off-ramp as the founder turns them into M-Pesa.

Why the operator is an address, not a device: a device can be replaced, re-flashed or stolen; the money goes to whoever holds the operator key.

### 2.9 The mesh: frames, mediums, phases

Three mediums (HomePlug AV for bulk, KQ-130F narrowband PLC for receipts and control, LoRa for discovery and survival) plus Wi-Fi for client attach. One frame format across all of them with a CRC (Law 8), four phases (discovery, admission, transfer, proof) and a settlement phase that leaves the mesh. Senders pick the medium with the best live score, so grid failure degrades to LoRa instead of stopping the network.

Why medium-agnostic frames: the money layer must not care whether a byte came over a power line or a radio, so receipts and vouchers are the same bytes everywhere and the C firmware, Python reference and Solidity all verify the same test vectors.

## 3. How they interact

| Step | Who | Talks to | Result |
|---|---|---|---|
| Buy | user (app or portal) | gateway-api `/buy-gas` | STK push to the phone; pending order keyed by reference |
| Confirm | bank | gateway-api callback | `bridgeMint` to the user's address, voucher issued |
| Fund the meter | user, relayed by kiosk | escrow `depositWithPermit` | `deposits[user]` rises; no ETH needed by the user |
| Join | client | node JOIN_REQ with voucher | node verifies offline, JOIN_ACK |
| Check balance | node | gateway-api (reads escrow) | node grants a session credit limit at most the known deposit |
| Use | client and node | DATA over the best medium | receipts every interval, latest kept |
| Settle | node, relayer | escrow `settleTicketBatch` | deposit down, operator earnings up, treasury fee |
| Claim | operator | escrow `claimEarnings` | XKN to the operator's address |
| Cash out | operator or founder | token transfer to bridge, payout worker | M-Pesa credit, bridge burns the same amount |
| Fee | anyone | treasury `claim` | XKN to the beneficiary |

## 4. Decisions and the reasoning behind them

1. **Base chain, not an own chain.** Settlement costs a third of a cent and there is nothing to operate. The network's value is in the mesh and the bridge, not in consensus.
2. **KES peg, backed by the kiosk float.** Users buy in KES and see KES. Every XKN in existence was minted against a bank confirmation, and the bridge burns on every payout, so circulating XKN equals the float held at Equity. There is no exchange rate for the product to get wrong.
3. **Escrow deposit as the meter, not the wallet balance.** Nodes need a pre-funded guarantee that survives the client vanishing mid-session. The deposit is withdrawable, so the user loses no flexibility.
4. **Global deposit, not per-node.** One number per user, readable by every node. Buy once, use everywhere follows from this, see 5.1.
5. **Off-chain receipts, on-chain settlement in batches.** Per-packet chain transactions are impossible; per-session ones are too expensive at Kenyan prices. Batches settle when the fee covers the gas.
6. **Cumulative counters everywhere.** Loss-tolerant, replay-proof, and the node stores one receipt per client instead of a log.
7. **Vouchers verified offline.** Admission cannot depend on the internet the network sells.
8. **Two key types from one seed.** Chain-native and edge-fast, without asking the user to manage two secrets.
9. **Founder economics without founder risk.** Fee capped, price banded, beneficiary timelocked with veto, claim anyone-callable and destination-fixed, no key can burn a user's balance. The network keeps settling if the founder disappears.
10. **Owner-set price for MVP.** Centralised and admitted as such; the band and cooldown bound the harm, and the price floor must clear measured backhaul cost before it is set.
11. **Simplest fiat path first.** Jenga covers both legs with one merchant account; Daraja is the second bridge because the contracts do not care which bridge minted.

## 5. Martin's two questions

### 5.1 Buy once, use at any node; balance visible to all nodes; share between users

**Supported by construction, with one operational rule to add.** The escrow keeps one `deposits[user]` for the whole network. A ticket names the node admin who served the bytes, so any node can settle against the same deposit. A node learns the balance the way Martin described: on demand, when the client first sends WAN traffic, the node asks gateway-api, which reads the escrow. gateway-api caches it and refreshes on every settlement. Nodes keep no global table; they keep the sessions they are serving.

The rule to add: a node grants each session a credit limit, the smaller of the last known deposit and a per-node cap (say 20 KES), and settles when the limit is half used. Without it, a user attached to several nodes at once could run all of them past one deposit; the contract pays each node only up to what is left (Law 6), so nothing goes insolvent, but the last node to settle would be underpaid. With it, the worst case for a node is one cap of bytes, which the two-times-interval rule (Law 3) already bounds further. When backhaul is down the node cannot ask, so it serves against the voucher alone up to a smaller offline cap. This rule lives in the node's session manager and in gateway-api's balance endpoint; no contract change.

**Sharing XKN between users at the same value: yes, three ways, one recommended.** XKN is an ordinary ERC-20, so a wallet-to-wallet transfer already works and costs about 0.1 KES of gas. The catch is that users hold no ETH, by design. So:

| Option | How | User cost | Work | Recommendation |
|---|---|---|---|---|
| A. Escrow-internal transfer, relayed | New escrow function `transferDeposit(from, to, amount, nonce, deadline, sig)`: the sender signs an EIP-712 authorisation, the kiosk relays it and pays the gas, the contract moves value between two deposit entries | Free to the user; operator pays about 0.1 KES gas per transfer | About 40 lines of Solidity plus tests, one gateway route, one app screen | Recommended. Keeps value 1:1, gasless, and the recipient can spend at any node immediately |
| B. Token transfer via permit, relayed | Sender signs a permit for the recipient, kiosk relays `transferFrom` | Free to user, same gas for operator | Gateway route only, no contract change | Moves wallet balance, not the meter; the recipient then needs a deposit step. Fine as a fallback |
| C. Off-chain IOUs settled later | Users exchange signed IOUs, kiosk nets them at settlement | Free | New protocol surface, new failure modes | Not for MVP |

Option A makes XKN a loose trade currency inside the community from day one: the app shows a QR of the recipient's address, the sender confirms an amount, and the relayed transaction lands in seconds. The operator's gas cost is the "free" in free transfers, and at 0.1 KES it is a rounding error against the 5% fee.

### 5.2 The companion app (Android first)

**Agreed, and it should be MVP scope on the client side.** Today the client key has nowhere durable to live: a captive-portal page can generate one in the browser, but it dies with cleared site data and cannot roam. The app is the xKoin wallet Martin imagined, and its minimum is small:

- One seed, stored in the Android Keystore, backed up as 12 words. Derives the EVM key (address, tickets, transfers) and the Ed25519 key (receipts).
- Balance screen: wallet XKN, escrow deposit, both read through gateway-api or an RPC.
- Buy: enter amount and phone, receive the STK push, watch the mint land, deposit into the escrow with one tap (permit, no gas).
- Auto-sign: the app signs receipts and tickets in the background while attached to any xKoin AP, and presents the voucher on join. This is what makes roaming work: the identity travels in the phone.
- Send: scan a QR, enter amount, relayed transfer (option A above).
- Withdraw to M-Pesa: sign a request, the bridge pays out and burns.

The later layers Martin listed fit on top without changing the money layer: community chat over the local LAN with messages signed by the same key (identity for free, no server), a directory of the node's free local resources, and the phone as a temporary cache or relay host. None of those touch the escrow, which is the point: the money layer stays small and proven while the experience layer grows.

Build choice, ranked: Kotlin with the Android Keystore (best key security, one platform), or React Native with a native keystore module (iOS later at low cost, weaker default key handling). Recommended: Kotlin for the MVP; the app is thin and the key handling is the part that matters.

## 6. Journeys

Each journey is the sequence a user or operator actually experiences, with the primitive doing the work in brackets. Status: built, partial, or proposed.

**J1. First purchase from a phone without the app (built)**
- Connect to the xKoin Wi-Fi; the captive portal opens.
- Portal generates a keypair in the browser and shows the address.
- Enter amount and M-Pesa number; STK push arrives; enter PIN.
- Bank confirms; gateway mints XKN to the address and issues the voucher [bridge, voucher].
- Portal relays the permit deposit; the meter is funded [escrow].
- Client joins the node with the voucher and browses; receipts sign in the background [receipts].
- Weakness: the key lives in the browser. J2 fixes it.

**J2. First purchase with the app (proposed, MVP)**
- Install from the Play Store, create the wallet, write down 12 words.
- Buy: amount, phone, STK push, PIN.
- Mint lands; one tap deposits into the escrow.
- Attach to any xKoin AP; the app presents the voucher and signs receipts.

**J3. Roam to another node (built on chain, rule pending on node)**
- Attach to a second AP, same phone, same key.
- Node verifies the voucher offline, admits [voucher].
- On first WAN request the node asks gateway-api for the deposit, grants a session credit limit [escrow read, node rule].
- Bytes flow; receipts and tickets name this node's operator; settlement draws from the same deposit [escrow].

**J4. Run low mid-session (built)**
- Node sees the granted limit nearly used, settles the ticket, re-reads the deposit.
- If the deposit is near zero the node throttles then drops; the app shows the balance and a buy button.
- Top up (J2 steps 2 and 3); the node re-reads and restores full service.

**J5. Send XKN to a friend (proposed, option A)**
- Friend shows a QR of their address in the app.
- Sender scans, enters 50 KES, confirms with fingerprint; the app signs the authorisation.
- Kiosk relays; the escrow moves 50 KES between the two deposits, gas paid by the operator.
- Friend's app shows the new balance; usable at any node at once.

**J6. Cash out as a user (proposed, MVP+1)**
- App: withdraw 200 KES to M-Pesa.
- App signs a withdrawal from the escrow to the wallet, then a transfer to the bridge with the MSISDN in the memo.
- Payout worker pays out by send-to-mobile, then burns the same amount [bridge].
- Today only the founder path is wired; user path reuses it with a per-user MSISDN instead of the pinned one.

**J7. Node operator earns and cashes out (built)**
- Operator installs a node, sets the operator address in its config.
- Users attach and browse; the node collects receipts, relays tickets in batches [receipts, relayer].
- Escrow credits `earnings[operator]` on each batch; operator calls `claimEarnings` to their address.
- Operator sends XKN to the bridge; payout to their M-Pesa; bridge burns [bridge].

**J8. Founder fee (built)**
- Every batch pays 5% to the treasury.
- Anyone calls `claim`; XKN goes to the beneficiary cold address.
- Beneficiary transfers to the bridge; payout worker checks the pinned MSISDN and pays out; burns.

**J9. Backhaul down at a node (built at the protocol layer)**
- Node cannot reach gateway-api; mesh degrades to LoRa for control if PLC is also down.
- Node admits voucher holders offline and serves up to the offline cap.
- Receipts accumulate; tickets settle when backhaul returns; nothing is lost (cumulative counters).

**J10. Lost phone (proposed, with the app)**
- Restore the 12 words on a new phone; same address, same deposit, same voucher validity.
- Nothing to ask anyone for; the balance was never in the phone.

**J11. Stolen server key (built)**
- Attacker can mint at most one day's cap and burn only the bridge's own balance.
- Owner revokes the bridge; new key; users' balances untouched.

**J12. Community chat and local resources (proposed, after MVP)**
- App discovers peers on the node's LAN; messages are signed by the wallet key, so the address is the handle.
- Node publishes a list of free local resources (files, media, compute) that cost no XKN.
- The phone can offer itself as a cache or relay host for the LAN; no money moves.

## 7. What ships in the first MVP, proposed

Ordered by the shortest path to a network that earns and a user who can roam, and by what is already built.

| Rank | Feature | Why now | Cost |
|---|---|---|---|
| 1 | Session credit limit and balance-on-demand in node and gateway-api | Makes roaming safe for operators (5.1) | Firmware session manager plus one gateway route |
| 2 | Escrow-internal relayed transfer (option A) | Free sharing, trade-currency feel, gasless | ~40 lines Solidity, tests, one route |
| 3 | Android app, minimum set from 5.2 | Durable identity, roaming, buy and send in one place | The largest item; Kotlin, four screens |
| 4 | User off-ramp through the existing payout worker (J6) | Completes the loop for users, not only operators | Generalise the worker's MSISDN source |
| 5 | Real-chain proof phases 1 to 5 | Confidence before Equity live | docs/ops/critical-accounts/05-test-plan.md |

Deferred without loss: chat, local resources, phone as cache or relay, federated kiosk keys, non-owner pricing. Each sits above the money layer and none changes a contract.

Decisions this proposal needs from Martin, ranked:

1. Include the relayed transfer in MVP (recommended: yes, it is small and it is the feature that makes XKN feel like money between people).
2. App stack: Kotlin (recommended) or React Native.
3. Per-node session cap for MVP (recommended: 20 KES online, 5 KES offline), to be tuned from pilot data.
