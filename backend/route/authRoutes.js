const express = require("express");
const router = express.Router();
const { signupUser, loginUser, getMe, updateUserProfile, getAllUsers, deleteUser, updateUserAdminDetails, createBranchAdmin, sendEmailCredentials } = require("../controlers/authController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/auth/signup
router.post("/signup", signupUser);

// POST /api/auth/login
router.post("/login", loginUser);

// POST /api/auth/create-branch-admin
router.post("/create-branch-admin", createBranchAdmin);

// POST /api/auth/send-credentials-email
router.post("/send-credentials-email", sendEmailCredentials);

// GET /api/auth/me
router.get("/me", protect, getMe);

// PUT /api/auth/profile
router.put("/profile", protect, updateUserProfile);

// GET /api/auth/users (All registered users)
router.get("/users", getAllUsers);

// PUT /api/auth/users/:id (Update admin user details)
router.put("/users/:id", updateUserAdminDetails);

// DELETE /api/auth/users/:id
router.delete("/users/:id", deleteUser);

module.exports = router;
