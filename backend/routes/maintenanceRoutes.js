const express = require("express");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const Property = require("../models/Property");
const Tenant = require("../models/Tenant");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST - Create a new maintenance request
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, propertyId, tenantId, priority, category } =
      req.body;

    if (!title || !description || !propertyId) {
      return res
        .status(400)
        .json({ message: "Please fill title, description, and property" });
    }

    // Verify property belongs to this user
    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user.id,
    });
    if (!property) {
      return res
        .status(404)
        .json({ message: "Property not found or does not belong to you" });
    }

    // If tenantId is provided, verify it belongs to this user
    if (tenantId) {
      const tenant = await Tenant.findOne({ _id: tenantId, owner: req.user.id });
      if (!tenant) {
        return res
          .status(404)
          .json({ message: "Tenant not found or does not belong to you" });
      }
    }

    const request = await MaintenanceRequest.create({
      title: title.trim(),
      description: description.trim(),
      propertyId,
      tenantId: tenantId || null,
      owner: req.user.id,
      priority: priority || "medium",
      category: category || "other",
      status: "open",
      resolvedAt: null,
    });

    const populated = await MaintenanceRequest.findById(request._id)
      .populate("propertyId", "title location")
      .populate("tenantId", "name email");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Create maintenance request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - All maintenance requests for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ owner: req.user.id })
      .populate("propertyId", "title location")
      .populate("tenantId", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Fetch maintenance requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - All requests for a specific property (MUST be before /:id)
router.get("/property/:propertyId", authMiddleware, async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({
      propertyId: req.params.propertyId,
      owner: req.user.id,
    })
      .populate("tenantId", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("Fetch requests by property error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - Single request by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findOne({
      _id: req.params.id,
      owner: req.user.id,
    })
      .populate("propertyId", "title location")
      .populate("tenantId", "name email");

    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    res.json(request);
  } catch (error) {
    console.error("Fetch maintenance request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT - Update a maintenance request
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      propertyId,
      tenantId,
      priority,
      category,
      status,
    } = req.body;

    const request = await MaintenanceRequest.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    // Verify new property ownership if changing propertyId
    if (propertyId && propertyId !== String(request.propertyId)) {
      const property = await Property.findOne({
        _id: propertyId,
        owner: req.user.id,
      });
      if (!property) {
        return res
          .status(404)
          .json({ message: "Property not found or does not belong to you" });
      }
    }

    request.title = title ?? request.title;
    request.description = description ?? request.description;
    request.propertyId = propertyId ?? request.propertyId;
    request.tenantId = tenantId !== undefined ? tenantId || null : request.tenantId;
    request.priority = priority ?? request.priority;
    request.category = category ?? request.category;

    // When status changes to "resolved", record the timestamp
    if (status && status !== request.status) {
      request.status = status;
      if (status === "resolved") {
        request.resolvedAt = new Date();
      } else if (status !== "resolved") {
        request.resolvedAt = null;
      }
    }

    const saved = await request.save();
    const populated = await MaintenanceRequest.findById(saved._id)
      .populate("propertyId", "title location")
      .populate("tenantId", "name email");

    res.json(populated);
  } catch (error) {
    console.error("Update maintenance request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE - Delete a maintenance request
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    await MaintenanceRequest.deleteOne({ _id: req.params.id });
    res.json({ message: "Maintenance request deleted successfully" });
  } catch (error) {
    console.error("Delete maintenance request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
