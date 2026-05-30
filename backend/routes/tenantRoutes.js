const express = require("express");
const Tenant = require("../models/Tenant");
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST - Create a new tenant (linked to the logged-in user)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, rentAmount, leaseStart, leaseEnd, propertyId } =
      req.body;

    if (!name || !email || !rentAmount || !leaseStart || !leaseEnd) {
      return res.status(400).json({
        message: "Please fill name, email, rent amount, lease start, and lease end",
      });
    }

    // If a propertyId is provided, verify it belongs to the same user
    if (propertyId) {
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

    const tenant = await Tenant.create({
      name,
      email,
      phone: phone || "",
      rentAmount: Number(rentAmount),
      leaseStart: new Date(leaseStart),
      leaseEnd: new Date(leaseEnd),
      propertyId: propertyId || null,
      owner: req.user.id,
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error("Create tenant error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - All tenants for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tenants = await Tenant.find({ owner: req.user.id })
      .populate("propertyId", "title location")
      .sort({ createdAt: -1 });
    res.json(tenants);
  } catch (error) {
    console.error("Fetch tenants error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - All tenants for a specific property (used by property detail page)
router.get("/property/:propertyId", authMiddleware, async (req, res) => {
  try {
    const tenants = await Tenant.find({
      propertyId: req.params.propertyId,
      owner: req.user.id,
    }).sort({ createdAt: -1 });
    res.json(tenants);
  } catch (error) {
    console.error("Fetch tenants by property error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - Single tenant by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).populate("propertyId", "title location");

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json(tenant);
  } catch (error) {
    console.error("Fetch tenant error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT - Update a tenant
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, rentAmount, leaseStart, leaseEnd, propertyId } =
      req.body;

    const tenant = await Tenant.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // If a new propertyId is provided, verify it belongs to the same user
    if (propertyId) {
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

    tenant.name = name ?? tenant.name;
    tenant.email = email ?? tenant.email;
    tenant.phone = phone ?? tenant.phone;
    tenant.rentAmount = rentAmount ? Number(rentAmount) : tenant.rentAmount;
    tenant.leaseStart = leaseStart ? new Date(leaseStart) : tenant.leaseStart;
    tenant.leaseEnd = leaseEnd ? new Date(leaseEnd) : tenant.leaseEnd;
    tenant.propertyId = propertyId !== undefined ? propertyId || null : tenant.propertyId;

    const updatedTenant = await tenant.save();
    res.json(updatedTenant);
  } catch (error) {
    console.error("Update tenant error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE - Delete a tenant
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    await Tenant.deleteOne({ _id: req.params.id });
    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Delete tenant error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
