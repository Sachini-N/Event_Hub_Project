const express = require("express");
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controlers/eventController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", protect, createEvent);
router.put("/:id", protect, authorize("admin", "super_admin", "branch_admin"), updateEvent);
router.delete("/:id", protect, authorize("admin", "super_admin", "branch_admin"), deleteEvent);

module.exports = router;
