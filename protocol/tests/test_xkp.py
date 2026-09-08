import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nacl.signing import SigningKey

from xkp.frames import (
    OVERHEAD, Frame, FrameError, FrameType, crc16_ccitt, pack, unpack,
)
from xkp.proofs import (
    Receipt, make_join_payload, node_id_from_verify_key, receipt_from_wire,
    receipt_to_wire, verify_join_payload, RECEIPT_WIRE_SIZE,
)
from xkp.sim import HOMEPLUG, KQ130F, LORA_SF7, ClientTransfer, Node, Sim, admit


def test_crc16_known_vector():
    # CRC16-CCITT(FALSE) of "123456789" is 0x29B1
    assert crc16_ccitt(b"123456789") == 0x29B1


def test_frame_roundtrip():
    f = Frame(FrameType.RECEIPT, b"s" * 8, b"d" * 8, 42, b"payload", flags=1, ttl=5)
    g = unpack(pack(f))
    assert (g.ftype, g.src, g.dst, g.seq, g.payload, g.flags, g.ttl) == (
        FrameType.RECEIPT, b"s" * 8, b"d" * 8, 42, b"payload", 1, 5)
    assert len(pack(f)) == OVERHEAD + len(f.payload)


@pytest.mark.parametrize("mutator", [
    lambda b: b[:5],                                # truncation
    lambda b: b"\x00\x00" + b[2:],                  # bad magic
    lambda b: b[:-1] + bytes([b[-1] ^ 0xFF]),       # crc corrupt
    lambda b: b[:30],                               # length mismatch
    lambda b: b"",                                  # empty
])
def test_frame_rejections(mutator):
    good = pack(Frame(FrameType.DATA, b"a" * 8, b"b" * 8, 1, b"x" * 10))
    with pytest.raises(FrameError):
        unpack(mutator(bytearray(good)) if isinstance(mutator(good), bytearray)
               else mutator(good))


def test_receipt_roundtrip_and_tamper():
    sk = SigningKey.generate()
    vk = bytes(sk.verify_key)
    r = Receipt(node_id_from_verify_key(vk), b"n" * 8, b"S" * 16, 1_234_567, 3)
    wire = receipt_to_wire(r, sk)
    assert len(wire) == RECEIPT_WIRE_SIZE == 108  # narrowband-PLC safe
    got = receipt_from_wire(wire, vk)
    assert got.cumulative_bytes == 1_234_567 and got.seq == 3
    bad = bytearray(wire)
    bad[40] ^= 1  # bump cumulative counter
    with pytest.raises(ValueError):
        receipt_from_wire(bytes(bad), vk)
    other = SigningKey.generate()
    with pytest.raises(ValueError):
        receipt_from_wire(wire, bytes(other.verify_key))


def test_join_voucher():
    kiosk = SigningKey(b"\x07" * 32)
    client = SigningKey.generate()
    payload = make_join_payload(bytes(client.verify_key), kiosk)
    assert verify_join_payload(payload, bytes(kiosk.verify_key)) == bytes(client.verify_key)
    forged = bytearray(payload)
    forged[0] ^= 1
    with pytest.raises(ValueError):
        verify_join_payload(bytes(forged), bytes(kiosk.verify_key))


def test_sim_transfer_completes_under_loss():
    kiosk = SigningKey(b"\x11" * 32)
    m = LORA_SF7()
    m.loss = 0.25
    m.loss_ewma = 0.25
    sim = Sim(99)
    c = Node(sim, "client")
    g = Node(sim, "gateway", kiosk_vk=bytes(kiosk.verify_key))
    c.connect(g, [m])
    admit(sim, c, g, kiosk, lambda: None)
    sim.run()
    x = ClientTransfer(sim, c, "gateway", 50_000, receipt_every=10_000, window=8)
    x.start()
    sim.run(until=5_000)
    assert x.done_at is not None and not x.failed
    assert g.proven[c.node_id] == 50_000
    assert g.receipts_rejected == 0
    assert m.tx_frames > m.delivered_frames  # retransmissions actually happened


def test_sim_prefers_fastest_medium_and_fails_over():
    kiosk = SigningKey(b"\x11" * 32)
    hp, kq, lo = HOMEPLUG(), KQ130F(), LORA_SF7()
    sim = Sim(5)
    c = Node(sim, "client")
    g = Node(sim, "gateway", kiosk_vk=bytes(kiosk.verify_key))
    c.connect(g, [hp, kq, lo])
    admit(sim, c, g, kiosk, lambda: None)
    sim.run()
    x = ClientTransfer(sim, c, "gateway", 500_000, receipt_every=100_000)
    x.start()
    sim.run()
    assert hp.tx_bytes > 0.95 * (hp.tx_bytes + kq.tx_bytes + lo.tx_bytes)
    # now kill PLC mid-flight and confirm LoRa carries the remainder
    hp.up = False
    kq.up = False
    y = ClientTransfer(sim, c, "gateway", 20_000, receipt_every=10_000, window=4)
    y.start()
    sim.run(until=sim.now + 4_000)
    assert y.done_at is not None
    assert lo.delivered_app_bytes >= 20_000
