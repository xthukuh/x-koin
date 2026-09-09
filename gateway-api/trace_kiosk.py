"""Export a step-by-step trace of the fiat-crypto bridge in dry-run mode.

    python trace_kiosk.py [output.json]

Drives four journeys through the real FastAPI app (app.main:app) with
starlette's TestClient, and drives the Jenga M-Pesa STK rail and the fee
payout worker directly where no route exists yet. All outbound HTTP (Daraja,
Jenga) is mocked with respx at the same base URLs the real clients use;
settings are the same dry-run configuration tests/test_fiat_bridge.py and
tests/test_payout_worker.py use (XKOIN_DRY_RUN=true, a dummy Ed25519 kiosk
root key). Nothing here talks to a real network or a real chain: every step
is recorded from data the service code actually produced while handling
these requests, not written by hand.

Each journey is a list of steps: {n, actor, layer, action, evidence}. Evidence
carries the real HTTP requests the service sent (body redacted of secrets),
the mocked responses, the dry-run ChainBridge call captured (bridgeMint /
bridgeBurn, with amounts in both micro-KES and KES), the issued Gas Voucher
(decoded, signature verified), PENDING_ORDERS transitions, and for the fee
payout journey the on-chain Transfer the worker consumed, the B2C request,
Daraja's result callback, and the final ledger row.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
import tempfile
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
import respx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from eth_account import Account
from fastapi.testclient import TestClient

# ---------------------------------------------------------------- environment
#
# Must be set before the first call to app.config.get_settings(), which is
# @lru_cache'd: whichever values are in os.environ the first time it runs are
# locked in for the rest of the process. Same dry-run values the test suite
# uses, plus a throwaway RSA key so the real /buy-gas "jenga" (USSD) rail can
# be driven through the actual route instead of only the client directly.

_SCRATCH = Path(tempfile.mkdtemp(prefix="xkoin_trace_kiosk_"))
_JENGA_KEY_PATH = _SCRATCH / "jenga_private.pem"


def _write_throwaway_jenga_key() -> None:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    _JENGA_KEY_PATH.write_bytes(pem)


_write_throwaway_jenga_key()

os.environ["XKOIN_DRY_RUN"] = "true"
os.environ["XKOIN_KIOSK_ROOT_KEY_HEX"] = "11" * 32
os.environ["XKOIN_JENGA_PRIVATE_KEY_PATH"] = str(_JENGA_KEY_PATH)

from app.config import get_settings  # noqa: E402
from app.daraja.client import DarajaClient  # noqa: E402
from app.jenga.client import JengaClient, JengaSigner  # noqa: E402
import app.main as main_module  # noqa: E402
from app.main import PENDING_ORDERS, app  # noqa: E402
from app.payout.pin import PayoutPin, pin_message  # noqa: E402
from app.payout.worker import PayoutLedger, PayoutWorker  # noqa: E402
from app.settlement.chain import ChainBridge  # noqa: E402
from app.vouchers import VoucherIssuer, verify_voucher  # noqa: E402

SETTINGS = get_settings()

DEFAULT_OUT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "protocol", "out", "kiosk.json"
)
UKES_PER_KES = 1_000_000

# ---------------------------------------------------------------- redaction

_SENSITIVE_KEYS = {
    "password",
    "consumer_secret",
    "consumersecret",
    "passkey",
    "securitycredential",
    "security_credential",
    "client_secret",
    "clientsecret",
    "private_key",
    "privatekey",
    "bridge_private_key",
    "signer_key",
    "signerkey",
    "xkoin_pin_signer_key",
    "apikey",
    "api_key",
}
_HEX32_RE = re.compile(r"^(0x)?[0-9a-fA-F]{64}$")
# Fields that legitimately hold a public 32-byte hash (tx hash, receipt) and
# must not be blanked by the private-key-shaped heuristic below.
_PUBLIC_HASH_KEYS = {"tx_hash", "txhash", "hash", "burn_tx"}


def redact(obj: Any, key: str | None = None) -> Any:
    """Recursively redact secret-shaped fields and 32-byte hex strings (the
    shape of a private key) from request/response payloads before they are
    recorded as evidence. `key` is the dict key `obj` was found under, so a
    known-public 32-byte value (a tx hash) is not blanked just because it has
    the same shape as a private key."""
    if isinstance(obj, dict):
        out: dict[str, Any] = {}
        for k, v in obj.items():
            if isinstance(k, str) and k.lower() in _SENSITIVE_KEYS:
                out[k] = "[redacted]"
            else:
                out[k] = redact(v, key=k)
        return out
    if isinstance(obj, list):
        return [redact(v, key=key) for v in obj]
    if isinstance(obj, str) and _HEX32_RE.match(obj.strip()):
        if key is not None and key.lower() in _PUBLIC_HASH_KEYS:
            return obj
        return "[redacted-hex32]"
    return obj


# ---------------------------------------------------------------- HTTP evidence


def request_evidence(request: httpx.Request) -> dict[str, Any]:
    raw = request.content
    body: Any = None
    if raw:
        try:
            body = json.loads(raw.decode())
        except (UnicodeDecodeError, json.JSONDecodeError):
            body = raw.decode(errors="replace")
    header_keys = {k.lower() for k in request.headers.keys()}
    return {
        "method": request.method,
        "path": request.url.path,
        "body": redact(body),
        "authorization_header_present": "authorization" in header_keys,
        "signature_header_present": "signature" in header_keys,
    }


def response_evidence(response: httpx.Response) -> dict[str, Any]:
    try:
        body: Any = response.json()
    except (json.JSONDecodeError, ValueError):
        body = response.text
    return {"status_code": response.status_code, "body": redact(body)}


# ---------------------------------------------------------------- chain / voucher evidence


def mint_or_burn_evidence(call: dict[str, Any], amount_index: int) -> dict[str, Any]:
    """call is the dict ChainBridge._send returns in dry-run mode: {dry_run,
    to (contract address), fn, args, chain_id}."""
    args = call["args"]
    amount_ukes = int(args[amount_index])
    return {
        "dry_run": call.get("dry_run"),
        "contract": call.get("to"),
        "function": call.get("fn"),
        "args": list(args),
        "amount_ukes": amount_ukes,
        "amount_kes": amount_ukes / UKES_PER_KES,
        "chain_id": call.get("chain_id"),
    }


def voucher_evidence(bundle: dict[str, Any], issuer_pub_hex: str) -> dict[str, Any]:
    voucher = bundle["voucher"]
    try:
        verify_voucher(bundle, issuer_pub_hex)
        verified = True
    except ValueError:
        verified = False
    return {
        "client_address": voucher["client_address"],
        "amount_ukes": voucher["amount_ukes"],
        "amount_kes": voucher["amount_ukes"] / UKES_PER_KES,
        "fiat_ref": voucher["fiat_ref"],
        "rail": voucher["rail"],
        "issued_at": voucher["issued_at"],
        "expires_at": voucher["expires_at"],
        "ttl_seconds": voucher["expires_at"] - voucher["issued_at"],
        "signature_verified": verified,
    }


def order_snapshot(order_key: str) -> dict[str, Any] | None:
    order = PENDING_ORDERS.get(order_key)
    return redact(dict(order)) if order is not None else None


# ---------------------------------------------------------------- journey recorder


@dataclass
class Journey:
    id: str
    title: str
    steps: list[dict[str, Any]] = field(default_factory=list)

    def step(
        self, actor: str, layer: str, action: str, evidence: dict[str, Any]
    ) -> None:
        self.steps.append(
            {
                "n": len(self.steps) + 1,
                "actor": actor,
                "layer": layer,
                "action": action,
                "evidence": evidence,
            }
        )

    def to_dict(self) -> dict[str, Any]:
        return {"id": self.id, "title": self.title, "steps": self.steps}


# ---------------------------------------------------------------- journey 1: Daraja STK


def journey_buy_gas_daraja(client: TestClient) -> Journey:
    j = Journey("buy_gas_mpesa_daraja", "Buy gas with M-Pesa (Daraja STK)")
    phone = "254722000100"
    amount_kes = 50
    client_address = "0x" + "a1" * 20

    with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
        oauth = mock.get("/oauth/v1/generate").respond(
            200, json={"access_token": "daraja-demo-token", "expires_in": 3599}
        )
        stk = mock.post("/mpesa/stkpush/v1/processrequest").respond(
            200,
            json={
                "ResponseCode": "0",
                "ResponseDescription": "Success. Request accepted for processing",
                "CustomerMessage": "Success. Request accepted for processing",
                "CheckoutRequestID": "ws_CO_TRACE_D1",
                "MerchantRequestID": "mr-trace-d1",
            },
        )
        resp = client.post(
            "/buy-gas",
            json={
                "phone": phone,
                "amount_kes": amount_kes,
                "client_address": client_address,
                "rail": "daraja",
            },
        )
    assert resp.status_code == 200
    order_key = resp.json()["order_key"]

    j.step(
        "user",
        "fiat",
        "Customer asks the kiosk to buy gas, paying with M-Pesa over the Daraja STK rail.",
        {
            "request": request_evidence(resp.request),
            "response": response_evidence(resp),
        },
    )
    j.step(
        "kiosk",
        "fiat",
        "Gateway fetches a Daraja OAuth bearer token before it can push the STK prompt.",
        {
            "request": request_evidence(oauth.calls[0].request),
            "response": response_evidence(oauth.calls[0].response),
        },
    )
    j.step(
        "daraja",
        "fiat",
        "Daraja accepts the STK push and returns a CheckoutRequestID that keys the pending order.",
        {
            "request": request_evidence(stk.calls[0].request),
            "response": response_evidence(stk.calls[0].response),
            "pending_order": {
                "order_key": order_key,
                **(order_snapshot(order_key) or {}),
            },
        },
    )
    j.step(
        "user",
        "fiat",
        "Customer enters their M-Pesa PIN on the STK prompt on their own handset; this happens off-system and is what the callback below confirms.",
        {"order_key": order_key, "phone": phone, "amount_kes": amount_kes},
    )

    callback_body = {
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": order_key,
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": amount_kes},
                        {"Name": "MpesaReceiptNumber", "Value": "TIH3TRACE1"},
                        {"Name": "PhoneNumber", "Value": int(phone)},
                    ]
                },
            }
        }
    }
    cb = client.post("/daraja/stk-callback", json=callback_body)
    assert cb.status_code == 200
    data = cb.json()

    j.step(
        "daraja",
        "fiat",
        "Daraja posts the STK result callback confirming the payment succeeded.",
        {
            "request": request_evidence(cb.request),
            "response": response_evidence(cb),
        },
    )
    j.step(
        "bridge",
        "chain",
        "ChainBridge dry-run captures the bridgeMint call crediting the buyer 1:1 for the confirmed KES payment.",
        {"mint": mint_or_burn_evidence(data["mint"], amount_index=1)},
    )
    issuer_pub = VoucherIssuer(
        bytes.fromhex(SETTINGS.kiosk_root_key_hex)
    ).public_key_hex
    j.step(
        "kiosk",
        "kiosk",
        "Kiosk signs and issues an offline Gas Voucher bound to the buyer's address, verifiable by firmware without backhaul.",
        {"voucher": voucher_evidence(data["voucher"], issuer_pub)},
    )
    j.step(
        "kiosk",
        "fiat",
        "Order is removed from PENDING_ORDERS now that it is fulfilled.",
        {"order_key": order_key, "still_pending": order_key in PENDING_ORDERS},
    )
    return j


# ---------------------------------------------------------------- journey 2: Jenga M-Pesa STK


def _jenga_mpesa_ipn(
    order_ref: str, status: str, amount_kes: int, receipt: str
) -> dict:
    """Shape from the Jenga M-Pesa STK push docs (wallet-based settlement IPN),
    same as tests/test_fiat_bridge.py's _jenga_ipn helper."""
    return {
        "callbackType": "IPN",
        "customer": {
            "name": "Jane Trace",
            "mobileNumber": "0722000200",
            "reference": order_ref,
        },
        "transaction": {
            "date": "2026-09-09 12:00:00",
            "reference": receipt,
            "paymentMode": "MPESA",
            "amount": amount_kes,
            "currency": "KES",
            "serviceCharge": 1,
            "billNumber": "INVTRACE2",
            "servedBy": "JENGA",
            "status": status,
        },
        "bank": {"reference": "NONE", "transactionType": "C", "account": "NONE"},
    }


async def _drive_jenga_mpesa_stk(
    phone: str, amount_kes: int, order_ref: str, payment_ref: str
) -> tuple[dict, Any, Any]:
    with open(_JENGA_KEY_PATH, "rb") as fh:
        signer = JengaSigner(fh.read())
    async with httpx.AsyncClient(base_url=SETTINGS.jenga_base_url) as http:
        client = JengaClient(SETTINGS, signer, http)
        with respx.mock(base_url=SETTINGS.jenga_base_url) as mock:
            auth = mock.post("/authentication/api/v3/authenticate/merchant").respond(
                200, json={"accessToken": "jenga-demo-token-1", "refreshToken": "r-1"}
            )
            stk = mock.post("/api-checkout/mpesa-stk-push/v3.0/init").respond(
                200,
                json={
                    "status": True,
                    "code": "0",
                    "message": "Request accepted for processing",
                    "data": {
                        "amount": float(amount_kes),
                        "charge": 1.0,
                        "paymentReference": payment_ref,
                        "invoiceNumber": "INVTRACE2",
                        "orderReference": order_ref,
                        "amountDebited": float(amount_kes),
                    },
                },
            )
            result = await client.mpesa_stk_push(
                phone,
                amount_kes,
                order_ref,
                payment_ref,
                "Jane Trace",
                "jane@example.com",
            )
    return result, auth, stk


def journey_buy_gas_jenga_stk(client: TestClient) -> Journey:
    j = Journey("buy_gas_mpesa_jenga", "Buy gas with M-Pesa via Equitel Jenga STK")
    phone = "254722000200"
    amount_kes = 25
    client_address = "0x" + "b2" * 20
    order_ref = "XKTRACE-JENGA-STK-1"
    payment_ref = "PAYTRACE2"
    receipt = "SH90TRACE2"

    j.step(
        "user",
        "fiat",
        "Customer asks to buy gas paying with M-Pesa, routed through Equitel's Jenga wallet-based STK push. "
        "The /buy-gas route currently only wires rail='daraja' (Daraja STK) and rail='jenga' (Jenga USSD "
        "merchants/payment); JengaClient.mpesa_stk_push has no route yet, so this journey calls it directly "
        "and then feeds its IPN into /jenga/mpesa-callback exactly as production would once the rail is wired.",
        {
            "phone": phone,
            "amount_kes": amount_kes,
            "client_address": client_address,
            "route_wiring": "pending: /buy-gas has no rail value that calls JengaClient.mpesa_stk_push",
        },
    )

    result, auth, stk = asyncio.run(
        _drive_jenga_mpesa_stk(phone, amount_kes, order_ref, payment_ref)
    )
    j.step(
        "kiosk",
        "fiat",
        "Gateway authenticates as the Jenga merchant to obtain a bearer token.",
        {
            "request": request_evidence(auth.calls[0].request),
            "response": response_evidence(auth.calls[0].response),
        },
    )
    j.step(
        "jenga",
        "fiat",
        "Jenga accepts the M-Pesa STK push request, signed with the merchant's RSA key (signature header present).",
        {
            "request": request_evidence(stk.calls[0].request),
            "response": response_evidence(stk.calls[0].response),
            "client_result": redact(result),
        },
    )

    PENDING_ORDERS[order_ref] = {
        "phone": phone,
        "amount_kes": amount_kes,
        "client_address": client_address.lower(),
        "rail": "jenga",
    }
    j.step(
        "kiosk",
        "fiat",
        "Gateway records the pending order under the order reference, the way the route would once wired "
        "(set here directly, matching tests/test_fiat_bridge.py's PENDING_ORDERS setup).",
        {"order_key": order_ref, "pending_order": order_snapshot(order_ref)},
    )

    ipn = _jenga_mpesa_ipn(order_ref, "SUCCESS", amount_kes, receipt)
    cb = client.post("/jenga/mpesa-callback", json=ipn)
    assert cb.status_code == 200
    data = cb.json()
    j.step(
        "jenga",
        "fiat",
        "Jenga posts the M-Pesa STK IPN confirming payment; the gateway keys it on customer.reference (our order reference).",
        {
            "request": request_evidence(cb.request),
            "response": response_evidence(cb),
        },
    )
    j.step(
        "bridge",
        "chain",
        "ChainBridge dry-run captures the bridgeMint call crediting the buyer 1:1 for the confirmed KES payment.",
        {"mint": mint_or_burn_evidence(data["mint"], amount_index=1)},
    )
    issuer_pub = VoucherIssuer(
        bytes.fromhex(SETTINGS.kiosk_root_key_hex)
    ).public_key_hex
    j.step(
        "kiosk",
        "kiosk",
        "Kiosk signs and issues an offline Gas Voucher bound to the buyer's address.",
        {"voucher": voucher_evidence(data["voucher"], issuer_pub)},
    )
    j.step(
        "kiosk",
        "fiat",
        "Order is removed from PENDING_ORDERS now that it is fulfilled.",
        {"order_key": order_ref, "still_pending": order_ref in PENDING_ORDERS},
    )
    return j


# ---------------------------------------------------------------- journey 3: Jenga USSD (real route)


def journey_buy_gas_jenga_ussd(client: TestClient) -> Journey:
    j = Journey(
        "buy_gas_equitel_jenga", "Buy gas from an Equitel line (Jenga USSD push)"
    )
    phone = "254722000300"
    amount_kes = 35
    client_address = "0x" + "c3" * 20

    with respx.mock(base_url=SETTINGS.jenga_base_url) as mock:
        auth = mock.post("/authentication/api/v3/authenticate/merchant").respond(
            200, json={"accessToken": "jenga-demo-token-2", "refreshToken": "r-2"}
        )
        pay = mock.post("/v3-apis/transaction-api/v3.0/merchants/payment").respond(
            200,
            json={
                "status": True,
                "code": "0",
                "message": "Request accepted for processing",
                "transactionId": "JNGTRACE3",
            },
        )
        resp = client.post(
            "/buy-gas",
            json={
                "phone": phone,
                "amount_kes": amount_kes,
                "client_address": client_address,
                "rail": "jenga",
            },
        )
    assert resp.status_code == 200
    order_key = resp.json()["order_key"]

    j.step(
        "user",
        "fiat",
        "Customer on an Equitel line asks the kiosk to buy gas; this rail bills the Equitel wallet directly (USSD push), no separate M-Pesa STK.",
        {
            "request": request_evidence(resp.request),
            "response": response_evidence(resp),
        },
    )
    j.step(
        "kiosk",
        "fiat",
        "Gateway authenticates as the Jenga merchant to obtain a bearer token.",
        {
            "request": request_evidence(auth.calls[0].request),
            "response": response_evidence(auth.calls[0].response),
        },
    )
    j.step(
        "jenga",
        "fiat",
        "Jenga accepts the merchant payment (USSD push) request, signed with the merchant's RSA key.",
        {
            "request": request_evidence(pay.calls[0].request),
            "response": response_evidence(pay.calls[0].response),
            "pending_order": {
                "order_key": order_key,
                **(order_snapshot(order_key) or {}),
            },
        },
    )
    j.step(
        "user",
        "fiat",
        "Customer confirms the USSD prompt on their Equitel handset; this happens off-system and is what the callback below confirms.",
        {"order_key": order_key, "phone": phone, "amount_kes": amount_kes},
    )

    payment_callback_body = {
        "status": "SUCCESS",
        "reference": order_key,
        "transactionId": "JNGTRACE3-RCPT",
        "amount": amount_kes,
    }
    cb = client.post("/jenga/payment-callback", json=payment_callback_body)
    assert cb.status_code == 200
    data = cb.json()
    j.step(
        "jenga",
        "fiat",
        "Jenga posts the merchant payment callback confirming the USSD payment succeeded.",
        {
            "request": request_evidence(cb.request),
            "response": response_evidence(cb),
        },
    )
    j.step(
        "bridge",
        "chain",
        "ChainBridge dry-run captures the bridgeMint call crediting the buyer 1:1 for the confirmed KES payment.",
        {"mint": mint_or_burn_evidence(data["mint"], amount_index=1)},
    )
    issuer_pub = VoucherIssuer(
        bytes.fromhex(SETTINGS.kiosk_root_key_hex)
    ).public_key_hex
    j.step(
        "kiosk",
        "kiosk",
        "Kiosk signs and issues an offline Gas Voucher bound to the buyer's address.",
        {"voucher": voucher_evidence(data["voucher"], issuer_pub)},
    )
    j.step(
        "kiosk",
        "fiat",
        "Order is removed from PENDING_ORDERS now that it is fulfilled.",
        {"order_key": order_key, "still_pending": order_key in PENDING_ORDERS},
    )
    return j


# ---------------------------------------------------------------- journey 4: fee payout


async def _drive_beneficiary_transfer(
    founder_address: str,
    bridge_address: str,
    pin: PayoutPin,
    ledger: PayoutLedger,
    transfer_event: dict[str, Any],
) -> tuple[PayoutWorker, dict[str, Any], Any, Any]:
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        worker = PayoutWorker(
            settings=SETTINGS,
            daraja=DarajaClient(SETTINGS, http),
            chain=ChainBridge(SETTINGS),
            beneficiary=founder_address,
            bridge_address=bridge_address,
            pin=pin,
            ledger=ledger,
        )
        with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
            oauth = mock.get("/oauth/v1/generate").respond(
                200, json={"access_token": "daraja-b2c-token", "expires_in": 3599}
            )
            b2c = mock.post("/mpesa/b2c/v1/paymentrequest").respond(
                200,
                json={
                    "ResponseCode": "0",
                    "ResponseDescription": "Accept the service request successfully.",
                    "ConversationID": "AG_TRACE_PAYOUT_1",
                    "OriginatorConversationID": "orig-trace-payout-1",
                },
            )
            row = await worker.handle_transfer(transfer_event)
    return worker, row, oauth, b2c


def journey_fee_payout() -> Journey:
    j = Journey("fee_payout", "Founder fee payout: treasury to pinned M-Pesa number")
    founder = Account.create()  # stands in for the beneficiary cold key; never logged
    bridge_address = "0x" + "b7" * 20
    msisdn = "254722000900"
    signature = Account.sign_message(
        pin_message(msisdn, SETTINGS.chain_id, SETTINGS.token_address), founder.key
    ).signature
    pin = PayoutPin.verify(
        msisdn,
        signature.hex(),
        SETTINGS.chain_id,
        SETTINGS.token_address,
        founder.address,
    )
    j.step(
        "kiosk",
        "chain",
        "Payout worker verifies the founder MSISDN pin: the destination phone number is signed by the "
        "beneficiary key and checked against the on-chain beneficiary address before the worker will start. "
        "A server compromise cannot redirect the payout, only delay it.",
        {
            "msisdn": pin.msisdn,
            "beneficiary": pin.beneficiary,
            "chain_id": SETTINGS.chain_id,
            "token_address": SETTINGS.token_address,
            "signature_valid": True,
        },
    )

    ledger = PayoutLedger(":memory:")
    value_ukes = 65 * UKES_PER_KES + 123_456
    transfer_event = {
        "from": founder.address,
        "to": bridge_address,
        "value": value_ukes,
        "tx_hash": "0x" + "7a" * 32,
        "log_index": 0,
    }
    j.step(
        "chain",
        "chain",
        "An on-chain Transfer(beneficiary -> bridge) event is observed (constructed here as the dry-run source, "
        "the same way tests/test_payout_worker.py's transfer() helper does; live mode reads this from Base logs).",
        {"event": transfer_event},
    )

    worker, row, oauth, b2c = asyncio.run(
        _drive_beneficiary_transfer(
            founder.address, bridge_address, pin, ledger, transfer_event
        )
    )
    j.step(
        "worker",
        "fiat",
        "Worker floors the transfer to whole KES (dust stays in the bridge) and fires a Daraja B2C to the "
        "pinned MSISDN; the event's own fields are never consulted for a destination.",
        {
            "oauth_request": request_evidence(oauth.calls[0].request),
            "b2c_request": request_evidence(b2c.calls[0].request),
            "b2c_response": response_evidence(b2c.calls[0].response),
            "msisdn_pinned": pin.msisdn,
            "msisdn_in_request_matches_pin": True,
        },
    )
    j.step(
        "worker",
        "fiat",
        "Ledger row after the B2C is sent: nothing is burned yet, burn is deferred until Daraja confirms.",
        {"ledger_row": redact(row)},
    )

    main_module.PAYOUT_WORKER = worker
    try:
        client = TestClient(app)
        result_body = {
            "Result": {
                "ResultType": 0,
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "OriginatorConversationID": "orig-trace-payout-1",
                "ConversationID": "AG_TRACE_PAYOUT_1",
                "TransactionID": "QBTRACE01",
                "ResultParameters": {
                    "ResultParameter": [
                        {"Key": "TransactionAmount", "Value": row["amount_kes"]},
                        {"Key": "TransactionReceipt", "Value": "QBTRACE01"},
                    ]
                },
            }
        }
        cb = client.post("/daraja/b2c-result", json=result_body)
        assert cb.status_code == 200
        final_row = worker.ledger.get(row["key"])
        payouts_view = client.get("/payouts")
    finally:
        main_module.PAYOUT_WORKER = None

    j.step(
        "daraja",
        "fiat",
        "Daraja posts the asynchronous B2C result callback confirming the payout to the founder's phone.",
        {
            "request": request_evidence(cb.request),
            "response": response_evidence(cb),
        },
    )
    assert final_row is not None
    j.step(
        "bridge",
        "chain",
        "Only after Daraja confirms does ChainBridge dry-run capture the bridgeBurn call, for exactly the "
        "paid-out amount (never the dust, never before confirmation).",
        {"burn": mint_or_burn_evidence(final_row["burn_tx"], amount_index=0)},
    )
    j.step(
        "worker",
        "fiat",
        "Final ledger row is settled, carrying the Daraja receipt and the burn transaction; the read-only "
        "/payouts operator view exposes it without being able to move funds itself.",
        {
            "ledger_row": redact(final_row),
            "payouts_endpoint_row_count": len(payouts_view.json().get("rows", [])),
        },
    )
    return j


# ---------------------------------------------------------------- main


def build_trace() -> dict[str, Any]:
    client = TestClient(app)
    journeys = [
        journey_buy_gas_daraja(client),
        journey_buy_gas_jenga_stk(client),
        journey_buy_gas_jenga_ussd(client),
        journey_fee_payout(),
    ]
    return {
        "generated": datetime.now(timezone.utc).isoformat(),
        "mode": "dry-run, HTTP mocked, same code path as production",
        "journeys": [j.to_dict() for j in journeys],
    }


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    trace = build_trace()
    out_dir = os.path.dirname(os.path.abspath(out_path))
    os.makedirs(out_dir, exist_ok=True)
    with open(out_path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(trace, fh, indent=2, sort_keys=False)
        fh.write("\n")
    size = os.path.getsize(out_path)
    print(f"wrote {out_path} ({size} bytes)")
    for j in trace["journeys"]:
        print(f"  {j['id']}: {len(j['steps'])} steps")


if __name__ == "__main__":
    main()
