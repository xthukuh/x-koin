// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title xKoinTreasury
/// @notice Receives the protocol fee cut from every settlement batch. Retained
///         funds cover relayer gas and protocol development (per plan doc 02).
///         Fee percentage lives here so governance changes never touch escrow.
contract xKoinTreasury is Ownable2Step {
    using SafeERC20 for IERC20;

    uint16 public constant MAX_FEE_BPS = 1000; // hard ceiling 10%
    uint16 public feeBps; // default 500 = 5%

    event FeeBpsSet(uint16 feeBps);
    event Withdrawn(address indexed token, address indexed to, uint256 amount);

    error FeeTooHigh();

    constructor(address initialOwner, uint16 initialFeeBps) Ownable(initialOwner) {
        if (initialFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = initialFeeBps;
        emit FeeBpsSet(initialFeeBps);
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

    /// @notice Owner sweeps accumulated fees (funds relayer gas top-ups).
    function withdraw(IERC20 token, address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
        emit Withdrawn(address(token), to, amount);
    }
}
