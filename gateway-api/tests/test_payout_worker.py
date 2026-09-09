"""B2C payout worker: beneficiary -> bridge transfer fires a Daraja B2C to the
pinned founder MSISDN, then burns exactly the paid-out XKN.

Security property under test (HANDOVER s4 item 2, spec s8.1): a compromised
server may DELAY a payout but can never REDIRECT one. Three mechanisms carry
that, and each has a test here:
  1. only transfers whose `from` is the on-chain beneficiary are paid;
  2. the destination MSISDN is signed by the beneficiary key and verified
     against that same address, so config edits without the cold key fail;
  3. the event carries no destination at all: PartyB is always the pin.
"""

import os

import httpx
import pytest
import respx
from eth_account import Account

os.environ["XKOIN_DRY_RUN"] = "true"

from app.config import get_settings  # noqa: E402
from app.daraja.client import DarajaClient  # noqa: E402
from app.payout.pin import PayoutPin, PayoutPinError, pin_message  # noqa: E402
from app.payout.worker import PayoutLedger, PayoutWorker  # noqa: E402
from app.settlement.chain import ChainBridge  # noqa: E402

SETTINGS = get_settings()
FOUNDER = Account.create()  # stands in for the beneficiary cold key
STRANGER = Account.create()
BRIDGE = "0x" + "b1" * 20
MSISDN = "254722000000"
UKES = 1_000_000


def make_pin(msisdn: str = MSISDN, signer=FOUNDER) -> PayoutPin:
    sig = Account.sign_message(
        pin_message(msisdn, SETTINGS.chain_id, SETTINGS.token_address), signer.key
    ).signature
    return PayoutPin.verify(
        msisdn, sig.hex(), SETTINGS.chain_id, SETTINGS.token_address, FOUNDER.address
    )


def transfer(
    value_ukes: int,
    sender: str = FOUNDER.address,
    to: str = BRIDGE,
    tx: str = "0xaa",
    log_index: int = 0,
):
    return {
        "from": sender,
        "to": to,
        "value": value_ukes,
        "tx_hash": tx,
        "log_index": log_index,
    }


def make_worker(http: httpx.AsyncClient, **overrides) -> PayoutWorker:
    return PayoutWorker(
        settings=SETTINGS,
        daraja=DarajaClient(SETTINGS, http),
        chain=ChainBridge(SETTINGS),
        beneficiary=FOUNDER.address,
        bridge_address=BRIDGE,
        pin=overrides.pop("pin", make_pin()),
        ledger=PayoutLedger(":memory:"),
        **overrides,
    )


def mock_daraja(mock: respx.MockRouter, response_code: str = "0"):
    mock.get("/oauth/v1/generate").respond(
        200, json={"access_token": "t", "expires_in": 3599}
    )
    return mock.post("/mpesa/b2c/v1/paymentrequest").respond(
        200,
        json={
            "ResponseCode": response_code,
            "ConversationID": "AG_20260909_1",
            "OriginatorConversationID": "orig-1",
        },
    )


def b2c_result(conversation_id: str, result_code: int, amount_kes: int) -> dict:
    return {
        "Result": {
            "ResultType": 0,
            "ResultCode": result_code,
            "ResultDesc": "ok" if result_code == 0 else "failed",
            "OriginatorConversationID": "orig-1",
            "ConversationID": conversation_id,
            "TransactionID": "QAB1XYZ",
            "ResultParameters": {
                "ResultParameter": [
                    {"Key": "TransactionAmount", "Value": amount_kes},
                    {"Key": "TransactionReceipt", "Value": "QAB1XYZ"},
                ]
            },
        }
    }


# ---------------------------------------------------------------- pin


def test_pin_verifies_and_rejects_tamper_or_wrong_signer():
    pin = make_pin()
    assert pin.msisdn == MSISDN
    good_sig = Account.sign_message(
        pin_message(MSISDN, SETTINGS.chain_id, SETTINGS.token_address), FOUNDER.key
    ).signature.hex()
    # Same signature, edited MSISDN: exactly what a server compromise would try.
    with pytest.raises(PayoutPinError, match="not signed by beneficiary"):
        PayoutPin.verify(
            "254733999999",
            good_sig,
            SETTINGS.chain_id,
            SETTINGS.token_address,
            FOUNDER.address,
        )
    # Fresh signature from a key that is not the beneficiary.
    bad_sig = Account.sign_message(
        pin_message(MSISDN, SETTINGS.chain_id, SETTINGS.token_address), STRANGER.key
    ).signature.hex()
    with pytest.raises(PayoutPinError, match="not signed by beneficiary"):
        PayoutPin.verify(
            MSISDN, bad_sig, SETTINGS.chain_id, SETTINGS.token_address, FOUNDER.address
        )
    # Replay on another chain id fails too.
    with pytest.raises(PayoutPinError):
        PayoutPin.verify(
            MSISDN,
            good_sig,
            SETTINGS.chain_id + 1,
            SETTINGS.token_address,
            FOUNDER.address,
        )
    with pytest.raises(PayoutPinError, match="MSISDN"):
        PayoutPin.verify(
            "0722000000",
            good_sig,
            SETTINGS.chain_id,
            SETTINGS.token_address,
            FOUNDER.address,
        )


# ---------------------------------------------------------------- transfer handling


@pytest.mark.anyio
async def test_beneficiary_transfer_fires_b2c_to_pinned_msisdn_and_defers_burn():
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        worker = make_worker(http)
        with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
            b2c = mock_daraja(mock)
            row = await worker.handle_transfer(transfer(65 * UKES + 123_456))
        assert b2c.call_count == 1
        body = b2c.calls[0].request.read().decode()
        assert f'"PartyB":"{MSISDN}"' in body
        assert '"Amount":65' in body  # floor to whole KES; dust stays in the bridge
        assert '"CommandID":"BusinessPayment"' in body
        assert row["status"] == "b2c_sent"
        assert row["amount_kes"] == 65
        assert row["dust_ukes"] == 123_456
        assert row["conversation_id"] == "AG_20260909_1"
        assert row["burn_tx"] is None  # nothing burned until Daraja confirms


@pytest.mark.anyio
async def test_transfers_not_from_beneficiary_or_not_to_bridge_are_ignored():
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        worker = make_worker(http)
        with respx.mock(
            base_url=SETTINGS.daraja_base_url, assert_all_called=False
        ) as mock:
            b2c = mock_daraja(mock)
            stranger = await worker.handle_transfer(
                transfer(50 * UKES, sender=STRANGER.address, tx="0x01")
            )
            elsewhere = await worker.handle_transfer(
                transfer(50 * UKES, to="0x" + "cc" * 20, tx="0x02")
            )
        assert b2c.call_count == 0
        assert stranger["status"] == "ignored"
        assert elsewhere["status"] == "ignored"
        assert worker.ledger.count(status="b2c_sent") == 0


@pytest.mark.anyio
async def test_event_fields_cannot_choose_the_destination():
    """An attacker who controls the event feed still pays only the pin."""
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        worker = make_worker(http)
        hostile = transfer(20 * UKES)
        hostile.update(
            {
                "phone": "254733999999",
                "msisdn": "254733999999",
                "PartyB": "254733999999",
            }
        )
        with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
            b2c = mock_daraja(mock)
            await worker.handle_transfer(hostile)
        body = b2c.calls[0].request.read().decode()
        assert f'"PartyB":"{MSISDN}"' in body
        assert "254733999999" not in body


@pytest.mark.anyio
async def test_duplicate_event_is_paid_once():
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        worker = make_worker(http)
        with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
            b2c = mock_daraja(mock)
            first = await worker.handle_transfer(
                transfer(30 * UKES, tx="0xdd", log_index=3)
            )
            again = await worker.handle_transfer(
                transfer(30 * UKES, tx="0xdd", log_index=3)
            )
        assert b2c.call_count == 1
        assert first["key"] == again["key"]
        assert again["status"] == "b2c_sent"


@pytest.mark.anyio
async def test_below_minimum_is_held_not_paid():
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        worker = make_worker(http)
        with respx.mock(
            base_url=SETTINGS.daraja_base_url, assert_all_called=False
        ) as mock:
            b2c = mock_daraja(mock)
            row = await worker.handle_transfer(transfer(9 * UKES + 999_999))
        assert b2c.call_count == 0
        assert row["status"] == "held"
        assert row["amount_kes"] == 9


# ---------------------------------------------------------------- B2C result -> burn


@pytest.mark.anyio
async def test_confirmed_b2c_burns_exactly_the_paid_amount():
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        worker = make_worker(http)
        with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
            mock_daraja(mock)
            await worker.handle_transfer(transfer(65 * UKES + 123_456))
        row = worker.handle_b2c_result(b2c_result("AG_20260909_1", 0, 65))
        assert row["status"] == "settled"
        burn = row["burn_tx"]
        assert burn["fn"] == "bridgeBurn"
        assert burn["args"][0] == 65 * UKES  # dust is never burned
        assert burn["args"][1] == "QAB1XYZ"  # Daraja receipt as the fiatRef
        assert row["receipt"] == "QAB1XYZ"


@pytest.mark.anyio
async def test_failed_b2c_keeps_tokens_and_retries_up_to_cap():
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        worker = make_worker(http, max_attempts=3)
        with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
            b2c = mock_daraja(mock)
            await worker.handle_transfer(transfer(40 * UKES))
            failed = worker.handle_b2c_result(b2c_result("AG_20260909_1", 2001, 40))
            assert failed["status"] == "b2c_failed"
            assert failed["burn_tx"] is None
            # retry 2 and 3 succeed at the API level, then the cap holds
            retried = await worker.retry_failed()
            assert len(retried) == 1 and retried[0]["attempts"] == 2
            worker.handle_b2c_result(b2c_result("AG_20260909_1", 2001, 40))
            retried = await worker.retry_failed()
            assert retried[0]["attempts"] == 3
            worker.handle_b2c_result(b2c_result("AG_20260909_1", 2001, 40))
            exhausted = await worker.retry_failed()
        assert exhausted == []
        assert b2c.call_count == 3
        assert worker.ledger.count(status="exhausted") == 1


def test_unknown_result_is_acknowledged_without_side_effects():
    worker = make_worker(httpx.AsyncClient(base_url=SETTINGS.daraja_base_url))
    row = worker.handle_b2c_result(b2c_result("AG_never_sent", 0, 10))
    assert row is None
    assert worker.ledger.count(status="settled") == 0


@pytest.mark.anyio
async def test_timeout_callback_marks_row_retryable():
    async with httpx.AsyncClient(base_url=SETTINGS.daraja_base_url) as http:
        worker = make_worker(http)
        with respx.mock(base_url=SETTINGS.daraja_base_url) as mock:
            mock_daraja(mock)
            await worker.handle_transfer(transfer(15 * UKES))
        row = worker.handle_b2c_timeout(
            {
                "Result": {
                    "ConversationID": "AG_20260909_1",
                    "ResultCode": 1,
                    "ResultDesc": "QueueTimeout",
                }
            }
        )
        assert row["status"] == "b2c_timeout"
        assert row["burn_tx"] is None


# ---------------------------------------------------------------- HTTP wiring


def test_result_endpoints_route_to_worker():
    from fastapi.testclient import TestClient

    import app.main as main

    worker = make_worker(httpx.AsyncClient(base_url=SETTINGS.daraja_base_url))
    main.PAYOUT_WORKER = worker
    try:
        client = TestClient(app=main.app)
        r = client.post("/daraja/b2c-result", json=b2c_result("AG_nothing", 0, 10))
        assert r.status_code == 200 and r.json() == {
            "ResultCode": 0,
            "ResultDesc": "Accepted",
        }
        r = client.post(
            "/daraja/b2c-timeout", json={"Result": {"ConversationID": "AG_nothing"}}
        )
        assert r.status_code == 200
        r = client.get("/payouts")
        assert r.status_code == 200 and r.json()["rows"] == []
    finally:
        main.PAYOUT_WORKER = None
