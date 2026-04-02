const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const properties = await Property.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, location, rent, currency, status } = req.body;

    const property = new Property({
      user: req.user.id,
      name,
      location,
      rent,
      currency: currency || "USD",
      status: status || "vacant",
    });

    const savedProperty = await property.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { ...req.body, user: req.user.id },
      { new: true },
    );

    res.status(200).json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
