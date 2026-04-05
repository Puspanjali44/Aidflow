const NGO = require("../models/NGO");
const Project = require("../models/Project");
const Donation = require("../models/Donation");
const AdminActivity = require("../models/AdminActivity");

// ================= DASHBOARD SUMMARY =================
// GET /api/admin/dashboard-summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const [
      totalNGOs,
      pendingNGORequests,
      approvedNGOs,
      rejectedNGOs,
      flaggedNGOs,
      activeNGOs,
      pausedNGOs,
      deactivatedNGOs,
      totalProjects,
      pendingProjects,
      activeProjects,
      pausedProjects,
      rejectedProjects,
      flaggedProjects,
      totalDonations,
      donationAgg,
    ] = await Promise.all([
      NGO.countDocuments(),
      NGO.countDocuments({ verificationStatus: "pending" }),
      NGO.countDocuments({ verificationStatus: "approved" }),
      NGO.countDocuments({ verificationStatus: "rejected" }),
      NGO.countDocuments({ flagged: true }),
      NGO.countDocuments({ accountStatus: "active" }),
      NGO.countDocuments({ accountStatus: "paused" }),
      NGO.countDocuments({ accountStatus: "deactivated" }),

      Project.countDocuments(),
      Project.countDocuments({ status: "under_review" }),
      Project.countDocuments({ status: "active" }),
      Project.countDocuments({ status: "paused" }),
      Project.countDocuments({ status: "rejected" }),
      Project.countDocuments({ flagged: true }),

      Donation.countDocuments(),
      Donation.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const totalDonationAmount = donationAgg?.[0]?.totalAmount || 0;

    return res.status(200).json({
      totalNGOs,
      pendingNGORequests,
      approvedNGOs,
      rejectedNGOs,
      flaggedNGOs,
      activeNGOs,
      pausedNGOs,
      deactivatedNGOs,

      totalProjects,
      pendingProjects,
      activeProjects,
      pausedProjects,
      rejectedProjects,
      flaggedProjects,

      totalDonations,
      totalDonationAmount,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD SUMMARY ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= RECENT ACTIVITY =================
// GET /api/admin/recent-activity
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const activities = await AdminActivity.find()
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json(activities);
  } catch (error) {
    console.error("GET RECENT ACTIVITY ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= FRAUD OVERVIEW =================
// GET /api/admin/fraud-overview
exports.getFraudOverview = async (req, res) => {
  try {
    const [flaggedNgos, flaggedProjects, highRiskNgos, highRiskProjects] =
      await Promise.all([
        NGO.find({ flagged: true })
          .select(
            "name verificationStatus accountStatus fraudScore flagReason riskReasons reviewedAt"
          )
          .sort({ reviewedAt: -1, createdAt: -1 }),

        Project.find({ flagged: true })
          .populate("ngo", "name")
          .select("title status fraudScore flagReason riskReasons reviewedAt ngo")
          .sort({ reviewedAt: -1, createdAt: -1 }),

        NGO.find({ fraudScore: { $gte: 30 } })
          .select(
            "name verificationStatus accountStatus fraudScore flagged riskReasons"
          )
          .sort({ fraudScore: -1, createdAt: -1 }),

        Project.find({ fraudScore: { $gte: 20 } })
          .populate("ngo", "name")
          .select("title status fraudScore flagged riskReasons ngo")
          .sort({ fraudScore: -1, createdAt: -1 }),
      ]);

    return res.status(200).json({
      counts: {
        flaggedNgos: flaggedNgos.length,
        flaggedProjects: flaggedProjects.length,
        highRiskNgos: highRiskNgos.length,
        highRiskProjects: highRiskProjects.length,
      },
      flaggedNgos,
      flaggedProjects,
      highRiskNgos,
      highRiskProjects,
    });
  } catch (error) {
    console.error("GET FRAUD OVERVIEW ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};