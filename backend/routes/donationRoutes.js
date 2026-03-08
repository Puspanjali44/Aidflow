const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createDonation,
  getMyDonations
} = require("../controllers/donation.controller");

// Create donation
router.post(
  "/",
  protect,
  authorizeRoles("donor"),
  createDonation
);

// Get donor's donation history
router.get(
  "/my",
  protect,
  authorizeRoles("donor"),
  getMyDonations
);

module.exports = router;