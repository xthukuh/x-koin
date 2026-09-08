"""EIP-712 Ticket signing + on-chain settlement against xKoinEscrow.

Domain and struct must byte-match contracts/src/xKoinEscrow.sol. The e2e run
asserts parity by comparing the locally computed digest with the contract's
hashTicket() before settling.
"""

from dataclasses import dataclass

from eth_account import Account
from eth_account.messages import encode_typed_data
from eth_utils import keccak

TICKET_TYPES = {
    "Ticket": [
        {"name": "client", "type": "address"},
        {"name": "nodeAdmin", "type": "address"},
        {"name": "sequenceNumber", "type": "uint64"},
        {"name": "cumulativeUnits", "type": "uint128"},
        {"name": "epochExpiry", "type": "uint256"},
    ]
}

ESCROW_ABI = [
    {"type": "function", "name": "deposit", "stateMutability": "nonpayable",
     "inputs": [{"name": "amount", "type": "uint256"}], "outputs": []},
    {"type": "function", "name": "deposits", "stateMutability": "view",
     "inputs": [{"name": "", "type": "address"}],
     "outputs": [{"name": "", "type": "uint256"}]},
    {"type": "function", "name": "earnings", "stateMutability": "view",
     "inputs": [{"name": "", "type": "address"}],
     "outputs": [{"name": "", "type": "uint256"}]},
    {"type": "function", "name": "hashTicket", "stateMutability": "view",
     "inputs": [{"name": "t", "type": "tuple", "components": [
         {"name": "client", "type": "address"},
         {"name": "nodeAdmin", "type": "address"},
         {"name": "sequenceNumber", "type": "uint64"},
         {"name": "cumulativeUnits", "type": "uint128"},
         {"name": "epochExpiry", "type": "uint256"}]}],
     "outputs": [{"name": "", "type": "bytes32"}]},
    {"type": "function", "name": "settleTicketBatch", "stateMutability": "nonpayable",
     "inputs": [
         {"name": "tickets", "type": "tuple[]", "components": [
             {"name": "client", "type": "address"},
             {"name": "nodeAdmin", "type": "address"},
             {"name": "sequenceNumber", "type": "uint64"},
             {"name": "cumulativeUnits", "type": "uint128"},
             {"name": "epochExpiry", "type": "uint256"}]},
         {"name": "signatures", "type": "bytes[]"}],
     "outputs": []},
    {"type": "function", "name": "pricePerUnit", "stateMutability": "view",
     "inputs": [], "outputs": [{"name": "", "type": "uint256"}]},
]

TOKEN_ABI = [
    {"type": "function", "name": "bridgeMint", "stateMutability": "nonpayable",
     "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"},
                {"name": "fiatRef", "type": "bytes32"}], "outputs": []},
    {"type": "function", "name": "approve", "stateMutability": "nonpayable",
     "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
     "outputs": [{"name": "", "type": "bool"}]},
    {"type": "function", "name": "balanceOf", "stateMutability": "view",
     "inputs": [{"name": "", "type": "address"}],
     "outputs": [{"name": "", "type": "uint256"}]},
]


@dataclass
class Ticket:
    client: str
    nodeAdmin: str
    sequenceNumber: int
    cumulativeUnits: int
    epochExpiry: int

    def as_tuple(self):
        return (self.client, self.nodeAdmin, self.sequenceNumber, self.cumulativeUnits,
                self.epochExpiry)

    def as_message(self):
        return {"client": self.client, "nodeAdmin": self.nodeAdmin,
                "sequenceNumber": self.sequenceNumber,
                "cumulativeUnits": self.cumulativeUnits, "epochExpiry": self.epochExpiry}


def typed_data(ticket: Ticket, chain_id: int, escrow: str) -> dict:
    return {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            **TICKET_TYPES,
        },
        "primaryType": "Ticket",
        "domain": {"name": "xKoinEscrow", "version": "1", "chainId": chain_id,
                   "verifyingContract": escrow},
        "message": ticket.as_message(),
    }


def local_digest(ticket: Ticket, chain_id: int, escrow: str) -> bytes:
    s = encode_typed_data(full_message=typed_data(ticket, chain_id, escrow))
    return keccak(b"\x19\x01" + s.header + s.body)


def sign_ticket(private_key: str, ticket: Ticket, chain_id: int, escrow: str) -> bytes:
    signable = encode_typed_data(full_message=typed_data(ticket, chain_id, escrow))
    return Account.sign_message(signable, private_key=private_key).signature


def send(w3, key: str, fn):
    acct = Account.from_key(key)
    tx = fn.build_transaction({"from": acct.address,
                               "nonce": w3.eth.get_transaction_count(acct.address),
                               "chainId": w3.eth.chain_id})
    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    assert receipt.status == 1, f"tx reverted: {fn}"
    return receipt
