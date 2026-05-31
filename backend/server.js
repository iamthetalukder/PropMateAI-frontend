const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");

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

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("PropMateAI Backend Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);

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
