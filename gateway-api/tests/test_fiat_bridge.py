import base64
import os

import httpx
import pytest
import respx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from fastapi.testclient import TestClient

os.environ["XKOIN_DRY_RUN"] = "true"
os.environ["XKOIN_KIOSK_ROOT_KEY_HEX"] = "11" * 32

from app.config import get_settings  # noqa: E402
from app.daraja.client import DarajaClient, parse_stk_callback  # noqa: E402
from app.jenga.client import JengaSigner  # noqa: E402
from app.main import PENDING_ORDERS, app  # noqa: E402
from app.vouchers import VoucherIssuer, verify_voucher  # noqa: E402

SETTINGS = get_settings()


# ---------------------------------------------------------------- Daraja


def test_lipa_password_is_deterministic():
    # Known-shape check: base64(shortcode+passkey+timestamp)
    pw = DarajaClient.lipa_password("174379", "passkey", "20260908120000")
    assert base64.b64decode(pw).decode() == "174379passkey20260908120000"


@pytest.mark.anyio
async def test_stk_push_request_shape():
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        client = DarajaClient(SETTINGS, http)
        with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
            mock.get("/oauth/v1/generate").respond(
                200, json={"access_token": "tkn", "expires_in": 3599}
            )
            stk = mock.post("/mpesa/stkpush/v1/processrequest").respond(
                200,
                json={"ResponseCode": "0", "CheckoutRequestID": "ws_CO_1", "MerchantRequestID": "m"},
            )
            ack = await client.stk_push("254722000000", 20, "0xabc")
        assert ack["CheckoutRequestID"] == "ws_CO_1"
        body = stk.calls[0].request.read().decode()
        assert '"Amount":20' in body
        assert '"TransactionType":"CustomerPayBillOnline"' in body
        assert "/daraja/stk-callback" in body


@pytest.mark.anyio
async def test_token_is_cached_across_calls():
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        client = DarajaClient(SETTINGS, http)
        with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
            oauth = mock.get("/oauth/v1/generate").respond(
                200, json={"access_token": "tkn", "expires_in": 3599}
            )
            mock.post("/mpesa/b2c/v1/paymentrequest").respond(
                200, json={"ResponseCode": "0", "ConversationID": "AG_1"}
            )
            await client.b2c_payment("254722000000", 950, "earnings")
            await client.b2c_payment("254722000000", 500, "earnings")
        assert oauth.call_count == 1


def test_parse_stk_callback_success_and_failure():
    success = {
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": "ws_CO_1",
                "ResultCode": 0,
                "ResultDesc": "Processed",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 20},
                        {"Name": "MpesaReceiptNumber", "Value": "TIH3XXXX"},
                        {"Name": "PhoneNumber", "Value": 254722000000},
                    ]
                },
            }
        }
    }
    cb = parse_stk_callback(success)
    assert cb == {
        "checkout_request_id": "ws_CO_1",
        "result_code": 0,
        "result_desc": "Processed",
        "amount_kes": 20,
        "receipt": "TIH3XXXX",
        "phone": "254722000000",
    }
    cancelled = {
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": "ws_CO_2",
                "ResultCode": 1032,
                "ResultDesc": "Cancelled by user",
            }
        }
    }
    assert parse_stk_callback(cancelled)["amount_kes"] is None


# ---------------------------------------------------------------- Jenga


def test_jenga_signature_verifies_with_public_key():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    signer = JengaSigner(pem)
    sig = base64.b64decode(signer.sign("MERCH123", "REF1", "2026-09-08", "20"))
    public = serialization.load_pem_public_key(signer.public_key_pem())
    # Raises on mismatch; passing means byte-exact field concatenation.
    public.verify(sig, b"MERCH123REF12026-09-0820", padding.PKCS1v15(), hashes.SHA256())


# ---------------------------------------------------------------- Vouchers


def test_voucher_roundtrip_and_tamper():
    issuer = VoucherIssuer(bytes.fromhex("22" * 32))
    bundle = issuer.issue("0xAbC0000000000000000000000000000000000001", 20_000_000, "TIH3XXXX", "daraja", 3600)
    v = verify_voucher(bundle, issuer.public_key_hex)
    assert v.amount_ukes == 20_000_000
    assert v.client_address == "0xabc0000000000000000000000000000000000001"

    bundle["voucher"]["amount_ukes"] = 999_999
    with pytest.raises(ValueError, match="signature invalid"):
        verify_voucher(bundle, issuer.public_key_hex)


def test_voucher_expiry_enforced():
    issuer = VoucherIssuer(bytes.fromhex("33" * 32))
    bundle = issuer.issue("0x" + "01" * 20, 100, "ref", "jenga", ttl_seconds=10)
    with pytest.raises(ValueError, match="expired"):
        verify_voucher(bundle, issuer.public_key_hex, now=bundle["voucher"]["expires_at"] + 1)


# ---------------------------------------------------------------- End-to-end (dry run)


def test_buy_gas_then_callback_mints_and_issues_voucher():
    client = TestClient(app)
    with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
        mock.get("/oauth/v1/generate").respond(200, json={"access_token": "t", "expires_in": 3599})
        mock.post("/mpesa/stkpush/v1/processrequest").respond(
            200, json={"ResponseCode": "0", "CheckoutRequestID": "ws_CO_E2E"}
        )
        r = client.post(
            "/buy-gas",
            json={
                "phone": "254722000000",
                "amount_kes": 20,
                "client_address": "0x" + "ab" * 20,
                "rail": "daraja",
            },
        )
    assert r.status_code == 200
    assert r.json()["order_key"] == "ws_CO_E2E"
    assert "ws_CO_E2E" in PENDING_ORDERS

    cb = client.post(
        "/daraja/stk-callback",
        json={
            "Body": {
                "stkCallback": {
                    "CheckoutRequestID": "ws_CO_E2E",
                    "ResultCode": 0,
                    "ResultDesc": "ok",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 20},
                            {"Name": "MpesaReceiptNumber", "Value": "TIH3E2E"},
                            {"Name": "PhoneNumber", "Value": 254722000000},
                        ]
                    },
                }
            }
        },
    )
    assert cb.status_code == 200
    data = cb.json()
    # 20 KES -> 20,000,000 micro-KES minted to the buyer, dry-run tx captured.
    assert data["mint"]["fn"] == "bridgeMint"
    assert data["mint"]["args"][1] == 20_000_000
    v = verify_voucher(data["voucher"], VoucherIssuer(bytes.fromhex("11" * 32)).public_key_hex)
    assert v.fiat_ref == "TIH3E2E"
    assert "ws_CO_E2E" not in PENDING_ORDERS


def test_failed_stk_drops_order_without_minting():
    client = TestClient(app)
    PENDING_ORDERS["ws_CO_FAIL"] = {
        "phone": "254722000000",
        "amount_kes": 20,
        "client_address": "0x" + "ab" * 20,
        "rail": "daraja",
    }
    r = client.post(
        "/daraja/stk-callback",
        json={
            "Body": {
                "stkCallback": {
                    "CheckoutRequestID": "ws_CO_FAIL",
                    "ResultCode": 1032,
                    "ResultDesc": "Cancelled by user",
                }
            }
        },
    )
    assert r.status_code == 200
    assert "mint" not in r.json()
    assert "ws_CO_FAIL" not in PENDING_ORDERS
