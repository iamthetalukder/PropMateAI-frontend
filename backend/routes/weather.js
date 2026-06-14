const express = require("express");

const router = express.Router();

// GET /api/weather?city=encoded — returns weather data for a city
router.get("/", async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ message: "city query param is required" });
    }

    const url =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      encodeURIComponent(city) +
      "&appid=" +
      process.env.OPENWEATHER_API_KEY +
      "&units=metric";

    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      return res.status(404).json({ message: data.message || "City not found" });
    }

    res.json({
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      wind_speed: Math.round((data.wind.speed || 0) * 3.6),
      city: data.name,
    });
  } catch (error) {
    console.error("Weather error:", error.message);
    res.status(500).json({ message: "Weather fetch failed" });
  }
});

module.exports = router;
