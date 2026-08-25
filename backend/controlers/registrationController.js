const Registration = require("../model/Registration");
const Event = require("../model/Event");

// Generate unique ticket ID
const generateTicketId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "EVT-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// POST /api/registrations
const registerForEvent = async (req, res) => {
  try {
    const { eventId, name, email, contactNumber, notes } = req.body;

    if (!eventId || !name || !email || !contactNumber) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields (name, email, contact number)." });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (event.status === "past") {
      return res.status(400).json({ success: false, message: "Cannot register for past events." });
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, message: "Sorry, this event is fully booked!" });
    }

    // Check if user is already registered for this event
    const existingRegistration = await Registration.findOne({ eventId, email: email.toLowerCase() });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event with this email address.",
        data: existingRegistration,
      });
    }

    const ticketId = generateTicketId();

    const registration = new Registration({
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      name,
      email: email.toLowerCase(),
      contactNumber,
      notes: notes || "",
      ticketId,
      status: "Confirmed",
    });

    await registration.save();

    await registration.save();

    // Atomic increment of event registeredCount for high concurrency safety
    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: {
        registration,
        event: {
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
          description: event.description,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

// GET /api/registrations/user/:email
const getUserRegistrations = async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const registrations = await Registration.find({ email }).populate("eventId").sort({ createdAt: -1 });
    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user registrations", error: error.message });
  }
};

// GET /api/registrations/event/:eventId
const getEventRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ eventId: req.params.eventId }).sort({ createdAt: -1 });
    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch event registrations", error: error.message });
  }
};

// GET /api/registrations (All registrations for Admin Dashboard)
const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find().populate("eventId").sort({ createdAt: -1 });
    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch registrations", error: error.message });
  }
};



// PUT /api/registrations/:id (Update status / notes)
const updateRegistration = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    if (status) registration.status = status;
    if (notes !== undefined) registration.notes = notes;

    await registration.save();

    res.json({ success: true, message: "Registration updated successfully", data: registration });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update registration", error: error.message });
  }
};

module.exports = {
  registerForEvent,
  getUserRegistrations,
  getEventRegistrations,
  getAllRegistrations,
  updateRegistration,
};
