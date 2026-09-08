"""XKP proof layer (P1 admission, P3 proof).

Receipt wire format (44 B canonical + 64 B Ed25519 signature = 108 B, which
fits the 128 B KQ-130F narrowband PLC MTU by design: proofs must flow even on
the slowest medium).
"""

import hashlib
import struct
from dataclasses import dataclass

from nacl.exceptions import BadSignatureError
from nacl.signing import SigningKey, VerifyKey

RECEIPT_STRUCT = struct.Struct("<8s8s16sQI")  # 44 bytes
RECEIPT_WIRE_SIZE = RECEIPT_STRUCT.size + 64


def node_id_from_verify_key(vk: bytes) -> bytes:
    """8-byte node id = first 8 bytes of SHA-256 of the Ed25519 public key."""
    return hashlib.sha256(vk).digest()[:8]


@dataclass(frozen=True)
class Receipt:
    client_id: bytes  # 8
    node_id: bytes  # 8
    session: bytes  # 16-byte nonce fixed at admission
    cumulative_bytes: int
    seq: int

    def canonical(self) -> bytes:
        return RECEIPT_STRUCT.pack(
            self.client_id, self.node_id, self.session, self.cumulative_bytes, self.seq
        )


def sign_receipt(r: Receipt, sk: SigningKey) -> bytes:
    return sk.sign(r.canonical()).signature


def receipt_to_wire(r: Receipt, sk: SigningKey) -> bytes:
    return r.canonical() + sign_receipt(r, sk)


def receipt_from_wire(data: bytes, client_vk: bytes) -> Receipt:
    """Parse and verify. Raises ValueError on any tamper or wrong signer."""
    if len(data) != RECEIPT_WIRE_SIZE:
        raise ValueError("bad receipt size")
    fields = RECEIPT_STRUCT.unpack(data[: RECEIPT_STRUCT.size])
    r = Receipt(*fields)
    try:
        VerifyKey(client_vk).verify(data[: RECEIPT_STRUCT.size], data[RECEIPT_STRUCT.size :])
    except BadSignatureError as exc:
        raise ValueError("receipt signature invalid") from exc
    if r.client_id != node_id_from_verify_key(client_vk):
        raise ValueError("client id does not match key")
    return r


# ---------------------------------------------------------------- admission

def make_join_payload(client_vk: bytes, kiosk_sk: SigningKey) -> bytes:
    """Voucher-lite for the simulator: kiosk root key attests the client key.
    Production uses the full GasVoucher JSON (gateway-api/app/vouchers.py);
    wire size here mirrors its signature cost. 96 B total, narrowband-safe."""
    return client_vk + kiosk_sk.sign(client_vk).signature


def verify_join_payload(payload: bytes, kiosk_vk: bytes) -> bytes:
    if len(payload) != 96:
        raise ValueError("bad join payload size")
    client_vk, sig = payload[:32], payload[32:]
    try:
        VerifyKey(kiosk_vk).verify(client_vk, sig)
    except BadSignatureError as exc:
        raise ValueError("voucher signature invalid") from exc
    return client_vk
