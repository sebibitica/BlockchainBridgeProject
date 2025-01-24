const express = require("express");
const { ethers } = require("ethers");
const { verifyPersonalMessageSignature} = require("@mysten/sui/verify");
const ethService = require("../services/ethService");
const suiService = require("../services/suiService");
require("dotenv").config();

const router = express.Router();

async function verifySignature(senderAddress, message, signature, isEthereum) {
    try {
      if (isEthereum) {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        console.log("Recovered Ethereum address:", recoveredAddress);
        console.log("Verified Ethereum address:", recoveredAddress.toLowerCase() === senderAddress.toLowerCase());
        return recoveredAddress.toLowerCase() === senderAddress.toLowerCase();
      } else {
        const messageBytes = new TextEncoder().encode(message);

        console.log("ADDRESSS TRYING TO SIGN", senderAddress);
        
        const publicKey = await verifyPersonalMessageSignature(
           messageBytes,
           signature.signature,
          { address: senderAddress }
        );
        console.log("Recovered SUI address:", publicKey.toSuiAddress());
  
        return publicKey.toSuiAddress() === senderAddress;
      }
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
}

router.post("/eth-to-sui", async (req, res) => {
  try {
    const { senderEthAddress, recipientSuiAddress, amount, message, signature } = req.body;

    if (!senderEthAddress || !recipientSuiAddress || !amount || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const isValid = await verifySignature(
      senderEthAddress,
      message,
      signature,
      true // isEthereum
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid Ethereum signature" });
    }

    console.log("Burning on Ethereum...");
    console.log("SENDER ETH ADDRESS", senderEthAddress);
    const ethTxHash = await ethService.burn(senderEthAddress, amount.toString());
    console.log("Ethereum burn successful:", ethTxHash);

    console.log("Minting on SUI...");
    const suiTxHash = await suiService.mint(recipientSuiAddress, amount.toString());
    console.log("SUI mint successful:", suiTxHash);

    res.json({
      message: "ETH to SUI bridge successful",
      ethTxHash,
      suiTxHash,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ETH to SUI bridge failed", details: err.message });
  }
});

router.post("/sui-to-eth", async (req, res) => {
  try {
    const { senderSuiAddress, recipientEthAddress, amount, message, signature, txDigest} = req.body;

    if (!senderSuiAddress || !recipientEthAddress || !amount || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const isValid = await verifySignature(
      senderSuiAddress,
      message,
      signature,
      false // isEthereum
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid Sui signature" });
    }

    console.log("Burning on SUI...");
    const suiTxHash = await suiService.burn(senderSuiAddress, amount.toString(),txDigest);
    console.log("SUI burn successful:", suiTxHash);

    console.log("Minting on Ethereum...");
    const ethTxHash = await ethService.mint(recipientEthAddress, amount.toString());
    console.log("Ethereum mint successful:", ethTxHash);

    res.json({
      message: "SUI to ETH bridge successful",
      suiTxHash,
      ethTxHash,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SUI to ETH bridge failed", details: err.message });
  }
});

module.exports = router;