"""Founder MSISDN pin for the B2C payout worker.

The destination phone number for fee payouts is not trusted from config as
plain text. It is signed (EIP-191 personal message) by the treasury
beneficiary key, and the worker verifies that signature against the
beneficiary address it reads from the chain. Editing the MSISDN in .env
without the cold key therefore fails closed: the worker refuses to start, so
a server compromise can delay payouts but never redirect them (spec s8.1).

Generating the signature is an OFFLINE step on the founder's machine:

    XKOIN_PIN_SIGNER_KEY=0x<beneficiary private key> python -m app.payout.pin \
        254722000000 --chain-id 84532 --token 0xTOKEN

Prints the signature to paste into XKOIN_PAYOUT_MSISDN_SIGNATURE. The private
key is read from the environment only, never from argv, and never leaves the
process.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from eth_account import Account
from eth_account.messages import SignableMessage, encode_defunct

MSISDN_RE = re.compile(r"^254\d{9}$")
PIN_VERSION = 1


class PayoutPinError(ValueError):
    pass


def pin_message(msisdn: str, chain_id: int, token_address: str) -> SignableMessage:
    """Canonical EIP-191 message. Binds chain id and token so a signature from
    a testnet deployment cannot be replayed against mainnet."""
    text = (
        f"xKoin payout pin v{PIN_VERSION}\n"
        f"msisdn: {msisdn}\n"
        f"chain_id: {chain_id}\n"
        f"token: {token_address.lower()}"
    )
    return encode_defunct(text=text)


@dataclass(frozen=True)
class PayoutPin:
    msisdn: str
    beneficiary: str

    @classmethod
    def verify(
        cls,
        msisdn: str,
        signature_hex: str,
        chain_id: int,
        token_address: str,
        beneficiary: str,
    ) -> "PayoutPin":
        if not MSISDN_RE.match(msisdn or ""):
            raise PayoutPinError(f"MSISDN must match 254XXXXXXXXX, got {msisdn!r}")
        if not signature_hex:
            raise PayoutPinError("payout MSISDN signature missing")
        try:
            sig = bytes.fromhex(signature_hex.removeprefix("0x"))
            recovered = Account.recover_message(
                pin_message(msisdn, chain_id, token_address), signature=sig
            )
        except Exception as exc:  # malformed hex, bad recovery id, wrong length
            raise PayoutPinError(f"payout MSISDN signature unreadable: {exc}") from exc
        if recovered.lower() != beneficiary.lower():
            raise PayoutPinError(
                f"payout MSISDN not signed by beneficiary {beneficiary} (signer {recovered})"
            )
        return cls(msisdn=msisdn, beneficiary=beneficiary)


def _main() -> None:
    import argparse
    import os
    import sys

    parser = argparse.ArgumentParser(description="Sign the payout MSISDN pin (offline).")
    parser.add_argument("msisdn")
    parser.add_argument("--chain-id", type=int, required=True)
    parser.add_argument("--token", required=True, help="xKoinToken address")
    args = parser.parse_args()
    key = os.environ.get("XKOIN_PIN_SIGNER_KEY")
    if not key:
        sys.exit("set XKOIN_PIN_SIGNER_KEY in the environment (never on the command line)")
    if not MSISDN_RE.match(args.msisdn):
        sys.exit("MSISDN must match 254XXXXXXXXX")
    acct = Account.from_key(key)
    sig = Account.sign_message(pin_message(args.msisdn, args.chain_id, args.token), key).signature
    print(f"signer:    {acct.address}")
    print(f"XKOIN_PAYOUT_MSISDN={args.msisdn}")
    print(f"XKOIN_PAYOUT_MSISDN_SIGNATURE=0x{sig.hex()}")


if __name__ == "__main__":
    _main()
