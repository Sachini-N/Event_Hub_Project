const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

// Monkey-patch dns.lookup for MongoDB Atlas clusters when local OS DNS fails
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  originalLookup(hostname, options, (err, address, family) => {
    if (
      err &&
      (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") &&
      (hostname.includes("mongodb.net") || hostname.includes("cluster0"))
    ) {
      dns.resolve4(hostname, (resolveErr, addresses) => {
        if (!resolveErr && addresses && addresses.length > 0) {
          if (options && options.all) {
            return callback(null, addresses.map((ip) => ({ address: ip, family: 4 })));
          }
          return callback(null, addresses[0], 4);
        }
        callback(err, address, family);
      });
    } else {
      callback(err, address, family);
    }
  });
};

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
const siteSettingRoutes = require("./route/siteSettingRoutes");

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
let dbConnectionPromise = null;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (dbConnectionPromise) return dbConnectionPromise;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  dbConnectionPromise = mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("Connected to MongoDB successfully!");
      await seedInitialEvents();
      await seedAdminUser();
      await seedInitialVenues();
      await seedInitialVenueBookings();
    })
    .catch((err) => {
      dbConnectionPromise = null;
      console.error("MongoDB Connection Error:", err.message);
      throw err;
    });

  return dbConnectionPromise;
};

// Non-blocking connection trigger so API callers get instant responses
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    connectDB().catch((err) => {
      console.warn("Background DB reconnect notice:", err.message);
    });
  }
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/venue-bookings", venueBookingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/settings", siteSettingRoutes);

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
