// Middleware factory — call with an array of allowed roles to protect a route
// Example: router.get("/admin", authMiddleware, roleMiddleware(["admin"]), handler)
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message:
          "Access denied. Required role: " + allowedRoles.join(" or "),
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
