const mongoose = require("mongoose");

// MaintenanceRequest schema: tracks repair/issue tickets for a property
const maintenanceRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    // Optional — request may be submitted on behalf of a tenant
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    category: {
      type: String,
      enum: ["plumbing", "electrical", "hvac", "appliance", "structural", "other"],
      default: "other",
    },
    // Set automatically when status changes to "resolved"
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
