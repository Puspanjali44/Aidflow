const Project = require("../models/Project");
const NGO = require("../models/NGO");

// ================= CREATE PROJECT =================
exports.createProject = async (req, res) => {
  try {
    const ngoProfile = await NGO.findOne({ user: req.user._id });

    if (!ngoProfile) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    const { title, description, goalAmount, endDate } = req.body;

    const project = await Project.create({
      title,
      description,
      goalAmount,
      endDate,
      status: "draft",
      raisedAmount: 0,
      ngo: ngoProfile._id,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET MY PROJECTS (WITH AUTO-COMPLETE) =================
exports.getMyProjects = async (req, res) => {
  try {
    const ngoProfile = await NGO.findOne({ user: req.user._id });

    if (!ngoProfile) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    const projects = await Project.find({ ngo: ngoProfile._id })
      .populate("ngo", "organizationName category verified verificationStatus")
      .sort({ createdAt: -1 });

    const now = new Date();

    for (let project of projects) {
      if (
        project.status !== "completed" &&
        project.status !== "rejected" &&
        project.raisedAmount >= project.goalAmount
      ) {
        project.status = "completed";
        await project.save();
      } else if (
        project.status === "active" &&
        project.endDate &&
        new Date(project.endDate) < now
      ) {
        project.status = "completed";
        await project.save();
      }
    }

    res.json(projects);
  } catch (error) {
    console.error("GET MY PROJECTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= SUBMIT FOR REVIEW =================
exports.submitForReview = async (req, res) => {
  try {
    const ngoProfile = await NGO.findOne({ user: req.user._id });

    if (!ngoProfile) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    if (!ngoProfile.verified || ngoProfile.verificationStatus !== "approved") {
      return res.status(400).json({
        message: "Your NGO must be verified before submitting projects for approval",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.ngo.toString() !== ngoProfile._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (project.status !== "draft") {
      return res.status(400).json({
        message: "Only draft projects can be submitted",
      });
    }

    project.status = "under_review";
    await project.save();

    res.json({
      message: "Project submitted for admin review",
      project,
    });
  } catch (error) {
    console.error("SUBMIT FOR REVIEW ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE PROJECT =================
exports.updateProject = async (req, res) => {
  try {
    const ngoProfile = await NGO.findOne({ user: req.user._id });

    if (!ngoProfile) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.ngo.toString() !== ngoProfile._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { title, description, goalAmount, endDate } = req.body;

    if (project.status === "draft") {
      project.title = title ?? project.title;
      project.description = description ?? project.description;
      project.goalAmount = goalAmount ?? project.goalAmount;
      project.endDate = endDate ?? project.endDate;
    } else if (project.status === "active") {
      if (description !== undefined) project.description = description;
      if (endDate !== undefined) project.endDate = endDate;

      if (goalAmount !== undefined) {
        if (goalAmount < project.raisedAmount) {
          return res.status(400).json({
            message: "Goal cannot be less than raised amount",
          });
        }

        if (goalAmount < project.goalAmount) {
          return res.status(400).json({
            message: "Goal can only be increased",
          });
        }

        project.goalAmount = goalAmount;
      }
    } else if (project.status === "under_review") {
      if (description !== undefined) project.description = description;
      if (endDate !== undefined) project.endDate = endDate;
    } else {
      return res.status(400).json({
        message: "This project cannot be edited",
      });
    }

    await project.save();
    res.json(project);
  } catch (error) {
    console.error("UPDATE PROJECT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE PROJECT =================
exports.deleteProject = async (req, res) => {
  try {
    const ngoProfile = await NGO.findOne({ user: req.user._id });

    if (!ngoProfile) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.ngo.toString() !== ngoProfile._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (project.status !== "draft") {
      return res.status(400).json({
        message: "Only draft projects can be deleted",
      });
    }

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= PAUSE PROJECT =================
exports.pauseProject = async (req, res) => {
  try {
    const ngoProfile = await NGO.findOne({ user: req.user._id });
    const project = await Project.findById(req.params.id);

    if (!ngoProfile || !project) {
      return res.status(404).json({ message: "Not found" });
    }

    if (project.ngo.toString() !== ngoProfile._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (project.status !== "active") {
      return res.status(400).json({
        message: "Only active projects can be paused",
      });
    }

    project.status = "paused";
    await project.save();

    res.json(project);
  } catch (error) {
    console.error("PAUSE PROJECT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= RESUME PROJECT =================
exports.resumeProject = async (req, res) => {
  try {
    const ngoProfile = await NGO.findOne({ user: req.user._id });
    const project = await Project.findById(req.params.id);

    if (!ngoProfile || !project) {
      return res.status(404).json({ message: "Not found" });
    }

    if (project.ngo.toString() !== ngoProfile._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (project.status !== "paused") {
      return res.status(400).json({
        message: "Only paused projects can be resumed",
      });
    }

    project.status = "active";
    await project.save();

    res.json(project);
  } catch (error) {
    console.error("RESUME PROJECT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN GET ALL PROJECTS =================
exports.adminGetAllProjects = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const projects = await Project.find(filter)
      .populate("ngo", "organizationName category verified verificationStatus")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error("ADMIN GET PROJECTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN APPROVE / REJECT PROJECT =================
exports.updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const project = await Project.findById(req.params.id).populate(
      "ngo",
      "organizationName category verified verificationStatus"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!["under_review", "rejected", "active"].includes(project.status)) {
      return res.status(400).json({
        message: "Only projects under review can be approved or rejected",
      });
    }

    project.status = status;
    await project.save();

    return res.status(200).json({
      message: `Project ${status === "active" ? "approved" : "rejected"} successfully`,
      project,
    });
  } catch (error) {
    console.error("UPDATE PROJECT STATUS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= PUBLIC GET APPROVED / ACTIVE PROJECTS =================
exports.getPublicProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: "active" })
      .populate("ngo", "organizationName category verified verificationStatus")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error("GET PUBLIC PROJECTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= PUBLIC GET SINGLE PROJECT =================
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "ngo",
      "organizationName category verified verificationStatus"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("GET PROJECT BY ID ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};