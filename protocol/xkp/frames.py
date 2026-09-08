"""XKP v1 frame codec. Layout per protocol/spec.md section 2.

This module is the byte-exact reference for the C firmware port: same struct
layout, same CRC polynomial, same rejection rules.
"""

import struct
from dataclasses import dataclass, field
from enum import IntEnum

MAGIC = 0x4B58  # "XK" when packed little-endian
VERSION = 1
BROADCAST = b"\xff" * 8

_HEADER = struct.Struct("<HBBB8s8sIH")
HEADER_SIZE = _HEADER.size  # 27
CRC_SIZE = 2
OVERHEAD = HEADER_SIZE + CRC_SIZE  # 29


class FrameType(IntEnum):
    BEACON = 0
    JOIN_REQ = 1
    JOIN_ACK = 2
    DATA = 3
    DATA_ACK = 4
    RECEIPT = 5
    RECEIPT_ACK = 6
    TELEMETRY = 7
    SETTLE_NOTIFY = 8


FLAG_ACK_REQ = 0x01
FLAG_ENCRYPTED = 0x02
FLAG_FRAGMENT = 0x04

ACK_TYPE_FOR = {
    FrameType.DATA: FrameType.DATA_ACK,
    FrameType.RECEIPT: FrameType.RECEIPT_ACK,
    FrameType.JOIN_REQ: FrameType.JOIN_ACK,
    FrameType.TELEMETRY: FrameType.DATA_ACK,
}


class FrameError(ValueError):
    pass


def crc16_ccitt(data: bytes, crc: int = 0xFFFF) -> int:
    """CRC16-CCITT (poly 0x1021, init 0xFFFF), bitwise reference form so the
    C port is a line-for-line translation."""
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    return crc


@dataclass
class Frame:
    ftype: FrameType
    src: bytes
    dst: bytes
    seq: int
    payload: bytes = b""
    flags: int = 0
    ttl: int = 8
    version: int = VERSION

    def __post_init__(self):
        if len(self.src) != 8 or len(self.dst) != 8:
            raise FrameError("src/dst must be 8-byte node ids")
        if len(self.payload) > 0xFFFF:
            raise FrameError("payload too large")


def pack(f: Frame) -> bytes:
    header = _HEADER.pack(
        MAGIC,
        ((f.version & 0x0F) << 4) | (f.ftype & 0x0F),
        f.flags & 0xFF,
        f.ttl & 0xFF,
        f.src,
        f.dst,
        f.seq & 0xFFFFFFFF,
        len(f.payload),
    )
    body = header + f.payload
    return body + struct.pack("<H", crc16_ccitt(body))


def unpack(data: bytes) -> Frame:
    if len(data) < OVERHEAD:
        raise FrameError("short frame")
    magic, vt, flags, ttl, src, dst, seq, plen = _HEADER.unpack_from(data)
    if magic != MAGIC:
        raise FrameError("bad magic")
    if (vt >> 4) != VERSION:
        raise FrameError("unsupported version")
    if (vt & 0x0F) > max(FrameType):
        raise FrameError("unknown frame type")
    if len(data) != HEADER_SIZE + plen + CRC_SIZE:
        raise FrameError("length mismatch")
    (crc,) = struct.unpack_from("<H", data, HEADER_SIZE + plen)
    if crc16_ccitt(data[: HEADER_SIZE + plen]) != crc:
        raise FrameError("crc mismatch")
    return Frame(
        ftype=FrameType(vt & 0x0F),
        src=src,
        dst=dst,
        seq=seq,
        payload=data[HEADER_SIZE : HEADER_SIZE + plen],
        flags=flags,
        ttl=ttl,
    )
