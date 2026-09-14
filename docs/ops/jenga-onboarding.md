# Equitel Jenga onboarding checklist

Prepared 2026-09-09. Jenga is the Equity Bank (Finserve Africa) API. It covers both legs we need, which is why it goes first:

| Leg | Jenga product | Endpoint | Status in gateway-api |
|---|---|---|---|
| Customer buys XKN from an Equitel line | Equitel STK/USSD Push (merchant payment) | `POST /v3-apis/transaction-api/v3.0/merchants/payment` | implemented, mocked tests |
| Customer buys XKN from an M-Pesa line | M-Pesa STK Push, wallet-based settlement | `POST /api-checkout/mpesa-stk-push/v3.0/init` | added 2026-09-09, mocked tests |
| Node operator or founder cashes out | Send Money to Mobile Wallets (walletName Mpesa, Airtel, Equitel) | `POST /v3-apis/transaction-api/v3.0/remittance/sendmobile` | implemented, wallet parameter added 2026-09-09 |

Daraja stays as the second bridge for a direct Safaricom relationship and as a fallback; nothing in the contracts cares which bridge minted.

## Step 1: sandbox (no company documents needed)

1. Sign up at https://v3.jengahq.io/ with business type, name, email, phone, business name and password. The profile is created in Test Mode.
2. From the portal collect the three values and put them in `gateway-api/.env` (template in `.env.example`):

       XKOIN_JENGA_MERCHANT_CODE=
       XKOIN_JENGA_CONSUMER_SECRET=
       XKOIN_JENGA_API_KEY=

3. Generate the RSA key pair on your machine, not in the portal:

       openssl genrsa -out jenga_private.pem 2048
       openssl rsa -in jenga_private.pem -pubout -out jenga_public.pem

   Upload `jenga_public.pem` in the portal (the signature field on every request is RSA-SHA256 over the documented fields, base64). The private key stays out of git; `.gitignore` already excludes `.env` and `*.pem`. The client reads it from `XKOIN_JENGA_PRIVATE_KEY_PATH` (default `jenga_private.pem`).
4. UAT base URL is already the default (`https://uat.finserve.africa`). Leave `XKOIN_DRY_RUN=true` until the first UAT call is observed by hand.
5. The token endpoint is `/authentication/api/v3/authenticate/merchant` with header `Api-Key` and body `merchantCode` + `consumerSecret`; the client caches it for 25 min.

## Step 2: callbacks

Jenga posts payment results to the `callbackUrl` in each request, which the code builds from `XKOIN_CALLBACK_BASE_URL`. That must be a public HTTPS root before UAT tests of the push endpoints. For the laptop, a tunnel (Cloudflare Tunnel or ngrok) is enough; the IPN payload shape is documented and the handler is mocked against it.

## Step 3: live onboarding (needs the company)

From the Finserve "Jenga V3 APIs Upgrade and Onboarding Steps" note:

1. In the portal click Live Onboarding, fill contact, business and signatory details.
2. Upload KYC: all director IDs, Certificate of Incorporation, current CR12, and documents for any shareholding company.
3. Submit. Each signatory receives an email link to approve the Terms and Conditions; the account only moves to Pending Activation after every signatory clicks it.
4. Finserve does internal approval on the KYC and activates within 48 hours of the steps above. Live base URL becomes `https://api.finserve.africa`.
5. Live integration support is by a Skype channel Finserve creates on request.

Not stated in the public docs and to be asked during onboarding: whether the settlement account must be an Equity Bank account (the payment-gateway docs say bank-account payments are Equity-only, so assume yes for float), the per-transaction charge on M-Pesa STK push (the sample response shows a `charge` of 1 KES on a 2 KES payment), and any IP allow-listing.

## What the code assumes, to verify on first UAT call

- Merchant payment signature: `merchantCode + reference + date + amount`.
- Send-to-mobile signature: `amount + currencyCode + reference + source.accountNumber` (confirmed against the current docs).
- M-Pesa STK signature: `orderReference + paymentCurrency + details.msisdn + details.paymentAmount` (confirmed against the current docs).
- Header name `Signature`; case-insensitive in HTTP but match the docs.

## Sources

- Developer quickstart: https://developer.jengahq.io/guides/get-started/developer-quickstart
- M-Pesa STK push, wallet based: https://developer.jengahq.io/guides/jenga-api/receive-money/mpesa-stk-push/wallet-based-settlement
- Mobile wallets send: https://developer.jengahq.io/api-explorer/send-money/mobile-wallets
- Supported payment methods: https://developer.jengahq.io/guides/jenga-pgw/supported-payment-methods
- Onboarding steps note (Finserve, 2022): https://rentrahisi.co.ke/homepage-assets/docs/Jenga%20V3%20APIs%20Upgrade%20and%20Onboarding%20Steps[6][1][2][9].pdf
