const mongoose = require("mongoose");
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

      Donation.countDocuments({ paymentStatus: "SUCCESS" }),
      Donation.aggregate([
        { $match: { paymentStatus: "SUCCESS" } },
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
            "name organizationName verificationStatus accountStatus fraudScore flagReason riskReasons reviewedAt"
          )
          .sort({ reviewedAt: -1, createdAt: -1 }),

        Project.find({ flagged: true })
          .populate("ngo", "name organizationName")
          .select("title status fraudScore flagReason riskReasons reviewedAt ngo")
          .sort({ reviewedAt: -1, createdAt: -1 }),

        NGO.find({ fraudScore: { $gte: 30 } })
          .select(
            "name organizationName verificationStatus accountStatus fraudScore flagged riskReasons"
          )
          .sort({ fraudScore: -1, createdAt: -1 }),

        Project.find({ fraudScore: { $gte: 20 } })
          .populate("ngo", "name organizationName")
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

// ================= FULL ADMIN ANALYTICS =================
// GET /api/admin/analytics
exports.getAdminAnalytics = async (req, res) => {
  try {
    const [
      monthlyDonationTrends,
      ngoFundingBreakdown,
      projectFundingBreakdown,
      topNgos,
      topProjects,
      ngoVerificationBreakdown,
      projectStatusBreakdown,
      flaggedNgos,
      flaggedProjects,
      highRiskNgos,
      highRiskProjects,
      recentActivity,
      totalNGOs,
      totalProjects,
      totalSuccessfulDonations,
      totalDonationAgg,
    ] = await Promise.all([
      Donation.aggregate([
        { $match: { paymentStatus: "SUCCESS" } },
        {
          $group: {
            _id: {
              year: { $year: { $ifNull: ["$paidAt", "$createdAt"] } },
              month: { $month: { $ifNull: ["$paidAt", "$createdAt"] } },
            },
            totalAmount: { $sum: "$amount" },
            totalDonations: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Donation.aggregate([
        { $match: { paymentStatus: "SUCCESS" } },
        {
          $lookup: {
            from: "projects",
            localField: "project",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: "$project" },
        {
          $lookup: {
            from: "ngos",
            localField: "project.ngo",
            foreignField: "_id",
            as: "ngo",
          },
        },
        { $unwind: "$ngo" },
        {
          $group: {
            _id: "$ngo._id",
            ngoName: {
              $first: {
                $ifNull: ["$ngo.organizationName", "$ngo.name"],
              },
            },
            totalAmount: { $sum: "$amount" },
            totalDonations: { $sum: 1 },
            totalProjectsFunded: { $addToSet: "$project._id" },
            fraudScore: { $first: { $ifNull: ["$ngo.fraudScore", 0] } },
            flagged: { $first: { $ifNull: ["$ngo.flagged", false] } },
            verificationStatus: {
              $first: { $ifNull: ["$ngo.verificationStatus", "pending"] },
            },
          },
        },
        {
          $project: {
            _id: 1,
            ngoName: 1,
            totalAmount: 1,
            totalDonations: 1,
            totalProjectsFunded: { $size: "$totalProjectsFunded" },
            fraudScore: 1,
            flagged: 1,
            verificationStatus: 1,
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      // FIXED: START FROM PROJECT SO ALL PROJECTS SHOW
      Project.aggregate([
        {
          $lookup: {
            from: "donations",
            localField: "_id",
            foreignField: "project",
            as: "donations",
          },
        },
        {
          $lookup: {
            from: "ngos",
            localField: "ngo",
            foreignField: "_id",
            as: "ngo",
          },
        },
        {
          $unwind: {
            path: "$ngo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            successfulDonations: {
              $filter: {
                input: "$donations",
                as: "donation",
                cond: { $eq: ["$$donation.paymentStatus", "SUCCESS"] },
              },
            },
          },
        },
        {
          $addFields: {
            totalAmount: {
              $sum: "$successfulDonations.amount",
            },
            totalDonations: {
              $size: "$successfulDonations",
            },
            ngoName: {
              $ifNull: ["$ngo.organizationName", "$ngo.name"],
            },
            fraudScore: { $ifNull: ["$fraudScore", 0] },
            flagged: { $ifNull: ["$flagged", false] },
            goalAmount: { $ifNull: ["$goalAmount", 0] },
            raisedAmount: { $ifNull: ["$raisedAmount", 0] },
            status: { $ifNull: ["$status", "draft"] },
          },
        },
        {
          $project: {
            _id: 1,
            projectTitle: "$title",
            ngoId: "$ngo._id",
            ngoName: 1,
            totalAmount: 1,
            totalDonations: 1,
            goalAmount: 1,
            raisedAmount: 1,
            status: 1,
            fraudScore: 1,
            flagged: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1, projectTitle: 1 } },
      ]),

      Donation.aggregate([
        { $match: { paymentStatus: "SUCCESS" } },
        {
          $lookup: {
            from: "projects",
            localField: "project",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: "$project" },
        {
          $lookup: {
            from: "ngos",
            localField: "project.ngo",
            foreignField: "_id",
            as: "ngo",
          },
        },
        { $unwind: "$ngo" },
        {
          $group: {
            _id: "$ngo._id",
            ngoName: {
              $first: {
                $ifNull: ["$ngo.organizationName", "$ngo.name"],
              },
            },
            totalAmount: { $sum: "$amount" },
            totalDonations: { $sum: 1 },
            fraudScore: { $first: { $ifNull: ["$ngo.fraudScore", 0] } },
            flagged: { $first: { $ifNull: ["$ngo.flagged", false] } },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
      ]),

      Donation.aggregate([
        { $match: { paymentStatus: "SUCCESS" } },
        {
          $lookup: {
            from: "projects",
            localField: "project",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: "$project" },
        {
          $lookup: {
            from: "ngos",
            localField: "project.ngo",
            foreignField: "_id",
            as: "ngo",
          },
        },
        { $unwind: "$ngo" },
        {
          $group: {
            _id: "$project._id",
            projectTitle: { $first: "$project.title" },
            ngoName: {
              $first: {
                $ifNull: ["$ngo.organizationName", "$ngo.name"],
              },
            },
            totalAmount: { $sum: "$amount" },
            totalDonations: { $sum: 1 },
            fraudScore: { $first: { $ifNull: ["$project.fraudScore", 0] } },
            flagged: { $first: { $ifNull: ["$project.flagged", false] } },
            status: { $first: { $ifNull: ["$project.status", "draft"] } },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
      ]),

      NGO.aggregate([
        {
          $group: {
            _id: "$verificationStatus",
            count: { $sum: 1 },
          },
        },
      ]),

      Project.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      NGO.find({ flagged: true })
        .select("name organizationName fraudScore flagReason verificationStatus")
        .sort({ reviewedAt: -1, createdAt: -1 })
        .limit(5),

      Project.find({ flagged: true })
        .populate("ngo", "name organizationName")
        .select("title fraudScore flagReason status ngo")
        .sort({ reviewedAt: -1, createdAt: -1 })
        .limit(5),

      NGO.find({ fraudScore: { $gte: 30 } })
        .select("name organizationName fraudScore flagged riskReasons")
        .sort({ fraudScore: -1, createdAt: -1 })
        .limit(5),

      Project.find({ fraudScore: { $gte: 20 } })
        .populate("ngo", "name organizationName")
        .select("title fraudScore flagged riskReasons status ngo")
        .sort({ fraudScore: -1, createdAt: -1 })
        .limit(5),

      AdminActivity.find()
        .populate("admin", "name email")
        .sort({ createdAt: -1 })
        .limit(8),

      NGO.countDocuments(),
      Project.countDocuments(),
      Donation.countDocuments({ paymentStatus: "SUCCESS" }),
      Donation.aggregate([
        { $match: { paymentStatus: "SUCCESS" } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const formattedMonthlyDonationTrends = monthlyDonationTrends.map((item) => ({
      month: `${String(item._id.month).padStart(2, "0")}/${item._id.year}`,
      totalAmount: item.totalAmount,
      totalDonations: item.totalDonations,
    }));

    const ngoVerificationStats = {
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    ngoVerificationBreakdown.forEach((item) => {
      if (item._id && ngoVerificationStats[item._id] !== undefined) {
        ngoVerificationStats[item._id] = item.count;
      }
    });

    const projectStatusStats = {
      draft: 0,
      under_review: 0,
      active: 0,
      paused: 0,
      completed: 0,
      rejected: 0,
    };

    projectStatusBreakdown.forEach((item) => {
      if (item._id && projectStatusStats[item._id] !== undefined) {
        projectStatusStats[item._id] = item.count;
      }
    });

    const totalDonationAmount = totalDonationAgg?.[0]?.totalAmount || 0;

    return res.status(200).json({
      totalNGOs,
      totalProjects,
      totalDonations: totalSuccessfulDonations,
      totalDonationAmount,
      monthlyDonationTrends: formattedMonthlyDonationTrends,
      ngoFundingBreakdown,
      projectFundingBreakdown,
      topNgos,
      topProjects,
      ngoVerificationStats,
      projectStatusStats,
      fraudHighlights: {
        flaggedNgos,
        flaggedProjects,
        highRiskNgos,
        highRiskProjects,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("GET ADMIN ANALYTICS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};