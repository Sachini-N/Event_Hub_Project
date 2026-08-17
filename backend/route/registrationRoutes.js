const express = require("express");
const router = express.Router();
const {
  registerForEvent,
  getUserRegistrations,
  getEventRegistrations,
  getAllRegistrations,
  updateRegistration,
} = require("../controlers/registrationController");

router.post("/", registerForEvent);
router.get("/", getAllRegistrations);
router.get("/user/:email", getUserRegistrations);
router.get("/event/:eventId", getEventRegistrations);
router.put("/:id", updateRegistration);

module.exports = router;
