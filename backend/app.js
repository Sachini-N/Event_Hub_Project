require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const eventRoutes = require("./route/eventRoutes");
const registrationRoutes = require("./route/registrationRoutes");
const authRoutes = require("./route/authRoutes");
const { seedInitialEvents } = require("./controlers/eventController");
const { seedAdminUser } = require("./controlers/authController");
const { seedInitialRegistrations } = require("./controlers/registrationController");

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static frontend files (checking frontend folder first, then public)
app.use(express.static(path.join(__dirname, "frontend")));
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);

// Fallback to index.html for single page navigation
app.use((req, res) => {
  const fs = require("fs");
  const frontendPath = path.join(__dirname, "frontend", "index.html");
  if (fs.existsSync(frontendPath)) {
    res.sendFile(frontendPath);
  } else {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});



const PORT = process.env.PORT || 5000;

mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb+srv://admin:3fg96tRd1iREyBza@cluster0.tkag7mg.mongodb.net/eventhub?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(async () => {
    console.log("Connected to MongoDB successfully!");
    await seedInitialEvents();
    await seedAdminUser();
    await seedInitialRegistrations();
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log("MongoDB connection error:", err));
