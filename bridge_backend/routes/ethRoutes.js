const express = require("express");
const ethService = require("../services/ethService");

const router = express.Router();

router.post("/mint", async (req, res) => {
    try {
        const { address, amount } = req.body;
        const txHash = await ethService.mint(address, amount);
        res.json({ message: "Minted successfully", transactionHash: txHash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/burn", async (req, res) => {
    try {
        const { address, amount } = req.body;
        const txHash = await ethService.burn(address, amount);
        res.json({ message: "Burned successfully", transactionHash: txHash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;