pragma solidity ^0.8.0;

import { SebToken } from "../src/SebToken.sol";
import { Script, console } from "../lib/forge-std/src/Script.sol";

contract DeployToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        SebToken token = new SebToken(1000000 * 10 ** 18);
        console.log("SebToken deployed at:", address(token));

        vm.stopBroadcast();
    }
}
