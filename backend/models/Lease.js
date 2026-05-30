const mongoose = require("mongoose");

// Lease schema: a formal lease document linking a tenant to a property with date range and rent
const leaseSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rentAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
    },
    // terminated = manually ended before expiry
    status: {
      type: String,
      enum: ["active", "upcoming", "expired", "terminated"],
      default: "upcoming",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Lease", leaseSchema);
