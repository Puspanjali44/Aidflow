const NGO = require("../models/NGO");
const User = require("../models/user.models");

// ================= GET NGO PROFILE =================
exports.getMyProfile = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id }).populate("user", "email");
    if (!ngo) return res.status(404).json({ message: "NGO profile not found" });
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
    if (!ngo) return res.status(404).json({ message: "NGO profile not found" });

    const fields = [
      "name", "registrationNumber", "category", "location", "phone",
      "website", "description", "mission", "establishedYear",
      "bankName", "accountNumber", "accountName", "branch"
    ];
    fields.forEach(f => { if (req.body[f] !== undefined) ngo[f] = req.body[f]; });

    const boolFields = [
      "showDonorNames", "publicDashboard", "enableContactForm",
      "notifyNewDonation", "notifyUpdateApproval", "notifyMonthlyReport", "notifyDonorComments"
    ];
    boolFields.forEach(f => { if (typeof req.body[f] === "boolean") ngo[f] = req.body[f]; });

    await ngo.save();
    res.json({ message: "Profile updated successfully", ngo });
  } catch (error) {
    console.error("UPDATE NGO PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPLOAD PROFILE IMAGE =================
// POST /api/ngo/upload-profile-image
exports.uploadProfileImage = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(404).json({ message: "NGO profile not found" });

    if (!req.file) return res.status(400).json({ message: "No image file provided" });

    ngo.profileImage = req.file.filename;
    await ngo.save();

    res.json({ message: "Profile image updated successfully", profileImage: ngo.profileImage });
  } catch (error) {
    console.error("UPLOAD PROFILE IMAGE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPLOAD VERIFICATION DOCUMENTS =================
// POST /api/ngo/upload-documents
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(404).json({ message: "NGO profile not found" });

    if (ngo.verificationStatus === "approved") {
      return res.status(400).json({ message: "NGO already approved. Cannot re-upload documents." });
    }

    if (ngo.verificationStatus === "pending") {
      return res.status(400).json({ message: "Documents already submitted for review. Wait for admin decision." });
    }

    const docFields = [
      "registrationCertificate",
      "panDocument",
      "auditReport",
      "taxClearance",
      "boardMemberVerification",
      "projectReport"
    ];

    if (req.files) {
      docFields.forEach(field => {
        if (req.files[field] && req.files[field][0]) {
          ngo.documents[field] = {
            fileUrl:    req.files[field][0].filename,
            uploadedAt: new Date(),
            status:     "uploaded"
          };
        }
      });
    }

    await ngo.save();
    res.json({ message: "Documents uploaded successfully", documents: ngo.documents });
  } catch (error) {
    console.error("UPLOAD DOCS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= SUBMIT NGO FOR VERIFICATION =================
// PUT /api/ngo/submit-verification
exports.submitNgoForVerification = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(404).json({ message: "NGO profile not found" });

    if (ngo.verificationStatus === "approved") {
      return res.status(400).json({ message: "NGO is already approved." });
    }

    const required = [
      "registrationCertificate", "panDocument", "auditReport",
      "taxClearance", "boardMemberVerification", "projectReport"
    ];

    const missing = required.filter(
      doc => !ngo.documents[doc] || !ngo.documents[doc].fileUrl
    );

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Please upload all required documents before submitting.",
        missing
      });
    }

    ngo.verificationStatus = "pending";
    ngo.verified    = false;
    ngo.adminRemark = "";
    await ngo.save();

    return res.status(200).json({
      message: "NGO submitted for verification. Admin will review your documents.",
      ngo
    });
  } catch (error) {
    console.error("SUBMIT NGO ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= ADMIN: GET ALL NGOs =================
// GET /api/ngo/admin/all-ngos?status=pending
exports.getAllNgosForAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { verificationStatus: status } : {};

    const ngos = await NGO.find(filter)
      .populate("user", "email name")
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
    const ngo = await NGO.findById(req.params.id).populate("user", "email name");
    if (!ngo) return res.status(404).json({ message: "NGO not found" });
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
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const ngo = await NGO.findById(req.params.id);
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    ngo.verificationStatus = status;
    ngo.verified    = status === "approved";
    ngo.adminRemark = remark || "";

    await ngo.save();

    return res.status(200).json({ message: `NGO ${status} successfully`, ngo });
  } catch (error) {
    console.error("UPDATE NGO STATUS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= PAUSE ACCOUNT =================
exports.pauseAccount = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(404).json({ message: "NGO not found" });
    ngo.accountStatus = "paused";
    await ngo.save();
    res.json({ message: "Account paused successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= DEACTIVATE ACCOUNT =================
exports.deactivateAccount = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(404).json({ message: "NGO not found" });
    ngo.accountStatus = "deactivated";
    await ngo.save();
    res.json({ message: "Account deactivated permanently" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= REACTIVATE ACCOUNT =================
exports.reactivateAccount = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(404).json({ message: "NGO not found" });
    ngo.accountStatus = "active";
    await ngo.save();
    res.json({ message: "Account reactivated successfully", ngo });
  } catch (error) {
    console.error("REACTIVATE ACCOUNT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};