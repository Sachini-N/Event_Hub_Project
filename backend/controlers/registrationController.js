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
    });

    await registration.save();

    // Increment event registeredCount
    event.registeredCount += 1;
    await event.save();

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
    // Filter out orphaned registrations where event was deleted from DB
    const validRegistrations = registrations.filter((reg) => reg.eventId && reg.eventId._id);
    res.json({ success: true, count: validRegistrations.length, data: validRegistrations });
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
    const validRegistrations = registrations.filter((reg) => reg.eventId && reg.eventId._id);
    res.json({ success: true, count: validRegistrations.length, data: validRegistrations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch registrations", error: error.message });
  }
};

// Seed initial registrations if database is empty
const seedInitialRegistrations = async () => {
  try {
    const count = await Registration.countDocuments();
    if (count === 0) {
      const sampleEvents = await Event.find({});
      if (sampleEvents.length > 0) {
        const sampleRegs = [
          {
            eventId: sampleEvents[0]._id,
            eventTitle: sampleEvents[0].title,
            eventDate: sampleEvents[0].date,
            eventLocation: sampleEvents[0].location,
            name: "Sarah Jenkins",
            email: "sarah.j@example.com",
            contactNumber: "+94 77 123 4567",
            ticketId: "EVT-SRH921",
            status: "Confirmed",
            createdAt: new Date(),
          },
          {
            eventId: sampleEvents[1] ? sampleEvents[1]._id : sampleEvents[0]._id,
            eventTitle: sampleEvents[1] ? sampleEvents[1].title : sampleEvents[0].title,
            eventDate: sampleEvents[1] ? sampleEvents[1].date : sampleEvents[0].date,
            eventLocation: sampleEvents[1] ? sampleEvents[1].location : sampleEvents[0].location,
            name: "Michael Chen",
            email: "m.chen@designstudio.co",
            contactNumber: "+94 71 987 6543",
            ticketId: "EVT-MCH341",
            status: "Confirmed",
            createdAt: new Date(Date.now() - 3600000 * 4),
          },
          {
            eventId: sampleEvents[2] ? sampleEvents[2]._id : sampleEvents[0]._id,
            eventTitle: sampleEvents[2] ? sampleEvents[2].title : sampleEvents[0].title,
            eventDate: sampleEvents[2] ? sampleEvents[2].date : sampleEvents[0].date,
            eventLocation: sampleEvents[2] ? sampleEvents[2].location : sampleEvents[0].location,
            name: "Emily Rodriguez",
            email: "emily.r@corpnet.org",
            contactNumber: "+94 76 555 4321",
            ticketId: "EVT-EMR812",
            status: "Pending",
            createdAt: new Date(Date.now() - 3600000 * 24),
          },
          {
            eventId: sampleEvents[0]._id,
            eventTitle: sampleEvents[0].title,
            eventDate: sampleEvents[0].date,
            eventLocation: sampleEvents[0].location,
            name: "David Kim",
            email: "dkim88@startup.io",
            contactNumber: "+94 70 444 3322",
            ticketId: "EVT-DVK009",
            status: "Confirmed",
            createdAt: new Date(Date.now() - 3600000 * 48),
          },
        ];
        await Registration.insertMany(sampleRegs);
        console.log("Sample registrations seeded successfully!");
      }
    }
  } catch (err) {
    console.error("Error seeding registrations:", err);
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
  seedInitialRegistrations,
};
