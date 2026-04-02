const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createDonation,
  getMyDonations,
  getNgoDonations,
  getProjectDonors,
  getWordsOfSupport,
  getLeaderboard,
  processRecurringDonations,
  cancelRecurringDonation
} = require("../controllers/donation.controller");

router.post("/", protect, authorizeRoles("donor"), createDonation);
router.get("/my", protect, authorizeRoles("donor"), getMyDonations);
router.get("/ngo", protect, authorizeRoles("ngo"), getNgoDonations);

router.get("/leaderboard", getLeaderboard);
router.get("/project/:id/donors", getProjectDonors);
router.get("/project/:id/words-of-support", getWordsOfSupport);

// recurring donation routes
router.post("/process-recurring", processRecurringDonations);
router.put(
  "/:id/cancel-recurring",
  protect,
  authorizeRoles("donor"),
  cancelRecurringDonation
);

module.exports = router;