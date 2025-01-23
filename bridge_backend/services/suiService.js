const { getFullnodeUrl, SuiClient } = require("@mysten/sui/client");
const { Transaction } = require("@mysten/sui/transactions");
const { Ed25519Keypair } = require("@mysten/sui/keypairs/ed25519");
require("dotenv").config();

const SUI_RPC_URL = getFullnodeUrl("localnet");
const SUI_SEED_PHRASE = process.env.SUI_SEED_PHRASE;
const SUI_PACKAGE_OBJECT_ID = process.env.SUI_PACKAGE_OBJECT_ID;
const SUI_TREASURYCAP_OBJECT_ID = process.env.SUI_TREASURYCAP_OBJECT_ID;

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

const burn = async (senderAddress, amount) => {
    if (!senderAddress || !amount || truncateAmount(amount) <= 0) {
        if (truncateAmount(amount) <= 0) {
            console.log("AMOUNT LESS THAN 0: ", amount);
            throw new Error("Invalid amount (Cannot be less than or equal to 0)");
        }
        throw new Error("Invalid sender address or amount");
    }

    const balance = await client.getBalance({
        owner: senderAddress,
        coinType: `${SUI_PACKAGE_OBJECT_ID}::seb_coin::SEB_COIN`,
    });

    if (balance.totalBalance < to6decimals(amount)) {
        throw new Error("Insufficient balance to burn");
    }

    console.log("BALANCE: ", balance.totalBalance);
    console.log("AMOUNT TO BURN: ", to6decimals(amount));

    const coins = await client.getCoins({
        owner: senderAddress,
        coinType: `${SUI_PACKAGE_OBJECT_ID}::seb_coin::SEB_COIN`,
    });

    const coinsList = coins.data;
    console.log("COINS LIST: ", coinsList);

    let burnCoinId = "";
    const coinToBurn = coinsList.find((coin) => coin.balance >= to6decimals(amount));
    // if there is no single coin with enough balance to burn, merge coins
    if (!coinToBurn) {
        let totalBalance = 0;
        let coinsToMerge = [];

        for (const coin of coinsList) {
            totalBalance += Number(coin.balance);
            coinsToMerge.push(coin);
            if (totalBalance >= to6decimals(amount)) break;
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

        await new Promise((resolve) => setTimeout(resolve, 3000));
        burnCoinId = coinsToMerge[0].coinObjectId;
    } else {
        console.log("FOUND A SINGLE COIN TO BURN", coinToBurn);
        burnCoinId = coinToBurn.coinObjectId;
    }
    console.log("BURNING  SUI: ", truncateAmount(amount), " SEB");

    const burnTx = new Transaction();
    burnTx.moveCall({
        target: `${SUI_PACKAGE_OBJECT_ID}::seb_coin::burn`,
        arguments: [
            burnTx.object(SUI_TREASURYCAP_OBJECT_ID),
            burnTx.object(burnCoinId),
            burnTx.pure.u64(to6decimals(amount)),
        ],
    });

    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: burnTx,
    });

    return result.digest;
};

module.exports = { mint, burn };
