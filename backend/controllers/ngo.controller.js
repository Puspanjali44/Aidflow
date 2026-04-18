const NGO = require("../models/NGO");
const User = require("../models/user.models");
const AdminActivity = require("../models/AdminActivity");
const fraudService = require("../services/fraudService");
const calculateNgoFraudScore = fraudService.calculateNgoFraudScore || ((ngo) => ({score:0, reasons:[]}));

// ================= GET NGO PROFILE =================
exports.getMyProfile = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id }).populate("user", "email");
    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    return res.json(ngo);
  } catch (error) {
    console.error("GET NGO PROFILE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE NGO PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id }).populate("user", "email");

    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    const fields = [
      "name",
      "registrationNumber",
      "category",
      "mainNiche",
      "location",
      "phone",
      "website",
      "description",
      "mission",
      "establishedYear",
      "bankName",
      "accountNumber",
      "accountName",
      "branch",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        ngo[field] = req.body[field];
      }
    });

    const boolFields = [
      "showDonorNames",
      "publicDashboard",
      "enableContactForm",
      "notifyNewDonation",
      "notifyUpdateApproval",
      "notifyMonthlyReport",
      "notifyDonorComments",
    ];

    boolFields.forEach((field) => {
      if (typeof req.body[field] === "boolean") {
        ngo[field] = req.body[field];
      }
    });

    // Preserve required email so validation does not fail
    ngo.email = req.body.email || ngo.email || ngo.user?.email || "";

    try {
      const fraudResult = calculateNgoFraudScore(ngo);
      ngo.fraudScore = fraudResult.score;
      ngo.riskReasons = fraudResult.reasons;
    } catch (e) {
      ngo.fraudScore = 0;
      ngo.riskReasons = ["Fraud service error"];
    }

    await ngo.save();

    const updatedNgo = await NGO.findById(ngo._id).populate("user", "email");

    return res.status(200).json({
      message: "Profile updated successfully",
      ngo: updatedNgo,
    });
  } catch (error) {
    console.error("UPDATE NGO PROFILE ERROR:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

// ================= UPLOAD PROFILE IMAGE =================
// POST /api/ngo/upload-profile-image
exports.uploadProfileImage = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    ngo.profileImage = req.file.filename;

    const fraudResult = calculateNgoFraudScore(ngo);
    ngo.fraudScore = fraudResult.score;
    ngo.riskReasons = fraudResult.reasons;

    await ngo.save();

    return res.json({
      message: "Profile image updated successfully",
      profileImage: ngo.profileImage,
    });
  } catch (error) {
    console.error("UPLOAD PROFILE IMAGE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPLOAD VERIFICATION DOCUMENTS =================
// POST /api/ngo/upload-documents
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    if (ngo.verificationStatus === "approved") {
      return res.status(400).json({
        message: "NGO already approved. Cannot re-upload documents.",
      });
    }

    if (ngo.verificationStatus === "pending") {
      return res.status(400).json({
        message: "Documents already submitted for review. Wait for admin decision.",
      });
    }

    const docFields = [
      "registrationCertificate",
      "panDocument",
      "auditReport",
      "taxClearance",
      "boardMemberVerification",
      "projectReport",
    ];

    if (req.files) {
      docFields.forEach((field) => {
        if (req.files[field] && req.files[field][0]) {
          ngo.documents[field] = {
            fileUrl: req.files[field][0].filename,
            uploadedAt: new Date(),
            status: "uploaded",
          };
        }
      });
    }

    const fraudResult = calculateNgoFraudScore(ngo);
    ngo.fraudScore = fraudResult.score;
    ngo.riskReasons = fraudResult.reasons;

    await ngo.save();

    return res.json({
      message: "Documents uploaded successfully",
      documents: ngo.documents,
      fraudScore: ngo.fraudScore,
      riskReasons: ngo.riskReasons,
    });
  } catch (error) {
    console.error("UPLOAD DOCS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= SUBMIT NGO FOR VERIFICATION =================
// PUT /api/ngo/submit-verification
exports.submitNgoForVerification = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    if (ngo.verificationStatus === "approved") {
      return res.status(400).json({ message: "NGO is already approved." });
    }

    const required = [
      "registrationCertificate",
      "panDocument",
      "auditReport",
      "taxClearance",
      "boardMemberVerification",
      "projectReport",
    ];

    const missing = required.filter(
      (doc) => !ngo.documents[doc] || !ngo.documents[doc].fileUrl
    );

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Please upload all required documents before submitting.",
        missing,
      });
    }

    const fraudResult = calculateNgoFraudScore(ngo);
    ngo.fraudScore = fraudResult.score;
    ngo.riskReasons = fraudResult.reasons;

    ngo.verificationStatus = "pending";
    ngo.verified = false;
    ngo.adminRemark = "";

    await ngo.save();

    return res.status(200).json({
      message: "NGO submitted for verification. Admin will review your documents.",
      ngo,
    });
  } catch (error) {
    console.error("SUBMIT NGO ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN: GET ALL NGOs =================
// GET /api/ngo/admin/all-ngos?status=pending&flagged=true
exports.getAllNgosForAdmin = async (req, res) => {
  try {
    const { status, flagged } = req.query;
    const filter = {};

    if (status) {
      filter.verificationStatus = status;
    }

    if (flagged === "true") {
      filter.flagged = true;
    } else if (flagged === "false") {
      filter.flagged = false;
    }

    const ngos = await NGO.find(filter)
      .populate("user", "email name")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(ngos);
  } catch (error) {
    console.error("GET ALL NGO ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN: GET SINGLE NGO DETAIL =================
// GET /api/ngo/admin/:id
exports.getNgoDetailForAdmin = async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id)
      .populate("user", "email name")
      .populate("reviewedBy", "name email");

    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    return res.status(200).json(ngo);
  } catch (error) {
    console.error("GET NGO DETAIL ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN: APPROVE / REJECT NGO =================
// PUT /api/ngo/admin/:id/status
// Body: { status: "approved" | "rejected", remark: "..." }
exports.updateNgoVerificationStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'approved' or 'rejected'",
      });
    }

    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    const fraudResult = calculateNgoFraudScore(ngo);
    ngo.fraudScore = fraudResult.score;
    ngo.riskReasons = fraudResult.reasons;

    ngo.verificationStatus = status;
    ngo.verified = status === "approved";
    ngo.adminRemark = remark || "";
    ngo.reviewedBy = req.user._id;
    ngo.reviewedAt = new Date();

    await ngo.save();

    await AdminActivity.create({
      admin: req.user._id,
      action: status === "approved" ? "approve_ngo" : "reject_ngo",
      entityType: "ngo",
      entityId: ngo._id,
      message:
        status === "approved"
          ? `Approved NGO: ${ngo.name}`
          : `Rejected NGO: ${ngo.name}`,
      metadata: {
        verificationStatus: status,
        adminRemark: ngo.adminRemark,
      },
    });

    return res.status(200).json({
      message: `NGO ${status} successfully`,
      ngo,
    });
  } catch (error) {
    console.error("UPDATE NGO STATUS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN: FLAG / UNFLAG NGO =================
// PUT /api/ngo/admin/:id/flag
// Body: { flagged: true/false, flagReason: "..." }
exports.flagNgo = async (req, res) => {
  try {
    const { flagged, flagReason } = req.body;

    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    ngo.flagged = Boolean(flagged);
    ngo.flagReason = flagged ? (flagReason || "").trim() : "";
    ngo.reviewedBy = req.user?._id || req.user?.id || null;
    ngo.reviewedAt = new Date();

    let fraudResult = { score: 0, reasons: [] };
    try {
      fraudResult = calculateNgoFraudScore(ngo) || { score: 0, reasons: [] };
    } catch (fraudErr) {
      console.error("FRAUD SCORE ERROR:", fraudErr);
    }

    ngo.fraudScore = fraudResult.score || 0;
    ngo.riskReasons = Array.isArray(fraudResult.reasons) ? [...fraudResult.reasons] : [];

    if (ngo.flagged && ngo.flagReason && !ngo.riskReasons.includes(ngo.flagReason)) {
      ngo.riskReasons.push(ngo.flagReason);
    }

    await ngo.save();

    try {
      await AdminActivity.create({
        admin: req.user?._id || req.user?.id,
        action: ngo.flagged ? "flag_ngo" : "unflag_ngo",
        entityType: "ngo",
        entityId: ngo._id,
        message: ngo.flagged
          ? `Flagged NGO: ${ngo.name}`
          : `Removed NGO flag: ${ngo.name}`,
        metadata: {
          flagged: ngo.flagged,
          flagReason: ngo.flagReason,
        },
      });
    } catch (activityErr) {
      console.error("ADMIN ACTIVITY CREATE ERROR:", activityErr);
    }

    return res.status(200).json({
      message: ngo.flagged ? "NGO flagged successfully" : "NGO flag removed successfully",
      ngo,
    });
  } catch (error) {
    console.error("FLAG NGO ERROR:", error);
    return res.status(500).json({
      message: error.message || "Server error",
    });
  }
};
// ================= ADMIN: GET FLAGGED NGOs =================
// GET /api/ngo/admin/flagged/list
exports.getFlaggedNgos = async (req, res) => {
  try {
    const ngos = await NGO.find({ flagged: true })
      .populate("user", "email name")
      .populate("reviewedBy", "name email")
      .sort({ reviewedAt: -1, createdAt: -1 });

    return res.status(200).json(ngos);
  } catch (error) {
    console.error("GET FLAGGED NGO ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN: UPDATE NGO ACCOUNT STATUS =================
// PUT /api/ngo/admin/:id/account-status
// Body: { accountStatus: "active" | "paused" | "deactivated" }
exports.updateNgoAccountStatus = async (req, res) => {
  try {
    const { accountStatus } = req.body;

    if (!["active", "paused", "deactivated"].includes(accountStatus)) {
      return res.status(400).json({
        message: "accountStatus must be 'active', 'paused', or 'deactivated'",
      });
    }

    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    ngo.accountStatus = accountStatus;
    ngo.reviewedBy = req.user._id;
    ngo.reviewedAt = new Date();

    await ngo.save();

    await AdminActivity.create({
      admin: req.user._id,
      action: `ngo_account_${accountStatus}`,
      entityType: "ngo",
      entityId: ngo._id,
      message: `Set NGO account status to ${accountStatus}: ${ngo.name}`,
      metadata: { accountStatus },
    });

    return res.status(200).json({
      message: `NGO account status updated to ${accountStatus}`,
      ngo,
    });
  } catch (error) {
    console.error("UPDATE NGO ACCOUNT STATUS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN: NGO RISK SUMMARY =================
// GET /api/ngo/admin/:id/risk-summary
exports.getNgoRiskSummary = async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id).populate("user", "email name");
    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    const fraudResult = calculateNgoFraudScore(ngo);

    ngo.fraudScore = fraudResult.score;
    ngo.riskReasons = fraudResult.reasons;
    await ngo.save();

    return res.status(200).json({
      ngoId: ngo._id,
      name: ngo.name,
      fraudScore: ngo.fraudScore,
      flagged: ngo.flagged,
      flagReason: ngo.flagReason,
      riskReasons: ngo.riskReasons,
      verificationStatus: ngo.verificationStatus,
      accountStatus: ngo.accountStatus,
    });
  } catch (error) {
    console.error("GET NGO RISK SUMMARY ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= PAUSE ACCOUNT (NGO SELF) =================
exports.pauseAccount = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    ngo.accountStatus = "paused";
    await ngo.save();

    return res.json({ message: "Account paused successfully" });
  } catch (error) {
    console.error("PAUSE ACCOUNT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= DEACTIVATE ACCOUNT (NGO SELF) =================
exports.deactivateAccount = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    ngo.accountStatus = "deactivated";
    await ngo.save();

    return res.json({ message: "Account deactivated permanently" });
  } catch (error) {
    console.error("DEACTIVATE ACCOUNT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= REACTIVATE ACCOUNT (NGO SELF) =================
exports.reactivateAccount = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    ngo.accountStatus = "active";
    await ngo.save();

    return res.json({
      message: "Account reactivated successfully",
      ngo,
    });
  } catch (error) {
    console.error("REACTIVATE ACCOUNT ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};