// foundry/script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {NftMarketplace} from "../src/NftMarketplace.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast();

        // 1) Deploy MockUSDC (no constructor args)
        MockUSDC usdc = new MockUSDC();

        // 2) Deploy NftMarketplace with the USDC address
        NftMarketplace market = new NftMarketplace(address(usdc));

        vm.stopBroadcast();

        console2.log("Mock USDC (Sepolia):", address(usdc));
        console2.log("NftMarketplace (Sepolia):", address(market));
    }
}
