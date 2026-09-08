// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title xKoinToken (XKN)
/// @notice ERC-20 with EIP-2612 permit() so clients approve escrow deposits via
///         signed meta-transactions (no on-chain gas needed from the client).
///         The kiosk backend mints against confirmed fiat (M-Pesa Daraja /
///         Equitel Jenga) receipts and burns on fiat off-ramp payouts, keeping
///         circulating XKN 1:1 with the KES float held by the kiosk.
contract xKoinToken is ERC20, ERC20Permit, Ownable2Step {
    /// @notice Addresses allowed to mint/burn (kiosk fiat bridge services).
    ///         TRUST SURFACE: a compromised bridge can mint unbacked XKN until
    ///         detected. Custody roadmap in spec s8: hot/cold split, mint-rate
    ///         cap, multisig owner. Owner transfer is two-step (Ownable2Step).
    mapping(address => bool) public isBridge;

    event BridgeSet(address indexed bridge, bool allowed);
    event BridgeMint(address indexed to, uint256 amount, bytes32 indexed fiatRef);
    event BridgeBurn(address indexed from, uint256 amount, bytes32 indexed fiatRef);

    error NotBridge();

    modifier onlyBridge() {
        if (!isBridge[msg.sender]) revert NotBridge();
        _;
    }

    constructor(address initialOwner)
        ERC20("xKoin", "XKN")
        ERC20Permit("xKoin")
        Ownable(initialOwner)
    {}

    /// @notice 1 XKN = 1 KES. 6 decimals (base unit = 1 micro-KES) so the
    ///         10 KB billing unit can price down to fractions of a cent.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function setBridge(address bridge, bool allowed) external onlyOwner {
        isBridge[bridge] = allowed;
        emit BridgeSet(bridge, allowed);
    }

    /// @param fiatRef keccak256 of the mobile money receipt (e.g. M-Pesa
    ///        CheckoutRequestID or Jenga transactionReference) for audit.
    function bridgeMint(address to, uint256 amount, bytes32 fiatRef) external onlyBridge {
        _mint(to, amount);
        emit BridgeMint(to, amount, fiatRef);
    }

    function bridgeBurn(address from, uint256 amount, bytes32 fiatRef) external onlyBridge {
        _burn(from, amount);
        emit BridgeBurn(from, amount, fiatRef);
    }
}
