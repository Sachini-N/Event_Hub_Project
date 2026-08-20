const express = require("express");
const router = express.Router();
const {
  getVenues,
  createVenue,
  deleteVenue,
} = require("../controlers/venueController");

router.get("/", getVenues);
router.post("/", createVenue);
router.delete("/:id", deleteVenue);

module.exports = router;
