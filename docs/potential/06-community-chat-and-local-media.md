# 06. Community chat and local media

*The free LAN plane is a place, not a discount: signed chat where the wallet address is the handle, a local media mirror, a directory of what costs nothing, and phones that host the cache. Explicitly after MVP.*

## 1. The situation

Kibera, Nairobi, in a block of rooms off Kamukunji Road where a single node
serves perhaps sixty phones within Wi-Fi reach. Mercy Atieno is nineteen, in
her second year of a diploma, and her phone is her only computer. She has a
smartphone and almost never has data on it. Her pattern is the common one: she
buys a small bundle, spends it on the things she must do, and spends the rest
of the day on a phone that is technically online and practically not.

What she does with the phone when it has no data is revealing. She reads things
she saved. She swaps files with friends by Bluetooth and by SHAREit-style
direct transfers. She uses the phone as a camera, a music player and a torch.
The device is full of capability and starved of a network.

The node in her building has a Wi-Fi signal she can associate with for free,
because association is free and only WAN forwarding is metered. Today that
association gives her a captive portal and nothing else. This document is about
what else it could give her, and it is explicitly after the MVP.

## 2. What breaks today

The local internet does not exist as a place people go, and three things
prevent it.

Every social product is remote. A message from Mercy to a friend fifteen metres
away travels to a data centre on another continent and back, and costs both of
them data to do it. The distance is economic rather than physical, and it makes
proximity worthless.

Identity is rented. Every chat application requires an account with a provider,
a phone number verification, and a connection to establish it. Nobody can start
a conversation on a network that has no internet.

Storage is idle. The building contains sixty phones with a few gigabytes of
free space each, holding content that other people in the building would want.
There is no mechanism to offer it that does not involve a person walking over
with a cable.

## 3. The xKoin composition

The hardware is the same hardware. This case adds no devices; it adds software
above the money layer.

| Device | Count | Role in this case |
|---|---|---|
| xKoin-Node | 1 | Hosts the local media mirror and the directory; routes local traffic without metering |
| xKoin-Node-Satellite | 2 or 3 | Extend Wi-Fi coverage through the block on the mains |
| xKoin-Client | 60+ | The phones. Chat client, cache host, signer |

One plane only: the free LAN plane. Nothing in this case touches the escrow,
the bridge, the treasury or a receipt. That is the design constraint and it is
the reason the case is deferrable without loss
([../how-it-works.md](../how-it-works.md) section 7).

Three services:

**Signed chat.** The Android companion app holds one seed in the Android
Keystore and derives an EVM key and an Ed25519 key from it. A message on the
LAN is signed by that key, so the address is the handle. No account, no
registration, no server. Two phones in the same building exchange messages
through the node without a byte leaving the block, which means without a
shilling.

**A local media mirror.** The Node carries storage. What goes on it is a
community decision: news text, a text encyclopaedia, government forms,
past papers, locally recorded audio, a church or mosque notice board, a stage's
route information. Serving it is free LAN traffic and stays free at any price.

**A directory of free resources.** The Node publishes what costs nothing. This
is the small piece that makes the rest discoverable: a page, served on
association, that says here is what you can use without paying. Today that page
is the captive portal and it only sells.

**The phone as cache host.** A client can offer itself as a cache or relay host
for the LAN. Mercy's phone, with four gigabytes free, holds a copy of something
popular; another phone on the block reads it from her rather than from the
Node. No money moves, by design. This is the piece furthest from built.

## 4. Internals: which primitives do the work

**Identity, reused.** Law 1 says the key is the account, and this case simply
takes that seriously in a second context. The wallet address is already the
identity for admission, tickets and transfers. Using it as a chat handle costs
nothing to build, because the key is already in the phone and already signing.
A user who restores their 12 words on a new phone restores their chat identity
along with their balance.

**The free LAN boundary.** The packet classifier routes local subnet and mesh
traffic without metering and blocks WAN forwarding until a session exists. Chat
between two clients on the same node is local at every hop. There is no
metering code in that path, which is why the service can be offered to people
with a zero balance without any policy about who deserves it
([../papers/04-settlement-and-economics.md](../papers/04-settlement-and-economics.md)).

**The absent primitives.** No voucher is needed, because admission to the free
LAN is association. No receipt is generated, because no WAN service is
rendered. No ticket, no settlement, no gas. A chat message costs the operator
the electricity to move it and nothing else.

**What XKN does add, once.** Because the handle is a wallet address, a person
in the chat can send another person XKN with a relayed escrow transfer: scan a
QR, enter an amount, confirm, and the value moves between two deposits with the
operator paying the gas ([../how-it-works.md](../how-it-works.md) J5). Chat and
money share an identity for free. A user with no data can be given data by a
neighbour, in a conversation, without either of them holding ETH or leaving the
building.

**Moderation, unsolved.** A network where identity is a keypair and there is no
account table is a network with no natural way to ban anyone. A node operator
can refuse to relay a node id, which is weak, and a community can ignore an
address, which is social. Neither is a solution. Any pilot that puts strangers
in a shared chat has to answer this before it starts, and the protocol does not
answer it.

## 5. A day in the life

A Saturday, with Mercy's phone at zero balance all day.

| Time | Event | Plane | Cost |
|---|---|---|---|
| 07:10 | Phone associates with the block's Wi-Fi. The directory page opens: what is free here | Free LAN | 0 |
| 07:15 | She opens the local news text mirror, refreshed by the Node overnight | Free LAN | 0 |
| 09:00 | Group chat for the block: someone has water, someone is selling a gas cylinder | Free LAN | 0 |
| 09:30 | A neighbour posts a photograph of a lost dog. It is stored on the Node, not in a cloud | Free LAN | 0 |
| 11:00 | She reads two chapters from the cached encyclopaedia for an assignment | Free LAN | 0 |
| 13:20 | A friend's phone, acting as a cache host, serves her a recorded lecture the Node does not carry | Free LAN, peer to peer | 0 |
| 15:00 | She needs the public internet for ten minutes to submit the assignment | Paid WAN | Metered, and she has nothing |
| 15:02 | She asks in the chat. Her cousin sends 20 KES of XKN to her address | Chain, relayed | Gas paid by the operator |
| 15:04 | Deposit lands. Node reads it, grants a session, she submits | Paid WAN | Metered |
| 19:00 | Evening. Forty clients on the LAN, three of them paying | Mixed | Most rows are zero |
| 22:00 | Node settles the day's three paying clients in one batch | Chain | One batch fee |

Eleven rows, two of which cost anything. The operator's revenue came from
fifteen minutes of one student's assignment and the network was useful to
everyone else all day. Whether that is a business is section 6.

## 6. Economics, with conditions

This case has no revenue of its own. Stating that plainly is more useful than
constructing one.

Every shilling figure elsewhere in this set is conditional on a pricing
decision (spec section 8). Here there is nothing to price, because the free LAN
plane never enters the proof layer. The economics are therefore entirely
indirect, and the indirect claim has to be measured rather than asserted:

- **The retention argument.** A node whose free plane is worth associating with
  keeps phones associated. A phone that is associated is a phone that buys WAN
  when it needs WAN, without first having to find and choose a network. This is
  plausible and unproven, and a pilot measures it by comparing paid conversion
  on nodes with and without a populated free plane.
- **The cost side is real and small.** Local traffic costs the operator
  electricity and storage. A local mirror is a one-time download and a
  scheduled refresh, both metered once at the node's own cost, then served an
  unlimited number of times for nothing.
- **The transfer feature is the one with a direct cost.** Every relayed escrow
  transfer costs the operator about 0.1 KES of gas
  ([../how-it-works.md](../how-it-works.md) section 5.1). At scale in a chat
  where people flick small amounts to each other constantly, that is no longer a
  rounding error against a 5% fee, and it needs a rate limit or a minimum
  amount. <!-- TODO: verify -->
- **Storage on the Node costs money once.** A larger mirror is a larger card.

The honest summary: this case makes the network worth having and does not make
it money. It belongs after the MVP for exactly that reason, and building it
before the money layer is proven would be building the roof first.

## 7. What could go wrong, and what answers it

| Risk | Answer | Mechanism |
|---|---|---|
| The chat is used to harass, defraud or organise harm | Unsolved by the protocol. Identity is a keypair with no account table, so there is no ban. A pilot must define moderation before strangers are put in a room together | Open, blocking for pilot |
| Someone floods the LAN chat | Rate limiting at the node is a config, and it is the only lever. Note that flooding the free plane earns the attacker nothing and costs the operator only electricity | Node policy, spec section 7 |
| Illegal content on the Node's mirror or on a phone cache host | The operator is hosting. This is a real liability question and it has no technical answer; content policy and takedown have to exist before the mirror does | Open |
| Data protection obligations for messages stored on a node | Open. Messages on a community node are personal data under the Data Protection Act 2019 and someone is the controller. Counsel has not been asked this | Open, add to the brief |
| Relayed transfers drain the operator's gas | Rate limit, minimum transfer amount, or make the sender pay from their deposit. A decision, not a defect | Escrow config |
| A cache-host phone is treated as a service provider | Unclear and unexamined. A phone serving files to neighbours is a new posture and the pilot should not include it until the simpler pieces are settled | Open |
| Users assume chat is private | Frames support an encryption flag, and whether the chat uses it end to end is an app decision that must be made and documented, not assumed | Spec section 2, bit1 |

## 8. What would have to be true to pilot this

1. The MVP money layer working first. This case is explicitly deferred, and the
   deferral is in [../how-it-works.md](../how-it-works.md) section 7.
2. The Android companion app shipped, because signed chat with the wallet key
   requires a durable key, and a browser-generated key that dies with cleared
   site data is not one.
3. A moderation model, written down, with a named person who acts on reports.
   This is the blocking item and it is not a technical one.
4. A content policy for the Node mirror, including what may be mirrored and who
   answers a takedown.
5. Counsel's answer on Data Protection Act obligations for a node operator
   holding community messages. This question is not currently in
   [../ops/regulatory-brief.md](../ops/regulatory-brief.md) and should be added.
6. A measurement plan for the retention claim, so the case is either supported
   by conversion data or dropped, rather than defended by anecdote.
