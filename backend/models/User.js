const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Role controls what the user can see and do in the app
    // admin: full system access + user management
    // manager: manage their own properties, tenants, leases (default)
    // tenant: read-only access to their own lease and maintenance info
    role: {
      type: String,
      enum: ["admin", "manager", "tenant"],
      default: "manager",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "agency"],
      default: "free",
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "canceled", "past_due"],
      default: "inactive",
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
