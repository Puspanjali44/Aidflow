const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  getMyProfile,
  updateProfile,
  pauseAccount,
  deactivateAccount
} = require("../controllers/ngo.controller");


// ================= NGO PROFILE =================

// Get logged-in NGO profile
router.get(
  "/profile",
  protect,
  authorizeRoles("ngo"),
  getMyProfile
);

// Update logged-in NGO profile
router.put(
  "/profile",
  protect,
  authorizeRoles("ngo"),
  updateProfile
);


// ================= ACCOUNT CONTROLS =================

// Pause NGO account
router.put(
  "/pause",
  protect,
  authorizeRoles("ngo"),
  pauseAccount
);

// Deactivate NGO account
router.put(
  "/deactivate",
  protect,
  authorizeRoles("ngo"),
  deactivateAccount
);

module.exports = router;