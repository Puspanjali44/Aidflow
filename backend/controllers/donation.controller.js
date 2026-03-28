const Donation = require("../models/Donation");
const Project = require("../models/Project");
const NGO = require("../models/NGO");

// ================= CREATE DONATION =================
exports.createDonation = async (req, res) => {
  try {
    const {
      projectId,
      amount,
      baseAmount,
      platformFee,
      donationType,
      donorName,
      receiptName,
      email,
      message,
      anonymous,
      address,
      city,
      country,
    } = req.body;

    if (!projectId || !amount) {
      return res.status(400).json({ message: "Project and amount required" });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const project = await Project.findById(projectId);

    if (!project || project.status !== "active") {
      return res.status(400).json({ message: "Project not available" });
    }

    const donation = await Donation.create({
      donor: req.user?._id || null,
      project: projectId,
      amount: Number(amount),

      baseAmount: Number(baseAmount || amount),
      platformFee: Number(platformFee || 0),
      donationType: donationType || "one-time",
      donorName: donorName || "",
      receiptName: receiptName || "",
      email: email || "",
      message: message || "",
      anonymous: !!anonymous,
      address: address || "",
      city: city || "",
      country: country || "",
      paymentStatus: "SUCCESS_SIMULATED",
    });

    project.raisedAmount = Number(project.raisedAmount || 0) + Number(baseAmount || amount);
    project.donorCount = await Donation.countDocuments({ project: project._id });
    project.lastDonation = new Date();

    if (project.raisedAmount >= project.goalAmount) {
      project.status = "completed";
    }

    await project.save();

    res.status(201).json({
      message: "Donation successful",
      donation,
    });
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
          select: "name",
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
    const ngoProfile = await NGO.findOne({ user: req.user._id });

    if (!ngoProfile) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    const projects = await Project.find({ ngo: ngoProfile._id });
    const projectIds = projects.map((p) => p._id);

    const donations = await Donation.find({
      project: { $in: projectIds },
    })
      .populate("donor", "name email")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error("GET NGO DONATIONS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET PROJECT DONORS =================
exports.getProjectDonors = async (req, res) => {
  try {
    const donations = await Donation.find({
      project: req.params.id,
      paymentStatus: "SUCCESS_SIMULATED",
    }).sort({ createdAt: -1 });

    const donors = donations.map((d) => ({
      name: d.anonymous
        ? "Anonymous Donor"
        : d.donorName || d.receiptName || "Anonymous Donor",
      amount: `₹${Number(d.baseAmount || d.amount || 0).toLocaleString("en-IN")}`,
      createdAt: d.createdAt,
      ago: new Date(d.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }));

    res.json(donors);
  } catch (error) {
    console.error("GET PROJECT DONORS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET WORDS OF SUPPORT =================
exports.getWordsOfSupport = async (req, res) => {
  try {
    const donations = await Donation.find({
      project: req.params.id,
      paymentStatus: "SUCCESS_SIMULATED",
      message: { $exists: true, $ne: "" },
    }).sort({ createdAt: -1 });

    const words = donations.map((d) => ({
      name: d.anonymous
        ? "Anonymous Donor"
        : d.donorName || d.receiptName || "Anonymous Donor",
      amount: `₹${Number(d.baseAmount || d.amount || 0).toLocaleString("en-IN")}`,
      message: d.message,
      createdAt: d.createdAt,
      ago: new Date(d.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }));

    res.json(words);
  } catch (error) {
    console.error("GET WORDS OF SUPPORT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};