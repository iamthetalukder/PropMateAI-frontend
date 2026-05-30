const express = require("express");
const fs = require("fs");
const path = require("path");
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Helper: delete image files from disk
const deleteImages = (imagePaths) => {
  if (!imagePaths || imagePaths.length === 0) return;
  imagePaths.forEach((imgPath) => {
    const fullPath = path.join(__dirname, "..", imgPath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Image delete failed:", fullPath, err.message);
      }
    });
  });
};

// Multer wrapper — returns JSON errors instead of HTML
const uploadMiddleware = (req, res, next) => {
  upload.array("images", 20)(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err.message);
      return res
        .status(400)
        .json({ message: err.message || "File upload failed" });
    }
    next();
  });
};

// POST - Create property
router.post("/", authMiddleware, uploadMiddleware, async (req, res) => {
  try {
    const {
      title,
      location,
      address,
      city,
      country,
      latitude,
      longitude,
      price,
      currency,
      status,
    } = req.body;

    if (!title || !location || !price) {
      return res
        .status(400)
        .json({ message: "Please fill title, location, and price" });
    }

    const imagePaths = req.files
      ? req.files.map((file) => "/uploads/" + file.filename)
      : [];

    const property = await Property.create({
      title,
      location,
      address: address || "",
      city: city || "",
      country: country || "",
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      price: Number(price),
      currency: currency || "USD",
      status: status || "vacant",
      images: imagePaths,
      owner: req.user.id,
    });

    res.status(201).json(property);
  } catch (error) {
    console.error("Create property error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - All properties for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(properties);
  } catch (error) {
    console.error("Fetch properties error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT - Update property
router.put("/:id", authMiddleware, uploadMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      location,
      address,
      city,
      country,
      latitude,
      longitude,
      price,
      currency,
      status,
    } = req.body;

    const property = await Property.findOne({ _id: id, owner: req.user.id });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.title = title ?? property.title;
    property.location = location ?? property.location;
    property.address = address ?? property.address;
    property.city = city ?? property.city;
    property.country = country ?? property.country;
    property.latitude = latitude ? Number(latitude) : property.latitude;
    property.longitude = longitude ? Number(longitude) : property.longitude;
    property.price = price ? Number(price) : property.price;
    property.currency = currency ?? property.currency;
    property.status = status ?? property.status;

    if (req.files && req.files.length > 0) {
      deleteImages(property.images);
      property.images = req.files.map((file) => "/uploads/" + file.filename);
    }

    const updatedProperty = await property.save();
    res.json(updatedProperty);
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE - Delete property
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    deleteImages(property.images);
    await Property.deleteOne({ _id: req.params.id });
    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
