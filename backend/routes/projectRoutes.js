const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");

const {
  createProject,
  getMyProjects,
  submitForReview,
  updateProject,
  deleteProject,
  pauseProject,
  resumeProject,
  adminGetAllProjects,
  updateProjectStatus,
  getPublicProjects
} = require("../controllers/project.controller");

const Project = require("../models/Project");

// ================= PUBLIC ROUTES =================

// Donors can see only approved/active projects
router.get("/public", getPublicProjects);

// ================= NGO ROUTES =================

// Create project
router.post("/", protect, authorizeRoles("ngo"), createProject);

// Get my projects
router.get("/my", protect, authorizeRoles("ngo"), getMyProjects);

// Submit project for admin review
router.put("/:id/submit", protect, authorizeRoles("ngo"), submitForReview);

// Upload / change cover image
router.put(
  "/:id/image",
  protect,
  authorizeRoles("ngo"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      project.image = req.file.filename;
      await project.save();

      res.json(project);
    } catch (err) {
      console.error("UPLOAD PROJECT IMAGE ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// Update project
router.put("/:id", protect, authorizeRoles("ngo"), updateProject);

// Delete project
router.delete("/:id", protect, authorizeRoles("ngo"), deleteProject);

// Pause project
router.put("/:id/pause", protect, authorizeRoles("ngo"), pauseProject);

// Resume project
router.put("/:id/resume", protect, authorizeRoles("ngo"), resumeProject);

// ================= ADMIN ROUTES =================

// Admin gets all projects or filtered projects
router.get("/admin/all", protect, authorizeRoles("admin"), adminGetAllProjects);

// Admin approves / rejects project
router.put("/:id/status", protect, authorizeRoles("admin"), updateProjectStatus);
// TODO: Implement flagProject controller
// router.put("/admin/:id/flag", protect, authorizeRoles("admin"), flagProject);

// ================= SINGLE PROJECT ROUTE (KEEP LAST) =================

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate({
      path: "ngo",
      select: "name category description verified verificationStatus"
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