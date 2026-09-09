"""Offline Gas Voucher certificates.

On confirmed fiat payment the kiosk signs a voucher with its Ed25519 Root Key.
Gateway firmware holds only the 32-byte public key and verifies vouchers fully
offline (< 4.5 ms on the ESP32-S3 per plan M1), so voucher admission survives
backhaul loss. Canonical serialization is compact sorted-key JSON so firmware,
backend, and kiosk-web all hash identical bytes.
"""

import base64
import json
import time
from dataclasses import asdict, dataclass

from nacl.exceptions import BadSignatureError
from nacl.signing import SigningKey, VerifyKey


@dataclass(frozen=True)
class GasVoucher:
    client_address: str  # EVM address of the buyer's ticket-signing key
    amount_ukes: int  # micro-KES credited (== XKN base units, 6 decimals)
    fiat_ref: str  # M-Pesa receipt or Jenga transaction reference
    rail: str  # "daraja" | "jenga"
    issued_at: int  # unix seconds
    expires_at: int  # unix seconds

    def canonical_bytes(self) -> bytes:
        return json.dumps(asdict(self), sort_keys=True, separators=(",", ":")).encode()


class VoucherIssuer:
    def __init__(self, root_seed: bytes):
        if len(root_seed) != 32:
            raise ValueError("Kiosk root key seed must be exactly 32 bytes")
        self._key = SigningKey(root_seed)

    @property
    def public_key_hex(self) -> str:
        return self._key.verify_key.encode().hex()

    def issue(
        self,
        client_address: str,
        amount_ukes: int,
        fiat_ref: str,
        rail: str,
        ttl_seconds: int,
    ) -> dict:
        now = int(time.time())
        voucher = GasVoucher(
            client_address=client_address.lower(),
            amount_ukes=amount_ukes,
            fiat_ref=fiat_ref,
            rail=rail,
            issued_at=now,
            expires_at=now + ttl_seconds,
        )
        signature = self._key.sign(voucher.canonical_bytes()).signature
        return {
            "voucher": asdict(voucher),
            "signature": base64.b64encode(signature).decode(),
        }


def verify_voucher(
    bundle: dict, public_key_hex: str, now: int | None = None
) -> GasVoucher:
    """Reference verifier mirroring what firmware does in C. Raises ValueError
    on any tamper, wrong key, or expiry."""
    voucher = GasVoucher(**bundle["voucher"])
    signature = base64.b64decode(bundle["signature"])
    try:
        VerifyKey(bytes.fromhex(public_key_hex)).verify(
            voucher.canonical_bytes(), signature
        )
    except BadSignatureError as exc:
        raise ValueError("Voucher signature invalid") from exc
    if voucher.expires_at < (now if now is not None else int(time.time())):
        raise ValueError("Voucher expired")
    return voucher
