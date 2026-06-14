const express = require("express");

const router = express.Router();

// Module-level cache so we don't hit the API on every request
let cachedRates = null;
let cacheExpiry = 0;
const ONE_HOUR_MS = 60 * 60 * 1000;

// GET /api/currency/rates — returns exchange rates vs USD with 1-hour cache
router.get("/rates", async (req, res) => {
  try {
    if (cachedRates && Date.now() < cacheExpiry) {
      return res.json({ rates: cachedRates, lastUpdated: new Date(cacheExpiry - ONE_HOUR_MS) });
    }

    const url =
      "https://v6.exchangerate-api.com/v6/" +
      process.env.EXCHANGERATE_API_KEY +
      "/latest/USD";

    const response = await fetch(url);
    const data = await response.json();

    if (data.result !== "success") {
      return res.status(502).json({ message: "Exchange rate fetch failed" });
    }

    const { EUR, GBP, BDT, CAD, AUD } = data.conversion_rates;
    cachedRates = { EUR, GBP, BDT, CAD, AUD };
    cacheExpiry = Date.now() + ONE_HOUR_MS;

    res.json({ rates: cachedRates, lastUpdated: new Date() });
  } catch (error) {
    console.error("Currency error:", error.message);
    if (cachedRates) {
      return res.json({ rates: cachedRates, lastUpdated: new Date(cacheExpiry - ONE_HOUR_MS) });
    }
    res.status(500).json({ message: "Currency fetch failed" });
  }
});

module.exports = router;
