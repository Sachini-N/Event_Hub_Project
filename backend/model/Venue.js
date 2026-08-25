const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      default: "TRACE Expert City (Colombo)",
      trim: true,
    },
    province: {
      type: String,
      default: "Western Province",
      trim: true,
    },
    city: {
      type: String,
      default: "Colombo, Sri Lanka",
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 100,
    },
    rentalPrice: {
      type: String,
      default: "Rs. 25,000 / hr",
      trim: true,
    },
    pricePerHour: {
      type: Number,
      default: 25000,
    },
    status: {
      type: String,
      enum: ["Available", "Reserved", "Under Maintenance"],
      default: "Available",
    },
    coverImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: ["High-Speed WiFi", "Air Conditioned", "4K AV Display"],
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// High Performance Query Indexes
venueSchema.index({ branch: 1, province: 1 });
venueSchema.index({ status: 1 });

module.exports = mongoose.model("Venue", venueSchema);
