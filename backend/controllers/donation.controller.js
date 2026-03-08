const Donation = require("../models/Donation");
const Project = require("../models/Project");


// ================= CREATE DONATION =================
exports.createDonation = async (req, res) => {
  try {
    const { projectId, amount } = req.body;

    if (!projectId || !amount) {
      return res.status(400).json({ message: "Project and amount required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const project = await Project.findById(projectId);

    if (!project || project.status !== "active") {
      return res.status(400).json({ message: "Project not available" });
    }

    // Create donation
    const donation = await Donation.create({
      donor: req.user._id,
      project: projectId,
      amount,
    });

    // Update project stats
    project.raisedAmount += amount;
    project.donorCount += 1;

    // Auto complete if goal reached
    if (project.raisedAmount >= project.goalAmount) {
      project.status = "completed";
    }

    await project.save();

    res.status(201).json(donation);

  } catch (error) {
    console.error("CREATE DONATION ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// ================= GET DONOR'S DONATIONS =================
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate({
        path: "project",
        populate: {
          path: "ngo",
          select: "organizationName",
        },
      })
      .sort({ createdAt: -1 });

    res.json(donations);

  } catch (error) {
    console.error("GET MY DONATIONS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// ================= GET DONATIONS FOR LOGGED-IN NGO =================
exports.getNgoDonations = async (req, res) => {
  try {
    // Find projects owned by this NGO
    const projects = await Project.find({ ngo: req.user._id });

    const projectIds = projects.map((p) => p._id);

    // Find donations for those projects
    const donations = await Donation.find({
      project: { $in: projectIds },
    })
      .populate("donor", "name")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    res.json(donations);

  } catch (error) {
    console.error("GET NGO DONATIONS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};