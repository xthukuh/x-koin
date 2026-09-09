# Accounts to open, in order

Each entry says where, what it is for, what to collect into the register, and
what to switch on before leaving the page. Amounts and fees shown on any
exchange screen change daily; the numbers here are what the plan needs, the
screen is the truth on the day.

## 1. Binance (exists, harden it today)

Purpose in this plan: buy a small amount of ETH and withdraw it to the gas
reserve wallet on Base. Nothing else. It is not a place to keep the founder's
keys and it is not part of the production design.

Do these in the app under Profile, then Security:

1. Two-factor authentication with an authenticator app (Google Authenticator,
   Aegis or 1Password), and remove SMS as a 2FA method once the app works.
   SIM swap fraud is common in Kenya and SMS codes are the usual way in.
2. Passkey or a hardware security key if the phone supports it. It replaces
   the password prompt with something that cannot be phished.
3. Anti-phishing code: a word that Binance puts in every genuine email. An
   email without it is fake, however good it looks.
4. Withdrawal whitelist: turn it on, then add the gas reserve address (from
   [02-wallet-roles.md](02-wallet-roles.md)) as the only whitelisted address.
   New addresses get a 24 hour hold; that hold is the protection.
5. Device management: remove any device that is not the phone in hand.
6. Email: the Binance login email gets its own long password and its own 2FA,
   held in a password manager. An attacker who owns the mailbox owns every
   account that resets through it.

Collect for the register: nothing secret. Record the account's UID (Profile
page) so the register can say which account holds the reserve.

### Moving money: USDT to ETH to Base

When phase 5 starts, and not before:

1. Trade, then Convert: USDT to ETH, about 2 USDT worth. Convert has no
   trading fee, only the quoted rate. Do not use the spot order book for this
   size; minimum order sizes and the taker fee make it worse.
2. Wallet, Withdraw, ETH. Network: **Base**. The screen lists several
   networks for ETH; Ethereum (ERC20) costs many times more in fees, and BNB
   Smart Chain or Arbitrum would deliver the ETH to a chain where the gas
   reserve wallet has no use for it. The address is the same string on every
   EVM chain, so a wrong network does not fail, it just lands the funds
   somewhere else.
3. Address: the gas reserve address from the whitelist. Compare the first
   six and last six characters against the register before confirming.
4. Read the minimum withdrawal amount and the network fee on that screen and
   write both into the register with the date. If the minimum is above the
   2 USDT target, withdraw the minimum; the extra sits in the reserve and is
   not lost.
5. Confirm with 2FA. The transaction hash on Basescan is the receipt; paste
   it into the register.

Everything above is Martin's hand on Martin's phone. The session never asks
for the Binance login, the 2FA code, or the withdrawal confirmation.

## 2. Hardware wallet (order now, long lead)

Purpose: the founder cold key, the treasury beneficiary. Full procedure in
[docs/key-management.md](../key-management.md) section 3. Order two of the
same model from the maker's own site, never a reseller:

- Ledger: https://shop.ledger.com (Nano S Plus is enough; Flex or Stax add a
  bigger screen, nothing the plan needs)
- Trezor: https://trezor.io/store (Safe 3 is enough)

Both ship to Kenya. Customs may add duty; budget for it. Until the devices
arrive, phases 0 to 4 use a testnet-only stand-in key that is clearly
labelled as such and never holds anything real.

## 3. Wallet software on the laptop (free)

Purpose: the human-driven steps, which are signing Safe transactions on Base
Sepolia and later on Base, and looking at balances. Install Rabby
(https://rabby.io) or MetaMask in a **dedicated browser profile** used for
nothing else, no other extensions. Rabby is preferred because it shows what a
transaction will do before signing and warns on known scam contracts.

Create a fresh seed inside it and label it TESTNET STAND-IN. When the hardware
wallet arrives, connect it to the same software; the software then only
displays, the device signs.

Add Base Sepolia (chain id 84532, RPC https://sepolia.base.org, explorer
https://sepolia.basescan.org) and Base (chain id 8453) as networks.

## 4. Coinbase Developer Platform, for the Base Sepolia faucet (free)

Purpose: free test ETH for every wallet in phases 1 to 4.

1. https://portal.cdp.coinbase.com, sign up with the project email, 2FA on.
2. Products, Faucet, network Base Sepolia. One claim per day per account,
   paid to any address you paste.
3. Claim first to the deployer address, then to the relayer, the bridge and
   the beneficiary stand-in on the following days, or forward from the
   deployer with `cast send`.

Fallbacks if the daily amount is not enough: the Alchemy faucet
(https://www.alchemy.com/faucets/base-sepolia, needs an Alchemy account and
a wallet holding 0.001 ETH on Ethereum mainnet, which the phase 5 ETH can
satisfy) and the Superchain faucet (https://console.optimism.io/faucet).

## 5. Alchemy, for reliable RPC (free tier)

Purpose: the gateway and the payout worker need an RPC endpoint that does not
rate limit or drop WebSocket subscriptions. The public https://sepolia.base.org
works for a laptop session and is the fallback; a VPS service wants an
allocated endpoint.

1. https://www.alchemy.com, sign up, 2FA on.
2. Create an app, chain Base, network Base Sepolia. Later a second app for
   Base mainnet.
3. Copy the HTTPS URL. It contains the API key, so it goes into the VPS
   `.env` as `XKOIN_RPC_URL` and nowhere else. Enable the allowlist on the
   app (VPS IP) once the VPS is up.

## 6. Basescan API key, for contract verification (free)

Purpose: `forge verify-contract` publishes the source next to the deployed
bytecode so anyone, including counsel and Equity, can read exactly what the
contracts do. Verified source is part of proving ownership.

1. https://basescan.org/register, then https://basescan.org/myapikey, create
   one key. Etherscan keys are now shared across their explorers, so one key
   covers Sepolia and mainnet.
2. Store as `BASESCAN_API_KEY` in the laptop's deploy shell only. It is not
   a server secret.

## 7. Safe, the owner multisig (free, gas only)

Purpose: the contracts' owner. Ownable2Step on all three contracts means the
Safe must call `acceptOwnership` itself, which is part of the phase 3
rehearsal.

1. https://app.safe.global, connect the wallet from step 3, network Base
   Sepolia.
2. Create a Safe with 3 owners and threshold 2. For the rehearsal the three
   owners are three testnet stand-in addresses that Martin controls. For
   mainnet they are the two hardware devices and the third signer from
   [docs/key-management.md](../key-management.md) section 8.
3. Record the Safe address in the register. It is public.

## 8. Jenga sandbox (documented, in progress)

Follow [docs/jenga-onboarding.md](../jenga-onboarding.md) step 1. The
callback URL in step 2 is the VPS from
[06-vps-xkoin.thuku.dev.md](06-vps-xkoin.thuku.dev.md). Nothing in the
sandbox moves real KES.

## 9. GitHub hardening, so only Martin can change production source

The contracts are not upgradeable: a change means a new deployment, which
needs the deployer key and then the Safe's signatures. The gateway on the VPS
is the part that can be changed by pushing code, so the repository is a
production control.

1. Account: 2FA with a passkey or security key; recovery codes in the
   password manager; SMS removed.
2. Repository: private, Martin the only member with write. Collaborators, if
   any, get read.
3. Branch protection on `main`: require signed commits, block force pushes,
   block deletion. Set up commit signing with an SSH key
   (`git config commit.gpgsign true`, `gpg.format ssh`) and upload that key
   as a signing key on GitHub.
4. Deploy from tags only. The VPS pulls with a read-only deploy key; it never
   holds a token that can push.
5. Dependabot alerts on; no GitHub Actions with secrets until there is a
   reason for them.

## 10. DNS: `xkoin.thuku.dev`

An A record `xkoin` pointing at the VPS IP. Details and the compose file in
[06-vps-xkoin.thuku.dev.md](06-vps-xkoin.thuku.dev.md).

## Later, not now

- Tenderly or OpenZeppelin Defender for alerting on contract events. The
  gateway's own worker and Basescan address watch (free email alerts on
  https://basescan.org/myaddress) cover the pilot.
- A hosted secrets manager for the VPS once the company exists
  ([docs/key-management.md](../key-management.md) section 8).
- Daraja sandbox, second bridge. Nothing in the contracts cares which bridge
  minted.
