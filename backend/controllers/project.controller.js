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
      ngo: ngoProfile._id
    });

    res.status(201).json(project);

  } catch (error) {
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
      .sort({ createdAt: -1 });

    const now = new Date();

    for (let project of projects) {
      if (
        project.status !== "completed" &&
        (
          project.raisedAmount >= project.goalAmount ||
          project.endDate < now
        )
      ) {
        project.status = "completed";
        await project.save();
      }
    }

    res.json(projects);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// ================= SUBMIT FOR REVIEW (SMART AUTOMATION) =================
exports.submitForReview = async (req, res) => {
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
        message: "Only draft projects can be submitted"
      });
    }

    // 🔥 Smart Auto-Approval Rules
    const completedProjects = await Project.countDocuments({
      ngo: ngoProfile._id,
      status: "completed"
    });

    if (
      ngoProfile.isTrusted ||
      project.goalAmount <= 50000 ||
      completedProjects >= 3
    ) {
      project.status = "active";
    } else {
      project.status = "under_review";
    }

    await project.save();
    res.json(project);

  } catch (error) {
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
    }

    else if (project.status === "active") {

      if (description) project.description = description;
      if (endDate) project.endDate = endDate;

      if (goalAmount) {

        if (goalAmount < project.raisedAmount) {
          return res.status(400).json({
            message: "Goal cannot be less than raised amount"
          });
        }

        if (goalAmount < project.goalAmount) {
          return res.status(400).json({
            message: "Goal can only be increased"
          });
        }

        project.goalAmount = goalAmount;
      }
    }

    else if (project.status === "under_review") {
      if (description) project.description = description;
      if (endDate) project.endDate = endDate;
    }

    else {
      return res.status(400).json({
        message: "This project cannot be edited"
      });
    }

    await project.save();
    res.json(project);

  } catch (error) {
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
        message: "Only draft projects can be deleted"
      });
    }

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });

  } catch (error) {
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
        message: "Only active projects can be paused"
      });
    }

    project.status = "paused";
    await project.save();

    res.json(project);

  } catch (error) {
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
        message: "Only paused projects can be resumed"
      });
    }

    project.status = "active";
    await project.save();

    res.json(project);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// ================= ADMIN GET ALL PROJECTS =================
exports.adminGetAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("ngo")
      .sort({ createdAt: -1 });

    res.json(projects);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};