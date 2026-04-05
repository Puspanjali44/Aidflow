const express = require("express");
const router = express.Router();

const {
  getDashboardSummary,
  getRecentActivity,
  getFraudOverview,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get("/dashboard-summary", protect, authorizeRoles("admin"), getDashboardSummary);
router.get("/recent-activity", protect, authorizeRoles("admin"), getRecentActivity);
router.get("/fraud-overview", protect, authorizeRoles("admin"), getFraudOverview);

module.exports = router;