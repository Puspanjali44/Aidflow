const express = require("express");
const router = express.Router();

const {
  initiateRecurringDonation,
  getMyRecurringDonations,
  cancelRecurringDonation,
  pauseRecurringDonation,
} = require("../controllers/recurringDonationController");

const { protect } = require("../middleware/authMiddleware");

router.post("/initiate", protect, initiateRecurringDonation);
router.get("/my", protect, getMyRecurringDonations);
router.patch("/:id/cancel", protect, cancelRecurringDonation);
router.patch("/:id/pause", protect, pauseRecurringDonation);

module.exports = router;