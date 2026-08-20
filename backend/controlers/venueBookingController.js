const VenueBooking = require("../model/VenueBooking");

// GET /api/venue-bookings (Fetch all venue booking inquiries)
const getAllVenueBookings = async (req, res) => {
  try {
    const bookings = await VenueBooking.find().sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch venue bookings", error: error.message });
  }
};

// GET /api/venue-bookings/user/:email (Fetch bookings by user email)
const getUserVenueBookings = async (req, res) => {
  try {
    const email = req.params.email;
    const bookings = await VenueBooking.find({
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") }
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user venue bookings", error: error.message });
  }
};

// POST /api/venue-bookings (Create new venue booking inquiry)
const createVenueBooking = async (req, res) => {
  try {
    const { venueId, venueName, branch, name, email, phone, eventTitle, eventDate, durationHours, guests, notes, price } = req.body;

    if (!venueName || !name || !email || !phone || !eventTitle || !eventDate) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields (Name, Email, Phone, Event Title, Date)."
      });
    }

    const bookingRef = "VBOOK-" + Math.floor(100000 + Math.random() * 900000);

    const booking = new VenueBooking({
      bookingRef,
      venueId: venueId || "",
      venueName,
      branch: branch || "TRACE Expert City (Colombo)",
      name,
      email: email.trim().toLowerCase(),
      phone,
      eventTitle,
      eventDate,
      durationHours: Number(durationHours) || 4,
      guests: Number(guests) || 50,
      notes: notes || "",
      price: price || "Rs. 25,000 / hr",
      status: "Pending",
    });

    await booking.save();
    res.status(201).json({ success: true, message: "Venue booking inquiry submitted successfully!", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create venue booking", error: error.message });
  }
};

// PUT /api/venue-bookings/:id (Update status/notes)
const updateVenueBookingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const booking = await VenueBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking inquiry not found" });
    }

    if (status) booking.status = status;
    if (notes !== undefined) booking.notes = notes;

    await booking.save();
    res.json({ success: true, message: "Booking status updated successfully!", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update booking status", error: error.message });
  }
};

// DELETE /api/venue-bookings/:id (Delete booking)
const deleteVenueBooking = async (req, res) => {
  try {
    const booking = await VenueBooking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking inquiry not found" });
    }
    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete booking", error: error.message });
  }
};

// Seed initial sample venue bookings if database is empty
const seedInitialVenueBookings = async () => {
  try {
    const count = await VenueBooking.countDocuments();
    if (count === 0) {
      const sampleBookings = [
        {
          bookingRef: "VBOOK-882193",
          venueName: "TRACE Main Grand Auditorium",
          branch: "TRACE Expert City (Colombo)",
          name: "Kasun Perera",
          email: "kasun@techstartup.lk",
          phone: "+94 77 123 4567",
          eventTitle: "Annual National AI Summit 2026",
          eventDate: "2026-09-15",
          durationHours: 6,
          guests: 250,
          notes: "Need 4K live streaming setup, stage lighting, and 2 podium microphones.",
          price: "Rs. 45,000 / hr",
          status: "Pending",
        },
        {
          bookingRef: "VBOOK-304192",
          venueName: "Kandy Tech Pavilion & Amphitheater",
          branch: "TRACE Innovation Hub (Kandy)",
          name: "Nimmi Fernando",
          email: "nimmi@kandytech.org",
          phone: "+94 71 987 6543",
          eventTitle: "Central Hills Developer Meetup",
          eventDate: "2026-10-02",
          durationHours: 4,
          guests: 120,
          notes: "Outdoor coffee break arrangement requested.",
          price: "Rs. 30,000 / hr",
          status: "Confirmed",
        },
      ];
      await VenueBooking.insertMany(sampleBookings);
      console.log("Sample venue bookings seeded successfully!");
    }
  } catch (err) {
    console.error("Error seeding venue bookings:", err);
  }
};

module.exports = {
  getAllVenueBookings,
  getUserVenueBookings,
  createVenueBooking,
  updateVenueBookingStatus,
  deleteVenueBooking,
  seedInitialVenueBookings,
};
