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
    /// @notice Bridge accounts (kiosk fiat services). TRUST SURFACE, bounded
    ///         on-chain: a compromised bridge can mint at most dailyMintCap of
    ///         unbacked XKN per rolling day, and can burn ONLY its own balance
    ///         (third-party balances are unburnable by construction, so no key
    ///         can destroy user funds). Owner transfer is two-step.
    struct BridgeInfo {
        bool allowed;
        uint128 dailyMintCap;
        uint128 mintedInWindow;
        uint64 windowStart;
    }

    mapping(address => BridgeInfo) public bridges;

    event BridgeSet(address indexed bridge, bool allowed, uint128 dailyMintCap);
    event BridgeMint(address indexed to, uint256 amount, bytes32 indexed fiatRef);
    event BridgeBurn(address indexed from, uint256 amount, bytes32 indexed fiatRef);

    error NotBridge();
    error MintCapExceeded();

    modifier onlyBridge() {
        if (!bridges[msg.sender].allowed) revert NotBridge();
        _;
    }

    function isBridge(address account) external view returns (bool) {
        return bridges[account].allowed;
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

    function setBridge(address bridge, bool allowed, uint128 dailyMintCap) external onlyOwner {
        BridgeInfo storage info = bridges[bridge];
        info.allowed = allowed;
        info.dailyMintCap = dailyMintCap;
        emit BridgeSet(bridge, allowed, dailyMintCap);
    }

    /// @param fiatRef keccak256 of the mobile money receipt (e.g. M-Pesa
    ///        CheckoutRequestID or Jenga transactionReference) for audit.
    function bridgeMint(address to, uint256 amount, bytes32 fiatRef) external onlyBridge {
        BridgeInfo storage info = bridges[msg.sender];
        if (block.timestamp >= info.windowStart + 1 days) {
            info.windowStart = uint64(block.timestamp);
            info.mintedInWindow = 0;
        }
        uint256 newTotal = uint256(info.mintedInWindow) + amount;
        if (newTotal > info.dailyMintCap) revert MintCapExceeded();
        info.mintedInWindow = uint128(newTotal);
        _mint(to, amount);
        emit BridgeMint(to, amount, fiatRef);
    }

    /// @notice Burns strictly from the bridge's OWN balance (fiat off-ramp:
    ///         funds arrive at the bridge, get paid out via B2C, then burn).
    function bridgeBurn(uint256 amount, bytes32 fiatRef) external onlyBridge {
        _burn(msg.sender, amount);
        emit BridgeBurn(msg.sender, amount, fiatRef);
    }
}
