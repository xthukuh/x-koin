# Wallet roles: one address per job

The isolation Martin asked for is not a feature to add; it is how the
contracts already move money. Client deposits sit in the escrow and can only
leave as a client withdrawal or as a settlement to a node admin's earnings
plus the treasury's fee. Fees sit in the treasury and can only leave to the
beneficiary. The bridge can only burn what it holds itself. What this file
adds is the discipline on the key side: which address plays which role, where
its key lives, and how to change any of them without touching the others.

## The roles

| Role | Holds | May do | Key lives | Gas needed | Test stand-in | Production |
|---|---|---|---|---|---|---|
| Deployer | ETH for one deploy | Deploys, then transfers ownership to the Safe and is discarded | Laptop, deploy day only | Deploy gas | `cast wallet new` | Same, fresh per deployment |
| Owner | Nothing | Set price within band, fee within cap, bridge caps, queue a beneficiary change; accept ownership | Safe 2-of-3 | Signers pay gas | Safe on Sepolia with 3 stand-in signers | Safe on Base, two hardware devices plus counsel |
| Beneficiary (founder cold key) | XKN fees after claim | Receive fees, veto a beneficiary change, sign the payout MSISDN pin | Hardware wallet | Almost none (veto is rare) | Stand-in seed in Rabby labelled TESTNET | Hardware wallet, first address |
| Bridge (hot) | XKN in transit during payouts; ETH for gas | `bridgeMint` up to the daily cap, `bridgeBurn` its own balance | VPS `.env` | Every mint and burn | `cast wallet new` | New key on the VPS, never the test one |
| Relayer (hot) | ETH for gas only | `settleTicketBatch`, `claim` on the treasury | VPS `.env` | Every batch | `cast wallet new` | Separate key from the bridge |
| Gas reserve | ETH | Top up bridge and relayer when they fall below threshold | Laptop wallet, or hardware wallet second account | None of its own | Faucet ETH | The address whitelisted on Binance |
| Test client | XKN deposit, a little ETH | Deposit, sign tickets, withdraw | Laptop | Deposit only (permit path needs none) | `cast wallet new` | Real users' devices |
| Test node admin | XKN earnings | Claim earnings | Laptop | Claim only | `cast wallet new` | Node operators |

Why the relayer is separate from the bridge: the relayer's transactions are
frequent and its key is used constantly, but it has no privilege on any
contract. A leaked relayer key loses the gas in it and nothing else. The
bridge key can mint up to the cap, so it is used only when fiat arrives, and
the cap on it is the safety net. Two keys, two blast radii.

Why the gas reserve is not on the server: a server that can refill itself
from a large pool turns any compromise into a drain of the pool. The reserve
tops up in small amounts, by a person or by a signed job from the laptop, and
the hot wallets hold days of gas, not months.

## Generating the hot keys

On the machine that will use them, or on the laptop and moved once over SSH:

```bash
cast wallet new
```

Prints an address and a private key. The private key goes straight into the
`.env` for that environment and into the password manager under the role
name and chain; the address goes into [registry.md](registry.md). Generate a
different key for every role and every chain: the Sepolia bridge key is not
the Base bridge key.

For the founder cold key and the Safe signers, the hardware wallet generates
the key and it never leaves the device.

## How addresses reach the software

Contract addresses are public and stable per chain, so they are committed:
the deploy script writes `contracts/deployments/<chainId>.json` on every
broadcast (Base Sepolia is `84532.json`, Base is `8453.json`; the local
anvil file `31337.json` is git-ignored). A session on any device reads the
same file.

Secrets and role keys live only in a per-environment env file that is never
committed. `.gitignore` already excludes `.env` and `.env.*` and keeps the
templates:

| File | Where | Holds |
|---|---|---|
| `gateway-api/.env.example` | repo | Every variable name, empty |
| `gateway-api/.env.sepolia.example` | repo | The phase 1 to 4 shape: Sepolia chain id, public RPC, dry run off, placeholders for addresses |
| `gateway-api/.env` | laptop, VPS | The live values for the environment that machine runs |

The gateway reads `.env` from its working directory through
`app/config.py`; every variable is prefixed `XKOIN_`. Switching the VPS from
Sepolia to Base is a change of six lines in that file (RPC, chain id, three
contract addresses, the bridge key) and a restart. The three addresses are
copied from the deployments file for that chain, nothing is typed from
memory.

## Rotating or transferring a role

Every role has a path that does not disturb the others. Order matters: the
new key is live before the old one is revoked, so the service never has a
moment with no valid key.

**Bridge key.** Generate the new key. Owner (Safe) calls
`setBridge(newAddress, true, cap)`. Update `.env`, restart the gateway,
confirm a mint from the new address on the explorer. Owner calls
`setBridge(oldAddress, false, 0)`. Move any XKN left on the old address to
the new one first; it is the bridge's own balance and only it can burn it.

**Relayer key.** Generate, fund with gas, update `.env`, restart. The old key
has no privilege to revoke; sweep its ETH to the reserve.

**Beneficiary.** Owner calls `queueBeneficiary(new)`. Seven days later anyone
calls `activateBeneficiary()`. During the seven days the current beneficiary
or the owner can cancel. This is the one change that is deliberately slow,
because it is the one that redirects the founder's money. Rehearsed in phase
3 of [05-test-plan.md](05-test-plan.md).

**Owner.** Safe owner set changes are done inside the Safe (add owner, remove
owner, change threshold). Moving to a different Safe entirely means
`transferOwnership(newSafe)` from the old Safe on each of the three
contracts, then `acceptOwnership()` from the new Safe on each.

**Kiosk root key, Jenga RSA key, Daraja credentials.** Server-side only, as
in [docs/ops/key-management.md](../key-management.md) section 2; none of them
touches the chain.

## The one address that must never change casually

The beneficiary. It is where every fee ends up, forever, and the contracts
make it hard to change on purpose. Before the mainnet deployment, the
beneficiary is the hardware wallet's first address, checked on the device
screen, checked again by sending a dust amount of ETH to it and seeing it
arrive, and written into the register with the date and the device serial.
The deploy script refuses to run on any real chain without an explicit
`BENEFICIARY_ADDRESS`, so the "default to deployer" convenience cannot leak
past the local chain.
