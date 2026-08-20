const express = require("express");
const router = express.Router();
const {
  getAllVenueBookings,
  getUserVenueBookings,
  createVenueBooking,
  updateVenueBookingStatus,
  deleteVenueBooking,
} = require("../controlers/venueBookingController");

// GET all venue booking inquiries (Admin)
router.get("/", getAllVenueBookings);

// GET venue bookings for user by email
router.get("/user/:email", getUserVenueBookings);

// POST new venue booking inquiry
router.post("/", createVenueBooking);

// PUT update venue booking status (Admin)
router.put("/:id", updateVenueBookingStatus);

// DELETE venue booking inquiry (Admin)
router.delete("/:id", deleteVenueBooking);

module.exports = router;
