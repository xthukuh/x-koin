# Security: the vigilance list

Grouped by where the attack comes from. Each DO is something to set up once or a habit; each DON'T is a way people in this position have actually lost money. The list is long because the surface is wide; the habits are few.

## Exchange (Binance)

DO
- Authenticator app or passkey for 2FA; SMS removed.
- Anti-phishing code set; every email without it is discarded unread.
- Withdrawal whitelist on, with only the gas reserve address, and the 24 hour hold on additions left on.
- Log in from the app on the phone, not from a link in any message.
- Treat Binance as a bureau de change: money passes through, it does not live there.

DON'T
- Keep the founder's or the project's keys on the exchange in any form.
- Answer "Binance support" that reaches out first, on Telegram, WhatsApp, X or email. Support never initiates contact and never asks for codes.
- Withdraw to an address pasted from a chat, an email or a web page. Only from the register, checked character by character at both ends.
- Choose a network on the withdrawal screen by habit. Read it every time.
- Do P2P trades outside the Binance escrow, whatever the better rate.

## Wallets and keys

DO
- One address per role ([02-wallet-roles.md](02-wallet-roles.md)). A key that does two jobs has two ways to be lost.
- Hardware wallet for the beneficiary, bought from the maker, initialised offline, seed on steel in two places, verified by restore on the second device.
- A dedicated browser profile for the wallet extension, no other extensions in it, and a different profile for everything else.
- Read the transaction on the hardware device's own screen before approving. The screen on the device is the only display an attacker cannot change.
- Test every new address with a dust transfer before it receives anything that matters.
- Keep hot wallets thin: days of gas, not the reserve.

DON'T
- Type, photograph, screenshot, or paste a seed phrase into anything. No password manager either for the hardware seed; steel and paper only.
- Enter a seed into any website, wallet "sync" tool, "validation" page or support form. There is no legitimate reason a seed is ever asked for.
- Reuse the testnet stand-in seed for anything on mainnet. Testnet keys have been through faucets, explorers and browser extensions; assume they are known.
- Sign a message or transaction you cannot read. "Sign in with Ethereum" prompts and blind `eth_sign` requests from unknown sites are the common way wallets are drained.
- Approve unlimited token allowances to contracts you do not control. The escrow uses permit with an exact amount for this reason.
- Buy a hardware wallet second hand or from a marketplace seller. Tampered devices ship with a pre-known seed.

## Server (the VPS)

DO
- SSH keys only, password login off, root login off, fail2ban on, and the firewall open only on 22, 80 and 443.
- Secrets in `/srv/xkoin/.env` and `/srv/xkoin/jenga_private.pem` with mode 600, owned by the service user, read at start and never logged. The gateway masks them in `/health`.
- Separate bridge and relayer keys so a leak of the busy one costs only gas.
- The bridge daily cap set to what the kiosk actually collects in a day, reviewed monthly. It is the single most important number on the server.
- Alerts: Basescan address watch on the bridge, relayer, treasury and beneficiary; the gateway's runway metric; a log line on every mint and burn with the fiat reference.
- Automatic security updates for the OS; Docker images rebuilt from tags.

DON'T
- Put the gas reserve, the beneficiary key or any Safe signer on the server. The server holds keys that can be revoked and refilled, never keys that own anything.
- Let the deploy key on the VPS have push rights. Read-only deploy keys only.
- Run the gateway as root inside or outside the container.
- Log request bodies from Jenga callbacks at info level; they contain MSISDNs and references. Debug logging is switched on for a session and off again.
- Expose the RPC API key: it lives in `.env` and in Alchemy's dashboard, and the Alchemy app gets an IP allowlist once the VPS has a fixed IP.

## Repository

DO
- Passkey 2FA on GitHub, signed commits required on `main`, force push and deletion blocked, Martin the only writer.
- Deploy from tags. The tag is the audit trail of what runs.
- Keep `.env`, `*.pem`, `*.sqlite3` and the local deployments file ignored, and check `git status` before every commit for anything that looks like a key.

DON'T
- Commit a private key "just for testing". Anvil's well-known keys are the only private keys that may appear in the repo, and only in test files. Anything that leaks into a public repo is swept by bots within seconds.
- Paste `.env` contents into a chat, an issue or a screenshot.
- Give a collaborator write access to shorten a task. Read access plus a pull request is the shape.

## People and process

DO
- Keep a sealed instruction with counsel: where the devices and steel plates are, and that `claim` on the treasury can be called by anyone. The network keeps paying the beneficiary address if Martin is unavailable; someone still needs to know how to spend from it.
- Rehearse each dangerous change on Sepolia first (phase 3 of the test plan) and keep the rehearsal transcript.
- Say the amount and the address out loud, or write them down, before every real transfer, then compare against the screen.
- Update [registry.md](registry.md) the same day an account or address changes.

DON'T
- Act under time pressure. Urgency in any message about money or keys is the tell. Everything in this plan can wait a day.
- Announce the addresses or the amounts in public, on social media, or in a pitch deck. The beneficiary address is public on chain, but there is no need to link it to a person and a phone number.
- Let a helper, a supplier or an adviser "set up the wallet for you". The person who watches the seed being written owns the wallet.
- Trust a screen share. Wallet and exchange windows are never on a shared screen, including with the session.

## If something goes wrong

| Signal | First move | Then |
|---|---|---|
| Unknown transaction from the bridge or relayer | Owner (Safe) calls `setBridge(bridge, false, 0)`; stop the gateway | New keys, new `.env`, restart, review the cap |
| Beneficiary change queued that Martin did not queue | Beneficiary (cold key) calls `cancelBeneficiaryChange()` within 7 days | Rotate every Safe signer; the owner set is compromised |
| Binance login from an unknown device | Freeze the account from the app (Security, then Disable account) | Change the email password, re-issue 2FA, contact support from inside the app |
| Seed phrase possibly exposed | Move everything that address holds to a fresh address now, gas permitting | Queue the beneficiary change to the new cold address; the 7 days start immediately |
| VPS compromise suspected | Stop the containers; revoke the bridge on chain; rotate the Jenga RSA key on the Finserve portal | Rebuild the host from a clean image before restoring service |
