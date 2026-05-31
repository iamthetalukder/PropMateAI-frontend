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
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
