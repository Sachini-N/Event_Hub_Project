const express = require("express");
const router = express.Router();
const {
  registerForEvent,
  getUserRegistrations,
  getEventRegistrations,
} = require("../controlers/registrationController");

router.post("/", registerForEvent);
router.get("/user/:email", getUserRegistrations);
router.get("/event/:eventId", getEventRegistrations);

module.exports = router;
