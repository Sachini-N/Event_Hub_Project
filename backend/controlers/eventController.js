const Event = require("../model/Event");

// Seed initial data if database is empty - Sample events removed per request
const seedInitialEvents = async () => {
  // No sample events seeded
};

// GET /api/events?status=upcoming|past
const getEvents = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const events = await Event.find(filter).sort({ date: status === "past" ? -1 : 1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch events", error: error.message });
  }
};

// GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching event details", error: error.message });
  }
};

// POST /api/events (Create Event)
const createEvent = async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.status(201).json({ success: true, message: "Event created successfully", data: newEvent });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to create event", error: error.message });
  }
};

// PUT /api/events/:id (Update Event)
const updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedEvent) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, message: "Event updated successfully", data: updatedEvent });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to update event", error: error.message });
  }
};

// DELETE /api/events/:id (Delete Event)
const deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete event", error: error.message });
  }
};

module.exports = {
  seedInitialEvents,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
