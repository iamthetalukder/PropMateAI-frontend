const mongoose = require("mongoose");

// Tenant schema: stores tenant details and links to a property and the owner (user)
const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    rentAmount: {
      type: Number,
      required: true,
    },
    leaseStart: {
      type: Date,
      required: true,
    },
    leaseEnd: {
      type: Date,
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Tenant", tenantSchema);
