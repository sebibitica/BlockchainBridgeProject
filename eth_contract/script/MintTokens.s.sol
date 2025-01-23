// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { SebToken } from "../src/SebToken.sol";
import { Script, console } from "../lib/forge-std/src/Script.sol";

contract MintTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address tokenAddress = 0x5FbDB2315678afecb367f032d93F642f64180aa3; 
        SebToken token = SebToken(tokenAddress);

        console.log("SENDER:",msg.sender);

        uint256 amountToMint = 222 * 10 ** 18;
        token.mint(msg.sender, amountToMint);

        console.log("Burned ", amountToMint, "tokens from ", msg.sender);

        vm.stopBroadcast();
    }
}
