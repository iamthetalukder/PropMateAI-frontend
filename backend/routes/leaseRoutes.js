const express = require("express");
const Lease = require("../models/Lease");
const Tenant = require("../models/Tenant");
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Helper: compute status string from startDate and endDate
const computeStatus = (startDate, endDate) => {
  const now = new Date();
  if (now < new Date(startDate)) return "upcoming";
  if (now > new Date(endDate)) return "expired";
  return "active";
};

// POST - Create a new lease
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { tenantId, propertyId, startDate, endDate, rentAmount, currency, notes } =
      req.body;

    if (!tenantId || !propertyId || !startDate || !endDate || !rentAmount) {
      return res.status(400).json({
        message:
          "Please fill tenant, property, start date, end date, and rent amount",
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    // Verify tenant and property belong to this user
    const [tenant, property] = await Promise.all([
      Tenant.findOne({ _id: tenantId, owner: req.user.id }),
      Property.findOne({ _id: propertyId, owner: req.user.id }),
    ]);

    if (!tenant)
      return res
        .status(404)
        .json({ message: "Tenant not found or does not belong to you" });
    if (!property)
      return res
        .status(404)
        .json({ message: "Property not found or does not belong to you" });

    const status = computeStatus(startDate, endDate);

    const lease = await Lease.create({
      tenantId,
      propertyId,
      owner: req.user.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rentAmount: Number(rentAmount),
      currency: currency || "USD",
      status,
      notes: notes || "",
    });

    const populated = await Lease.findById(lease._id)
      .populate("tenantId", "name email phone")
      .populate("propertyId", "title location");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Create lease error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - All leases for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const leases = await Lease.find({ owner: req.user.id })
      .populate("tenantId", "name email phone")
      .populate("propertyId", "title location")
      .sort({ createdAt: -1 });

    // Recompute status in real time (except terminated — that is permanent)
    const updated = leases.map((lease) => {
      const obj = lease.toObject();
      if (obj.status !== "terminated") {
        obj.status = computeStatus(obj.startDate, obj.endDate);
      }
      return obj;
    });

    res.json(updated);
  } catch (error) {
    console.error("Fetch leases error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - All leases for a specific property (MUST be before /:id route)
router.get("/property/:propertyId", authMiddleware, async (req, res) => {
  try {
    const leases = await Lease.find({
      propertyId: req.params.propertyId,
      owner: req.user.id,
    })
      .populate("tenantId", "name email phone")
      .sort({ startDate: -1 });

    const updated = leases.map((lease) => {
      const obj = lease.toObject();
      if (obj.status !== "terminated") {
        obj.status = computeStatus(obj.startDate, obj.endDate);
      }
      return obj;
    });

    res.json(updated);
  } catch (error) {
    console.error("Fetch leases by property error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - All leases for a specific tenant (MUST be before /:id route)
router.get("/tenant/:tenantId", authMiddleware, async (req, res) => {
  try {
    const leases = await Lease.find({
      tenantId: req.params.tenantId,
      owner: req.user.id,
    })
      .populate("propertyId", "title location")
      .sort({ startDate: -1 });

    const updated = leases.map((lease) => {
      const obj = lease.toObject();
      if (obj.status !== "terminated") {
        obj.status = computeStatus(obj.startDate, obj.endDate);
      }
      return obj;
    });

    res.json(updated);
  } catch (error) {
    console.error("Fetch leases by tenant error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - Single lease by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const lease = await Lease.findOne({
      _id: req.params.id,
      owner: req.user.id,
    })
      .populate("tenantId", "name email phone")
      .populate("propertyId", "title location");

    if (!lease) return res.status(404).json({ message: "Lease not found" });

    const obj = lease.toObject();
    if (obj.status !== "terminated") {
      obj.status = computeStatus(obj.startDate, obj.endDate);
    }

    res.json(obj);
  } catch (error) {
    console.error("Fetch lease error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT - Update a lease
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { tenantId, propertyId, startDate, endDate, rentAmount, currency, status, notes } =
      req.body;

    const lease = await Lease.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!lease) return res.status(404).json({ message: "Lease not found" });

    // Validate tenant ownership if changing tenantId
    if (tenantId && tenantId !== String(lease.tenantId)) {
      const tenant = await Tenant.findOne({ _id: tenantId, owner: req.user.id });
      if (!tenant)
        return res
          .status(404)
          .json({ message: "Tenant not found or does not belong to you" });
    }

    // Validate property ownership if changing propertyId
    if (propertyId && propertyId !== String(lease.propertyId)) {
      const property = await Property.findOne({
        _id: propertyId,
        owner: req.user.id,
      });
      if (!property)
        return res
          .status(404)
          .json({ message: "Property not found or does not belong to you" });
    }

    lease.tenantId = tenantId ?? lease.tenantId;
    lease.propertyId = propertyId ?? lease.propertyId;
    lease.startDate = startDate ? new Date(startDate) : lease.startDate;
    lease.endDate = endDate ? new Date(endDate) : lease.endDate;
    lease.rentAmount = rentAmount ? Number(rentAmount) : lease.rentAmount;
    lease.currency = currency ?? lease.currency;
    lease.notes = notes !== undefined ? notes : lease.notes;

    // Allow manually setting "terminated"; otherwise recompute
    if (status === "terminated") {
      lease.status = "terminated";
    } else {
      lease.status = computeStatus(lease.startDate, lease.endDate);
    }

    const saved = await lease.save();
    const populated = await Lease.findById(saved._id)
      .populate("tenantId", "name email phone")
      .populate("propertyId", "title location");

    res.json(populated);
  } catch (error) {
    console.error("Update lease error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE - Delete a lease
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const lease = await Lease.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!lease) return res.status(404).json({ message: "Lease not found" });

    await Lease.deleteOne({ _id: req.params.id });
    res.json({ message: "Lease deleted successfully" });
  } catch (error) {
    console.error("Delete lease error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
