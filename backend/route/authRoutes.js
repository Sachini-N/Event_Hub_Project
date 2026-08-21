const express = require("express");
const router = express.Router();
const { signupUser, loginUser, getMe, updateUserProfile, getAllUsers, deleteUser } = require("../controlers/authController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/auth/signup
router.post("/signup", signupUser);

// POST /api/auth/login
router.post("/login", loginUser);

// GET /api/auth/me
router.get("/me", protect, getMe);

// PUT /api/auth/profile
router.put("/profile", protect, updateUserProfile);

// GET /api/auth/users (All registered users)
router.get("/users", getAllUsers);

// DELETE /api/auth/users/:id
router.delete("/users/:id", deleteUser);

module.exports = router;
