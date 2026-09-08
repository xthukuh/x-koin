// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title xKoinTreasury
/// @notice Receives the protocol fee cut from every settlement batch.
///
///         Founder economics without founder risk (spec s8.1):
///         - claim() is callable by ANYONE and can only ever move funds to the
///           beneficiary. No key is required to pay the founder; no key can
///           pay anyone else. A stolen owner key yields an attacker nothing
///           here except the ability to send the founder his own money.
///         - Changing the beneficiary takes a 7-day public timelock, and the
///           current beneficiary (founder cold key) can veto the change. Key
///           theft therefore gives a 7-day reaction window instead of a loss.
///         - Fee percentage is hard-capped at 10% on-chain, so the fee lever
///           can grief margins but can never confiscate or halt settlement.
contract xKoinTreasury is Ownable2Step {
    using SafeERC20 for IERC20;

    uint16 public constant MAX_FEE_BPS = 1000; // hard ceiling 10%
    uint256 public constant BENEFICIARY_DELAY = 7 days;

    uint16 public feeBps; // default 500 = 5%
    address public beneficiary;
    address public pendingBeneficiary;
    uint256 public beneficiaryActivation;

    event FeeBpsSet(uint16 feeBps);
    event Claimed(address indexed token, address indexed beneficiary, uint256 amount);
    event BeneficiaryChangeQueued(address indexed pending, uint256 activation);
    event BeneficiaryChanged(address indexed beneficiary);
    event BeneficiaryChangeCancelled(address indexed cancelledBy);

    error FeeTooHigh();
    error ZeroAddress();
    error NothingToClaim();
    error NoPendingChange();
    error TimelockActive();
    error NotAuthorized();

    constructor(address initialOwner, uint16 initialFeeBps, address beneficiary_)
        Ownable(initialOwner)
    {
        if (initialFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        if (beneficiary_ == address(0)) revert ZeroAddress();
        feeBps = initialFeeBps;
        beneficiary = beneficiary_;
        emit FeeBpsSet(initialFeeBps);
        emit BeneficiaryChanged(beneficiary_);
    }

    /// @notice Fee owed on a gross settlement amount, in token units.
    function feeOn(uint256 grossAmount) external view returns (uint256) {
        return (grossAmount * feeBps) / 10_000;
    }

    function setFeeBps(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = newFeeBps;
        emit FeeBpsSet(newFeeBps);
    }

    /// @notice Sweep the full balance of a token to the beneficiary. Anyone
    ///         may call; the destination is not a parameter by design.
    function claim(IERC20 token) external {
        uint256 amount = token.balanceOf(address(this));
        if (amount == 0) revert NothingToClaim();
        token.safeTransfer(beneficiary, amount);
        emit Claimed(address(token), beneficiary, amount);
    }

    /// @notice Begin a beneficiary change; activates after 7 public days.
    function queueBeneficiary(address newBeneficiary) external onlyOwner {
        if (newBeneficiary == address(0)) revert ZeroAddress();
        pendingBeneficiary = newBeneficiary;
        beneficiaryActivation = block.timestamp + BENEFICIARY_DELAY;
        emit BeneficiaryChangeQueued(newBeneficiary, beneficiaryActivation);
    }

    function activateBeneficiary() external {
        if (pendingBeneficiary == address(0)) revert NoPendingChange();
        if (block.timestamp < beneficiaryActivation) revert TimelockActive();
        beneficiary = pendingBeneficiary;
        pendingBeneficiary = address(0);
        beneficiaryActivation = 0;
        emit BeneficiaryChanged(beneficiary);
    }

    /// @notice The founder's cold key (current beneficiary) or the owner can
    ///         veto a queued change inside the 7-day window.
    function cancelBeneficiaryChange() external {
        if (msg.sender != owner() && msg.sender != beneficiary) revert NotAuthorized();
        if (pendingBeneficiary == address(0)) revert NoPendingChange();
        pendingBeneficiary = address(0);
        beneficiaryActivation = 0;
        emit BeneficiaryChangeCancelled(msg.sender);
    }
}
