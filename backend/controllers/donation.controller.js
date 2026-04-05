const Donation = require("../models/Donation");
const Project = require("../models/Project");
const NGO = require("../models/NGO");
const RecurringDonation = require("../models/RecurringDonation");

// ================= CREATE DONATION =================
// Old direct-create flow is no longer used.
// Donations should now be created through Khalti initiate + verify flow.
exports.createDonation = async (req, res) => {
  return res.status(400).json({
    message:
      "Direct donation creation is disabled. Use Khalti payment initiation instead.",
  });
};

// ================= GET DONOR'S DONATIONS =================
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate({
        path: "project",
        populate: {
          path: "ngo",
          select: "organizationName category profileImage",
        },
      })
      .populate("recurringDonation")
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
      paymentStatus: "SUCCESS",
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
      paymentStatus: "SUCCESS",
    }).sort({ createdAt: -1 });

    const donors = donations.map((d) => ({
      name: d.anonymous
        ? "Anonymous Donor"
        : d.donorName || d.receiptName || "Anonymous Donor",
      amount: `₹${Number(d.baseAmount || d.amount || 0).toLocaleString("en-IN")}`,
      amountValue: Number(d.baseAmount || d.amount || 0),
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
      paymentStatus: "SUCCESS",
      message: { $exists: true, $ne: "" },
    }).sort({ createdAt: -1 });

    const words = donations.map((d) => ({
      name: d.anonymous
        ? "Anonymous Donor"
        : d.donorName || d.receiptName || "Anonymous Donor",
      amount: `₹${Number(d.baseAmount || d.amount || 0).toLocaleString("en-IN")}`,
      amountValue: Number(d.baseAmount || d.amount || 0),
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

// ================= GET LEADERBOARD =================
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Donation.aggregate([
      {
        $match: {
          paymentStatus: "SUCCESS",
          donor: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$donor",
          totalDonated: {
            $sum: { $ifNull: ["$baseAmount", "$amount"] },
          },
          donationCount: { $sum: 1 },
          uniqueProjects: { $addToSet: "$project" },
          latestDonorName: { $last: "$donorName" },
          latestReceiptName: { $last: "$receiptName" },
        },
      },
      {
        $addFields: {
          uniqueProjectCount: { $size: "$uniqueProjects" },
        },
      },
      {
        $addFields: {
          points: {
            $add: [
              { $multiply: ["$donationCount", 50] },
              { $floor: { $divide: ["$totalDonated", 100] } },
              { $multiply: ["$uniqueProjectCount", 100] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: {
            $ifNull: [
              "$user.name",
              {
                $ifNull: [
                  "$latestDonorName",
                  {
                    $ifNull: ["$latestReceiptName", "Anonymous Donor"],
                  },
                ],
              },
            ],
          },
          totalDonated: 1,
          donationCount: 1,
          uniqueProjectCount: 1,
          points: 1,
        },
      },
      {
        $sort: { points: -1, totalDonated: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error("GET LEADERBOARD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= PROCESS RECURRING DONATIONS =================
// ================= PROCESS RECURRING DONATIONS =================
exports.processRecurringDonations = async (req, res) => {
  try {
    const now = new Date();

    const dueSubscriptions = await RecurringDonation.find({
      status: "ACTIVE",
      nextBillingDate: { $lte: now },
    });

    let processedCount = 0;

    for (const sub of dueSubscriptions) {
      const project = await Project.findById(sub.project);

      if (!project || project.status !== "active") {
        continue;
      }

      const donation = await Donation.create({
        donor: sub.donor,
        project: sub.project,
        recurringDonation: sub._id,
        amount: Number(sub.amount),
        baseAmount: Number(sub.baseAmount || sub.amount),
        platformFee: Number(sub.platformFee || 0),
        donationType: "monthly",
        donorName: sub.donorName || "",
        receiptName: sub.receiptName || "",
        email: sub.email || "",
        message: sub.message || "",
        anonymous: !!sub.anonymous,
        address: sub.address || "",
        city: sub.city || "",
        country: sub.country || "Nepal",
        paymentStatus: "SUCCESS",
        providerReference: `manual-renewal-${Date.now()}-${sub._id}`,
        paidAt: new Date(),
      });

      project.raisedAmount =
        Number(project.raisedAmount || 0) +
        Number(sub.baseAmount || sub.amount);

      project.donorCount = await Donation.countDocuments({
        project: project._id,
        paymentStatus: "SUCCESS",
      });

      project.lastDonation = new Date();

      if (project.raisedAmount >= project.goalAmount) {
        project.status = "completed";
      }

      await project.save();

      const nextDate = new Date(sub.nextBillingDate || now);
      nextDate.setMonth(nextDate.getMonth() + 1);

      sub.lastDonation = donation._id;
      sub.lastChargedAt = new Date();
      sub.nextBillingDate = nextDate;
      sub.paymentStatus = "SUCCESS";

      await sub.save();

      processedCount += 1;
    }

    return res.status(200).json({
      message: "Recurring donations processed successfully",
      processedCount,
    });
  } catch (error) {
    console.error("PROCESS RECURRING DONATIONS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= CANCEL RECURRING DONATION =================
exports.cancelRecurringDonation = async (req, res) => {
  try {
    const recurring = await RecurringDonation.findById(req.params.id);

    if (!recurring) {
      return res.status(404).json({ message: "Recurring donation not found" });
    }

    if (String(recurring.donor) !== String(req.user._id)) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (recurring.status !== "ACTIVE" && recurring.status !== "PAUSED") {
      return res
        .status(400)
        .json({ message: "This recurring donation is not active" });
    }

    recurring.status = "CANCELLED";
    recurring.cancelledAt = new Date();
    recurring.nextBillingDate = null;

    await recurring.save();

    res.json({
      message: "Recurring donation cancelled successfully",
      recurring,
    });
  } catch (error) {
    console.error("CANCEL RECURRING DONATION ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};