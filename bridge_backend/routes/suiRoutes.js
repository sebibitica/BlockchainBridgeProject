const express = require("express");
const suiService = require("../services/suiService");

const router = express.Router();

router.post("/mint", async (req, res) => {
    try {
        const { address, amount } = req.body;
        const txHash = await suiService.mint(address, amount);
        res.json({ message: "Minted successfully", transactionHash: txHash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/burn", async (req, res) => {
    try {
        const { address, amount } = req.body;
        const txHash = await suiService.burn(address, amount);
        res.json({ message: "Burned successfully", transactionHash: txHash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;