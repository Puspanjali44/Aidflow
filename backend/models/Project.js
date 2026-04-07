const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    goalAmount: {
      type: Number,
      required: true,
    },

    raisedAmount: {
      type: Number,
      default: 0,
    },

    // ================= MEDIA =================
    image: {
      type: String,
      default: null,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // ================= LOCATION =================
    location: {
      type: String,
      default: "",
      trim: true,
    },

    lat: {
      type: Number,
      default: null,
    },

    lng: {
      type: Number,
      default: null,
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: [
        "draft",
        "under_review",
        "active",
        "paused",
        "completed",
        "rejected",
      ],
      default: "draft",
    },

    donorCount: {
      type: Number,
      default: 0,
    },

    // ================= RELATION =================
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      required: true,
    },

    // ================= TRANSPARENCY =================
    totalSpent: {
      type: Number,
      default: 0,
    },

    // ================= FRAUD / ADMIN REVIEW =================
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);