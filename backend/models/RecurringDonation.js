const mongoose = require("mongoose");

const recurringDonationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
    baseAmount: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "NPR",
    },

    donorName: {
      type: String,
      default: "",
    },
    receiptName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "Nepal",
    },

    interval: {
      type: String,
      enum: ["monthly"],
      default: "monthly",
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "PAUSED", "CANCELLED", "FAILED"],
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    provider: {
      type: String,
      enum: ["khalti"],
      default: "khalti",
    },

    providerReference: {
      type: String,
      default: null,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },
    lastChargedAt: {
      type: Date,
      default: null,
    },
    nextBillingDate: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecurringDonation", recurringDonationSchema);