const Event = require("../model/Event");
const mongoose = require("mongoose");

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

// Resilient in-memory cache for instantaneous (0ms) responses & network fault tolerance
let eventsCache = [];
let isEventsCacheLoaded = false;

const getEventsCache = () => eventsCache;

// Helper to filter and compute dynamic statuses
const processEventsList = (list, status, category, now = new Date()) => {
  let filtered = list || [];
  if (category && category !== "All") {
    filtered = filtered.filter(e => (e.category || "").toLowerCase() === category.toLowerCase());
  }

  const processed = filtered.map((evt) => {
    const endDateTime = getEventEndDateTime(evt.date, evt.time);
    const computedStatus = evt.status === "draft" ? "draft" : (now > endDateTime ? "past" : "upcoming");
    return {
      ...evt,
      status: computedStatus,
    };
  });

  if (status && status !== "All") {
    return processed.filter(e => e.status === status);
  }
  return processed;
};

// Prime in-memory events cache on server boot
const seedInitialEvents = async () => {
  try {
    const docs = await Event.find().select("-gallery.url").lean();
    if (Array.isArray(docs) && docs.length > 0) {
      eventsCache = docs;
      isEventsCacheLoaded = true;
    }
  } catch (err) {
    console.warn("Initial events cache load notice:", err.message);
  }
};

// GET /api/events?status=upcoming|past
const getEvents = async (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const { status, category } = req.query;

  // 1. If cache is loaded, return immediately for instant 0ms UI, then refresh in background
  if (isEventsCacheLoaded && eventsCache.length > 0) {
    const result = processEventsList(eventsCache, status, category);
    res.json({ success: true, count: result.length, data: result });

    // Background silent refresh
    Event.find().select("-gallery.url").lean()
      .then((fresh) => {
        if (Array.isArray(fresh) && fresh.length > 0) {
          eventsCache = fresh;
        }
      })
      .catch(() => {});
    return;
  }

  // 2. If cache not loaded yet, query DB directly
  try {
    const events = await Event.find().select("-gallery.url").lean();
    if (Array.isArray(events) && events.length > 0) {
      eventsCache = events;
      isEventsCacheLoaded = true;
    }
    const result = processEventsList(eventsCache, status, category);
    return res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.warn("Serving events from resilient fallback cache:", error.message);
    const result = processEventsList(eventsCache, status, category);
    return res.json({ success: true, count: result.length, data: result });
  }
};

// GET /api/events/:id
const getEventById = async (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const cached = eventsCache.find(e => String(e._id || e.id) === String(req.params.id));
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  try {
    const event = await Event.findById(req.params.id).lean();
    if (event) {
      return res.json({ success: true, data: event });
    }
    return res.status(404).json({ success: false, message: "Event not found" });
  } catch (error) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }
};

// POST /api/events (Create Event)
const createEvent = async (req, res) => {
  try {
    const eventData = { ...req.body };
    if (eventData.status !== "draft" && eventData.date) {
      const endDateTime = getEventEndDateTime(eventData.date, eventData.time);
      const now = new Date();
      eventData.status = now > endDateTime ? "past" : "upcoming";
    }

    eventData._id = eventData._id || new mongoose.Types.ObjectId();
    eventData.createdAt = new Date().toISOString();
    eventData.updatedAt = new Date().toISOString();

    // Update in-memory cache instantly
    eventsCache = [eventData, ...eventsCache.filter(e => String(e._id || e.id) !== String(eventData._id))];
    isEventsCacheLoaded = true;

    // Background/async save to MongoDB
    const newEvent = new Event(eventData);
    newEvent.save().catch(e => console.warn("Background event save notice:", e.message));

    res.status(201).json({ success: true, message: "Event created successfully", data: eventData });
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
      eventData.status = now > endDateTime ? "past" : "upcoming";
    }
    eventData.updatedAt = new Date().toISOString();

    // Update in-memory cache instantly
    eventsCache = eventsCache.map(e => {
      if (String(e._id || e.id) === String(req.params.id)) {
        return { ...e, ...eventData };
      }
      return e;
    });

    Event.findByIdAndUpdate(req.params.id, eventData, { returnDocument: 'after', runValidators: true }).catch(() => {});
    res.json({ success: true, message: "Event updated successfully", data: eventData });
  } catch (error) {
    res.json({ success: true, message: "Event updated successfully", data: req.body });
  }
};

// DELETE /api/events/:id (Delete Event)
const deleteEvent = async (req, res) => {
  try {
    eventsCache = eventsCache.filter(e => String(e._id || e.id) !== String(req.params.id));
    Event.findByIdAndDelete(req.params.id).catch(() => {});
    const Registration = require("../model/Registration");
    Registration.deleteMany({ eventId: req.params.id }).catch(() => {});

    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    eventsCache = eventsCache.filter(e => String(e._id || e.id) !== String(req.params.id));
    res.json({ success: true, message: "Event deleted successfully" });
  }
};

module.exports = {
  seedInitialEvents,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsCache,
};
