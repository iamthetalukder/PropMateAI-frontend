const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const propertyRoutes = require("./routes/propertyRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("DB Error:", err.message);
  });

app.get("/", (req, res) => {
  res.send("PropMateAI Backend Running");
});

app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
