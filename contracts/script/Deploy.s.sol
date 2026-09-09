// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {xKoinToken} from "../src/xKoinToken.sol";
import {xKoinTreasury} from "../src/xKoinTreasury.sol";
import {xKoinEscrow} from "../src/xKoinEscrow.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Usage (Base Sepolia):
///   export DEPLOYER_KEY=0x...
///   export BRIDGE_ADDRESS=0x...        # gateway-api hot wallet
///   export BENEFICIARY_ADDRESS=0x...   # founder cold key; required off the local chain
///   export DAILY_MINT_CAP_KES=5000     # optional, default 50,000 KES/day per bridge
///   forge script script/Deploy.s.sol --rpc-url base_sepolia \
///       --private-key $DEPLOYER_KEY --broadcast
///
/// Every broadcast writes deployments/<chainId>.json with the three addresses,
/// the beneficiary, the bridge and the cap, so gateway-api/.env is filled from
/// a file rather than from memory (docs/critical-accounts/02-wallet-roles.md).
contract Deploy is Script {
    uint16 constant FEE_BPS = 500; // 5% per plan doc 02
    uint256 constant PRICE_PER_UNIT = 500; // micro-KES per 10 KB unit = 0.05 KES/MB, owner-tunable
    uint256 constant DEFAULT_CAP_KES = 50_000; // 50,000 KES/day per bridge
    uint256 constant UKES_PER_KES = 1_000_000; // XKN has 6 decimals
    uint256 constant LOCAL_CHAIN_ID = 31337; // anvil

    function run() external {
        address deployer = vm.addr(vm.envUint("DEPLOYER_KEY"));
        address bridgeAddr = vm.envAddress("BRIDGE_ADDRESS");

        // The deployer-as-beneficiary default exists for local proofs only. On
        // any real chain the fee recipient must be named on purpose.
        address beneficiary;
        if (block.chainid == LOCAL_CHAIN_ID) {
            beneficiary = vm.envOr("BENEFICIARY_ADDRESS", deployer);
        } else {
            require(
                vm.envExists("BENEFICIARY_ADDRESS"),
                "BENEFICIARY_ADDRESS is required off the local chain (docs/key-management.md s3)"
            );
            beneficiary = vm.envAddress("BENEFICIARY_ADDRESS");
            require(beneficiary != deployer, "beneficiary must not be the disposable deployer key");
        }

        uint256 capKes = vm.envOr("DAILY_MINT_CAP_KES", DEFAULT_CAP_KES);
        uint128 dailyMintCap = uint128(capKes * UKES_PER_KES);

        vm.startBroadcast(vm.envUint("DEPLOYER_KEY"));
        xKoinToken token = new xKoinToken(deployer);
        xKoinTreasury treasury = new xKoinTreasury(deployer, FEE_BPS, beneficiary);
        xKoinEscrow escrow =
            new xKoinEscrow(IERC20(address(token)), treasury, PRICE_PER_UNIT, deployer);
        token.setBridge(bridgeAddr, true, dailyMintCap);
        vm.stopBroadcast();

        console.log("chainId      :", block.chainid);
        console.log("beneficiary  :", beneficiary);
        console.log("bridge       :", bridgeAddr);
        console.log("dailyCap KES :", capKes);
        console.log("xKoinToken   :", address(token));
        console.log("xKoinTreasury:", address(treasury));
        console.log("xKoinEscrow  :", address(escrow));

        _writeDeployment(token, treasury, escrow, beneficiary, bridgeAddr, capKes);
    }

    function _writeDeployment(
        xKoinToken token,
        xKoinTreasury treasury,
        xKoinEscrow escrow,
        address beneficiary,
        address bridgeAddr,
        uint256 capKes
    ) internal {
        string memory key = "deployment";
        vm.serializeUint(key, "chainId", block.chainid);
        vm.serializeAddress(key, "token", address(token));
        vm.serializeAddress(key, "treasury", address(treasury));
        vm.serializeAddress(key, "escrow", address(escrow));
        vm.serializeAddress(key, "beneficiary", beneficiary);
        vm.serializeAddress(key, "bridge", bridgeAddr);
        vm.serializeUint(key, "dailyMintCapKes", capKes);
        vm.serializeUint(key, "feeBps", FEE_BPS);
        vm.serializeUint(key, "pricePerUnit", PRICE_PER_UNIT);
        string memory json = vm.serializeUint(key, "deployedAt", block.timestamp);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        vm.writeJson(json, path);
        console.log("written      :", path);
    }
}
