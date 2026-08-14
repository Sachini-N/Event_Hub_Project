const Event = require("../model/Event");

// Seed initial data if database is empty
const seedInitialEvents = async () => {
  try {
    const count = await Event.countDocuments();
    if (count === 0) {
      const sampleEvents = [
        {
          title: "Tech Innovation Summit 2026",
          description: "Join industry leaders as we explore breakthrough AI solutions, modern web architectures, and cloud native scaling strategies. Open to developers, designers, and tech enthusiasts.",
          category: "Technology",
          date: new Date("2026-09-15T10:00:00Z"),
          time: "10:00 AM - 04:00 PM EST",
          location: "Grand Auditorium & Online Stream",
          capacity: 250,
          registeredCount: 42,
          status: "upcoming",
          coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
          highlights: ["Keynote on Autonomous Agents", "Interactive Live Coding", "Networking Lunch"],
          speaker: {
            name: "Dr. Elena Rostova",
            role: "Chief AI Architect",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
          },
        },
        {
          title: "Global UX & Product Design Masterclass",
          description: "A hands-on workshop covering micro-interactions, accessible UI components, and design systems for enterprise web applications.",
          category: "Design",
          date: new Date("2026-09-28T14:00:00Z"),
          time: "02:00 PM - 06:00 PM EST",
          location: "Innovation Hub Hall B",
          capacity: 150,
          registeredCount: 88,
          status: "upcoming",
          coverImage: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
          highlights: ["Figma Design Systems", "User Psychology", "Live Portfolio Reviews"],
          speaker: {
            name: "Marcus Vance",
            role: "Principal Product Designer",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          },
        },
        {
          title: "DevOps & Cloud Architecture Expo 2026",
          description: "Learn Kubernetes orchestration, CI/CD pipeline optimization, and zero-trust security infrastructure from veteran DevOps architects.",
          category: "DevOps",
          date: new Date("2026-10-10T09:00:00Z"),
          time: "09:00 AM - 03:00 PM EST",
          location: "Tech Center Theater",
          capacity: 200,
          registeredCount: 15,
          status: "upcoming",
          coverImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
          highlights: ["Kubernetes Best Practices", "Infrastructure as Code", "Security Audit Checklists"],
          speaker: {
            name: "Sarah Jenkins",
            role: "Cloud Solutions Director",
            avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
          },
        },
        {
          title: "Annual Developers & Innovators Hackathon 2025",
          description: "Our landmark past 48-hour hackathon where over 300 developers built collaborative open-source tools and AI assistants.",
          category: "Hackathon",
          date: new Date("2025-11-20T09:00:00Z"),
          time: "Full Weekend Showcase",
          location: "Metropolitan Convention Center",
          capacity: 300,
          registeredCount: 300,
          status: "past",
          coverImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80",
          highlights: ["32 Projects Built", "$10,000 Prize Pool", "Keynote by Industry Leaders"],
          gallery: [
            {
              url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1000&q=80",
              caption: "Hackathon Opening Ceremony & Keynote Speech",
            },
            {
              url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80",
              caption: "Collaborative Team Coding Sessions in Main Arena",
            },
            {
              url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
              caption: "Final Project Demos & Live Judging Panel",
            },
            {
              url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80",
              caption: "Award Ceremony and Winner Celebrations",
            },
          ],
          speaker: {
            name: "David Chen",
            role: "Community Lead",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
          },
        },
        {
          title: "AI & Future of Automation Forum 2025",
          description: "An extraordinary past gathering examining the societal and technical impacts of Large Language Models and intelligent agents.",
          category: "Artificial Intelligence",
          date: new Date("2025-08-14T11:00:00Z"),
          time: "11:00 AM - 05:00 PM EST",
          location: "City Digital Hall",
          capacity: 220,
          registeredCount: 220,
          status: "past",
          coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
          highlights: ["Panel Debate on Ethical AI", "Agentic Systems Demo", "Q&A Session"],
          gallery: [
            {
              url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80",
              caption: "Main Stage Panel Discussion on Autonomous AI",
            },
            {
              url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80",
              caption: "Keynote Speaker Addressing Audience Questions",
            },
            {
              url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1000&q=80",
              caption: "Networking Reception & Tech Showcase",
            },
          ],
          speaker: {
            name: "Dr. Aris Thorne",
            role: "AI Ethics Researcher",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
          },
        },
      ];
      await Event.insertMany(sampleEvents);
      console.log("Successfully seeded initial sample events into database.");
    }
  } catch (error) {
    console.error("Error seeding initial events:", error);
  }
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
