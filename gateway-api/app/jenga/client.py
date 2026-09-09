"""Equitel Finserve Jenga API client.

Covers:
  * On-ramp:  POST /v3-apis/transaction-api/v3.0/merchants/payment
  * On-ramp:  POST /api-checkout/mpesa-stk-push/v3.0/init
  * Off-ramp: POST /v3-apis/transaction-api/v3.0/remittance/sendmobile

Jenga authenticates with a bearer token (merchant authenticate endpoint) plus a
per-request `signature` header: base64(RSA-SHA256(concatenated key fields))
signed with the merchant's private key registered on the Jenga portal.
"""

import base64
import time

import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from app.config import Settings


class JengaError(RuntimeError):
    pass


class JengaSigner:
    def __init__(self, private_key_pem: bytes):
        self._key = serialization.load_pem_private_key(private_key_pem, password=None)

    def sign(self, *fields: str) -> str:
        """Jenga signature: RSA-SHA256 over the plain concatenation of the
        endpoint's documented signature fields, base64 encoded."""
        message = "".join(fields).encode()
        sig = self._key.sign(message, padding.PKCS1v15(), hashes.SHA256())
        return base64.b64encode(sig).decode()

    def public_key_pem(self) -> bytes:
        return self._key.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        )


class JengaClient:
    def __init__(
        self,
        settings: Settings,
        signer: JengaSigner,
        http: httpx.AsyncClient | None = None,
    ):
        self._s = settings
        self._signer = signer
        self._http = http or httpx.AsyncClient(
            base_url=settings.jenga_base_url, timeout=30
        )
        self._token: str | None = None
        self._token_expiry: float = 0.0

    async def get_token(self) -> str:
        if self._token and time.monotonic() < self._token_expiry:
            return self._token
        resp = await self._http.post(
            "/authentication/api/v3/authenticate/merchant",
            headers={"Api-Key": self._s.jenga_api_key},
            json={
                "merchantCode": self._s.jenga_merchant_code,
                "consumerSecret": self._s.jenga_consumer_secret,
            },
        )
        if resp.status_code != 200:
            raise JengaError(f"Jenga auth failed: {resp.status_code} {resp.text}")
        data = resp.json()
        self._token = data["accessToken"]
        self._token_expiry = (
            time.monotonic() + 1500
        )  # tokens last ~30 min; refresh early
        return self._token

    async def _post(self, path: str, payload: dict, signature: str) -> dict:
        token = await self.get_token()
        resp = await self._http.post(
            path,
            json=payload,
            headers={"Authorization": f"Bearer {token}", "signature": signature},
        )
        data = resp.json()
        if resp.status_code not in (200, 201):
            raise JengaError(f"Jenga call {path} failed: {resp.status_code} {data}")
        return data

    # -- on-ramp ------------------------------------------------------------

    async def merchant_payment(
        self, phone_msisdn: str, amount_kes: int, reference: str, date_iso: str
    ) -> dict:
        """Bill the Equitel wallet (STK-equivalent) toward the kiosk merchant.

        Signature fields per Jenga docs for merchant payment:
        merchantCode + reference + date + amount.
        """
        amount = (
            f"{amount_kes:.2f}" if isinstance(amount_kes, float) else str(amount_kes)
        )
        payload = {
            "merchant": {
                "accountNumber": self._s.jenga_merchant_code,
                "countryCode": "KE",
            },
            "payment": {
                "ref": reference,
                "amount": amount,
                "currency": "KES",
                "telco": "Equitel",
                "mobileNumber": phone_msisdn,
                "date": date_iso,
                "callBackUrl": f"{self._s.callback_base_url}/jenga/payment-callback",
                "pushType": "USSD",
            },
        }
        signature = self._signer.sign(
            self._s.jenga_merchant_code, reference, date_iso, amount
        )
        return await self._post(
            "/v3-apis/transaction-api/v3.0/merchants/payment", payload, signature
        )

    async def mpesa_stk_push(
        self,
        phone_msisdn: str,
        amount_kes: int,
        order_reference: str,
        payment_reference: str,
        name: str,
        email: str = "",
    ) -> dict:
        """Push an M-Pesa STK prompt via Jenga's wallet-based settlement API.

        Signature fields per Jenga docs for the M-Pesa STK push, in order:
        order.orderReference + payment.paymentCurrency + payment.details.msisdn
        + payment.details.paymentAmount.
        """
        payload = {
            "order": {
                "orderReference": order_reference,
                "orderAmount": amount_kes,
                "orderCurrency": "KES",
                "source": "APICHECKOUT",
                "countryCode": "KE",
                "description": "xKoin gas top-up",
            },
            "customer": {
                "name": name,
                "email": email,
                "phoneNumber": phone_msisdn,
                "identityNumber": "",
                "firstAddress": "",
                "secondAddress": "",
            },
            "payment": {
                "paymentReference": payment_reference,
                "paymentCurrency": "KES",
                "channel": "MOBILE",
                "service": "MPESA",
                "provider": "JENGA",
                "callbackUrl": f"{self._s.callback_base_url}/jenga/mpesa-callback",
                "details": {"msisdn": phone_msisdn, "paymentAmount": amount_kes},
            },
        }
        signature = self._signer.sign(
            order_reference, "KES", phone_msisdn, str(amount_kes)
        )
        return await self._post(
            "/api-checkout/mpesa-stk-push/v3.0/init", payload, signature
        )

    # -- off-ramp -----------------------------------------------------------

    async def send_to_mobile(
        self,
        phone_msisdn: str,
        amount_kes: int,
        reference: str,
        date_iso: str,
        name: str,
        wallet: str = "Equitel",
    ) -> dict:
        """Remit node admin earnings to a mobile wallet (Equitel/Mpesa/Airtel).

        Signature fields per Jenga docs for send-to-mobile:
        amount + currencyCode + reference + source.accountNumber.
        """
        amount = str(amount_kes)
        source_account = self._s.jenga_merchant_code
        payload = {
            "source": {
                "countryCode": "KE",
                "name": "xKoin Kiosk",
                "accountNumber": source_account,
            },
            "destination": {
                "type": "mobile",
                "countryCode": "KE",
                "name": name,
                "mobileNumber": phone_msisdn,
                "walletName": wallet,
            },
            "transfer": {
                "type": "MobileWallet",
                "amount": amount,
                "currencyCode": "KES",
                "reference": reference,
                "date": date_iso,
                "description": "xKoin node earnings payout",
            },
        }
        signature = self._signer.sign(amount, "KES", reference, source_account)
        return await self._post(
            "/v3-apis/transaction-api/v3.0/remittance/sendmobile", payload, signature
        )
