const express = require("express");

const router = express.Router();

// GET /api/unsplash/property-photos?query=encoded — returns 9 Unsplash photos
router.get("/property-photos", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "query param is required" });
    }

    const url =
      "https://api.unsplash.com/search/photos?query=" +
      encodeURIComponent(query) +
      "&per_page=9&client_id=" +
      process.env.UNSPLASH_ACCESS_KEY;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) {
      return res.status(502).json({ message: "Unsplash response invalid" });
    }

    const photos = data.results.map((photo) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumb: photo.urls.thumb,
      photographer: photo.user.name,
    }));

    res.json(photos);
  } catch (error) {
    console.error("Unsplash error:", error.message);
    res.status(500).json({ message: "Photo search failed" });
  }
});

module.exports = router;
