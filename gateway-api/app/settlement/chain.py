"""L2 chain bridge for the fiat layer.

Responsibilities (plan doc 02, phases 2-3):
  * mint_for_fiat: credit XKN 1:1 against a confirmed KES payment.
  * relay_batch:   submit node-collected tickets to xKoinEscrow.settleTicketBatch.
  * burn_for_payout: self-only burn after a confirmed fiat payout; the
    Transfer watching and B2C firing live in app/payout/worker.py.

web3 is imported lazily; with settings.dry_run=True every method returns the
transaction it WOULD send, which is what the sandbox simulation asserts on.
"""

from typing import Any

from app.config import Settings

ESCROW_ABI: list[dict[str, Any]] = [
    {
        "type": "function",
        "name": "settleTicketBatch",
        "stateMutability": "nonpayable",
        "inputs": [
            {
                "name": "tickets",
                "type": "tuple[]",
                "components": [
                    {"name": "client", "type": "address"},
                    {"name": "nodeAdmin", "type": "address"},
                    {"name": "sequenceNumber", "type": "uint64"},
                    {"name": "cumulativeUnits", "type": "uint128"},
                    {"name": "epochExpiry", "type": "uint256"},
                ],
            },
            {"name": "signatures", "type": "bytes[]"},
        ],
        "outputs": [],
    },
    {
        "type": "function",
        "name": "withdrawWithSig",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "client", "type": "address"},
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "deadline", "type": "uint256"},
            {"name": "signature", "type": "bytes"},
        ],
        "outputs": [],
    },
    {
        "type": "function",
        "name": "transferDeposit",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "from", "type": "address"},
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "deadline", "type": "uint256"},
            {"name": "signature", "type": "bytes"},
        ],
        "outputs": [],
    },
    {
        "type": "function",
        "name": "authNonces",
        "stateMutability": "view",
        "inputs": [{"name": "", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
    },
    {
        "type": "function",
        "name": "deposits",
        "stateMutability": "view",
        "inputs": [{"name": "", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
    },
    {
        "type": "event",
        "name": "BatchSettled",
        "inputs": [
            {"name": "relayer", "type": "address", "indexed": True},
            {"name": "gross", "type": "uint256", "indexed": False},
            {"name": "fee", "type": "uint256", "indexed": False},
            {"name": "net", "type": "uint256", "indexed": False},
        ],
    },
]

TOKEN_ABI: list[dict[str, Any]] = [
    {
        "type": "function",
        "name": "bridgeMint",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "fiatRef", "type": "bytes32"},
        ],
        "outputs": [],
    },
    {
        "type": "event",
        "name": "Transfer",
        "inputs": [
            {"name": "from", "type": "address", "indexed": True},
            {"name": "to", "type": "address", "indexed": True},
            {"name": "value", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "function",
        "name": "bridgeBurn",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "amount", "type": "uint256"},
            {"name": "fiatRef", "type": "bytes32"},
        ],
        "outputs": [],
    },
]

TREASURY_ABI: list[dict[str, Any]] = [
    {
        "type": "function",
        "name": "beneficiary",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"name": "", "type": "address"}],
    },
]


def fiat_ref_hash(reference: str) -> bytes:
    """keccak256 of the mobile money reference, matching the contract event."""
    from eth_utils import keccak  # lazy: ships with web3

    return keccak(text=reference)


def _jsonable(value: Any) -> Any:
    """Bytes become 0x-hex so a dry-run transaction can be returned as JSON."""
    if isinstance(value, (bytes, bytearray)):
        return "0x" + bytes(value).hex()
    if isinstance(value, (list, tuple)):
        return [_jsonable(v) for v in value]
    return value


class ChainBridge:
    def __init__(self, settings: Settings):
        self._s = settings
        self._w3 = None

    def _web3(self):
        if self._w3 is None:
            from web3 import Web3

            self._w3 = Web3(Web3.HTTPProvider(self._s.rpc_url))
        return self._w3

    def _send(self, contract_address: str, abi: list, fn: str, args: tuple) -> dict:
        if self._s.dry_run:
            return {
                "dry_run": True,
                "to": contract_address,
                "fn": fn,
                "args": _jsonable(list(args)),
                "chain_id": self._s.chain_id,
            }
        w3 = self._web3()
        acct = w3.eth.account.from_key(self._s.bridge_private_key)
        contract = w3.eth.contract(address=contract_address, abi=abi)
        tx = getattr(contract.functions, fn)(*args).build_transaction(
            {
                "from": acct.address,
                "nonce": w3.eth.get_transaction_count(acct.address),
                "chainId": self._s.chain_id,
            }
        )
        signed = acct.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        return {"dry_run": False, "tx_hash": tx_hash.hex(), "status": receipt.status}

    # -- on-ramp ------------------------------------------------------------

    def mint_for_fiat(
        self, client_address: str, amount_cents: int, fiat_ref: str
    ) -> dict:
        ref = fiat_ref_hash(fiat_ref) if not self._s.dry_run else fiat_ref
        return self._send(
            self._s.token_address,
            TOKEN_ABI,
            "bridgeMint",
            (client_address, amount_cents, ref),
        )

    # -- off-ramp -----------------------------------------------------------

    def burn_for_payout(self, amount_ukes: int, fiat_ref: str) -> dict:
        """Burns the bridge's OWN balance (contract enforces self-only burn):
        payout flow is receive XKN -> fire B2C -> burn, in that order."""
        ref = fiat_ref_hash(fiat_ref) if not self._s.dry_run else fiat_ref
        return self._send(
            self._s.token_address, TOKEN_ABI, "bridgeBurn", (amount_ukes, ref)
        )

    # -- relayed escrow authorisations ---------------------------------------

    def auth_state(self, client: str) -> dict | None:
        """On-chain nonce and deposit for a pre-check, or None in dry run."""
        if self._s.dry_run:
            return None
        w3 = self._web3()
        escrow = w3.eth.contract(address=self._s.escrow_address, abi=ESCROW_ABI)
        return {
            "nonce": escrow.functions.authNonces(client).call(),
            "deposit": escrow.functions.deposits(client).call(),
        }

    def relay_withdraw(
        self, client: str, to: str, amount: int, deadline: int, signature: bytes
    ) -> dict:
        return self._send(
            self._s.escrow_address,
            ESCROW_ABI,
            "withdrawWithSig",
            (client, to, amount, deadline, signature),
        )

    def relay_transfer(
        self, sender: str, to: str, amount: int, deadline: int, signature: bytes
    ) -> dict:
        return self._send(
            self._s.escrow_address,
            ESCROW_ABI,
            "transferDeposit",
            (sender, to, amount, deadline, signature),
        )

    # -- settlement relay ----------------------------------------------------

    def relay_batch(self, tickets: list[dict], signatures: list[bytes]) -> dict:
        ordered = [
            (
                t["client"],
                t["nodeAdmin"],
                int(t["sequenceNumber"]),
                int(t["cumulativeUnits"]),
                int(t["epochExpiry"]),
            )
            for t in tickets
        ]
        return self._send(
            self._s.escrow_address,
            ESCROW_ABI,
            "settleTicketBatch",
            (ordered, signatures),
        )
