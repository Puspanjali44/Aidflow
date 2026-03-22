const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload"); // ✅ added for image upload

const {
  createProject,
  getMyProjects,
  submitForReview,
  updateProject,
  deleteProject,
  pauseProject,
  resumeProject
} = require("../controllers/project.controller");

const Project = require("../models/Project");


// ================= PUBLIC ROUTES =================

router.get("/public", async (req, res) => {
  try {
    const projects = await Project.find({ status: "active" }).populate({
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

// ✅ Upload / change cover image — must be before generic /:id PUT
router.put("/:id/image", protect, authorizeRoles("ngo"), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { image: req.file.filename },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update project (text fields only — JSON body)
router.put("/:id", protect, authorizeRoles("ngo"), updateProject);

// Delete draft
router.delete("/:id", protect, authorizeRoles("ngo"), deleteProject);

// Pause
router.put("/:id/pause", protect, authorizeRoles("ngo"), pauseProject);

// Resume
router.put("/:id/resume", protect, authorizeRoles("ngo"), resumeProject);


// ⭐ SINGLE PROJECT ROUTE (MUST BE LAST)

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate({
      path: "ngo",
      select: "organizationName category description"
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("GET PROJECT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;