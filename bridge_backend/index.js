const express = require("express");
const cors = require("cors");
const ethRoutes = require("./routes/ethRoutes");
const suiRoutes = require("./routes/suiRoutes");
const bridgeRoutes = require("./routes/bridgeRoutes");

require("dotenv").config();

const app = express();

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'], 
};

app.use(cors(corsOptions));
app.use(express.json());

app.options('*', cors(corsOptions));

function authorize(req, res, next) {
  if (req.method === 'OPTIONS') return next();
  
  const apiKey = req.headers["x-api-key"];
  if (apiKey === process.env.API_KEY) {
    next()
  } else {
    res.status(403).json({ error: "Unauthorized" });
  }
}

// admin only with api key
app.use("/api/eth", authorize, ethRoutes);
app.use("/api/sui", authorize, suiRoutes);

// public
app.use("/api/bridge", bridgeRoutes);

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});