const Project = require("../models/Project");
const NGO = require("../models/NGO");
const AdminActivity = require("../models/AdminActivity");
const { calculateProjectFraudScore } = require("../services/fraudService");

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

    const fraudResult = calculateProjectFraudScore(project, ngoProfile);
    project.fraudScore = fraudResult.score;
    project.riskReasons = fraudResult.reasons;
    await project.save();

    const populatedProject = await Project.findById(project._id).populate(
      "ngo",
      "name organizationName category mainNiche verified verificationStatus"
    );

    return res.status(201).json(populatedProject);
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
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
      .populate(
        "ngo",
        "name organizationName category mainNiche verified verificationStatus"
      )
      .sort({ createdAt: -1 });

    const now = new Date();

    for (const project of projects) {
      if (
        project.status !== "completed" &&
        project.status !== "rejected" &&
        Number(project.raisedAmount || 0) >= Number(project.goalAmount || 0)
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

    const refreshedProjects = await Project.find({ ngo: ngoProfile._id })
      .populate(
        "ngo",
        "name organizationName category mainNiche verified verificationStatus"
      )
      .sort({ createdAt: -1 });

    return res.json(refreshedProjects);
  } catch (error) {
    console.error("GET MY PROJECTS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
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

    const fraudResult = calculateProjectFraudScore(project, ngoProfile);
    project.fraudScore = fraudResult.score;
    project.riskReasons = fraudResult.reasons;
    project.status = "under_review";

    await project.save();

    const populatedProject = await Project.findById(project._id).populate(
      "ngo",
      "name organizationName category mainNiche verified verificationStatus"
    );

    return res.json({
      message: "Project submitted for admin review",
      project: populatedProject,
    });
  } catch (error) {
    console.error("SUBMIT FOR REVIEW ERROR:", error);
    return res.status(500).json({ message: "Server error" });
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
        if (Number(goalAmount) < Number(project.raisedAmount || 0)) {
          return res.status(400).json({
            message: "Goal cannot be less than raised amount",
          });
        }

        if (Number(goalAmount) < Number(project.goalAmount || 0)) {
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

    const fraudResult = calculateProjectFraudScore(project, ngoProfile);
    project.fraudScore = fraudResult.score;
    project.riskReasons = fraudResult.reasons;

    await project.save();

    const populatedProject = await Project.findById(project._id).populate(
      "ngo",
      "name organizationName category mainNiche verified verificationStatus"
    );

    return res.json(populatedProject);
  } catch (error) {
    console.error("UPDATE PROJECT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE PROJECT LOCATION =================
exports.updateProjectLocation = async (req, res) => {
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

    const { location, lat, lng } = req.body;

    if (location !== undefined) {
      project.location = location;
    }

    if (lat !== undefined) {
      if (lat === null || lat === "") {
        project.lat = null;
      } else {
        const parsedLat = Number(lat);
        if (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
          return res.status(400).json({ message: "Invalid latitude value" });
        }
        project.lat = parsedLat;
      }
    }

    if (lng !== undefined) {
      if (lng === null || lng === "") {
        project.lng = null;
      } else {
        const parsedLng = Number(lng);
        if (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
          return res.status(400).json({ message: "Invalid longitude value" });
        }
        project.lng = parsedLng;
      }
    }

    await project.save();

    const populatedProject = await Project.findById(project._id).populate(
      "ngo",
      "name organizationName category mainNiche verified verificationStatus"
    );

    return res.json({
      message: "Project location updated successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.error("UPDATE PROJECT LOCATION ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET PROJECT TIMELINE =================
exports.getProjectTimeline = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json(project.timeline || []);
  } catch (error) {
    console.error("GET PROJECT TIMELINE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADD PROJECT TIMELINE =================
exports.addProjectTimeline = async (req, res) => {
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

    const { label, date, done } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ message: "Timeline label is required" });
    }

    if (!project.timeline) {
      project.timeline = [];
    }

    project.timeline.push({
      label: label.trim(),
      date: date || "",
      done: !!done,
    });

    await project.save();

    return res.status(201).json({
      message: "Timeline item added successfully",
      timeline: project.timeline,
    });
  } catch (error) {
    console.error("ADD PROJECT TIMELINE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
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
    return res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
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

    const populatedProject = await Project.findById(project._id).populate(
      "ngo",
      "name organizationName category mainNiche verified verificationStatus"
    );

    return res.json(populatedProject);
  } catch (error) {
    console.error("PAUSE PROJECT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
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

    const populatedProject = await Project.findById(project._id).populate(
      "ngo",
      "name organizationName category mainNiche verified verificationStatus"
    );

    return res.json(populatedProject);
  } catch (error) {
    console.error("RESUME PROJECT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN GET ALL PROJECTS =================
exports.adminGetAllProjects = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.flagged === "true") {
      filter.flagged = true;
    } else if (req.query.flagged === "false") {
      filter.flagged = false;
    }

    const projects = await Project.find(filter)
      .populate(
        "ngo",
        "name organizationName category mainNiche verified verificationStatus"
      )
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(projects);
  } catch (error) {
    console.error("ADMIN GET PROJECTS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN APPROVE / REJECT PROJECT =================
exports.updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.status !== "under_review") {
      return res.status(400).json({
        message: "Only projects under review can be approved or rejected",
      });
    }

    const ngo = await NGO.findById(project.ngo);
    const fraudResult = calculateProjectFraudScore(project, ngo);

    project.fraudScore = fraudResult.score;
    project.riskReasons = fraudResult.reasons;
    project.status = status;
    project.reviewedBy = req.user._id;
    project.reviewedAt = new Date();

    await project.save();

    await AdminActivity.create({
      admin: req.user._id,
      action: status === "active" ? "approve_project" : "reject_project",
      entityType: "project",
      entityId: project._id,
      message:
        status === "active"
          ? `Approved project: ${project.title}`
          : `Rejected project: ${project.title}`,
      metadata: {
        status,
        fraudScore: project.fraudScore,
      },
    });

    const populatedProject = await Project.findById(project._id).populate(
      "ngo",
      "name organizationName category mainNiche verified verificationStatus"
    );

    return res.status(200).json({
      message: `Project ${status === "active" ? "approved" : "rejected"} successfully`,
      project: populatedProject,
    });
  } catch (error) {
    console.error("UPDATE PROJECT STATUS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN FLAG / UNFLAG PROJECT =================
exports.flagProject = async (req, res) => {
  try {
    const { flagged, flagReason } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const ngo = await NGO.findById(project.ngo);
    const fraudResult = calculateProjectFraudScore(project, ngo);

    project.fraudScore = fraudResult.score;
    project.riskReasons = [...fraudResult.reasons];
    project.flagged = !!flagged;
    project.flagReason = flagged ? (flagReason || "") : "";
    project.reviewedBy = req.user._id;
    project.reviewedAt = new Date();

    if (flagged && flagReason && !project.riskReasons.includes(flagReason)) {
      project.riskReasons.push(flagReason);
    }

    await project.save();

    await AdminActivity.create({
      admin: req.user._id,
      action: flagged ? "flag_project" : "unflag_project",
      entityType: "project",
      entityId: project._id,
      message: flagged
        ? `Flagged project: ${project.title}`
        : `Removed flag from project: ${project.title}`,
      metadata: {
        flagged: project.flagged,
        flagReason: project.flagReason,
      },
    });

    return res.json({
      message: "Project flag updated",
      project,
    });
  } catch (error) {
    console.error("FLAG PROJECT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN GET FLAGGED PROJECTS =================
exports.getFlaggedProjects = async (req, res) => {
  try {
    const projects = await Project.find({ flagged: true })
      .populate("ngo", "name organizationName")
      .populate("reviewedBy", "name email")
      .sort({ reviewedAt: -1, createdAt: -1 });

    return res.json(projects);
  } catch (error) {
    console.error("GET FLAGGED PROJECTS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= PUBLIC GET APPROVED / ACTIVE PROJECTS =================
exports.getPublicProjects = async (req, res) => {
  try {
    const now = new Date();

    const projects = await Project.find({
      status: { $in: ["active", "completed"] },
    })
      .populate(
        "ngo",
        "name organizationName category mainNiche verified verificationStatus"
      )
      .sort({ createdAt: -1 });

    for (const project of projects) {
      let changed = false;

      if (
        project.status !== "completed" &&
        Number(project.raisedAmount || 0) >= Number(project.goalAmount || 0)
      ) {
        project.status = "completed";
        changed = true;
      }

      if (
        project.status === "active" &&
        project.endDate &&
        new Date(project.endDate) < now
      ) {
        project.status = "completed";
        changed = true;
      }

      if (changed) {
        await project.save();
      }
    }

    const refreshedProjects = await Project.find({
      status: { $in: ["active", "completed"] },
    })
      .populate(
        "ngo",
        "name organizationName category mainNiche verified verificationStatus"
      )
      .sort({ status: 1, createdAt: -1 });

    return res.json(refreshedProjects);
  } catch (error) {
    console.error("GET PUBLIC PROJECTS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= PUBLIC GET SINGLE PROJECT =================
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "ngo",
      "name organizationName category mainNiche verified verificationStatus"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch (error) {
    console.error("GET PROJECT BY ID ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPLOAD IMPACT REPORT =================
exports.uploadImpactReport = async (req, res) => {
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

    const pdfFile = req.files?.pdf?.[0] || null;
    const photoFiles = req.files?.photos || [];

    project.impactReport = {
      beneficiaries: req.body.beneficiaries || "",
      testimonials: req.body.testimonials || "",
      pdf: pdfFile ? pdfFile.filename : project.impactReport?.pdf || null,
      photos: photoFiles.length
        ? photoFiles.map((file) => file.filename)
        : project.impactReport?.photos || [],
    };

    await project.save();

    return res.status(200).json({
      message: "Impact report uploaded successfully",
      impactReport: project.impactReport,
    });
  } catch (error) {
    console.error("UPLOAD IMPACT REPORT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET IMPACT REPORT =================
exports.getImpactReport = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const impact = project.impactReport || {};

    return res.status(200).json({
      pdfUploaded: !!impact.pdf,
      pdf: impact.pdf || null,
      photoCount: impact.photos?.length || 0,
      photos: impact.photos || [],
      beneficiaries: impact.beneficiaries || "",
      testimonials: impact.testimonials || "",
    });
  } catch (error) {
    console.error("GET IMPACT REPORT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};