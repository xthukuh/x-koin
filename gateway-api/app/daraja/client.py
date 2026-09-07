"""Safaricom Daraja API client.

Covers the two flows the MVP plan requires:
  * On-ramp:  POST /mpesa/stkpush/v1/processrequest  (Lipa Na M-Pesa Online)
  * Off-ramp: POST /mpesa/b2c/v1/paymentrequest      (node admin payout)

Token acquisition uses the client-credentials endpoint and caches the bearer
until 60 seconds before expiry.
"""

import base64
import time
from datetime import datetime, timezone

import httpx

from app.config import Settings


class DarajaError(RuntimeError):
    pass


class DarajaClient:
    def __init__(self, settings: Settings, http: httpx.AsyncClient | None = None):
        self._s = settings
        self._http = http or httpx.AsyncClient(base_url=settings.daraja_base_url, timeout=30)
        self._token: str | None = None
        self._token_expiry: float = 0.0

    # -- auth ---------------------------------------------------------------

    async def get_token(self) -> str:
        if self._token and time.monotonic() < self._token_expiry:
            return self._token
        basic = base64.b64encode(
            f"{self._s.daraja_consumer_key}:{self._s.daraja_consumer_secret}".encode()
        ).decode()
        resp = await self._http.get(
            "/oauth/v1/generate",
            params={"grant_type": "client_credentials"},
            headers={"Authorization": f"Basic {basic}"},
        )
        if resp.status_code != 200:
            raise DarajaError(f"OAuth failed: {resp.status_code} {resp.text}")
        data = resp.json()
        self._token = data["access_token"]
        self._token_expiry = time.monotonic() + int(data.get("expires_in", 3599)) - 60
        return self._token

    # -- helpers ------------------------------------------------------------

    @staticmethod
    def lipa_password(shortcode: str, passkey: str, timestamp: str) -> str:
        """base64(Shortcode + Passkey + Timestamp) per Daraja spec."""
        return base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()

    @staticmethod
    def timestamp(now: datetime | None = None) -> str:
        now = now or datetime.now(timezone.utc)
        return now.strftime("%Y%m%d%H%M%S")

    # -- on-ramp ------------------------------------------------------------

    async def stk_push(self, phone_msisdn: str, amount_kes: int, account_ref: str) -> dict:
        """Fire an STK push to the buyer's handset. Returns Daraja's ack, whose
        CheckoutRequestID keys the eventual callback."""
        token = await self.get_token()
        ts = self.timestamp()
        payload = {
            "BusinessShortCode": self._s.daraja_shortcode,
            "Password": self.lipa_password(self._s.daraja_shortcode, self._s.daraja_passkey, ts),
            "Timestamp": ts,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount_kes,
            "PartyA": phone_msisdn,
            "PartyB": self._s.daraja_shortcode,
            "PhoneNumber": phone_msisdn,
            "CallBackURL": f"{self._s.callback_base_url}/daraja/stk-callback",
            "AccountReference": account_ref,
            "TransactionDesc": "xKoin Gas Voucher",
        }
        resp = await self._http.post(
            "/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        data = resp.json()
        if resp.status_code != 200 or data.get("ResponseCode") not in ("0", 0):
            raise DarajaError(f"STK push rejected: {resp.status_code} {data}")
        return data

    # -- off-ramp -----------------------------------------------------------

    async def b2c_payment(self, phone_msisdn: str, amount_kes: int, remarks: str) -> dict:
        """Business-to-customer payout to a node admin's M-Pesa wallet."""
        token = await self.get_token()
        payload = {
            "InitiatorName": self._s.daraja_initiator_name,
            "SecurityCredential": self._s.daraja_security_credential,
            "CommandID": "BusinessPayment",
            "Amount": amount_kes,
            "PartyA": self._s.daraja_b2c_shortcode,
            "PartyB": phone_msisdn,
            "Remarks": remarks[:100],
            "QueueTimeOutURL": f"{self._s.callback_base_url}/daraja/b2c-timeout",
            "ResultURL": f"{self._s.callback_base_url}/daraja/b2c-result",
            "Occasion": "xKoinPayout",
        }
        resp = await self._http.post(
            "/mpesa/b2c/v1/paymentrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        data = resp.json()
        if resp.status_code != 200 or data.get("ResponseCode") not in ("0", 0):
            raise DarajaError(f"B2C rejected: {resp.status_code} {data}")
        return data


def parse_stk_callback(body: dict) -> dict:
    """Flatten Daraja's nested STK callback into a settlement-friendly dict.

    Returns: {checkout_request_id, result_code, result_desc, amount_kes,
              receipt, phone} with amount/receipt/phone None on failure.
    """
    cb = body.get("Body", {}).get("stkCallback", {})
    out = {
        "checkout_request_id": cb.get("CheckoutRequestID"),
        "result_code": cb.get("ResultCode"),
        "result_desc": cb.get("ResultDesc"),
        "amount_kes": None,
        "receipt": None,
        "phone": None,
    }
    for item in cb.get("CallbackMetadata", {}).get("Item", []):
        name, value = item.get("Name"), item.get("Value")
        if name == "Amount":
            out["amount_kes"] = value
        elif name == "MpesaReceiptNumber":
            out["receipt"] = value
        elif name == "PhoneNumber":
            out["phone"] = str(value)
    return out
