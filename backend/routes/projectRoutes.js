const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createProject,
  getMyProjects,
  submitForReview,
  updateProject,
  deleteProject,
  pauseProject,
  resumeProject
} = require("../controllers/project.controller");

// Public - Get all active projects
router.get("/public", async (req, res) => {
  try {
    const projects = await require("../models/Project")
      .find({ status: "active" })
      .populate({
        path: "ngo",
        select: "organizationName category description"
      });

    res.json(projects);
  } catch (error) {
    console.error("PUBLIC PROJECT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= NGO ROUTES =================

// Create project
router.post("/", protect, authorizeRoles("ngo"), createProject);

// Get my projects
router.get("/my", protect, authorizeRoles("ngo"), getMyProjects);

// Submit for review
router.put("/:id/submit", protect, authorizeRoles("ngo"), submitForReview);

// Update project
router.put("/:id", protect, authorizeRoles("ngo"), updateProject);

// Delete draft
router.delete("/:id", protect, authorizeRoles("ngo"), deleteProject);

// Pause
router.put("/:id/pause", protect, authorizeRoles("ngo"), pauseProject);

// Resume
router.put("/:id/resume", protect, authorizeRoles("ngo"), resumeProject);


module.exports = router;