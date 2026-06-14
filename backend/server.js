const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const leaseRoutes = require("./routes/leaseRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const stripeRoutes = require("./routes/stripe");
const stripeWebhookRoute = require("./routes/stripeWebhook");
const geocodeRoute = require("./routes/geocode");
const smsRoute = require("./routes/sms");
const weatherRoute = require("./routes/weather");
const currencyRoute = require("./routes/currency");
const unsplashRoute = require("./routes/unsplash");
const mailchimpRoute = require("./routes/mailchimp");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://prop-mate-ai-frontend.vercel.app",
      "https://prop-mate-ai-frontend-git-main-friction-lab.vercel.app",
      "https://prop-mate-ai-frontend-5us4jtxkg-friction-lab.vercel.app",
    ],
    credentials: true,
  }),
);

// Webhook must be registered before express.json() to preserve the raw request body for Stripe signature verification
app.use("/api/webhook", stripeWebhookRoute);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("PropMateAI Backend Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/leases", leaseRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/geocode", geocodeRoute);
app.use("/api/sms", smsRoute);
app.use("/api/weather", weatherRoute);
app.use("/api/currency", currencyRoute);
app.use("/api/unsplash", unsplashRoute);
app.use("/api/mailchimp", mailchimpRoute);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("DB Error:", err.message);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
