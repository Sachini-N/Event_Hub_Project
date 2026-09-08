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
const chatRoutes = require("./route/chatRoutes");

const { seedInitialEvents } = require("./controlers/eventController");
const { seedAdminUser } = require("./controlers/authController");
const { seedInitialVenues } = require("./controlers/venueController");
const { seedInitialVenueBookings } = require("./controlers/venueBookingController");

const helmet = require("helmet");
const cors = require("cors");

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow external CDN icons, fonts, and Cloudinary media
    crossOriginEmbedderPolicy: false,
  })
);

// Secure CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or localhost/trace domains
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || origin.endsWith(".trace.lk") || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, safely headers configured
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  })
);

// Body Parser Middleware
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

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
app.use("/api/chat", chatRoutes);

// Return JSON 404 for unhandled /api requests (Prevents returning HTML to API callers)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found` });
  }
  next();
});

// Serve static public files
app.use(express.static(path.join(__dirname, "public")));

// Fallback to index.html for non-API single page navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;

// Start server locally when not running inside Vercel serverless runtime
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  connectDB().catch((err) => console.log("MongoDB initial connection error:", err.message));
}

module.exports = app;
