const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: String,
  fileUrl: String,
  status: {
    type: String,
    enum: ["verified", "pending", "rejected"],
    default: "pending"
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const ngoSchema = new mongoose.Schema(
  {
    // ================= LINK TO USER =================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ================= BASIC INFO =================
    name: {
      type: String,
      required: true
    },

    registrationNumber: {
      type: String,
      required: true
    },

    category: {
      type: String,
      default: "General"
    },

    location: String,
    phone: String,
    website: String,

    description: String,
    mission: String,

    establishedYear: Number,

    // ================= VERIFICATION =================
    verified: {
      type: Boolean,
      default: false
    },

    documents: [documentSchema],

    // ================= TRANSPARENCY =================
    transparencyScore: {
      type: Number,
      default: 0
    },

    fraudScore: {
      type: Number,
      default: 0
    },

    // ================= BANK DETAILS =================
    bankName: String,
    accountNumber: String,
    accountName: String,
    branch: String,

    // ================= NOTIFICATION PREFERENCES =================
    notifyNewDonation: {
      type: Boolean,
      default: true
    },

    notifyUpdateApproval: {
      type: Boolean,
      default: true
    },

    notifyMonthlyReport: {
      type: Boolean,
      default: true
    },

    notifyDonorComments: {
      type: Boolean,
      default: true
    },

    // ================= PUBLIC VISIBILITY =================
    showDonorNames: {
      type: Boolean,
      default: true
    },

    publicDashboard: {
      type: Boolean,
      default: true
    },

    enableContactForm: {
      type: Boolean,
      default: true
    },

    // ================= ACCOUNT STATUS =================
    accountStatus: {
      type: String,
      enum: ["active", "paused", "deactivated"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("NGO", ngoSchema);