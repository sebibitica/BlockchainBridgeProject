const { ethers } = require("ethers");
require("dotenv").config();

const ETH_RPC_URL = "http://127.0.0.1:8545";
const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY;
const ETH_CONTRACT_ADDRESS = process.env.ETH_CONTRACT_ADDRESS;

const ABI = [
    "function mint(address to, uint256 amount) external",
    "function burn(address from, uint256 amount) external",
    "function checkBalance(address account) external view returns (uint256)",
];

if (!ETH_PRIVATE_KEY || !ETH_RPC_URL || !ETH_CONTRACT_ADDRESS) {
    console.error("Please set ETH_PRIVATE_KEY, ETH_RPC_URL, and ETH_CONTRACT_ADDRESS in .env");
    process.exit(1);
}

const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
const wallet = new ethers.Wallet(ETH_PRIVATE_KEY, provider);
const contract = new ethers.Contract(ETH_CONTRACT_ADDRESS, ABI, wallet);

const roundedAmount = (amount) => { return Math.floor(amount * 1e6) / 1e6;};

const toWei = (amount) => {
    return ethers.parseUnits(roundedAmount(amount).toString(), 18);
};

const mint = async (address, amount) => {
    if (!ethers.isAddress(address) || !amount || roundedAmount(amount) <= 0) {
        if(roundedAmount(amount) <= 0) {
            console.log("AMOUNT LESS THAN 0: ", amount);
            throw new Error("Invalid amount (Cannot be less than or equal to 0)");
        }
        throw new Error("Invalid address or amount");
    }

    console.log("MINTING ETH:", ethers.formatEther(toWei(amount)), " SEB");

    const tx = await contract.mint(address, toWei(amount));
    await tx.wait();
    return tx.hash;
};

const burn = async (address, amount) => {
    if (!ethers.isAddress(address) || !amount || roundedAmount(amount) <= 0) {
        if(roundedAmount(amount) <= 0) {
            throw new Error("Invalid amount (Cannot be less than or equal to 0)");
        }
        throw new Error("Invalid address or amount");
    }

    const balance = await contract.checkBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    console.log("Balance in ETH:", balanceInEth);
    console.log("Amount to burn:", roundedAmount(amount));
    
    if (balance < toWei(amount)) {
        throw new Error("Insufficient balance");
    }

    console.log("BURNING ETH:", ethers.formatEther(toWei(amount)), " SEB");

    const tx = await contract.burn(address, toWei(amount));
    await tx.wait();
    return tx.hash;
};

module.exports = { mint, burn };
