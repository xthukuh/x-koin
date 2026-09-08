"""XKP discrete-event simulator.

Models each medium with bandwidth, base loss, latency, MTU, and half-duplex
occupancy. Nodes pick the best live medium per frame (score = bps * (1 -
loss_ewma)), quarantine a medium after 3 consecutive delivery failures, and
retransmit with dedupe at the receiver. Time is virtual; the engine is
deterministic per seed so every reported number is reproducible.
"""

import heapq
import struct
from dataclasses import dataclass, field

from nacl.signing import SigningKey

from xkp.frames import (
    ACK_TYPE_FOR,
    FLAG_ACK_REQ,
    Frame,
    FrameType,
    pack,
)
from xkp.proofs import (
    Receipt,
    node_id_from_verify_key,
    receipt_from_wire,
    receipt_to_wire,
    verify_join_payload,
)

import random


class Sim:
    def __init__(self, seed: int = 1):
        self.now = 0.0
        self._q: list = []
        self._n = 0
        self.rng = random.Random(seed)

    def at(self, t: float, fn):
        heapq.heappush(self._q, (t, self._n, fn))
        self._n += 1

    def after(self, dt: float, fn):
        self.at(self.now + dt, fn)

    def run(self, until: float = 1e12):
        while self._q and self._q[0][0] <= until:
            self.now, _, fn = heapq.heappop(self._q)
            fn()


@dataclass
class Medium:
    name: str
    bps: float
    loss: float  # ground-truth per-frame loss probability
    latency: float
    mtu: int  # max payload bytes per frame
    up: bool = True
    quarantine_until: float = 0.0
    fail_streak: int = 0
    busy_until: float = 0.0
    loss_ewma: float = field(default=-1.0)
    # counters
    tx_frames: int = 0
    tx_bytes: int = 0
    lost_frames: int = 0
    delivered_frames: int = 0
    delivered_app_bytes: int = 0
    airtime: float = 0.0

    def __post_init__(self):
        if self.loss_ewma < 0:
            self.loss_ewma = self.loss

    def live(self, now: float) -> bool:
        return self.up and now >= self.quarantine_until

    def airtime_for(self, nbytes: int) -> float:
        return nbytes * 8 / self.bps

    def score(self) -> float:
        return self.bps * (1.0 - min(self.loss_ewma, 0.99))

    def observe(self, success: bool, now: float, failovers: list):
        self.loss_ewma = 0.85 * self.loss_ewma + 0.15 * (0.0 if success else 1.0)
        if success:
            self.fail_streak = 0
        else:
            self.fail_streak += 1
            if self.fail_streak >= 3:
                self.quarantine_until = now + 2.0
                self.fail_streak = 0
                failovers.append((now, self.name))


def HOMEPLUG():
    return Medium("homeplug", 10_000_000, 0.001, 0.002, 1400)


def KQ130F():
    return Medium("kq130f", 7_680, 0.05, 0.020, 128)  # 9600 baud 8N1


def LORA_SF7():
    return Medium("lora-sf7", 5_468, 0.02, 0.050, 226)  # SF7/BW125/CR4:5


def GFSK150():
    return Medium("gfsk-150k", 150_000, 0.04, 0.010, 226)  # SX1262 GFSK mode


@dataclass
class Link:
    mediums: list

    def best(self, now: float):
        live = [m for m in self.mediums if m.live(now)]
        return max(live, key=lambda m: m.score()) if live else None


MAX_TRIES = 30
MAX_MEDIUM_WAITS = 4000  # 1000 s with no live medium => hard failure


class Node:
    def __init__(self, sim: Sim, name: str, kiosk_vk: bytes | None = None):
        self.sim = sim
        self.name = name
        self.sk = SigningKey.generate()
        self.vk = bytes(self.sk.verify_key)
        self.node_id = node_id_from_verify_key(self.vk)
        self.peers: dict[str, tuple[Link, "Node"]] = {}
        self.kiosk_vk = kiosk_vk  # serving nodes verify admission vouchers
        self._seq = 0
        self._pending: dict[int, dict] = {}
        self._seen: set[tuple[bytes, int]] = set()
        # serving-node state
        self.clients: dict[bytes, bytes] = {}  # client_id -> verify key
        self.proven: dict[bytes, int] = {}  # client_id -> cumulative proven bytes
        self.delivered: dict[bytes, int] = {}  # client_id -> delivered app bytes
        self.max_unproven: int = 0
        self.receipts_verified = 0
        self.receipts_rejected = 0
        self.on_data = None  # optional hook(frame)
        self.failovers: list = []
        self.tele_acked = 0

    def connect(self, other: "Node", mediums: list):
        link = Link(mediums)
        self.peers[other.name] = (link, other)
        other.peers[self.name] = (link, self)
        return link

    def next_seq(self) -> int:
        self._seq += 1
        return self._seq

    # -- reliable send ------------------------------------------------------

    def send(self, peer: str, ftype: FrameType, payload: bytes, on_ack=None, on_fail=None):
        f = Frame(ftype, self.node_id, self.peers[peer][1].node_id, self.next_seq(), payload,
                  flags=FLAG_ACK_REQ)
        self._pending[f.seq] = {
            "frame": f, "peer": peer, "on_ack": on_ack, "on_fail": on_fail,
            "tries": 0, "waits": 0, "medium": None,
        }
        self._tx(f.seq)

    def _tx(self, seq: int):
        info = self._pending.get(seq)
        if info is None:
            return
        link, dest = self.peers[info["peer"]]
        m = link.best(self.sim.now)
        if m is None:
            info["waits"] += 1
            if info["waits"] > MAX_MEDIUM_WAITS:
                self._pending.pop(seq)
                if info["on_fail"]:
                    info["on_fail"]()
                return
            self.sim.after(0.25, lambda: self._tx(seq))
            return
        info["tries"] += 1
        info["medium"] = m
        f = info["frame"]
        wire = len(pack(f))
        start = max(self.sim.now, m.busy_until)
        air = m.airtime_for(wire)
        m.busy_until = start + air
        arrival = start + air + m.latency
        m.tx_frames += 1
        m.tx_bytes += wire
        m.airtime += air
        if self.sim.rng.random() < m.loss:
            m.lost_frames += 1
        else:
            self.sim.at(arrival, lambda: dest._rx(f, m, self))
        timeout = (arrival - self.sim.now) * 2 + 4 * m.latency + 0.05
        self.sim.after(timeout, lambda: self._timeout(seq, info["tries"]))

    def _timeout(self, seq: int, at_try: int):
        info = self._pending.get(seq)
        if info is None or info["tries"] != at_try:
            return  # acked, or a newer attempt owns the timer
        info["medium"].observe(False, self.sim.now, self.failovers)
        if info["tries"] >= MAX_TRIES:
            self._pending.pop(seq)
            if info["on_fail"]:
                info["on_fail"]()
            return
        self._tx(seq)

    def _ack(self, orig: Frame, sender: "Node", medium: Medium):
        atype = ACK_TYPE_FOR.get(orig.ftype)
        if atype is None:
            return
        f = Frame(atype, self.node_id, orig.src, self.next_seq(), struct.pack("<I", orig.seq))
        # Priority ack: modeled as immediate (piggyback/inter-frame gap in the
        # real MAC), so acks never queue behind the sender's own data window.
        # Airtime still counts against the medium and duty-cycle budget.
        wire = len(pack(f))
        air = medium.airtime_for(wire)
        medium.tx_frames += 1
        medium.tx_bytes += wire
        medium.airtime += air
        if self.sim.rng.random() >= medium.loss:
            self.sim.at(self.sim.now + air + medium.latency, lambda: sender._rx(f, medium, self))
        else:
            medium.lost_frames += 1

    def _rx(self, f: Frame, medium: Medium, sender: "Node"):
        medium.delivered_frames += 1
        if f.ftype in (FrameType.DATA_ACK, FrameType.RECEIPT_ACK, FrameType.JOIN_ACK):
            (orig_seq,) = struct.unpack("<I", f.payload)
            info = self._pending.pop(orig_seq, None)
            if info is not None:
                info["medium"].observe(True, self.sim.now, self.failovers)
                if info["on_ack"]:
                    info["on_ack"]()
            return
        if f.flags & FLAG_ACK_REQ:
            self._ack(f, sender, medium)
        key = (f.src, f.seq)
        if key in self._seen:
            return
        self._seen.add(key)
        self._dispatch(f, medium)

    # -- serving-node behaviour --------------------------------------------

    def _dispatch(self, f: Frame, medium: Medium):
        if f.ftype == FrameType.JOIN_REQ:
            if self.kiosk_vk is None:
                return
            client_vk = verify_join_payload(f.payload, self.kiosk_vk)  # raises on tamper
            cid = node_id_from_verify_key(client_vk)
            self.clients[cid] = client_vk
            self.proven.setdefault(cid, 0)
            self.delivered.setdefault(cid, 0)
        elif f.ftype == FrameType.DATA:
            if f.src in self.clients:
                self.delivered[f.src] = self.delivered.get(f.src, 0) + len(f.payload)
                medium.delivered_app_bytes += len(f.payload)
                unproven = self.delivered[f.src] - self.proven.get(f.src, 0)
                self.max_unproven = max(self.max_unproven, unproven)
            if self.on_data:
                self.on_data(f)
        elif f.ftype == FrameType.RECEIPT:
            vk = self.clients.get(f.src)
            if vk is None:
                self.receipts_rejected += 1
                return
            try:
                r = receipt_from_wire(f.payload, vk)
            except ValueError:
                self.receipts_rejected += 1
                return
            if r.cumulative_bytes > self.proven.get(f.src, 0):
                self.proven[f.src] = r.cumulative_bytes
            self.receipts_verified += 1
        elif f.ftype == FrameType.TELEMETRY:
            pass


class ClientTransfer:
    """Windowed reliable upload with cumulative signed receipts (P2 + P3)."""

    def __init__(self, sim, client: Node, server_name: str, total: int,
                 receipt_every: int = 1_000_000, window: int = 16, session: bytes = b"\x00" * 16):
        self.sim = sim
        self.client = client
        self.server_name = server_name
        self.total = total
        self.receipt_every = receipt_every
        self.window = window
        self.session = session
        self.offset = 0
        self.acked = 0
        self.outstanding = 0
        self.retransmissions = 0
        self.receipts_sent = 0
        self._last_receipt_at = 0
        self.done_at: float | None = None
        self.failed = False
        self.first_ack_hook = None  # scenario hook(now)

    def start(self, on_done=None):
        self._on_done = on_done
        self._pump()

    def _pump(self):
        while self.outstanding < self.window and self.offset < self.total:
            link, _ = self.client.peers[self.server_name]
            m = link.best(self.sim.now)
            mtu = m.mtu if m else 128
            chunk = min(mtu, self.total - self.offset)
            self.offset += chunk
            self.outstanding += 1
            self.client.send(
                self.server_name, FrameType.DATA, bytes(chunk),
                on_ack=lambda c=chunk: self._on_chunk_ack(c),
                on_fail=self._on_fail,
            )

    def _on_chunk_ack(self, chunk: int):
        self.outstanding -= 1
        self.acked += chunk
        if self.first_ack_hook:
            self.first_ack_hook(self.sim.now)
            self.first_ack_hook = None
        if (self.acked - self._last_receipt_at >= self.receipt_every) or self.acked >= self.total:
            self._send_receipt(final=self.acked >= self.total)
        self._pump()

    def _send_receipt(self, final: bool):
        self._last_receipt_at = self.acked
        self.receipts_sent += 1
        _, server = self.client.peers[self.server_name]
        r = Receipt(self.client.node_id, server.node_id, self.session, self.acked,
                    self.receipts_sent)
        wire = receipt_to_wire(r, self.client.sk)
        self.client.send(
            self.server_name, FrameType.RECEIPT, wire,
            on_ack=(self._finish if final else None),
        )

    def _finish(self):
        if self.done_at is None:
            self.done_at = self.sim.now
            if self._on_done:
                self._on_done()

    def _on_fail(self):
        self.failed = True


def admit(sim, client: Node, server: Node, kiosk_sk: SigningKey, done):
    from xkp.proofs import make_join_payload

    client.send(server.name, FrameType.JOIN_REQ, make_join_payload(client.vk, kiosk_sk),
                on_ack=done)
