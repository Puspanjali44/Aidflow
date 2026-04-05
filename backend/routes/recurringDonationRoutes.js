const express = require("express");
const router = express.Router();

const {
  initiateRecurringDonation,
  getMyRecurringDonations,
  cancelRecurringDonation,
  pauseRecurringDonation,
} = require("../controllers/recurringDonationController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post(
  "/initiate",
  protect,
  authorizeRoles("donor"),
  initiateRecurringDonation
);

router.get("/my", protect, authorizeRoles("donor"), getMyRecurringDonations);
router.patch("/:id/cancel", protect, authorizeRoles("donor"), cancelRecurringDonation);
router.patch("/:id/pause", protect, authorizeRoles("donor"), pauseRecurringDonation);

module.exports = router;