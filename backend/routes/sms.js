const express = require("express");
const Tenant = require("../models/Tenant");
const Lease = require("../models/Lease");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { sendSMS } = require("../utils/smsService");

const router = express.Router();

// POST /api/sms/rent-reminder — sends rent due reminder to a tenant
router.post("/rent-reminder", authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.body;

    const tenant = await Tenant.findOne({ _id: tenantId, owner: req.user.id }).populate(
      "propertyId",
      "title location",
    );

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    if (!tenant.phone) {
      return res.status(400).json({ message: "Tenant has no phone number" });
    }

    const address = tenant.propertyId ? tenant.propertyId.location : "your property";
    const message =
      "Hi " +
      tenant.name +
      ", your rent of $" +
      Number(tenant.rentAmount).toLocaleString() +
      " is due in 3 days for " +
      address +
      ". — PropMate AI";

    const result = await sendSMS(tenant.phone, message);
    res.json(result);
  } catch (error) {
    console.error("SMS rent-reminder error:", error.message);
    res.status(500).json({ message: "Failed to send SMS" });
  }
});

// POST /api/sms/maintenance-update — notifies tenant about maintenance status change
router.post("/maintenance-update", authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await MaintenanceRequest.findOne({
      _id: requestId,
      owner: req.user.id,
    }).populate("tenantId", "name phone");

    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }
    if (!request.tenantId || !request.tenantId.phone) {
      return res.status(400).json({ message: "Tenant has no phone number" });
    }

    const message =
      "Hi " +
      request.tenantId.name +
      ", your maintenance request '" +
      request.title +
      "' status updated to: " +
      request.status +
      ". — PropMate AI";

    const result = await sendSMS(request.tenantId.phone, message);
    res.json(result);
  } catch (error) {
    console.error("SMS maintenance-update error:", error.message);
    res.status(500).json({ message: "Failed to send SMS" });
  }
});

// POST /api/sms/lease-expiry — sends lease expiry reminder
// Accepts { leaseId } or { tenantId } — tenantId uses most recent lease
router.post("/lease-expiry", authMiddleware, async (req, res) => {
  try {
    const { leaseId, tenantId } = req.body;

    let tenantName, tenantPhone, propertyAddress, expiryDate;

    if (leaseId) {
      const lease = await Lease.findOne({ _id: leaseId, owner: req.user.id })
        .populate("tenantId", "name phone")
        .populate("propertyId", "title location");

      if (!lease) return res.status(404).json({ message: "Lease not found" });
      if (!lease.tenantId?.phone) {
        return res.status(400).json({ message: "Tenant has no phone number" });
      }
      tenantName = lease.tenantId.name;
      tenantPhone = lease.tenantId.phone;
      propertyAddress = lease.propertyId ? lease.propertyId.location : "your property";
      expiryDate = new Date(lease.endDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (tenantId) {
      const tenant = await Tenant.findOne({ _id: tenantId, owner: req.user.id }).populate(
        "propertyId",
        "title location",
      );

      if (!tenant) return res.status(404).json({ message: "Tenant not found" });
      if (!tenant.phone) {
        return res.status(400).json({ message: "Tenant has no phone number" });
      }
      tenantName = tenant.name;
      tenantPhone = tenant.phone;
      propertyAddress = tenant.propertyId ? tenant.propertyId.location : "your property";
      expiryDate = new Date(tenant.leaseEnd).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      return res.status(400).json({ message: "leaseId or tenantId is required" });
    }

    const message =
      "Hi " +
      tenantName +
      ", your lease at " +
      propertyAddress +
      " expires on " +
      expiryDate +
      ". Contact your landlord to discuss renewal. — PropMate AI";

    const result = await sendSMS(tenantPhone, message);
    res.json(result);
  } catch (error) {
    console.error("SMS lease-expiry error:", error.message);
    res.status(500).json({ message: "Failed to send SMS" });
  }
});

// POST /api/sms/custom — sends a custom SMS to any number
router.post("/custom", authMiddleware, async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ message: "phone and message are required" });
    }

    const result = await sendSMS(phone, message);
    res.json(result);
  } catch (error) {
    console.error("SMS custom error:", error.message);
    res.status(500).json({ message: "Failed to send SMS" });
  }
});

module.exports = router;
