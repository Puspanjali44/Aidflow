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

    donorName: String,
    receiptName: String,
    email: String,
    message: String,
    anonymous: {
      type: Boolean,
      default: false,
    },
    address: String,
    city: String,
    country: String,

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
    nextBillingDate: {
      type: Date,
      default: null,
    },
    lastChargedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecurringDonation", recurringDonationSchema);