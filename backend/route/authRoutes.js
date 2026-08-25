const express = require("express");
const router = express.Router();
const { signupUser, loginUser, getMe, updateUserProfile, getAllUsers, deleteUser, updateUserAdminDetails, createBranchAdmin, sendEmailCredentials } = require("../controlers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

// POST /api/auth/signup
router.post("/signup", signupUser);

// POST /api/auth/login
router.post("/login", loginUser);

// POST /api/auth/create-branch-admin (Admin only)
router.post("/create-branch-admin", protect, authorize("admin", "super_admin"), createBranchAdmin);

// POST /api/auth/send-credentials-email (Admin only)
router.post("/send-credentials-email", protect, authorize("admin", "super_admin"), sendEmailCredentials);

// GET /api/auth/me
router.get("/me", protect, getMe);

// PUT /api/auth/profile
router.put("/profile", protect, updateUserProfile);

// GET /api/auth/users (All registered users - Admin only)
router.get("/users", protect, authorize("admin", "super_admin", "branch_admin"), getAllUsers);

// PUT /api/auth/users/:id (Update admin user details - Admin only)
router.put("/users/:id", protect, authorize("admin", "super_admin", "branch_admin"), updateUserAdminDetails);

// DELETE /api/auth/users/:id (Admin only)
router.delete("/users/:id", protect, authorize("admin", "super_admin"), deleteUser);

module.exports = router;
