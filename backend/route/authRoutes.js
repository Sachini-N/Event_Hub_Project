const express = require("express");
const router = express.Router();
const { signupUser, loginUser, getMe } = require("../controlers/authController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/auth/signup
router.post("/signup", signupUser);

// POST /api/auth/login
router.post("/login", loginUser);

// GET /api/auth/me
router.get("/me", protect, getMe);

module.exports = router;
