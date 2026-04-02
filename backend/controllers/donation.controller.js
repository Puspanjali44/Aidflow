const Donation = require("../models/Donation");
const Project = require("../models/Project");
const NGO = require("../models/NGO");

const addOneMonth = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
};

const applyDonationToProject = async (projectId, amountToAdd) => {
  const project = await Project.findById(projectId);

  if (!project) return null;

  project.raisedAmount =
    Number(project.raisedAmount || 0) + Number(amountToAdd || 0);

  project.donorCount = await Donation.countDocuments({
    project: project._id,
    paymentStatus: "SUCCESS_SIMULATED"
  });

  project.lastDonation = new Date();

  if (project.raisedAmount >= project.goalAmount) {
    project.status = "completed";
  }

  await project.save();
  return project;
};

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
      country
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

    const isMonthly = donationType === "monthly";
    const now = new Date();

    const donation = await Donation.create({
      donor: req.user?._id || null,
      project: projectId,
      amount: Number(amount),
      baseAmount: Number(baseAmount || amount),
      platformFee: Number(platformFee || 0),
      donationType: isMonthly ? "monthly" : "one-time",
      donorName: donorName || "",
      receiptName: receiptName || "",
      email: email || "",
      message: message || "",
      anonymous: !!anonymous,
      address: address || "",
      city: city || "",
      country: country || "",
      paymentStatus: "SUCCESS_SIMULATED",

      isRecurring: isMonthly,
      frequency: isMonthly ? "monthly" : null,
      recurringStatus: isMonthly ? "active" : null,
      nextChargeDate: isMonthly ? addOneMonth(now) : null,
      lastChargedAt: isMonthly ? now : null
    });

    await applyDonationToProject(projectId, Number(baseAmount || amount));

    res.status(201).json({
      message: isMonthly
        ? "Monthly donation started successfully"
        : "Donation successful",
      donation
    });
  } catch (error) {
    console.error("CREATE DONATION ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= PROCESS RECURRING DONATIONS =================
exports.processRecurringDonations = async (req, res) => {
  try {
    const now = new Date();

    const recurringDonations = await Donation.find({
      isRecurring: true,
      recurringStatus: "active",
      frequency: "monthly",
      nextChargeDate: { $lte: now },
      paymentStatus: "SUCCESS_SIMULATED"
    });

    let processedCount = 0;

    for (const recurring of recurringDonations) {
      const project = await Project.findById(recurring.project);

      if (!project || project.status !== "active") {
        continue;
      }

      const newCharge = await Donation.create({
        donor: recurring.donor,
        project: recurring.project,
        amount: recurring.amount,
        baseAmount: recurring.baseAmount,
        platformFee: recurring.platformFee,
        donationType: "monthly",
        donorName: recurring.donorName,
        receiptName: recurring.receiptName,
        email: recurring.email,
        message: recurring.message,
        anonymous: recurring.anonymous,
        address: recurring.address,
        city: recurring.city,
        country: recurring.country,
        paymentStatus: "SUCCESS_SIMULATED",

        isRecurring: false,
        frequency: null,
        recurringStatus: null,
        nextChargeDate: null,
        lastChargedAt: now,
        parentDonation: recurring._id
      });

      await applyDonationToProject(recurring.project, recurring.baseAmount || recurring.amount);

      recurring.lastChargedAt = now;
      recurring.nextChargeDate = addOneMonth(recurring.nextChargeDate || now);
      await recurring.save();

      processedCount += 1;
    }

    res.json({
      message: "Recurring donations processed successfully",
      processedCount
    });
  } catch (error) {
    console.error("PROCESS RECURRING DONATIONS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= CANCEL RECURRING DONATION =================
exports.cancelRecurringDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    if (donation.donor?.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!donation.isRecurring || donation.recurringStatus !== "active") {
      return res.status(400).json({ message: "This recurring donation is not active" });
    }

    donation.isRecurring = false;
    donation.recurringStatus = "cancelled";
    donation.nextChargeDate = null;

    await donation.save();

    res.json({
      message: "Recurring donation cancelled successfully",
      donation
    });
  } catch (error) {
    console.error("CANCEL RECURRING DONATION ERROR:", error);
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
          select: "organizationName category profileImage"
        }
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
      project: { $in: projectIds }
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
      paymentStatus: "SUCCESS_SIMULATED"
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
        year: "numeric"
      })
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
      message: { $exists: true, $ne: "" }
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
        year: "numeric"
      })
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
          paymentStatus: "SUCCESS_SIMULATED",
          donor: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$donor",
          totalDonated: {
            $sum: { $ifNull: ["$baseAmount", "$amount"] }
          },
          donationCount: { $sum: 1 },
          uniqueProjects: { $addToSet: "$project" },
          latestDonorName: { $last: "$donorName" },
          latestReceiptName: { $last: "$receiptName" }
        }
      },
      {
        $addFields: {
          uniqueProjectCount: { $size: "$uniqueProjects" }
        }
      },
      {
        $addFields: {
          points: {
            $add: [
              { $multiply: ["$donationCount", 50] },
              { $floor: { $divide: ["$totalDonated", 100] } },
              { $multiply: ["$uniqueProjectCount", 100] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
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
                    $ifNull: ["$latestReceiptName", "Anonymous Donor"]
                  }
                ]
              }
            ]
          },
          totalDonated: 1,
          donationCount: 1,
          uniqueProjectCount: 1,
          points: 1
        }
      },
      {
        $sort: { points: -1, totalDonated: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error("GET LEADERBOARD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};