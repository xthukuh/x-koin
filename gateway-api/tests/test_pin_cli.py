"""The payout pin CLI must work without the beneficiary private key ever
touching a computer: print the message for a hardware wallet, then verify the
pasted signature."""

from __future__ import annotations

import os
import sys

import pytest
from eth_account import Account

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.payout.pin import PayoutPinError, _main, pin_message  # noqa: E402

TOKEN = "0x" + "ab" * 20
MSISDN = "254722000000"


def test_print_message_mode_needs_no_key(capsys, monkeypatch):
    monkeypatch.delenv("XKOIN_PIN_SIGNER_KEY", raising=False)
    _main([MSISDN, "--chain-id", "84532", "--token", TOKEN, "--print-message"])
    out = capsys.readouterr().out
    assert "xKoin payout pin v1" in out
    assert f"msisdn: {MSISDN}" in out
    assert "chain_id: 84532" in out
    assert f"token: {TOKEN.lower()}" in out


def test_verify_mode_accepts_hardware_wallet_signature(capsys, monkeypatch):
    monkeypatch.delenv("XKOIN_PIN_SIGNER_KEY", raising=False)
    cold = Account.create("cold")
    sig = Account.sign_message(pin_message(MSISDN, 84532, TOKEN), cold.key).signature
    _main(
        [
            MSISDN,
            "--chain-id",
            "84532",
            "--token",
            TOKEN,
            "--verify",
            "0x" + sig.hex(),
            "--beneficiary",
            cold.address,
        ]
    )
    out = capsys.readouterr().out
    assert f"XKOIN_PAYOUT_MSISDN={MSISDN}" in out
    assert f"XKOIN_PAYOUT_MSISDN_SIGNATURE=0x{sig.hex()}" in out


def test_verify_mode_rejects_wrong_beneficiary(monkeypatch):
    monkeypatch.delenv("XKOIN_PIN_SIGNER_KEY", raising=False)
    cold = Account.create("cold")
    other = Account.create("other")
    sig = Account.sign_message(pin_message(MSISDN, 84532, TOKEN), cold.key).signature
    with pytest.raises(SystemExit) as exc:
        _main(
            [
                MSISDN,
                "--chain-id",
                "84532",
                "--token",
                TOKEN,
                "--verify",
                "0x" + sig.hex(),
                "--beneficiary",
                other.address,
            ]
        )
    assert "not signed by beneficiary" in str(exc.value)


def test_sign_mode_still_works_with_env_key(capsys, monkeypatch):
    cold = Account.create("cold")
    monkeypatch.setenv("XKOIN_PIN_SIGNER_KEY", "0x" + cold.key.hex())
    _main([MSISDN, "--chain-id", "84532", "--token", TOKEN])
    out = capsys.readouterr().out
    assert f"signer:    {cold.address}" in out
    assert "XKOIN_PAYOUT_MSISDN_SIGNATURE=0x" in out


def test_pin_error_is_value_error():
    assert issubclass(PayoutPinError, ValueError)
