// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {xKoinToken} from "../src/xKoinToken.sol";
import {xKoinTreasury} from "../src/xKoinTreasury.sol";
import {xKoinEscrow} from "../src/xKoinEscrow.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Usage (Base Sepolia):
///   export DEPLOYER_KEY=0x...
///   export BRIDGE_ADDRESS=0x...   # gateway-api hot wallet
///   forge script script/Deploy.s.sol --rpc-url base_sepolia \
///       --private-key $DEPLOYER_KEY --broadcast
contract Deploy is Script {
    uint16 constant FEE_BPS = 500; // 5% per plan doc 02
    uint256 constant PRICE_PER_UNIT = 500; // micro-KES per 10 KB unit = 0.05 KES/MB, owner-tunable

    function run() external {
        address deployer = vm.addr(vm.envUint("DEPLOYER_KEY"));
        address bridgeAddr = vm.envAddress("BRIDGE_ADDRESS");

        vm.startBroadcast(vm.envUint("DEPLOYER_KEY"));
        xKoinToken token = new xKoinToken(deployer);
        xKoinTreasury treasury = new xKoinTreasury(deployer, FEE_BPS);
        xKoinEscrow escrow =
            new xKoinEscrow(IERC20(address(token)), treasury, PRICE_PER_UNIT, deployer);
        token.setBridge(bridgeAddr, true);
        vm.stopBroadcast();

        console.log("xKoinToken   :", address(token));
        console.log("xKoinTreasury:", address(treasury));
        console.log("xKoinEscrow  :", address(escrow));
    }
}
