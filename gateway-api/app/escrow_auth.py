"""Off-chain pre-check for relayed escrow authorisations.

The kiosk pays gas for withdrawWithSig and transferDeposit, so it verifies an
authorisation before submitting it: a bad one would revert on chain and burn
the kiosk's gas. The digest is the one xKoinEscrow._useAuthorization builds:

    EIP-712 domain  xKoinEscrow, version 1, chainId, verifyingContract
    Withdraw(address client,address to,uint256 amount,uint256 nonce,uint256 deadline)
    TransferDeposit(address from,address to,uint256 amount,uint256 nonce,uint256 deadline)

Parity: tests/test_escrow_auth.py recovers signatures produced by the /demo
JavaScript, which the real contract accepted in a forge test.
"""

from __future__ import annotations

from typing import Literal

from eth_account import Account
from eth_account.messages import encode_typed_data

Kind = Literal["withdraw", "transfer"]

_FIELDS = {
    "withdraw": ("Withdraw", "client"),
    "transfer": ("TransferDeposit", "from"),
}


def typed_data(
    kind: Kind,
    chain_id: int,
    escrow: str,
    owner: str,
    to: str,
    amount: int,
    nonce: int,
    deadline: int,
) -> dict:
    primary, first = _FIELDS[kind]
    return {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            primary: [
                {"name": first, "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "amount", "type": "uint256"},
                {"name": "nonce", "type": "uint256"},
                {"name": "deadline", "type": "uint256"},
            ],
        },
        "primaryType": primary,
        "domain": {
            "name": "xKoinEscrow",
            "version": "1",
            "chainId": chain_id,
            "verifyingContract": escrow,
        },
        "message": {
            first: owner,
            "to": to,
            "amount": amount,
            "nonce": nonce,
            "deadline": deadline,
        },
    }


def recover(
    kind: Kind,
    chain_id: int,
    escrow: str,
    owner: str,
    to: str,
    amount: int,
    nonce: int,
    deadline: int,
    signature: bytes,
) -> str | None:
    """The address that signed, or None if the bytes are not a valid signature."""
    msg = encode_typed_data(
        full_message=typed_data(
            kind, chain_id, escrow, owner, to, amount, nonce, deadline
        )
    )
    try:
        return Account.recover_message(msg, signature=signature)
    except Exception:  # malformed signature bytes
        return None
