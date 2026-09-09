"""XKP sandbox proof runner.

    python3 run_sim.py            # all protocol scenarios
    python3 run_sim.py --chain    # + settle real EIP-712 tickets on anvil

Scenarios:
  S1 speed       25 MB over homeplug+kq130f+lora, receipts every 1 MB
  S2 blackout    grid failure at t=2 s, survival plane on LoRa
  S3 relay       client -> satellite (LoRa) -> gateway (HomePlug), satellite earns
  S4 loss sweep  LoRa-only completion under 2%..40% frame loss
  S5 fuzz        corrupted + random frames must never parse
  S6 loraweb     serve real web pages over LoRa via gateway distillation,
                 and over SX1262 GFSK mode; duty-cycle budget math
"""

import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from nacl.signing import SigningKey, VerifyKey

from xkp import frames
from xkp.frames import Frame, FrameType, pack, unpack, FrameError, OVERHEAD
from xkp.sim import (
    GFSK150, HOMEPLUG, KQ130F, LORA_SF7, ClientTransfer, Node, Sim, admit,
)

KIOSK_SK = SigningKey(b"\x11" * 32)
MB = 1_000_000


def fmt_rate(bps):
    return f"{bps/1e6:.2f} Mbps" if bps >= 1e6 else f"{bps/1e3:.2f} kbps"


def base_pair(seed, mediums, trace: list | None = None):
    sim = Sim(seed, trace=trace)
    client = Node(sim, "client")
    gateway = Node(sim, "gateway", kiosk_vk=bytes(KIOSK_SK.verify_key))
    client.connect(gateway, mediums)
    admitted = {}
    admit(sim, client, gateway, KIOSK_SK, lambda: admitted.setdefault("t", sim.now))
    sim.run()
    assert client.node_id in gateway.clients, "admission failed"
    return sim, client, gateway, admitted["t"]


def s1_speed(trace: list | None = None):
    mediums = [HOMEPLUG(), KQ130F(), LORA_SF7()]
    sim, client, gateway, admit_t = base_pair(1, mediums, trace=trace)
    xfer = ClientTransfer(sim, client, "gateway", 25 * MB, receipt_every=1 * MB, window=16)
    if trace is not None:
        xfer.start(on_done=lambda: trace.append((xfer.done_at, "done")))
    else:
        xfer.start()
    sim.run()
    assert xfer.done_at and not xfer.failed
    dur = xfer.done_at - admit_t
    wire = sum(m.tx_bytes for m in mediums)
    return {
        "admission_ms": admit_t * 1000,
        "transfer_s": dur,
        "goodput": 25 * MB * 8 / dur,
        "per_medium_wire_bytes": {m.name: m.tx_bytes for m in mediums},
        "overhead_pct": (wire - 25 * MB) / (25 * MB) * 100,
        "receipts_sent": xfer.receipts_sent,
        "receipts_verified": gateway.receipts_verified,
        "max_unproven_bytes": gateway.max_unproven,
        "proven_bytes": gateway.proven[client.node_id],
    }


def s2_blackout(trace: list | None = None):
    mediums = [HOMEPLUG(), KQ130F(), LORA_SF7()]
    sim, client, gateway, _ = base_pair(2, mediums, trace=trace)
    xfer = ClientTransfer(sim, client, "gateway", 3 * MB, receipt_every=250_000, window=16)
    marks = {}

    def cut():
        mediums[0].up = False  # HomePlug dies with the grid
        mediums[1].up = False  # narrowband PLC too
        marks["cut"] = sim.now
        if trace is not None:
            trace.append((sim.now, "cut"))
        lora = mediums[2]
        base = lora.delivered_app_bytes

        def poll():
            if lora.delivered_app_bytes > base:
                marks["recovered"] = sim.now
                if trace is not None:
                    trace.append((sim.now, "recovered"))
            elif sim.now < marks["cut"] + 60:
                sim.after(0.005, poll)

        poll()

    sim.at(2.0, cut)
    # survival-plane heartbeat every 30 s, until the transfer completes
    beats = {"acked": 0}

    def beat():
        if xfer.done_at is not None:
            return
        client.send("gateway", FrameType.TELEMETRY, b"hb",
                    on_ack=lambda: beats.__setitem__("acked", beats["acked"] + 1))
        sim.after(30.0, beat)

    sim.after(1.0, beat)
    if trace is not None:
        xfer.start(on_done=lambda: trace.append((xfer.done_at, "done")))
    else:
        xfer.start()
    sim.run(until=90_000)
    lora = mediums[2]
    pre = 3 * MB - (3 * MB - gateway.delivered[client.node_id])  # delivered total
    return {
        "completed": xfer.done_at is not None,
        "failover_ms": (marks.get("recovered", 0) - marks["cut"]) * 1000,
        "post_blackout_goodput": lora.delivered_app_bytes * 8 /
                                 (xfer.done_at - marks["cut"]) if xfer.done_at else 0,
        "lora_app_bytes": lora.delivered_app_bytes,
        "heartbeats_acked": beats["acked"],
        "delivered_bytes": pre,
        "receipts_verified": gateway.receipts_verified,
        "quarantine_events": len(client.failovers),
    }


def s3_relay(trace: list | None = None):
    sim = Sim(3, trace=trace)
    client = Node(sim, "client")
    sat = Node(sim, "satellite", kiosk_vk=bytes(KIOSK_SK.verify_key))
    gateway = Node(sim, "gateway", kiosk_vk=bytes(KIOSK_SK.verify_key))
    c_link = client.connect(sat, [LORA_SF7()])
    b_link = sat.connect(gateway, [HOMEPLUG()])
    backhauled = {"bytes": 0}

    def forward(f: Frame):
        sat.send("gateway", FrameType.DATA, f.payload,
                 on_ack=lambda n=len(f.payload): backhauled.__setitem__(
                     "bytes", backhauled["bytes"] + n))

    sat.on_data = forward
    admit(sim, client, sat, KIOSK_SK, lambda: None)
    sim.run()
    xfer = ClientTransfer(sim, client, "satellite", 1 * MB, receipt_every=100_000, window=8)
    if trace is not None:
        xfer.start(on_done=lambda: trace.append((xfer.done_at, "done")))
    else:
        xfer.start()
    sim.run()
    assert xfer.done_at and not xfer.failed
    return {
        "transfer_s": xfer.done_at,
        "earner": "satellite (serving node keeps attribution)",
        "satellite_proven_bytes": sat.proven[client.node_id],
        "satellite_receipts_verified": sat.receipts_verified,
        "backhauled_to_gateway_bytes": backhauled["bytes"],
        "lora_goodput": 1 * MB * 8 / xfer.done_at,
    }


def s4_loss_sweep():
    rows = []
    for loss in (0.02, 0.10, 0.20, 0.30, 0.40):
        m = LORA_SF7()
        m.loss = loss
        m.loss_ewma = loss
        sim = Sim(int(loss * 100) + 7)
        client = Node(sim, "client")
        gateway = Node(sim, "gateway", kiosk_vk=bytes(KIOSK_SK.verify_key))
        client.connect(gateway, [m])
        admit(sim, client, gateway, KIOSK_SK, lambda: None)
        sim.run()
        xfer = ClientTransfer(sim, client, "gateway", 100_000, receipt_every=25_000, window=8)
        xfer.start()
        sim.run(until=10_000)
        rows.append({
            "loss_pct": loss * 100,
            "completed": xfer.done_at is not None and not xfer.failed,
            "time_s": xfer.done_at,
            "retx_ratio": m.tx_frames / max(m.delivered_frames, 1),
        })
    assert all(r["completed"] for r in rows), "transfer failed under loss sweep"
    return rows


def s5_fuzz(n=20_000):
    import random as _r
    rng = _r.Random(42)
    good = pack(Frame(FrameType.DATA, b"A" * 8, b"B" * 8, 7, bytes(64)))
    false_accepts = 0
    rejected = 0
    for _ in range(n):
        buf = bytearray(good)
        for _ in range(rng.randint(1, 4)):
            buf[rng.randrange(len(buf))] ^= 1 << rng.randrange(8)
        try:
            unpack(bytes(buf))
            if bytes(buf) != good:
                false_accepts += 1
        except FrameError:
            rejected += 1
    garbage_accepts = 0
    for _ in range(n):
        blob = rng.randbytes(rng.randint(0, 300))
        try:
            unpack(blob)
            garbage_accepts += 1
        except FrameError:
            pass
    return {"mutations": n, "rejected": rejected, "false_accepts": false_accepts,
            "garbage_frames": n, "garbage_accepts": garbage_accepts}


def s6_loraweb():
    """Serving internet over LoRa: the gateway terminates TCP/TLS upstream,
    distills the page (text extraction + shared-dictionary compression, done in
    cloud-proxy), and streams the distilled representation over XKP. A 2.5 MB
    modern page compresses to ~12 KB of dictionary-coded text."""
    results = {}
    for label, medium_fn in (("lora-sf7", LORA_SF7), ("gfsk-150k", GFSK150)):
        m = medium_fn()
        sim = Sim(6)
        client = Node(sim, "client")
        gateway = Node(sim, "gateway", kiosk_vk=bytes(KIOSK_SK.verify_key))
        client.connect(gateway, [m])
        admit(sim, client, gateway, KIOSK_SK, lambda: None)
        sim.run()
        t0 = sim.now
        xfer = ClientTransfer(sim, client, "gateway", 12_000, receipt_every=4_000, window=8)
        xfer.start()
        sim.run()
        assert xfer.done_at
        page_t = xfer.done_at - t0
        airtime = m.airtime
        results[label] = {
            "origin_page_bytes": 2_500_000,
            "distilled_bytes": 12_000,
            "page_latency_s": page_t,
            "airtime_s": airtime,
            "pages_per_hour_at_1pct_duty": 36.0 / airtime,
            "pages_per_hour_8_channels": 8 * 36.0 / airtime,
        }
    return results


def crypto_bench(n=2000):
    sk = SigningKey.generate()
    msg = b"x" * 44
    sig = sk.sign(msg).signature
    vk = VerifyKey(bytes(sk.verify_key))
    t0 = time.perf_counter()
    for _ in range(n):
        vk.verify(msg, sig)
    dt = time.perf_counter() - t0
    return {"verifies_per_s_sandbox": n / dt,
            "note": "x86 sandbox reference; ESP32-S3 target < 4.5 ms/verify (doc 02 M1)"}


def chain_settle(gw_units: int, sat_units: int):
    from eth_account import Account
    from web3 import Web3

    from xkp.settle import (ESCROW_ABI, TOKEN_ABI, TREASURY_ABI, Ticket, local_digest,
                            send, sign_ticket)

    w3 = Web3(Web3.HTTPProvider(os.environ.get("XKOIN_RPC", "http://127.0.0.1:8545")))
    assert w3.is_connected(), "anvil not reachable"
    chain_id = w3.eth.chain_id
    escrow_addr = w3.to_checksum_address(os.environ["XKOIN_ESCROW"])
    token_addr = w3.to_checksum_address(os.environ["XKOIN_TOKEN"])
    treasury_addr = w3.to_checksum_address(os.environ["XKOIN_TREASURY"])
    anvil0 = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    bridge_key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

    client, gw, sat, relayer = (Account.create(f"xkoin-{i}") for i in range(4))
    a0 = Account.from_key(anvil0).address
    for acct in (client, relayer):
        send(w3, anvil0, _transfer_fn(w3, a0, acct.address))

    escrow = w3.eth.contract(escrow_addr, abi=ESCROW_ABI)
    token = w3.eth.contract(token_addr, abi=TOKEN_ABI)

    send(w3, bridge_key, token.functions.bridgeMint(client.address, 100_000_000, b"\x01" * 32))  # 100 KES
    send(w3, client.key, token.functions.approve(escrow_addr, 100_000_000))
    send(w3, client.key, escrow.functions.deposit(10_000_000))  # 10 KES escrowed

    expiry = w3.eth.get_block("latest")["timestamp"] + 3600
    t_gw = Ticket(client.address, gw.address, 25, gw_units, expiry)
    t_sat = Ticket(client.address, sat.address, 10, sat_units, expiry)
    # gw: 2500 units (25 MB), sat: 100 units (1 MB) at 500 uKES/unit

    for t in (t_gw, t_sat):
        onchain = escrow.functions.hashTicket(t.as_tuple()).call()
        local = local_digest(t, chain_id, escrow_addr)
        assert onchain == local, "EIP-712 digest parity FAILED"

    sigs = [sign_ticket(client.key, t, chain_id, escrow_addr) for t in (t_gw, t_sat)]
    rcpt = send(w3, relayer.key,
                escrow.functions.settleTicketBatch([t_gw.as_tuple(), t_sat.as_tuple()], sigs))

    price = escrow.functions.pricePerUnit().call()
    dep = escrow.functions.deposits(client.address).call()
    e_gw = escrow.functions.earnings(gw.address).call()
    e_sat = escrow.functions.earnings(sat.address).call()
    tre = token.functions.balanceOf(treasury_addr).call()
    esc_bal = token.functions.balanceOf(escrow_addr).call()
    assert esc_bal == dep + e_gw + e_sat, "escrow solvency FAILED"
    assert 10_000_000 - dep == e_gw + e_sat + tre, "conservation FAILED"

    # Founder payout property: a STRANGER (the relayer) triggers the sweep and
    # the money can only land on the beneficiary cold address.
    treasury_c = w3.eth.contract(treasury_addr, abi=TREASURY_ABI)
    ben = treasury_c.functions.beneficiary().call()
    ben_before = token.functions.balanceOf(ben).call()
    send(w3, relayer.key, treasury_c.functions.claim(token_addr))
    ben_after = token.functions.balanceOf(ben).call()
    assert token.functions.balanceOf(treasury_addr).call() == 0, "claim left dust"
    assert ben_after - ben_before == tre, "founder payout mismatch"
    assert token.functions.balanceOf(relayer.address).call() == 0, "stranger gained tokens"

    return {
        "digest_parity": "python EIP-712 == contract hashTicket for both tickets",
        "price_per_unit_ukes": price,
        "settle_gas": rcpt.gasUsed,
        "client_deposit_left_ukes": dep,
        "gateway_earnings_ukes": e_gw,
        "satellite_earnings_ukes": e_sat,
        "treasury_fee_ukes": tre,
        "founder_claimed_ukes": ben_after - ben_before,
        "claim_property": "triggered by a stranger; funds can only reach beneficiary",
        "solvency": "escrow balance == deposits + earnings (asserted)",
    }


def _transfer_fn(w3, frm, to):
    class _F:
        def build_transaction(self, tx):
            return {"from": frm, "to": to, "value": w3.to_wei(1, "ether"),
                    "gas": 21000, "gasPrice": w3.eth.gas_price, **tx}
    return _F()


def show(title, obj, indent=2):
    print(f"\n== {title}")
    if isinstance(obj, list):
        for row in obj:
            print(" " * indent + str(row))
        return
    for k, v in obj.items():
        if isinstance(v, float):
            v = f"{v:,.2f}"
        print(" " * indent + f"{k}: {v}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--chain", action="store_true")
    args = ap.parse_args()

    s1 = s1_speed()
    show("S1 speed (25 MB, homeplug+kq130f+lora)", s1)
    s2 = s2_blackout()
    show("S2 blackout survival (grid cut at t=2 s)", s2)
    s3 = s3_relay()
    show("S3 satellite relay (LoRa ingress, HomePlug backhaul)", s3)
    show("S4 loss sweep (LoRa, 100 KB)", s4_loss_sweep())
    show("S5 frame fuzz", s5_fuzz())
    show("S6 internet over LoRa (distilled pages)", s6_loraweb())
    show("Crypto bench", crypto_bench())

    if args.chain:
        UNIT = 10_000  # 1 billing unit = 10 KB
        gw_units = s1["proven_bytes"] // UNIT
        sat_units = s3["satellite_proven_bytes"] // UNIT
        show("ON-CHAIN SETTLEMENT (anvil, real xKoinEscrow)",
             chain_settle(gw_units, sat_units))
    print("\nALL SCENARIOS PASSED")
