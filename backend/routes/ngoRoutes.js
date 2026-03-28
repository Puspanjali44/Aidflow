const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");

const {
  getMyProfile,
  updateProfile,
  pauseAccount,
  deactivateAccount,
  reactivateAccount,
  uploadVerificationDocuments,
  submitNgoForVerification,
  getAllNgosForAdmin,
  getNgoDetailForAdmin,
  updateNgoVerificationStatus
} = require("../controllers/ngo.controller");

// ================= NGO PROFILE =================
router.get("/profile", protect, authorizeRoles("ngo"), getMyProfile);
router.put("/profile", protect, authorizeRoles("ngo"), updateProfile);

// ================= DOCUMENT UPLOAD =================
router.post(
  "/upload-documents",
  protect,
  authorizeRoles("ngo"),
  upload.uploadNgoDocs,
  uploadVerificationDocuments
);

router.put(
  "/submit-verification",
  protect,
  authorizeRoles("ngo"),
  submitNgoForVerification
);

// ================= ACCOUNT CONTROLS =================
router.put("/pause", protect, authorizeRoles("ngo"), pauseAccount);
router.put("/deactivate", protect, authorizeRoles("ngo"), deactivateAccount);
router.put("/reactivate", protect, authorizeRoles("ngo"), reactivateAccount);

// ================= ADMIN ROUTES =================
router.get(
  "/admin/all-ngos",
  protect,
  authorizeRoles("admin"),
  getAllNgosForAdmin
);

router.get(
  "/admin/:id",
  protect,
  authorizeRoles("admin"),
  getNgoDetailForAdmin
);

router.put(
  "/admin/:id/status",
  protect,
  authorizeRoles("admin"),
  updateNgoVerificationStatus
);

module.exports = router;