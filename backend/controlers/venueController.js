const Venue = require("../model/Venue");

// GET /api/venues (Fetch all venues)
const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });
    res.json({ success: true, count: venues.length, data: venues });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch venues", error: error.message });
  }
};

// POST /api/venues (Create new venue)
const createVenue = async (req, res) => {
  try {
    const { name, city, address, capacity, status, coverImage, amenities, description } = req.body;

    if (!name || !address || !capacity) {
      return res.status(400).json({ success: false, message: "Please provide Venue Name, Address, and Capacity." });
    }

    const venue = new Venue({
      name,
      city: city || "Colombo, Sri Lanka",
      address,
      capacity: Number(capacity),
      status: status || "Available",
      coverImage: coverImage || "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
      amenities: Array.isArray(amenities) ? amenities : (amenities ? amenities.split(",").map(a => a.trim()) : ["High-Speed WiFi", "Air Conditioned"]),
      description: description || "",
    });

    await venue.save();
    res.status(201).json({ success: true, message: "Venue added successfully!", data: venue });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create venue", error: error.message });
  }
};

// DELETE /api/venues/:id (Delete venue)
const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) {
      return res.status(404).json({ success: false, message: "Venue not found" });
    }
    res.json({ success: true, message: "Venue deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete venue", error: error.message });
  }
};

// Seed initial venues if database is empty
const seedInitialVenues = async () => {
  try {
    const count = await Venue.countDocuments();
    if (count === 0) {
      const sampleVenues = [
        {
          name: "TRACE Main Auditorium",
          city: "Colombo 10, Sri Lanka",
          address: "Bay 5, TRACE Expert City, Maradana Rd",
          capacity: 250,
          status: "Available",
          coverImage: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
          amenities: ["4K Projectors", "High-Speed WiFi", "Live Streaming AV", "Air Conditioned", "Stage Lighting"],
          description: "State-of-the-art enterprise auditorium for tech conferences, keynotes, and product launches.",
        },
        {
          name: "Innovation Center Tech Lab",
          city: "Colombo 10, Sri Lanka",
          address: "Building B, TRACE Expert City",
          capacity: 120,
          status: "Available",
          coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
          amenities: ["Interactive Whiteboards", "Power Outlets at Desk", "Dual Monitors", "Catering Station"],
          description: "Hands-on tech workshop space equipped with modern developer workstations.",
        },
        {
          name: "TRACE Hub Meeting Hall 4",
          city: "Colombo 10, Sri Lanka",
          address: "Bay 2, TRACE Expert City",
          capacity: 60,
          status: "Reserved",
          coverImage: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80",
          amenities: ["Conference Cam", "Surround Audio", "Whiteboard Wall"],
          description: "Collaborative executive meeting hall for ecosystem partner meetups.",
        },
      ];
      await Venue.insertMany(sampleVenues);
      console.log("Sample venues seeded successfully!");
    }
  } catch (err) {
    console.error("Error seeding venues:", err);
  }
};

module.exports = {
  getVenues,
  createVenue,
  deleteVenue,
  seedInitialVenues,
};
