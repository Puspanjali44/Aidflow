const NGO = require("../models/NGO");
const User = require("../models/user.models");


// ================= GET NGO PROFILE =================
exports.getMyProfile = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id })
      .populate("user", "email");

    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    res.json(ngo);

  } catch (error) {
    console.error("GET NGO PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// ================= UPDATE NGO PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });

    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    const {
      name,
      registrationNumber,
      category,
      location,
      phone,
      website,
      description,
      mission,
      establishedYear,

      // Bank
      bankName,
      accountNumber,
      accountName,
      branch,

      // Preferences
      showDonorNames,
      publicDashboard,
      enableContactForm,
      notifyNewDonation,
      notifyUpdateApproval,
      notifyMonthlyReport,
      notifyDonorComments
    } = req.body;

    // ================= BASIC INFO =================
    if (name !== undefined) ngo.name = name;
    if (registrationNumber !== undefined) ngo.registrationNumber = registrationNumber;
    if (category !== undefined) ngo.category = category;
    if (location !== undefined) ngo.location = location;
    if (phone !== undefined) ngo.phone = phone;
    if (website !== undefined) ngo.website = website;
    if (description !== undefined) ngo.description = description;
    if (mission !== undefined) ngo.mission = mission;
    if (establishedYear !== undefined) ngo.establishedYear = establishedYear;

    // ================= BANK DETAILS =================
    if (bankName !== undefined) ngo.bankName = bankName;
    if (accountNumber !== undefined) ngo.accountNumber = accountNumber;
    if (accountName !== undefined) ngo.accountName = accountName;
    if (branch !== undefined) ngo.branch = branch;

    // ================= PREFERENCES =================
    if (typeof showDonorNames === "boolean")
      ngo.showDonorNames = showDonorNames;

    if (typeof publicDashboard === "boolean")
      ngo.publicDashboard = publicDashboard;

    if (typeof enableContactForm === "boolean")
      ngo.enableContactForm = enableContactForm;

    if (typeof notifyNewDonation === "boolean")
      ngo.notifyNewDonation = notifyNewDonation;

    if (typeof notifyUpdateApproval === "boolean")
      ngo.notifyUpdateApproval = notifyUpdateApproval;

    if (typeof notifyMonthlyReport === "boolean")
      ngo.notifyMonthlyReport = notifyMonthlyReport;

    if (typeof notifyDonorComments === "boolean")
      ngo.notifyDonorComments = notifyDonorComments;

    await ngo.save();

    res.json({
      message: "Profile updated successfully",
      ngo
    });

  } catch (error) {
    console.error("UPDATE NGO PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// ================= PAUSE ALL PROJECTS =================
exports.pauseAccount = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });

    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    ngo.accountStatus = "paused";
    await ngo.save();

    res.json({ message: "Account paused successfully" });

  } catch (error) {
    console.error("PAUSE ACCOUNT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// ================= DEACTIVATE ACCOUNT =================
exports.deactivateAccount = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });

    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    ngo.accountStatus = "deactivated";
    await ngo.save();

    res.json({ message: "Account deactivated permanently" });

  } catch (error) {
    console.error("DEACTIVATE ACCOUNT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};