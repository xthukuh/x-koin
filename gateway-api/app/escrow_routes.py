"""Relayed escrow exits: POST /escrow/withdraw and POST /escrow/transfer.

The client signs, the kiosk submits and pays gas. Before spending gas the
kiosk refuses anything that would revert: expired deadline, zero destination,
a signature that does not recover to the owner, and (live mode only) a nonce
or deposit that does not match the chain.
"""

from __future__ import annotations

import time
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import get_settings
from app.escrow_auth import recover
from app.settlement.chain import ChainBridge

router = APIRouter(prefix="/escrow", tags=["escrow"])

_ADDR = r"^0x[0-9a-fA-F]{40}$"
_SIG = r"^0x[0-9a-fA-F]{130}$"
_ZERO = "0x" + "0" * 40


class EscrowAuthRequest(BaseModel):
    """`owner` is the client for a withdraw and the sender for a transfer.
    `nonce` is the one the wallet signed (read from authNonces before signing)."""

    owner: str = Field(pattern=_ADDR)
    to: str = Field(pattern=_ADDR)
    amount: int = Field(gt=0, description="micro-KES")
    nonce: int = Field(ge=0)
    deadline: int = Field(gt=0, description="unix seconds")
    signature: str = Field(pattern=_SIG)


def _relay(kind: Literal["withdraw", "transfer"], req: EscrowAuthRequest) -> dict:
    s = get_settings()
    if not s.escrow_address:
        raise HTTPException(503, "escrow address not configured")
    if req.to.lower() == _ZERO:
        raise HTTPException(422, "ZeroAddress: destination is the zero address")
    if req.deadline < int(time.time()):
        raise HTTPException(400, "AuthorizationExpired: deadline has passed")
    sig = bytes.fromhex(req.signature[2:])
    signer = recover(
        kind,
        s.chain_id,
        s.escrow_address,
        req.owner,
        req.to,
        req.amount,
        req.nonce,
        req.deadline,
        sig,
    )
    if signer is None or signer.lower() != req.owner.lower():
        raise HTTPException(
            400,
            "BadAuthorization: signature does not recover to the owner for this destination, amount and nonce",
        )
    chain = ChainBridge(s)
    state = chain.auth_state(req.owner)
    if state is not None:
        if state["nonce"] != req.nonce:
            raise HTTPException(
                409,
                f"BadAuthorization: on-chain nonce is {state['nonce']}, signed nonce is {req.nonce}",
            )
        if state["deposit"] < req.amount:
            raise HTTPException(
                400, "InsufficientDeposit: meter holds less than the amount"
            )
    send = chain.relay_withdraw if kind == "withdraw" else chain.relay_transfer
    tx = send(req.owner, req.to, req.amount, req.deadline, sig)
    checks = "skipped (dry run)" if state is None else "nonce and deposit match"
    return {"precheck": {"signer": signer, "chain_checks": checks}, **tx}


@router.post("/withdraw")
async def escrow_withdraw(req: EscrowAuthRequest):
    """Gasless exit: meter back to a wallet."""
    return _relay("withdraw", req)


@router.post("/transfer")
async def escrow_transfer(req: EscrowAuthRequest):
    """Meter to meter between two clients."""
    return _relay("transfer", req)
