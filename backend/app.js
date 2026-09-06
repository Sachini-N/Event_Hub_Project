require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const eventRoutes = require("./route/eventRoutes");
const registrationRoutes = require("./route/registrationRoutes");
const authRoutes = require("./route/authRoutes");
const venueRoutes = require("./route/venueRoutes");
const venueBookingRoutes = require("./route/venueBookingRoutes");
const uploadRoutes = require("./route/uploadRoutes");

const { seedInitialEvents } = require("./controlers/eventController");
const { seedAdminUser } = require("./controlers/authController");
const { seedInitialVenues } = require("./controlers/venueController");
const { seedInitialVenueBookings } = require("./controlers/venueBookingController");

const app = express();

// Enable CORS for cross-origin requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Body Parser Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serverless-friendly cached MongoDB connection helper
let isDbConnected = false;
const connectDB = async () => {
  if (isDbConnected || mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }
  await mongoose.connect(process.env.MONGO_URI);
  isDbConnected = true;
  console.log("Connected to MongoDB successfully!");
  await seedInitialEvents();
  await seedAdminUser();
  await seedInitialVenues();
  await seedInitialVenueBookings();
};

// Ensure database connection before serving any request (essential for Vercel serverless cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection error:", err.message);
    res.status(500).json({ success: false, message: "Database connection failed", error: err.message });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/venue-bookings", venueBookingRoutes);
app.use("/api/upload", uploadRoutes);

// Return JSON 404 for unhandled /api requests (Prevents returning HTML to API callers)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found` });
  }
  next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, "frontend")));
app.use(express.static(path.join(__dirname, "public")));

// Fallback to index.html for non-API single page navigation
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

// Start server locally when not running inside Vercel serverless runtime
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  connectDB().catch((err) => console.log("MongoDB initial connection error:", err.message));
}

module.exports = app;
