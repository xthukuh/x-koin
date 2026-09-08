// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {xKoinTreasury} from "./xKoinTreasury.sol";

/// @title xKoinEscrow
/// @notice Trust-minimized state-channel escrow: peers need no trust in each
///         other, but see spec s8 for the named trusted parties at the fiat
///         boundary (owner, bridge, kiosk root key) and their removal path. Clients deposit XKN; gateway nodes
///         collect signed off-chain tickets while relaying WAN bytes and settle
///         them in batches. Tickets carry CUMULATIVE units so losing an
///         intermediate ticket loses nothing: only the latest ticket per
///         (client, nodeAdmin) channel matters, and settlement pays the delta
///         over what was already settled.
///
///         Ticket signatures are EIP-712 secp256k1 ECDSA (the chain's native
///         scheme). Ed25519 verification stays at the hardware edge for mesh
///         admission; the client key that signs tickets is an EVM keypair held
///         by the client device/wallet.
contract xKoinEscrow is EIP712, ReentrancyGuard, Ownable2Step {
    using SafeERC20 for IERC20;

    /// @dev Field order matches plan doc 02 exactly.
    struct Ticket {
        address client;
        address nodeAdmin;
        uint64 sequenceNumber;
        uint128 cumulativeUnits;
        uint256 epochExpiry;
    }

    struct Channel {
        uint64 lastSequence;
        uint128 settledUnits;
    }

    bytes32 public constant TICKET_TYPEHASH = keccak256(
        "Ticket(address client,address nodeAdmin,uint64 sequenceNumber,uint128 cumulativeUnits,uint256 epochExpiry)"
    );

    IERC20 public immutable token;
    xKoinTreasury public immutable treasury;

    /// @notice XKN base units (micro-KES) per relayed unit (1 unit = 10 KB WAN).
    uint256 public pricePerUnit;

    /// @notice Client deposits available to be consumed by tickets.
    mapping(address => uint256) public deposits;
    /// @notice Node admin earnings pending withdrawal / B2C payout.
    mapping(address => uint256) public earnings;
    /// @notice channel state per keccak256(client, nodeAdmin).
    mapping(bytes32 => Channel) public channels;

    event Deposited(address indexed client, uint256 amount);
    event DepositWithdrawn(address indexed client, uint256 amount);
    event TicketSettled(
        address indexed client,
        address indexed nodeAdmin,
        uint64 sequenceNumber,
        uint128 deltaUnits,
        uint256 paidAmount
    );
    event BatchSettled(address indexed relayer, uint256 gross, uint256 fee, uint256 net);
    event EarningsClaimed(address indexed nodeAdmin, address indexed to, uint256 amount);
    event PricePerUnitSet(uint256 pricePerUnit);

    error LengthMismatch();
    error EmptyBatch();
    error ExpiredTicket(uint256 index);
    error StaleSequence(uint256 index);
    error NoNewUnits(uint256 index);
    error BadSignature(uint256 index);
    error ZeroAmount();
    error InsufficientDeposit();
    error InsufficientEarnings();
    error ZeroPrice();

    constructor(IERC20 token_, xKoinTreasury treasury_, uint256 pricePerUnit_, address initialOwner)
        EIP712("xKoinEscrow", "1")
        Ownable(initialOwner)
    {
        if (pricePerUnit_ == 0) revert ZeroPrice();
        token = token_;
        treasury = treasury_;
        pricePerUnit = pricePerUnit_;
        emit PricePerUnitSet(pricePerUnit_);
    }

    // ------------------------------------------------------------------
    // Client side: deposits
    // ------------------------------------------------------------------

    function deposit(uint256 amount) external nonReentrant {
        _deposit(msg.sender, amount);
    }

    /// @notice Gasless top-up path: kiosk backend relays the client's EIP-2612
    ///         permit so the client never needs native gas.
    function depositWithPermit(
        address client,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        // Front-running a permit only griefs the relayer; tolerate failure so a
        // pre-consumed permit does not brick the deposit.
        try IERC20Permit(address(token)).permit(client, address(this), amount, deadline, v, r, s) {}
            catch {}
        _deposit(client, amount);
    }

    function _deposit(address client, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        token.safeTransferFrom(client, address(this), amount);
        deposits[client] += amount;
        emit Deposited(client, amount);
    }

    /// @notice Clients may exit unspent balance at any time. Off-chain tickets
    ///         are only redeemable against remaining deposit, so nodes must
    ///         settle promptly (dynamic batch threshold handled by relayer).
    function withdrawDeposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 bal = deposits[msg.sender];
        if (bal < amount) revert InsufficientDeposit();
        deposits[msg.sender] = bal - amount;
        token.safeTransfer(msg.sender, amount);
        emit DepositWithdrawn(msg.sender, amount);
    }

    // ------------------------------------------------------------------
    // Node side: settlement
    // ------------------------------------------------------------------

    /// @notice Verifies and settles a batch of client-signed tickets. Anyone
    ///         may relay (typically the gateway-api settlement service); funds
    ///         only ever move client deposit -> nodeAdmin earnings + treasury.
    /// @dev Per-ticket validity reverts the whole batch: the relayer pre-checks
    ///      off-chain, so an invalid ticket on-chain means a bug or an attack
    ///      and must be loud, not silently skipped.
    function settleTicketBatch(Ticket[] calldata tickets, bytes[] calldata signatures)
        external
        nonReentrant
    {
        uint256 n = tickets.length;
        if (n == 0) revert EmptyBatch();
        if (n != signatures.length) revert LengthMismatch();

        uint256 gross;
        uint256 totalFee;
        for (uint256 i = 0; i < n; ++i) {
            (uint256 paid, uint256 fee) = _settleOne(tickets[i], signatures[i], i);
            gross += paid;
            totalFee += fee;
        }
        if (gross == 0) revert ZeroAmount();

        if (totalFee > 0) token.safeTransfer(address(treasury), totalFee);
        emit BatchSettled(msg.sender, gross, totalFee, gross - totalFee);
    }

    function _settleOne(Ticket calldata t, bytes calldata sig, uint256 i)
        internal
        returns (uint256 paid, uint256 fee)
    {
        if (t.epochExpiry < block.timestamp) revert ExpiredTicket(i);

        bytes32 channelId = keccak256(abi.encodePacked(t.client, t.nodeAdmin));
        Channel storage ch = channels[channelId];
        if (t.sequenceNumber <= ch.lastSequence) revert StaleSequence(i);
        if (t.cumulativeUnits <= ch.settledUnits) revert NoNewUnits(i);

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    TICKET_TYPEHASH,
                    t.client,
                    t.nodeAdmin,
                    t.sequenceNumber,
                    t.cumulativeUnits,
                    t.epochExpiry
                )
            )
        );
        if (ECDSA.recover(digest, sig) != t.client) revert BadSignature(i);

        uint128 deltaUnits = t.cumulativeUnits - ch.settledUnits;
        uint256 owed = uint256(deltaUnits) * pricePerUnit;

        // A client cannot owe more than they escrowed. Nodes see live deposit
        // state via the relayer and stop serving overdrawn clients; partial
        // payment here protects the node from losing the entire ticket.
        uint256 available = deposits[t.client];
        paid = owed <= available ? owed : available;

        ch.lastSequence = t.sequenceNumber;
        ch.settledUnits = t.cumulativeUnits;

        if (paid > 0) {
            deposits[t.client] = available - paid;
            fee = treasury.feeOn(paid);
            earnings[t.nodeAdmin] += paid - fee;
        }
        emit TicketSettled(t.client, t.nodeAdmin, t.sequenceNumber, deltaUnits, paid);
    }

    /// @notice Node admin pulls settled earnings. The gateway-api B2C relayer
    ///         watches EarningsClaimed/BatchSettled to trigger M-Pesa payout.
    function claimEarnings(address to, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 bal = earnings[msg.sender];
        if (bal < amount) revert InsufficientEarnings();
        earnings[msg.sender] = bal - amount;
        token.safeTransfer(to, amount);
        emit EarningsClaimed(msg.sender, to, amount);
    }

    // ------------------------------------------------------------------
    // Governance
    // ------------------------------------------------------------------

    function setPricePerUnit(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert ZeroPrice();
        pricePerUnit = newPrice;
        emit PricePerUnitSet(newPrice);
    }

    /// @notice Exposed for firmware/backend to build identical EIP-712 digests.
    function hashTicket(Ticket calldata t) external view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    TICKET_TYPEHASH,
                    t.client,
                    t.nodeAdmin,
                    t.sequenceNumber,
                    t.cumulativeUnits,
                    t.epochExpiry
                )
            )
        );
    }

    function channelState(address client, address nodeAdmin)
        external
        view
        returns (uint64 lastSequence, uint128 settledUnits)
    {
        Channel storage ch = channels[keccak256(abi.encodePacked(client, nodeAdmin))];
        return (ch.lastSequence, ch.settledUnits);
    }
}
