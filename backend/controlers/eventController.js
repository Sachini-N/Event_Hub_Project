const Event = require("../model/Event");

// Helper function to calculate exact end date and time of an event
const getEventEndDateTime = (dateVal, timeStr) => {
  if (!dateVal) return new Date();

  let year, month, day;

  if (typeof dateVal === "string") {
    const cleanDateStr = dateVal.includes("T") ? dateVal.split("T")[0] : dateVal;
    const parts = cleanDateStr.split("-");
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
  }

  if (year === undefined || isNaN(year)) {
    const d = new Date(dateVal);
    year = d.getFullYear();
    month = d.getMonth();
    day = d.getDate();
  }

  let hours = 23;
  let minutes = 59;
  let seconds = 59;

  if (timeStr && typeof timeStr === "string" && timeStr.trim().length > 0) {
    let targetTime = timeStr.trim();
    const hasRange = targetTime.includes("-") || targetTime.toLowerCase().includes(" to ");

    if (targetTime.includes("-")) {
      const splitTime = targetTime.split("-");
      targetTime = splitTime[1].trim();
    } else if (targetTime.toLowerCase().includes(" to ")) {
      const splitTime = targetTime.toLowerCase().split(" to ");
      targetTime = splitTime[1].trim();
    }

    const timeMatch = targetTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      let m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;

      if (!hasRange) {
        h += 2;
      }

      hours = h;
      minutes = m;
      seconds = 0;
    }
  }

  return new Date(year, month, day, hours, minutes, seconds);
};

// Seed initial data if database is empty - Sample events removed per request
const seedInitialEvents = async () => {
  // No sample events seeded
};

// GET /api/events?status=upcoming|past
const getEvents = async (req, res) => {
  try {
    const now = new Date();
    const Registration = require("../model/Registration");

    // Auto-update any non-draft events whose set date & time have passed to 'past' in MongoDB
    const nonDraftEvents = await Event.find({ status: { $ne: "draft" } });
    for (const evt of nonDraftEvents) {
      const endDateTime = getEventEndDateTime(evt.date, evt.time);
      if (now > endDateTime && evt.status !== "past") {
        evt.status = "past";
        await evt.save();
      } else if (now <= endDateTime && evt.status === "past") {
        evt.status = "upcoming";
        await evt.save();
      }
    }

    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const events = await Event.find(filter).sort({ date: status === "past" ? -1 : 1 });

    // Sync real registration counts from Registration collection
    const eventsWithRealCounts = await Promise.all(
      events.map(async (evt) => {
        const actualRegCount = await Registration.countDocuments({
          $or: [{ eventId: evt._id }, { eventTitle: evt.title }],
        });
        if (evt.registeredCount !== actualRegCount) {
          evt.registeredCount = actualRegCount;
          await evt.save();
        }
        return evt;
      })
    );

    res.json({ success: true, count: eventsWithRealCounts.length, data: eventsWithRealCounts });
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
    const eventData = { ...req.body };
    if (eventData.status !== "draft" && eventData.date) {
      const endDateTime = getEventEndDateTime(eventData.date, eventData.time);
      const now = new Date();
      if (now > endDateTime) {
        eventData.status = "past";
      } else {
        eventData.status = "upcoming";
      }
    }

    const newEvent = new Event(eventData);
    await newEvent.save();
    res.status(201).json({ success: true, message: "Event created successfully", data: newEvent });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to create event", error: error.message });
  }
};

// PUT /api/events/:id (Update Event)
const updateEvent = async (req, res) => {
  try {
    const eventData = { ...req.body };
    if (eventData.status !== "draft" && eventData.date) {
      const endDateTime = getEventEndDateTime(eventData.date, eventData.time);
      const now = new Date();
      if (now > endDateTime) {
        eventData.status = "past";
      } else {
        eventData.status = "upcoming";
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, eventData, { new: true, runValidators: true });
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
    // Delete associated registrations for this deleted event
    const Registration = require("../model/Registration");
    await Registration.deleteMany({ eventId: req.params.id });

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
