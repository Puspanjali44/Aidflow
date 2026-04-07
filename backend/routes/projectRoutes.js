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
  updateProjectLocation,
  deleteProject,
  pauseProject,
  resumeProject,
  adminGetAllProjects,
  updateProjectStatus,
  flagProject,
  getFlaggedProjects,
  getPublicProjects,
  getProjectById,
} = require("../controllers/project.controller");

const Project = require("../models/Project");

// ================= PUBLIC ROUTES =================
router.get("/public", getPublicProjects);

// ================= NGO ROUTES =================
router.post("/", protect, authorizeRoles("ngo"), createProject);
router.get("/my", protect, authorizeRoles("ngo"), getMyProjects);
router.put("/:id/submit", protect, authorizeRoles("ngo"), submitForReview);

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

      return res.json(project);
    } catch (err) {
      console.error("UPLOAD PROJECT IMAGE ERROR:", err);
      return res.status(500).json({ message: err.message });
    }
  }
);

// ADD THIS ROUTE
router.put("/:id/location", protect, authorizeRoles("ngo"), updateProjectLocation);

router.put("/:id", protect, authorizeRoles("ngo"), updateProject);
router.delete("/:id", protect, authorizeRoles("ngo"), deleteProject);
router.put("/:id/pause", protect, authorizeRoles("ngo"), pauseProject);
router.put("/:id/resume", protect, authorizeRoles("ngo"), resumeProject);

// ================= ADMIN ROUTES =================
router.get("/admin/all", protect, authorizeRoles("admin"), adminGetAllProjects);
router.get("/admin/flagged/list", protect, authorizeRoles("admin"), getFlaggedProjects);
router.put("/admin/:id/status", protect, authorizeRoles("admin"), updateProjectStatus);
router.put("/admin/:id/flag", protect, authorizeRoles("admin"), flagProject);

// ================= SINGLE PROJECT ROUTE (KEEP LAST) =================
router.get("/:id", getProjectById);

module.exports = router;