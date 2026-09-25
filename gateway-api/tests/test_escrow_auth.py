"""Relayed escrow exits: signature pre-check and the two routes, in dry run."""

import os
import time

import pytest
from eth_account import Account
from eth_account.messages import encode_typed_data
from fastapi.testclient import TestClient

os.environ["XKOIN_DRY_RUN"] = "true"

from app.config import get_settings  # noqa: E402
from app.escrow_auth import recover, typed_data  # noqa: E402
from app.main import app  # noqa: E402

# Vectors from web/src/demo/crypto.js. A forge test deployed xKoinEscrow at
# ESCROW on chain 31337 and accepted both signatures (2026-09-26).
CHAIN = 31337
ESCROW = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
AMINA = "0x04058E195865C8C6f52d568e1a4574C18169CdDA"
BARAKA = "0x7fBce6431AF7fb5F1F20FD433a67899f1BB38baE"
D = 2_000_000_000
WSIG = bytes.fromhex(
    "dad5b2189c9253c3201e10102a8e18ebbbbdeac9bb376ceb4c44f26ac00d3c78088d9cc0207516704cc20a97c95475f123f4ff1cbe0a72f76321f6a8d4c350c41c"
)
TSIG = bytes.fromhex(
    "643caf38d6eab40c81123d3fb48a04cd560a6cae05b6b8215aa82c032e7c20bd35a743ac9ed2e4108b9da913bd14acfb5e2799deae70c8a7c94d04c388847cf01b"
)

KEY = "0x" + "c1" * 32
OWNER = Account.from_key(KEY).address


def test_parity_with_demo_javascript():
    assert (
        recover("withdraw", CHAIN, ESCROW, AMINA, AMINA, 5_000_000, 0, D, WSIG) == AMINA
    )
    assert (
        recover("transfer", CHAIN, ESCROW, AMINA, BARAKA, 1_000_000, 1, D, TSIG)
        == AMINA
    )


def test_signature_binds_every_field():
    assert (
        recover("withdraw", CHAIN, ESCROW, AMINA, BARAKA, 5_000_000, 0, D, WSIG)
        != AMINA
    )  # to
    assert (
        recover("withdraw", CHAIN, ESCROW, AMINA, AMINA, 5_000_001, 0, D, WSIG) != AMINA
    )  # amount
    assert (
        recover("withdraw", CHAIN, ESCROW, AMINA, AMINA, 5_000_000, 1, D, WSIG) != AMINA
    )  # nonce
    assert (
        recover("transfer", CHAIN, ESCROW, AMINA, AMINA, 5_000_000, 0, D, WSIG) != AMINA
    )  # kind
    assert (
        recover("withdraw", 84532, ESCROW, AMINA, AMINA, 5_000_000, 0, D, WSIG) != AMINA
    )  # chain
    assert (
        recover("withdraw", CHAIN, ESCROW, AMINA, AMINA, 5_000_000, 0, D, b"\x00" * 65)
        is None
    )


@pytest.fixture
def client(monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "chain_id", CHAIN)
    monkeypatch.setattr(s, "escrow_address", ESCROW)
    monkeypatch.setattr(s, "dry_run", True)
    return TestClient(app)


def _body(
    kind, to=BARAKA, amount=3_000_000, nonce=0, deadline=None, key=KEY, owner=None
):
    deadline = deadline or int(time.time()) + 3600
    owner = owner or OWNER
    msg = encode_typed_data(
        full_message=typed_data(kind, CHAIN, ESCROW, owner, to, amount, nonce, deadline)
    )
    sig = Account.sign_message(msg, private_key=key).signature
    return {
        "owner": owner,
        "to": to,
        "amount": amount,
        "nonce": nonce,
        "deadline": deadline,
        "signature": "0x" + sig.hex().removeprefix("0x"),
    }


def test_withdraw_relays_in_dry_run(client):
    r = client.post("/escrow/withdraw", json=_body("withdraw", to=OWNER))
    assert r.status_code == 200, r.text
    out = r.json()
    assert (
        out["dry_run"] is True
        and out["fn"] == "withdrawWithSig"
        and out["to"] == ESCROW
    )
    assert out["args"][:3] == [OWNER, OWNER, 3_000_000]
    assert (
        out["args"][4].startswith("0x") and len(out["args"][4]) == 132
    )  # signature as hex
    assert out["precheck"] == {"signer": OWNER, "chain_checks": "skipped (dry run)"}


def test_transfer_relays_in_dry_run(client):
    r = client.post("/escrow/transfer", json=_body("transfer"))
    assert r.status_code == 200, r.text
    assert r.json()["fn"] == "transferDeposit"


def test_redirect_is_refused(client):
    body = _body("withdraw", to=OWNER)
    body["to"] = BARAKA
    r = client.post("/escrow/withdraw", json=body)
    assert r.status_code == 400 and "BadAuthorization" in r.text


def test_wrong_signer_and_cross_kind_are_refused(client):
    assert (
        client.post(
            "/escrow/withdraw", json=_body("withdraw", key="0x" + "d2" * 32)
        ).status_code
        == 400
    )
    assert client.post("/escrow/transfer", json=_body("withdraw")).status_code == 400


def test_expired_zero_address_and_shape(client):
    r = client.post(
        "/escrow/withdraw", json=_body("withdraw", deadline=int(time.time()) - 1)
    )
    assert r.status_code == 400 and "AuthorizationExpired" in r.text
    r = client.post("/escrow/transfer", json=_body("transfer", to="0x" + "0" * 40))
    assert r.status_code == 422 and "ZeroAddress" in r.text
    bad = _body("withdraw")
    bad["signature"] = "0x1234"
    assert client.post("/escrow/withdraw", json=bad).status_code == 422
    bad = _body("withdraw")
    bad["amount"] = 0
    assert client.post("/escrow/withdraw", json=bad).status_code == 422
