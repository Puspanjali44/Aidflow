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
} = require("../controllers/donation.controller");

router.post("/", protect, authorizeRoles("donor"), createDonation);
router.get("/my", protect, authorizeRoles("donor"), getMyDonations);
router.get("/ngo", protect, authorizeRoles("ngo"), getNgoDonations);

router.get("/project/:id/donors", getProjectDonors);
router.get("/project/:id/words-of-support", getWordsOfSupport);

module.exports = router;