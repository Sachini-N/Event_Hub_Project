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
    const { name, branch, city, province, address, capacity, rentalPrice, pricePerHour, status, coverImage, amenities, description } = req.body;

    if (!name || !address || !capacity) {
      return res.status(400).json({ success: false, message: "Please provide Venue Name, Address, and Capacity." });
    }

    const numericPrice = pricePerHour ? Number(pricePerHour) : 25000;
    const formattedPrice = rentalPrice || `Rs. ${numericPrice.toLocaleString()} / hr`;

    const venue = new Venue({
      name,
      branch: branch || "TRACE Expert City (Colombo)",
      city: city || "Colombo, Sri Lanka",
      province: province || "Western Province",
      address,
      capacity: Number(capacity),
      rentalPrice: formattedPrice,
      pricePerHour: numericPrice,
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

// PUT /api/venues/:id (Update existing venue)
const updateVenue = async (req, res) => {
  try {
    const { name, branch, city, province, address, capacity, rentalPrice, pricePerHour, status, coverImage, amenities, description } = req.body;

    const numericPrice = pricePerHour !== undefined ? Number(pricePerHour) : undefined;
    const formattedPrice = rentalPrice || (numericPrice !== undefined ? `Rs. ${numericPrice.toLocaleString()} / hr` : undefined);

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (branch !== undefined) updateFields.branch = branch;
    if (city !== undefined) updateFields.city = city;
    if (province !== undefined) updateFields.province = province;
    if (address !== undefined) updateFields.address = address;
    if (capacity !== undefined) updateFields.capacity = Number(capacity);
    if (numericPrice !== undefined) updateFields.pricePerHour = numericPrice;
    if (formattedPrice !== undefined) updateFields.rentalPrice = formattedPrice;
    if (status !== undefined) updateFields.status = status;
    if (coverImage !== undefined) updateFields.coverImage = coverImage;
    if (amenities !== undefined) {
      updateFields.amenities = Array.isArray(amenities)
        ? amenities
        : amenities.split(",").map(a => a.trim()).filter(Boolean);
    }
    if (description !== undefined) updateFields.description = description;

    const venue = await Venue.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    if (!venue) {
      return res.status(404).json({ success: false, message: "Venue not found" });
    }
    res.json({ success: true, message: "Venue updated successfully!", data: venue });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update venue", error: error.message });
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

// Seed initial venues across all TRACE branches if database is empty or requires re-population
const seedInitialVenues = async () => {
  try {
    const count = await Venue.countDocuments();
    if (count === 0) {
      const sampleVenues = [
        // TRACE Expert City (Colombo)
        {
          name: "TRACE Main Grand Auditorium",
          branch: "TRACE Expert City (Colombo)",
          city: "Colombo 10, Sri Lanka",
          address: "Bay 5, TRACE Expert City, Maradana Rd, Colombo",
          capacity: 350,
          rentalPrice: "Rs. 45,000 / hr",
          pricePerHour: 45000,
          status: "Available",
          coverImage: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
          amenities: ["4K Cinema Projector", "Gigabit Fiber WiFi", "Stage Sound & Lighting", "Air Conditioned", "VIP Lounge Access"],
          description: "Premier enterprise auditorium equipped for tech summit keynotes, hackathons, and product launch events.",
        },
        {
          name: "Innovation Center Tech Lab",
          branch: "TRACE Expert City (Colombo)",
          city: "Colombo 10, Sri Lanka",
          address: "Building B, Floor 2, TRACE Expert City, Colombo",
          capacity: 120,
          rentalPrice: "Rs. 25,000 / hr",
          pricePerHour: 25000,
          status: "Available",
          coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
          amenities: ["Interactive Smart Boards", "Power Desk Hubs", "Dual 4K Displays", "Catering Station"],
          description: "Hands-on tech laboratory and workshop facility designed for developer bootcamps and team hackathons.",
        },
        {
          name: "TRACE Bay 2 Executive Suite",
          branch: "TRACE Expert City (Colombo)",
          city: "Colombo 10, Sri Lanka",
          address: "Bay 2, TRACE Expert City, Maradana Rd, Colombo",
          capacity: 65,
          rentalPrice: "Rs. 18,000 / hr",
          pricePerHour: 18000,
          status: "Reserved",
          coverImage: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80",
          amenities: ["4K Video Conference Cam", "Acoustic Soundproofing", "Executive Seating", "Coffee Bar"],
          description: "Collaborative executive suite for ecosystem partner roundtables and startup investor pitch sessions.",
        },

        // TRACE Innovation Hub (Kandy)
        {
          name: "Kandy Tech Pavilion & Amphitheater",
          branch: "TRACE Innovation Hub (Kandy)",
          city: "Kandy, Sri Lanka",
          address: "Peradeniya Tech Corridor, Kandy",
          capacity: 220,
          rentalPrice: "Rs. 30,000 / hr",
          pricePerHour: 30000,
          status: "Available",
          coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
          amenities: ["High-Lumen Projector", "Outdoor Terrace Access", "Centralized Audio", "High-Speed WiFi"],
          description: "Scenic tech event hall situated in the central hill district, ideal for regional tech conferences and university tech summits.",
        },
        {
          name: "Central Hill Maker & AI Lab",
          branch: "TRACE Innovation Hub (Kandy)",
          city: "Kandy, Sri Lanka",
          address: "Building 1, TRACE Hub, Peradeniya Rd, Kandy",
          capacity: 85,
          rentalPrice: "Rs. 15,000 / hr",
          pricePerHour: 15000,
          status: "Available",
          coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
          amenities: ["Hardware Workbenches", "IoT Testing Kit", "High-Speed Internet", "Ergonomic Chairs"],
          description: "Specialized Maker Lab for artificial intelligence, robotics, and hardware prototype building workshops.",
        },

        // TRACE Tech Park (Jaffna)
        {
          name: "Northern Innovation Deck",
          branch: "TRACE Tech Park (Jaffna)",
          city: "Jaffna, Sri Lanka",
          address: "Palaly Innovation Rd, Jaffna",
          capacity: 180,
          rentalPrice: "Rs. 22,000 / hr",
          pricePerHour: 22000,
          status: "Available",
          coverImage: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
          amenities: ["Dual Projection Screen", "Wireless Microphones", "Podium Stage", "AC Hall"],
          description: "Spacious event deck catering to northern tech initiatives, startup showcases, and developer meetups.",
        },
        {
          name: "Jaffna Cyber & Coding Hub",
          branch: "TRACE Tech Park (Jaffna)",
          city: "Jaffna, Sri Lanka",
          address: "Block C, TRACE Tech Park, Jaffna",
          capacity: 90,
          rentalPrice: "Rs. 12,000 / hr",
          pricePerHour: 12000,
          status: "Reserved",
          coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
          amenities: ["High-Speed Fiber Cable", "Presentation Display", "Whiteboard Walls", "Breakout Lounge"],
          description: "Modern coding space built for intense coding competitions, bootcamps, and developer community sessions.",
        },

        // TRACE Hub (Galle)
        {
          name: "Southern Ocean-View Conference Hall",
          branch: "TRACE Hub (Galle)",
          city: "Galle, Sri Lanka",
          address: "Fort Promenade, Marine Drive, Galle",
          capacity: 150,
          rentalPrice: "Rs. 35,000 / hr",
          pricePerHour: 35000,
          status: "Available",
          coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
          amenities: ["Sea View Terrace", "Full HD Projector", "Wireless Sound System", "Catering & Coffee Bar"],
          description: "Coastal event space overlooking the historic Galle coastline, ideal for corporate retreats and technology summits.",
        },

        // TRACE Tech Bay (Kurunegala)
        {
          name: "Wayamba Enterprise & Incubator Center",
          branch: "TRACE Tech Bay (Kurunegala)",
          city: "Kurunegala, Sri Lanka",
          address: "Lake Round Road, Kurunegala",
          capacity: 110,
          rentalPrice: "Rs. 16,000 / hr",
          pricePerHour: 16000,
          status: "Available",
          coverImage: "https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=800&q=80",
          amenities: ["High-Speed WiFi", "Modular Seating", "AV Presentation Setup", "Air Conditioned"],
          description: "Entrepreneurship and startup incubator hall empowering regional innovators and technology startups in Wayamba province.",
        },
      ];
      await Venue.insertMany(sampleVenues);
      console.log("Sample multi-branch venues seeded successfully!");
    }
  } catch (err) {
    console.error("Error seeding venues:", err);
  }
};

module.exports = {
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  seedInitialVenues,
};
