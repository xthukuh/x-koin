"""B2C payout worker: fiat leg of the protocol fee (spec s8.1).

    treasury.claim() -> beneficiary cold wallet          (anyone, on-chain)
    beneficiary -> bridge   Transfer                      (founder, on-chain)
    worker: B2C to the pinned MSISDN, wait for Daraja's result callback,
            then bridgeBurn exactly the KES paid out      (this module)

Never-redirect property. Nothing that arrives over the network chooses where
money goes: the destination is the PayoutPin (signed by the beneficiary key),
the trigger is a Transfer whose `from` is the beneficiary, and the burn is
self-only by contract. A hostile event feed or a rewritten .env can stall the
loop; it cannot pay anyone but the founder.

Burn timing. XKN is burned only after Daraja confirms the B2C (ResultCode 0).
A failed or timed-out payout leaves the XKN in the bridge and the row
retryable, bounded by max_attempts. Burning before confirmation would let a
failed payout destroy founder funds, so the order is fixed: pay, confirm,
burn.

Ledger. SQLite (stdlib), one row per Transfer log keyed by tx hash + log
index, so restarts and duplicate events are idempotent. `:memory:` in tests.
"""

from __future__ import annotations

import asyncio
import json
import logging
import sqlite3
import time
from typing import Any

from app.config import Settings
from app.daraja.client import DarajaClient, DarajaError
from app.payout.pin import PayoutPin
from app.settlement.chain import TOKEN_ABI, TREASURY_ABI, ChainBridge

log = logging.getLogger("xkoin.payout")

UKES_PER_KES = 1_000_000
RETRYABLE = ("b2c_failed", "b2c_timeout")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS payouts (
    key             TEXT PRIMARY KEY,
    tx_hash         TEXT NOT NULL,
    log_index       INTEGER NOT NULL,
    sender          TEXT NOT NULL,
    value_ukes      INTEGER NOT NULL,
    amount_kes      INTEGER NOT NULL,
    dust_ukes       INTEGER NOT NULL,
    status          TEXT NOT NULL,
    attempts        INTEGER NOT NULL DEFAULT 0,
    conversation_id TEXT,
    originator_id   TEXT,
    receipt         TEXT,
    burn_tx         TEXT,
    last_error      TEXT,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS payouts_conversation ON payouts(conversation_id);
CREATE TABLE IF NOT EXISTS cursor (name TEXT PRIMARY KEY, block INTEGER NOT NULL);
"""


class PayoutLedger:
    def __init__(self, path: str = ":memory:"):
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._db.row_factory = sqlite3.Row
        self._db.executescript(_SCHEMA)

    @staticmethod
    def _row(r: sqlite3.Row | None) -> dict | None:
        if r is None:
            return None
        d = dict(r)
        d["burn_tx"] = json.loads(d["burn_tx"]) if d["burn_tx"] else None
        return d

    def get(self, key: str) -> dict | None:
        return self._row(self._db.execute("SELECT * FROM payouts WHERE key=?", (key,)).fetchone())

    def by_conversation(
        self, conversation_id: str | None, originator_id: str | None
    ) -> dict | None:
        r = None
        if conversation_id:
            r = self._db.execute(
                "SELECT * FROM payouts WHERE conversation_id=?", (conversation_id,)
            ).fetchone()
        if r is None and originator_id:
            r = self._db.execute(
                "SELECT * FROM payouts WHERE originator_id=?", (originator_id,)
            ).fetchone()
        return self._row(r)

    def insert(self, row: dict) -> dict:
        now = int(time.time())
        self._db.execute(
            "INSERT INTO payouts (key, tx_hash, log_index, sender, value_ukes, amount_kes, "
            "dust_ukes, status, attempts, created_at, updated_at) "
            "VALUES (:key, :tx_hash, :log_index, :sender, :value_ukes, :amount_kes, "
            ":dust_ukes, :status, 0, :now, :now)",
            {**row, "now": now},
        )
        self._db.commit()
        return self.get(row["key"])

    def update(self, key: str, **fields: Any) -> dict:
        if "burn_tx" in fields and fields["burn_tx"] is not None:
            fields["burn_tx"] = json.dumps(fields["burn_tx"])
        fields["updated_at"] = int(time.time())
        cols = ", ".join(f"{k}=:{k}" for k in fields)
        self._db.execute(f"UPDATE payouts SET {cols} WHERE key=:key", {**fields, "key": key})
        self._db.commit()
        return self.get(key)

    def where(self, status: str | tuple[str, ...]) -> list[dict]:
        statuses = (status,) if isinstance(status, str) else status
        marks = ",".join("?" * len(statuses))
        rows = self._db.execute(
            f"SELECT * FROM payouts WHERE status IN ({marks}) ORDER BY created_at", statuses
        ).fetchall()
        return [self._row(r) for r in rows]

    def count(self, status: str) -> int:
        return self._db.execute(
            "SELECT COUNT(*) FROM payouts WHERE status=?", (status,)
        ).fetchone()[0]

    def all(self, limit: int = 200) -> list[dict]:
        rows = self._db.execute(
            "SELECT * FROM payouts ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [self._row(r) for r in rows]

    def cursor(self, name: str = "transfers") -> int | None:
        r = self._db.execute("SELECT block FROM cursor WHERE name=?", (name,)).fetchone()
        return int(r[0]) if r else None

    def set_cursor(self, block: int, name: str = "transfers") -> None:
        self._db.execute(
            "INSERT INTO cursor(name, block) VALUES(?, ?) "
            "ON CONFLICT(name) DO UPDATE SET block=excluded.block",
            (name, block),
        )
        self._db.commit()


class PayoutWorker:
    def __init__(
        self,
        settings: Settings,
        daraja: DarajaClient,
        chain: ChainBridge,
        beneficiary: str,
        bridge_address: str,
        pin: PayoutPin,
        ledger: PayoutLedger,
        min_kes: int | None = None,
        max_attempts: int | None = None,
    ):
        if pin.beneficiary.lower() != beneficiary.lower():
            raise ValueError("pin was verified against a different beneficiary")
        self._s = settings
        self._daraja = daraja
        self._chain = chain
        self.beneficiary = beneficiary.lower()
        self.bridge = bridge_address.lower()
        self.pin = pin
        self.ledger = ledger
        self.min_kes = settings.payout_min_kes if min_kes is None else min_kes
        self.max_attempts = settings.payout_max_attempts if max_attempts is None else max_attempts

    # -- inbound: Transfer(beneficiary -> bridge) -----------------------------

    async def handle_transfer(self, ev: dict) -> dict:
        """ev: {from, to, value, tx_hash, log_index}. Extra keys are ignored on
        purpose: the event never carries a destination."""
        key = f"{str(ev['tx_hash']).lower()}:{int(ev['log_index'])}"
        existing = self.ledger.get(key)
        if existing is not None:
            return existing
        sender = str(ev["from"]).lower()
        value = int(ev["value"])
        amount_kes, dust = divmod(value, UKES_PER_KES)
        row = {
            "key": key,
            "tx_hash": str(ev["tx_hash"]).lower(),
            "log_index": int(ev["log_index"]),
            "sender": sender,
            "value_ukes": value,
            "amount_kes": amount_kes,
            "dust_ukes": dust,
            "status": "ignored",
        }
        if str(ev["to"]).lower() != self.bridge or sender != self.beneficiary:
            log.info("payout: ignoring transfer %s from %s (not beneficiary->bridge)", key, sender)
            return self.ledger.insert(row)
        if amount_kes < self.min_kes:
            row["status"] = "held"
            log.info("payout: holding %s, %d KES below minimum %d", key, amount_kes, self.min_kes)
            return self.ledger.insert(row)
        row["status"] = "pending"
        self.ledger.insert(row)
        return await self._fire_b2c(key)

    async def _fire_b2c(self, key: str) -> dict:
        row = self.ledger.get(key)
        attempts = row["attempts"] + 1
        try:
            ack = await self._daraja.b2c_payment(
                self.pin.msisdn,
                row["amount_kes"],
                remarks=f"xKoin fee {row['tx_hash'][:10]}",
            )
        except (DarajaError, OSError) as exc:
            log.warning("payout: B2C send failed for %s: %s", key, exc)
            return self.ledger.update(
                key, status="b2c_failed", attempts=attempts, last_error=str(exc)[:500]
            )
        return self.ledger.update(
            key,
            status="b2c_sent",
            attempts=attempts,
            conversation_id=ack.get("ConversationID"),
            originator_id=ack.get("OriginatorConversationID"),
            last_error=None,
        )

    # -- Daraja callbacks ------------------------------------------------------

    @staticmethod
    def _parse_result(body: dict) -> dict:
        res = body.get("Result", {}) or {}
        params = {}
        for item in (res.get("ResultParameters", {}) or {}).get("ResultParameter", []) or []:
            params[item.get("Key")] = item.get("Value")
        return {
            "conversation_id": res.get("ConversationID"),
            "originator_id": res.get("OriginatorConversationID"),
            "result_code": res.get("ResultCode"),
            "result_desc": res.get("ResultDesc"),
            "receipt": params.get("TransactionReceipt") or res.get("TransactionID"),
            "amount_kes": params.get("TransactionAmount"),
        }

    def handle_b2c_result(self, body: dict) -> dict | None:
        r = self._parse_result(body)
        row = self.ledger.by_conversation(r["conversation_id"], r["originator_id"])
        if row is None:
            log.warning("payout: result for unknown conversation %s", r["conversation_id"])
            return None
        if row["status"] == "settled":
            return row  # Daraja may redeliver; the burn already happened
        if r["result_code"] not in (0, "0"):
            return self.ledger.update(
                row["key"], status="b2c_failed", last_error=f"{r['result_code']} {r['result_desc']}"
            )
        receipt = str(r["receipt"] or row["conversation_id"])
        burn = self._chain.burn_for_payout(row["amount_kes"] * UKES_PER_KES, receipt)
        return self.ledger.update(row["key"], status="settled", receipt=receipt, burn_tx=burn)

    def handle_b2c_timeout(self, body: dict) -> dict | None:
        r = self._parse_result(body)
        row = self.ledger.by_conversation(r["conversation_id"], r["originator_id"])
        if row is None or row["status"] == "settled":
            return row
        return self.ledger.update(
            row["key"], status="b2c_timeout", last_error=r["result_desc"] or "queue timeout"
        )

    # -- retry ----------------------------------------------------------------

    async def retry_failed(self) -> list[dict]:
        out = []
        for row in self.ledger.where(RETRYABLE):
            if row["attempts"] >= self.max_attempts:
                self.ledger.update(row["key"], status="exhausted")
                log.error("payout: %s exhausted after %d attempts", row["key"], row["attempts"])
                continue
            out.append(await self._fire_b2c(row["key"]))
        return out

    # -- chain polling (live mode only) -----------------------------------------

    def scan_transfers(self, w3, from_block: int, to_block: int) -> list[dict]:
        """Transfer logs into the bridge. Filtering on `from` happens in
        handle_transfer so the ignore decision is recorded, not silent."""
        token = w3.eth.contract(
            address=w3.to_checksum_address(self._s.token_address), abi=TOKEN_ABI
        )
        logs = token.events.Transfer().get_logs(
            argument_filters={"to": w3.to_checksum_address(self.bridge)},
            from_block=from_block,
            to_block=to_block,
        )
        return [
            {
                "from": lg["args"]["from"],
                "to": lg["args"]["to"],
                "value": int(lg["args"]["value"]),
                "tx_hash": lg["transactionHash"].hex(),
                "log_index": int(lg["logIndex"]),
            }
            for lg in logs
        ]

    async def poll_once(self, w3, confirmations: int = 2, span: int = 2000) -> dict:
        head = w3.eth.block_number - confirmations
        start = self.ledger.cursor()
        start = (start + 1) if start is not None else max(head - span, 0)
        if head < start:
            return {"scanned": 0, "handled": 0}
        end = min(head, start + span)
        events = self.scan_transfers(w3, start, end)
        for ev in events:
            await self.handle_transfer(ev)
        self.ledger.set_cursor(end)
        await self.retry_failed()
        return {"scanned": end - start + 1, "handled": len(events)}

    async def run_forever(self, w3, interval_s: float = 15.0) -> None:
        while True:
            try:
                await self.poll_once(w3)
            except Exception:  # keep the loop alive; the ledger makes retries safe
                log.exception("payout: poll failed")
            await asyncio.sleep(interval_s)


def build_worker(settings: Settings, ledger: PayoutLedger | None = None) -> PayoutWorker:
    """Wire a worker from settings. In live mode the beneficiary and bridge
    address come from the chain; dry-run uses the configured overrides."""
    chain = ChainBridge(settings)
    if settings.dry_run:
        beneficiary = settings.beneficiary_address
        bridge = settings.bridge_address
    else:
        w3 = chain._web3()
        treasury = w3.eth.contract(
            address=w3.to_checksum_address(settings.treasury_address), abi=TREASURY_ABI
        )
        beneficiary = treasury.functions.beneficiary().call()
        if (
            settings.beneficiary_address
            and settings.beneficiary_address.lower() != beneficiary.lower()
        ):
            raise ValueError("configured beneficiary_address disagrees with the treasury on chain")
        bridge = w3.eth.account.from_key(settings.bridge_private_key).address
    if not beneficiary or not bridge:
        raise ValueError("payout worker needs beneficiary_address and bridge_address (dry-run)")
    pin = PayoutPin.verify(
        settings.payout_msisdn,
        settings.payout_msisdn_signature,
        settings.chain_id,
        settings.token_address,
        beneficiary,
    )
    return PayoutWorker(
        settings=settings,
        daraja=DarajaClient(settings),
        chain=chain,
        beneficiary=beneficiary,
        bridge_address=bridge,
        pin=pin,
        ledger=ledger or PayoutLedger(settings.payout_ledger_path),
    )


def _main() -> None:
    from app.config import get_settings

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
    settings = get_settings()
    worker = build_worker(settings)
    if settings.dry_run:
        print("dry-run: nothing to poll; worker built and pin verified OK")
        return
    asyncio.run(worker.run_forever(worker._chain._web3()))


if __name__ == "__main__":
    _main()
