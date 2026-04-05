const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");

const {
  getMyProfile,
  updateProfile,
  uploadProfileImage,
  uploadVerificationDocuments,
  submitNgoForVerification,
  getAllNgosForAdmin,
  getNgoDetailForAdmin,
  updateNgoVerificationStatus,
  flagNgo,
  getFlaggedNgos,
  updateNgoAccountStatus,
  getNgoRiskSummary,
  pauseAccount,
  deactivateAccount,
  reactivateAccount,
} = require("../controllers/ngo.controller");

// ================= NGO PROFILE =================
router.get("/profile", protect, authorizeRoles("ngo"), getMyProfile);
router.put("/profile", protect, authorizeRoles("ngo"), updateProfile);

// ================= PROFILE IMAGE =================
router.post(
  "/upload-profile-image",
  protect,
  authorizeRoles("ngo"),
  upload.single("profileImage"),
  uploadProfileImage
);

// ================= DOCUMENT UPLOAD =================
router.post(
  "/upload-documents",
  protect,
  authorizeRoles("ngo"),
  upload.uploadNgoDocs,
  uploadVerificationDocuments
);

// ================= VERIFICATION SUBMIT =================
router.put(
  "/submit-verification",
  protect,
  authorizeRoles("ngo"),
  submitNgoForVerification
);

// ================= NGO SELF ACCOUNT CONTROLS =================
router.put("/pause", protect, authorizeRoles("ngo"), pauseAccount);
router.put("/deactivate", protect, authorizeRoles("ngo"), deactivateAccount);
router.put("/reactivate", protect, authorizeRoles("ngo"), reactivateAccount);

// ================= ADMIN NGO ROUTES =================
router.get("/admin/all-ngos", protect, authorizeRoles("admin"), getAllNgosForAdmin);
router.get("/admin/flagged/list", protect, authorizeRoles("admin"), getFlaggedNgos);
router.get("/admin/:id", protect, authorizeRoles("admin"), getNgoDetailForAdmin);
router.get("/admin/:id/risk-summary", protect, authorizeRoles("admin"), getNgoRiskSummary);
router.put("/admin/:id/status", protect, authorizeRoles("admin"), updateNgoVerificationStatus);
router.put("/admin/:id/flag", protect, authorizeRoles("admin"), flagNgo);
router.put("/admin/:id/account-status", protect, authorizeRoles("admin"), updateNgoAccountStatus);

module.exports = router;