const { getFullnodeUrl, SuiClient } = require("@mysten/sui/client");
const { Transaction } = require("@mysten/sui/transactions");
const { Ed25519Keypair } = require("@mysten/sui/keypairs/ed25519");
require("dotenv").config();

const SUI_RPC_URL = getFullnodeUrl("localnet");
const SUI_SEED_PHRASE = process.env.SUI_SEED_PHRASE;
const SUI_PACKAGE_OBJECT_ID = process.env.SUI_PACKAGE_OBJECT_ID;
const SUI_TREASURYCAP_OBJECT_ID = process.env.SUI_TREASURYCAP_OBJECT_ID;
const SUI_DEPLOYER_ADDRESS = process.env.SUI_DEPLOYER_ADDRESS;

const client = new SuiClient({ url: SUI_RPC_URL });
const keypair = Ed25519Keypair.deriveKeypair(SUI_SEED_PHRASE);

const truncateAmount = (amount) => {
    return Math.floor(amount * 1e6) / 1e6;
};

const to6decimals = (amount) => {
    return truncateAmount(amount) * 1e6;
}

const mint = async (recipientAddress, amount) => {

    if (!recipientAddress || !amount || truncateAmount(amount) <= 0) {
        if (truncateAmount(amount) <= 0) {
            throw new Error("Invalid amount (Cannot be less than or equal to 0)");
        }
        throw new Error("Invalid recipient address or amount");
    }

    console.log("MINTING SUI:", truncateAmount(amount), " SEB");

    const tx = new Transaction();
    tx.moveCall({
        target: `${SUI_PACKAGE_OBJECT_ID}::seb_coin::mint`,
        arguments: [
            tx.object(SUI_TREASURYCAP_OBJECT_ID),
            tx.pure.u64(to6decimals(amount)),
            tx.pure.address(recipientAddress),
        ],
    });

    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
    });

    return result.digest;
};

async function burn(senderAddress, amount, txDigest) {
    const numericAmount = Number(amount);
    const amountIn6Decimals = to6decimals(numericAmount);
    
    if (!senderAddress || numericAmount <= 0) {
        throw new Error("Invalid burn parameters");
    }

    if (senderAddress !== SUI_DEPLOYER_ADDRESS) {
        console.log("BURNING USER IS NOT DEPLOYER! CHECKING TRANSACTION PROOF...");
        if (!txDigest) {
            throw new Error("Transaction digest required for user burns");
        }

        const txDetails = await client.getTransactionBlock({
            digest: txDigest,
            options: { showEvents: true, showInput: true }
        });

        const transferEvent = txDetails.events?.find(e => 
            e.type === `${SUI_PACKAGE_OBJECT_ID}::seb_coin::CoinTransferToBurnEvent`
        );

        if (!transferEvent?.parsedJson) {
            throw new Error("Transfer To Burn transfer event not found");
        }

        const eventData = transferEvent.parsedJson;
        if (
            eventData.sender !== senderAddress ||
            eventData.recipient !== SUI_DEPLOYER_ADDRESS ||
            Number(eventData.amount) !== amountIn6Decimals ||
            eventData.coin_id === undefined || eventData.coin_id === null
        ) {
            throw new Error("Transfer event validation failed");
        }

        const coinObject = await client.getObject({
            id: eventData.coin_id,
            options: { showOwner: true }
        });

        if (coinObject.data?.owner?.AddressOwner !== SUI_DEPLOYER_ADDRESS) {
            throw new Error("Transferred coin not owned by deployer");
        }

        console.log("TRANSACTION PROOF VALIDATED: ", eventData);
        console.log("COIN TO BE BURNED IS OWNED BY DEPLOYER: ", coinObject.data.owner);

        return executeDeployerBurn(eventData.coin_id);
    }

    return handleDeployerDirectBurn(amountIn6Decimals);
}

async function executeDeployerBurn(coinId) {
    const burnTx = new Transaction();
    burnTx.moveCall({
        target: `${SUI_PACKAGE_OBJECT_ID}::seb_coin::burn`,
        arguments: [
            burnTx.object(SUI_TREASURYCAP_OBJECT_ID),
            burnTx.object(coinId),
        ],
    });

    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: burnTx,
    });

    return result.digest;
}

// This function is called when the user burning is the deployer
// Merge and Split coin logic needs to be implemented here to burn the exact amount
async function handleDeployerDirectBurn(amount) {
    console.log("USER BURNING IS DEPLOYER!");
    const balance = await client.getBalance({
        owner: SUI_DEPLOYER_ADDRESS,
        coinType: `${SUI_PACKAGE_OBJECT_ID}::seb_coin::SEB_COIN`,
    });

    if (balance.totalBalance < amount) {
        throw new Error("Insufficient balance to burn");
    }

    console.log("BALANCE: ", balance.totalBalance);
    console.log("AMOUNT TO BURN: ", amount);

    const coins = await client.getCoins({
        owner: SUI_DEPLOYER_ADDRESS,
        coinType: `${SUI_PACKAGE_OBJECT_ID}::seb_coin::SEB_COIN`,
    });

    console.log("COINS LIST: ", coins.data);

    let burnCoinData;
    let burnCoin = coins.data.find(c => Number(c.balance) >= amount);

    let burnCoinEqual = coins.data.find(c => Number(c.balance) === amount);
    if (burnCoinEqual) {
        burnCoin = burnCoinEqual;
    }

    if (!burnCoin) {

        let totalBalance = 0;
        let coinsToMerge = [];

        for (const coin of coins.data) {
            totalBalance += Number(coin.balance);
            coinsToMerge.push(coin);
            if (totalBalance >= amount) break;
        }

        console.log("MERGING THESE COINS FOR BURNING", coinsToMerge);

        const tx = new Transaction();
        tx.mergeCoins(
            tx.object(coinsToMerge[0].coinObjectId),
            coinsToMerge.slice(1).map((coin) => tx.object(coin.coinObjectId))
        );

        const mergeResult = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
        });

        console.log("MERGE RESULT", mergeResult);

        await new Promise((resolve) => setTimeout(resolve, 3000));
        burnCoinData = coinsToMerge[0];
    } else{
        burnCoinData = burnCoin;
    }

    // If the balance of the coin is equal to the amount to burn, directly burn it
    if (Number(burnCoinData.balance) === amount) {
        return executeDeployerBurn(burnCoinData.coinObjectId);
    }

    // Split the coin to burn the exact amount
    const splitTx = new Transaction();

    const [coinToBurn, remainingCoin] = splitTx.splitCoins(
        splitTx.object(burnCoinData.coinObjectId),
        [
            splitTx.pure.u64(amount),
            splitTx.pure.u64(Number(burnCoinData.balance) - amount)
        ]
    );

    // burn the coin
    splitTx.moveCall({
        target: `${SUI_PACKAGE_OBJECT_ID}::seb_coin::burn`,
        arguments: [
            splitTx.object(SUI_TREASURYCAP_OBJECT_ID),
            coinToBurn
        ]
    });

    splitTx.transferObjects([remainingCoin], splitTx.pure.address(SUI_DEPLOYER_ADDRESS));

    const splitResult = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: splitTx,
    });

    return splitResult.digest;
}

module.exports = { mint, burn };
