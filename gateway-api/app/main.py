"""xKoin gateway-api: fiat on/off-ramp bridge between Kenyan mobile money and
the xKoin escrow contracts.

Flow (plan doc 02, phase 3):
  1. POST /buy-gas             -> STK push (Daraja) or USSD push (Jenga)
  2. POST /daraja/stk-callback -> on success: bridgeMint XKN + issue signed
     /jenga/payment-callback      Gas Voucher bound to the buyer's address
  3. POST /settlement/relay    -> forwards node ticket batches on-chain
  4. BatchSettled event        -> payout worker fires B2C / remittance
"""

import logging
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.config import get_settings
from app.daraja.client import DarajaClient, parse_stk_callback
from app.jenga.client import JengaClient, JengaSigner
from app.settlement.chain import ChainBridge
from app.vouchers import VoucherIssuer

log = logging.getLogger("xkoin.gateway")

app = FastAPI(title="xKoin gateway-api", version="0.1.0")

# In-memory pending-order book for the MVP sandbox. Production swaps this for
# Redis/SQLite so a restart cannot orphan a paid order.
PENDING_ORDERS: dict[str, dict] = {}
ISSUED_VOUCHERS: dict[str, dict] = {}


def _services():
    s = get_settings()
    issuer = VoucherIssuer(bytes.fromhex(s.kiosk_root_key_hex)) if s.kiosk_root_key_hex else None
    signer = None
    try:
        with open(s.jenga_private_key_path, "rb") as fh:
            signer = JengaSigner(fh.read())
    except FileNotFoundError:
        pass
    return s, DarajaClient(s), (JengaClient(s, signer) if signer else None), ChainBridge(s), issuer


class BuyGasRequest(BaseModel):
    phone: str = Field(pattern=r"^254\d{9}$", description="MSISDN, e.g. 254722000000")
    amount_kes: int = Field(ge=10, le=10_000)
    client_address: str = Field(pattern=r"^0x[0-9a-fA-F]{40}$")
    rail: Literal["daraja", "jenga"] = "daraja"


@app.get("/health")
async def health():
    return {"ok": True, "service": "xkoin-gateway-api"}


@app.post("/buy-gas")
async def buy_gas(req: BuyGasRequest):
    settings, daraja, jenga, _, _ = _services()
    if req.rail == "daraja":
        ack = await daraja.stk_push(req.phone, req.amount_kes, account_ref=req.client_address[:12])
        order_key = ack["CheckoutRequestID"]
    else:
        if jenga is None:
            raise HTTPException(503, "Jenga rail not configured (missing private key)")
        from datetime import date

        reference = f"XK{req.client_address[2:10]}{req.amount_kes}"
        ack = await jenga.merchant_payment(
            req.phone, req.amount_kes, reference, date.today().isoformat()
        )
        order_key = reference
    PENDING_ORDERS[order_key] = {
        "phone": req.phone,
        "amount_kes": req.amount_kes,
        "client_address": req.client_address.lower(),
        "rail": req.rail,
    }
    return {"order_key": order_key, "ack": ack}


def _fulfil(order_key: str, fiat_ref: str, amount_kes: int) -> dict:
    settings, _, _, chain, issuer = _services()
    order = PENDING_ORDERS.pop(order_key, None)
    if order is None:
        raise HTTPException(404, f"Unknown order {order_key}")
    amount_cents = amount_kes * 100
    mint = chain.mint_for_fiat(order["client_address"], amount_cents, fiat_ref)
    bundle = None
    if issuer:
        bundle = issuer.issue(
            order["client_address"],
            amount_cents,
            fiat_ref,
            order["rail"],
            settings.voucher_ttl_seconds,
        )
        ISSUED_VOUCHERS[fiat_ref] = bundle
    log.info("fulfilled order=%s ref=%s cents=%d", order_key, fiat_ref, amount_cents)
    return {"mint": mint, "voucher": bundle}


@app.post("/daraja/stk-callback")
async def daraja_stk_callback(body: dict):
    cb = parse_stk_callback(body)
    if cb["result_code"] != 0:
        PENDING_ORDERS.pop(cb["checkout_request_id"], None)
        log.warning("STK failed: %s %s", cb["result_code"], cb["result_desc"])
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    result = _fulfil(cb["checkout_request_id"], cb["receipt"], int(cb["amount_kes"]))
    return {"ResultCode": 0, "ResultDesc": "Accepted", **result}


@app.post("/jenga/payment-callback")
async def jenga_payment_callback(body: dict):
    status = str(body.get("status", "")).upper()
    reference = body.get("reference") or body.get("transactionReference")
    if status not in ("SUCCESS", "COMPLETED", "PAID"):
        PENDING_ORDERS.pop(reference, None)
        return {"accepted": True, "fulfilled": False}
    amount = int(float(body.get("amount", 0)))
    result = _fulfil(reference, body.get("transactionId", reference), amount)
    return {"accepted": True, "fulfilled": True, **result}


class TicketModel(BaseModel):
    client: str
    nodeAdmin: str
    sequenceNumber: int
    cumulativeUnits: int
    epochExpiry: int


class RelayRequest(BaseModel):
    tickets: list[TicketModel]
    signatures: list[str]  # hex-encoded 65-byte EIP-712 signatures


@app.post("/settlement/relay")
async def settlement_relay(req: RelayRequest):
    if len(req.tickets) != len(req.signatures):
        raise HTTPException(422, "tickets/signatures length mismatch")
    _, _, _, chain, _ = _services()
    sigs = [bytes.fromhex(s.removeprefix("0x")) for s in req.signatures]
    return chain.relay_batch([t.model_dump() for t in req.tickets], sigs)
