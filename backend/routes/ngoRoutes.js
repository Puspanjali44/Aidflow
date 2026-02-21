const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  getMyProfile,
  updateProfile,
} = require("../controllers/ngo.controller");

// Get logged-in NGO profile
router.get("/profile", protect, getMyProfile);

// Update logged-in NGO profile
router.put("/profile", protect, updateProfile);

module.exports = router;