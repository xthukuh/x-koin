import base64
import json
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
from app.jenga.client import JengaClient, JengaError, JengaSigner  # noqa: E402
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
                json={
                    "ResponseCode": "0",
                    "CheckoutRequestID": "ws_CO_1",
                    "MerchantRequestID": "m",
                },
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


def _jenga_signer() -> JengaSigner:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    return JengaSigner(pem)


@pytest.mark.anyio
async def test_mpesa_stk_push_request_shape_and_signature():
    async with httpx.AsyncClient(base_url=SETTINGS.jenga_base_url) as http:
        signer = _jenga_signer()
        client = JengaClient(SETTINGS, signer, http)
        with respx.mock(base_url=SETTINGS.jenga_base_url) as mock:
            mock.post("/authentication/api/v3/authenticate/merchant").respond(
                200, json={"accessToken": "tkn", "refreshToken": "r"}
            )
            stk = mock.post("/api-checkout/mpesa-stk-push/v3.0/init").respond(
                200,
                json={
                    "status": True,
                    "code": "0",
                    "message": "Request accepted for processing",
                    "data": {
                        "amount": 2.0,
                        "charge": 1.0,
                        "paymentReference": "PAY1",
                        "invoiceNumber": "INV1",
                        "orderReference": "REF1",
                        "amountDebited": 2.0,
                    },
                },
            )
            result = await client.mpesa_stk_push(
                "254722000000", 2, "REF1", "PAY1", "Jane Doe", "jane@example.com"
            )
        assert result["data"]["paymentReference"] == "PAY1"

        req = stk.calls[0].request
        assert req.headers["Authorization"] == "Bearer tkn"
        body = json.loads(req.content.decode())
        assert body == {
            "order": {
                "orderReference": "REF1",
                "orderAmount": 2,
                "orderCurrency": "KES",
                "source": "APICHECKOUT",
                "countryCode": "KE",
                "description": "xKoin gas top-up",
            },
            "customer": {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "phoneNumber": "254722000000",
                "identityNumber": "",
                "firstAddress": "",
                "secondAddress": "",
            },
            "payment": {
                "paymentReference": "PAY1",
                "paymentCurrency": "KES",
                "channel": "MOBILE",
                "service": "MPESA",
                "provider": "JENGA",
                "callbackUrl": f"{SETTINGS.callback_base_url}/jenga/mpesa-callback",
                "details": {"msisdn": "254722000000", "paymentAmount": 2},
            },
        }

        signature_b64 = req.headers["Signature"]
        sig = base64.b64decode(signature_b64)
        message = ("REF1" + "KES" + "254722000000" + "2").encode()
        public = serialization.load_pem_public_key(signer.public_key_pem())
        # Raises on mismatch; passing means byte-exact field concatenation.
        public.verify(sig, message, padding.PKCS1v15(), hashes.SHA256())


@pytest.mark.anyio
async def test_mpesa_stk_push_raises_on_error_status():
    async with httpx.AsyncClient(base_url=SETTINGS.jenga_base_url) as http:
        client = JengaClient(SETTINGS, _jenga_signer(), http)
        with respx.mock(base_url=SETTINGS.jenga_base_url) as mock:
            mock.post("/authentication/api/v3/authenticate/merchant").respond(
                200, json={"accessToken": "tkn", "refreshToken": "r"}
            )
            mock.post("/api-checkout/mpesa-stk-push/v3.0/init").respond(
                400, json={"status": False, "code": "10", "message": "Invalid request"}
            )
            with pytest.raises(JengaError):
                await client.mpesa_stk_push(
                    "254722000000", 2, "REF1", "PAY1", "Jane Doe"
                )


@pytest.mark.anyio
async def test_send_to_mobile_wallet_defaults_to_equitel_and_accepts_override():
    async with httpx.AsyncClient(base_url=SETTINGS.jenga_base_url) as http:
        client = JengaClient(SETTINGS, _jenga_signer(), http)
        with respx.mock(base_url=SETTINGS.jenga_base_url) as mock:
            mock.post("/authentication/api/v3/authenticate/merchant").respond(
                200, json={"accessToken": "tkn", "refreshToken": "r"}
            )
            send = mock.post(
                "/v3-apis/transaction-api/v3.0/remittance/sendmobile"
            ).respond(200, json={"status": True})
            await client.send_to_mobile(
                "254722000000", 500, "REF2", "2026-09-09", "Jane Doe"
            )
            await client.send_to_mobile(
                "254722000000", 500, "REF3", "2026-09-09", "Jane Doe", wallet="Mpesa"
            )
        default_body = json.loads(send.calls[0].request.content.decode())
        mpesa_body = json.loads(send.calls[1].request.content.decode())
        assert default_body["destination"]["walletName"] == "Equitel"
        assert mpesa_body["destination"]["walletName"] == "Mpesa"


# ---------------------------------------------------------------- Vouchers


def test_voucher_roundtrip_and_tamper():
    issuer = VoucherIssuer(bytes.fromhex("22" * 32))
    bundle = issuer.issue(
        "0xAbC0000000000000000000000000000000000001",
        20_000_000,
        "TIH3XXXX",
        "daraja",
        3600,
    )
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
        verify_voucher(
            bundle, issuer.public_key_hex, now=bundle["voucher"]["expires_at"] + 1
        )


# ---------------------------------------------------------------- End-to-end (dry run)


def test_buy_gas_then_callback_mints_and_issues_voucher():
    client = TestClient(app)
    with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
        mock.get("/oauth/v1/generate").respond(
            200, json={"access_token": "t", "expires_in": 3599}
        )
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
    v = verify_voucher(
        data["voucher"], VoucherIssuer(bytes.fromhex("11" * 32)).public_key_hex
    )
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


def _jenga_ipn(order_ref: str, status: str, amount: int = 20) -> dict:
    """Shape from the Jenga M-Pesa STK push docs (wallet-based settlement)."""
    return {
        "callbackType": "IPN",
        "customer": {"name": "Jane", "mobileNumber": "0722000000", "reference": order_ref},
        "transaction": {
            "date": "2026-09-09 12:00:00",
            "reference": "SH90HU7FO2",
            "paymentMode": "MPESA",
            "amount": amount,
            "currency": "KES",
            "serviceCharge": 1,
            "billNumber": "INVDBU",
            "servedBy": "JENGA",
            "status": status,
        },
        "bank": {"reference": "NONE", "transactionType": "C", "account": "NONE"},
    }


def test_jenga_mpesa_callback_keys_on_our_order_reference():
    client = TestClient(app)
    PENDING_ORDERS["OR-XK-1"] = {
        "phone": "254722000000",
        "amount_kes": 20,
        "client_address": "0x" + "ab" * 20,
        "rail": "jenga",
    }
    r = client.post("/jenga/mpesa-callback", json=_jenga_ipn("OR-XK-1", "SUCCESS"))
    assert r.status_code == 200
    data = r.json()
    assert data["fulfilled"] is True
    assert data["mint"]["args"][1] == 20_000_000
    v = verify_voucher(
        data["voucher"], VoucherIssuer(bytes.fromhex("11" * 32)).public_key_hex
    )
    assert v.fiat_ref == "SH90HU7FO2"  # Jenga's receipt id, not our order key
    assert "OR-XK-1" not in PENDING_ORDERS


def test_jenga_mpesa_callback_failure_drops_order():
    client = TestClient(app)
    PENDING_ORDERS["OR-XK-2"] = {
        "phone": "254722000000",
        "amount_kes": 20,
        "client_address": "0x" + "ab" * 20,
        "rail": "jenga",
    }
    r = client.post("/jenga/mpesa-callback", json=_jenga_ipn("OR-XK-2", "FAILED"))
    assert r.status_code == 200
    assert r.json() == {"accepted": True, "fulfilled": False}
    assert "OR-XK-2" not in PENDING_ORDERS


# ---------------------------------------------------------------- health


def test_health_reports_environment_shape_without_secrets():
    client = TestClient(app)
    body = client.get("/health").json()
    assert body["ok"] is True
    assert body["chain_id"] == SETTINGS.chain_id
    assert body["dry_run"] is True
    assert body["bridge_key_set"] is False
    # Never echo a key: the only key-related field is a boolean.
    assert "bridge_private_key" not in body
    assert not any(isinstance(v, str) and v.startswith("0x") and len(v) > 42 for v in body.values())
