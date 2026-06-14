const express = require("express");

const router = express.Router();

// GET /api/geocode?address=encoded — forwards to Google Geocoding API, returns { lat, lng }
router.get("/", async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ message: "address query param is required" });
    }

    const url =
      "https://maps.googleapis.com/maps/api/geocode/json?address=" +
      encodeURIComponent(address) +
      "&key=" +
      process.env.GOOGLE_MAPS_API_KEY;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    const { lat, lng } = data.results[0].geometry.location;
    res.json({ lat, lng });
  } catch (error) {
    console.error("Geocode error:", error.message);
    res.status(500).json({ message: "Geocoding failed" });
  }
});

module.exports = router;
