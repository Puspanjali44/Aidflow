const express = require("express");
const router = express.Router();
const { initiateRecurringDonation } = require("../controllers/recurringDonationController");
const { protect } = require("../middleware/authMiddleware");

router.post("/initiate", protect, initiateRecurringDonation);

module.exports = router;