const User = require("../model/User");
const { signToken } = require("../middleware/authMiddleware");

// POST /api/auth/signup
const signupUser = async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide Name, Email, and Password." });
    }

    const emailClean = email.toLowerCase().trim();

    // Check if email already registered
    const existingUser = await User.findOne({ email: emailClean });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "An account with this email address already exists. Please log in." });
    }

    const isAdminEmail = emailClean.includes('admin') || req.body.role === 'admin';

    const user = new User({
      name,
      email: emailClean,
      password,
      contactNumber: contactNumber || "",
      role: isAdminEmail ? "admin" : "user",
    });

    await user.save();

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contactNumber: user.contactNumber,
          avatar: user.avatar || "",
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Signup failed", error: error.message });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide both Email and Password." });
    }

    const emailClean = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailClean });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    res.json({
      success: true,
      message: "Logged in successfully!",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contactNumber: user.contactNumber,
          avatar: user.avatar || "",
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        contactNumber: req.user.contactNumber,
        avatar: req.user.avatar || "",
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch profile", error: error.message });
  }
};

// PUT /api/auth/profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.contactNumber !== undefined) user.contactNumber = req.body.contactNumber;
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
    if (req.body.email) {
      const emailClean = req.body.email.toLowerCase().trim();
      if (emailClean !== user.email) {
        const existing = await User.findOne({ email: emailClean });
        if (existing) {
          return res.status(400).json({ success: false, message: "Email is already in use by another account." });
        }
        user.email = emailClean;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully!",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        avatar: user.avatar || "",
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
  }
};

// Seed default Admin User if none exists
const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ $or: [{ email: "admin@trace.lk" }, { role: "admin" }] });
    if (!adminExists) {
      const admin = new User({
        name: "TRACE Admin",
        email: "admin@trace.lk",
        password: "admin123",
        contactNumber: "+94 11 234 5678",
        role: "admin",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      });
      await admin.save();
      console.log("Default Admin user seeded successfully (admin@trace.lk / admin123)");
    }
  } catch (err) {
    console.error("Error seeding admin user:", err);
  }
};

// GET /api/auth/users (Get all registered users for Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch registered users", error: error.message });
  }
};

// DELETE /api/auth/users/:id (Delete a user account)
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User account deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
  }
};

module.exports = {
  signupUser,
  loginUser,
  getMe,
  updateUserProfile,
  seedAdminUser,
  getAllUsers,
  deleteUser,
};
