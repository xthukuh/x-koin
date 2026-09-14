# Address and account register

Public identifiers only. A private key, seed, API key, password or 2FA secret never appears in this file; if one does, the file is treated as compromised and every key in it is rotated. Update the same day anything changes and commit.

Last updated: 2026-09-09 (created, nothing registered yet).

## Accounts

| Account | Handle or identifier | Purpose | 2FA | Opened |
|---|---|---|---|---|
| Binance | UID: | Buy ETH, withdraw to the gas reserve on Base | app | before 2026-09-09 |
| Coinbase Developer Platform | email: | Base Sepolia faucet | | |
| Alchemy | email: | RPC for Sepolia and Base | | |
| Basescan | email: | Contract verification, address watch alerts | | |
| Safe (Sepolia) | address: | Owner rehearsal | signers below | |
| Safe (Base) | address: | Production owner | signers below | |
| Jenga sandbox | merchant code: | UAT on-ramp and off-ramp | | |
| GitHub | xthukuh | Source of truth, deploy tags | passkey | |
| DNS | xkoin.thuku.dev | Callback endpoint | | |

## Wallets, Base Sepolia (chain id 84532)

| Role | Address | Created | Key location | Notes |
|---|---|---|---|---|
| Deployer | | | laptop, password manager | discard after phase 3 |
| Beneficiary stand-in | | | Rabby testnet profile | TESTNET ONLY |
| Bridge | | | laptop `.env`, then VPS `.env` | cap 5,000 KES |
| Relayer | | | VPS `.env` | gas only |
| Gas reserve | | | Rabby testnet profile | faucet ETH |
| Test client | | | laptop | |
| Test node admin | | | laptop | |
| Safe signer 1 | | | Rabby testnet profile | |
| Safe signer 2 | | | Rabby testnet profile | |
| Safe signer 3 | | | Rabby testnet profile | |

## Wallets, Base (chain id 8453)

| Role | Address | Created | Key location | Notes |
|---|---|---|---|---|
| Deployer | | | laptop, deploy day | discarded |
| Beneficiary (founder cold) | | | hardware wallet, first address; device serial: | steel backup in two places |
| Bridge | | | VPS `.env` | cap 0 until Equity live |
| Relayer | | | VPS `.env` | gas only |
| Gas reserve | | | hardware wallet, second account, or laptop wallet | whitelisted on Binance |
| Safe signer 1 | | | hardware device A | |
| Safe signer 2 | | | hardware device B | |
| Safe signer 3 | | | counsel or co-founder | |

## Contracts

Authoritative copies are `contracts/deployments/<chainId>.json`, written by the deploy script. This table is the human index.

| Chain | Token | Treasury | Escrow | Deployed | Verified |
|---|---|---|---|---|---|
| 84532 | | | | | |
| 8453 | | | | | |

## Money movements

| Date | From | To | Amount | Network | Tx hash | Note |
|---|---|---|---|---|---|---|
| | Binance | Gas reserve | | Base | | min withdrawal and fee seen on screen: |

## Phase receipts

### Phase 1
### Phase 2
### Phase 3
### Phase 4
### Phase 5
