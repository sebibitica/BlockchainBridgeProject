pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {console} from "../lib/forge-std/src/console.sol";

contract SebToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("SebToken", "SEB") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    function checkBalance(address account) external view returns (uint256) {
        return balanceOf(account);
    }
}
