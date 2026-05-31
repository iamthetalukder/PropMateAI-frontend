const express = require("express");
const User = require("../models/User");
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// All admin routes require authentication + admin role
const adminOnly = [authMiddleware, roleMiddleware(["admin"])];

// GET /api/admin/users — list all users (admin only)
router.get("/users", ...adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/users/:id/role — change a user's role (admin only)
router.put("/users/:id/role", ...adminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "manager", "tenant"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be admin, manager, or tenant",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/users/:id — delete a user account (admin only)
router.delete("/users/:id", ...adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/stats — system-wide stats across all users (admin only)
router.get("/stats", ...adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const occupiedProperties = await Property.countDocuments({
      status: "occupied",
    });

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const roleBreakdown = { admin: 0, manager: 0, tenant: 0 };
    usersByRole.forEach((r) => {
      if (r._id in roleBreakdown) roleBreakdown[r._id] = r.count;
    });

    res.json({
      totalUsers,
      totalProperties,
      occupiedProperties,
      vacantProperties: totalProperties - occupiedProperties,
      occupancyRate:
        totalProperties === 0
          ? 0
          : Math.round((occupiedProperties / totalProperties) * 100),
      usersByRole: roleBreakdown,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
