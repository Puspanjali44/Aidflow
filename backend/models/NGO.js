const mongoose = require("mongoose");

// ================= VERIFICATION DOCUMENT SCHEMA =================
const verificationDocSchema = new mongoose.Schema({
  fileUrl: { type: String, default: null },
  uploadedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ["not_uploaded", "uploaded", "verified", "rejected"],
    default: "not_uploaded",
  },
});

// ================= NGO SCHEMA =================
const ngoSchema = new mongoose.Schema(
  {
    // ================= LINK TO USER =================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ================= BASIC INFO =================
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    category: { type: String, default: "General" },
    mainNiche: { type: String, default: "" },
    location: { type: String, default: "" },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
    description: { type: String, default: "" },
    mission: { type: String, default: "" },
    establishedYear: { type: Number, default: null },

    // ================= PROFILE IMAGE =================
    profileImage: {
      type: String,
      default: null,
    },
    

    // ================= VERIFICATION DOCUMENTS (6 required) =================
    documents: {
      registrationCertificate: {
        type: verificationDocSchema,
        default: () => ({}),
      },
      panDocument: {
        type: verificationDocSchema,
        default: () => ({}),
      },
      auditReport: {
        type: verificationDocSchema,
        default: () => ({}),
      },
      taxClearance: {
        type: verificationDocSchema,
        default: () => ({}),
      },
      boardMemberVerification: {
        type: verificationDocSchema,
        default: () => ({}),
      },
      projectReport: {
        type: verificationDocSchema,
        default: () => ({}),
      },
    },

    // ================= VERIFICATION STATUS =================
    verified: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
    },

    adminRemark: {
      type: String,
      default: "",
    },

    // ================= TRANSPARENCY / FRAUD =================
    transparencyScore: {
      type: Number,
      default: 0,
    },
    fraudScore: {
      type: Number,
      default: 0,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: "",
    },
    riskReasons: {
      type: [String],
      default: [],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    email: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  lowercase: true,
},

    // ================= BANK DETAILS =================
    bankName: {
      type: String,
      default: "",
    },
    accountNumber: {
      type: String,
      default: "",
    },
    accountName: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "",
    },

    // ================= NOTIFICATION PREFERENCES =================
    notifyNewDonation: {
      type: Boolean,
      default: true,
    },
    notifyUpdateApproval: {
      type: Boolean,
      default: true,
    },
    notifyMonthlyReport: {
      type: Boolean,
      default: true,
    },
    notifyDonorComments: {
      type: Boolean,
      default: true,
    },

    // ================= PUBLIC VISIBILITY =================
    showDonorNames: {
      type: Boolean,
      default: true,
    },
    publicDashboard: {
      type: Boolean,
      default: true,
    },
    enableContactForm: {
      type: Boolean,
      default: true,
    },

    // ================= ACCOUNT STATUS =================
    accountStatus: {
      type: String,
      enum: ["active", "paused", "deactivated"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NGO", ngoSchema);