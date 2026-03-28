const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|avif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDFs are allowed"));
  }
};

const upload = multer({ storage, fileFilter });

// Single image upload (existing usage)
module.exports = upload;

// Named fields for NGO document upload (6 docs)
module.exports.uploadNgoDocs = upload.fields([
  { name: "registrationCertificate", maxCount: 1 },
  { name: "panDocument",             maxCount: 1 },
  { name: "auditReport",             maxCount: 1 },
  { name: "taxClearance",            maxCount: 1 },
  { name: "boardMemberVerification", maxCount: 1 },
  { name: "projectReport",           maxCount: 1 }
]);