# xKoin key management

Prepared 2026-09-09 for Martin, who asked how to set up the primary signing key so that ownership of the network and its earnings cannot be taken from him by a server compromise, a partner, or his own mistake.

## 1. The principle

One key per job, and the job with the most money behind it gets the coldest key. Reusing one key-pair across Jenga and xKoin is not possible (Jenga signs with RSA-2048, the chain with secp256k1, receipts and vouchers with Ed25519) and would be wrong even if it were: the Jenga key must live on the server that talks to Finserve, and any key that lives on a server is one breach away from an attacker. The link of ownership Martin wants comes from what the cold key controls and from documents that name it, not from sharing key material.

## 2. Key inventory

| Key | Algorithm | Lives where | Can move money? | If stolen | If lost |
|---|---|---|---|---|---|
| Founder cold key (treasury beneficiary) | secp256k1 | hardware wallet, never on a computer | Receives all fees; signs the payout MSISDN pin; vetoes beneficiary changes | Attacker becomes the fee recipient after they also pass the 7-day timelock as owner, or immediately for future claims | Fees keep accruing to an address nobody controls: the one loss that cannot be undone. Steel backup in two places |
| Owner (contract admin) | Gnosis Safe multisig (2-of-3) | on chain; signers are hardware wallets | Sets price within the band, fee bps, bridge caps, queues a new beneficiary (7-day public delay, cold-key veto) | Cannot burn user balances or redirect fees; can annoy (price band, cooldown limit the damage) | Recoverable while 2 of 3 signers exist |
| Deployer | secp256k1, disposable | laptop, only on deploy day | No | Nothing after ownership moves to the Safe | Nothing |
| Bridge hot key | secp256k1 | gateway-api server | Mints up to the daily cap (50,000 KES default), burns only its own balance | Bounded by the cap and by fiat actually collected; revoke with setBridge | Rotate: new key, setBridge, update .env |
| Kiosk root key | Ed25519 | gateway-api server | No; signs 24 h admission vouchers | Free riders until rotated; rotate the key, nodes learn the new public key | Same |
| Jenga RSA key | RSA-2048 | gateway-api server, registered on the Finserve portal | Yes: send-to-mobile moves KES from the merchant float | As dangerous as the bridge key; treat identically | Generate a new pair, re-register the public key |
| Daraja credentials | consumer key/secret, passkey, initiator credential | gateway-api server | Yes: B2C | Same | Reissue on the Daraja portal |
| Node keys | Ed25519 | inside each ESP32-S3 (flash encryption, secure boot) | No | One node can be impersonated | Re-flash |

## 3. Setting up the founder cold key

1. Buy a hardware wallet from the manufacturer only (Ledger or Trezor; never second hand, never a marketplace listing). Buy two of the same model.
2. Initialise the first device offline. Write the 24-word seed on the card, then stamp or engrave it on a steel plate. Do not photograph it, type it, or store it in any cloud. Verify the seed by restoring it on the second device: both must show the same first address.
3. Keep one device with the steel plate in a place only Martin can reach, and the second device in a different building. A sealed envelope with the lawyer holding instructions (not the seed) covers incapacity; the contracts already let anyone trigger a claim to the beneficiary, so the network never depends on the founder being available.
4. Use the first address of that seed as `BENEFICIARY_ADDRESS` at deploy time. The deploy script defaults the beneficiary to the deployer; that default is for local proofs only and must never be used on a real chain.
5. The cold key signs exactly two things in normal operation: the payout MSISDN pin (an EIP-191 message) and, rarely, a veto. Both are done on the device screen, so `app/payout/pin.py` gets a mode that prints the message to sign and a mode that verifies a pasted signature; the private key is never entered on a computer.

## 4. Owner as a multisig

After deploy, transfer ownership of token, treasury and escrow to a Gnosis Safe on Base (2-of-3: Martin's cold device, Martin's second device or a second seed, and a third signer Martin trusts, for example counsel or a co-founder). Ownable2Step means the Safe must call acceptOwnership; the deployer key is then discarded. HANDOVER.md backlog item 10 already requires this before any mainnet deployment.

Why 2-of-3 and not the cold key alone: an owner key is used more often (price, fee, bridge caps), and a key that is used often is exposed more often. The cold key stays cold because it is not the owner.

## 5. Server-side keys

- Generate on the server they will be used on, or on Martin's machine and move once over an encrypted channel; never by email or chat.
- Store outside the repo. `.env` and `*.pem` are git-ignored, but that is a courtesy, not a control. On the VPS use the OS secret store or a secrets manager (Doppler, 1Password Connect, HashiCorp Vault); on Windows use DPAPI-protected files. The service reads them at start and never logs them.
- Rotate on any staff change and at least yearly. Every key has a rotation path in the table above.
- The bridge daily mint cap is the real safety net: keep it near the fiat the kiosk actually collects in a day, not at a comfortable maximum.

## 6. Proving ownership without sharing keys

1. Company minutes and the IP assignment name the founder cold address as the treasury beneficiary and record that Martin controls it.
2. Martin signs, on the device, the statement "I, Martin Thuku, control address 0x... and it is the xKoin treasury beneficiary" (EIP-191). Counsel keeps the statement and signature; anyone can verify it with a public tool and no key is revealed.
3. The Jenga merchant account is opened in the company name with Martin as signatory; Finserve KYC ties the merchant code to the company, and the company is tied to Martin by the cap table, not by a key.

## 7. What the code already enforces

- Treasury claim is anyone-callable and can only pay the beneficiary.
- Beneficiary change is owner-initiated, 7 days public, cold-key veto.
- No key can burn user balances; bridge burn is self-only.
- Per-bridge rolling-day mint cap; price band with cooldown.
- Payout MSISDN pinned by a cold-key signature and checked against the on-chain beneficiary; a rewritten .env cannot redirect a payout.

## 8. Decisions for Martin, ranked

1. Hardware wallet model: two Ledger or two Trezor devices from the maker's site. Recommended: whichever Martin can buy directly; the model matters less than buying from the source and having two.
2. Third Safe signer: counsel is the natural choice, since they already hold the ownership statement; a co-founder is the alternative.
3. Where server secrets live: a hosted secrets manager (least effort, small monthly cost) versus files under the OS keyring on the VPS (free, more hands-on). Recommended: hosted manager once the company exists; OS keyring until then.
