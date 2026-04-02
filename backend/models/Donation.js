const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
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
    },

    platformFee: {
      type: Number,
      default: 0,
    },

    donationType: {
      type: String,
      enum: ["one-time", "monthly"],
      default: "one-time",
    },

    donorName: {
      type: String,
    },

    receiptName: {
      type: String,
    },

    email: {
      type: String,
    },

    message: {
      type: String,
    },

    anonymous: {
      type: Boolean,
      default: false,
    },

    address: {
      type: String,
    },

    city: {
      type: String,
    },

    country: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    khaltiPidx: {
      type: String,
      default: "",
    },

    khaltiPaymentUrl: {
      type: String,
      default: "",
    },

    khaltiPurchaseOrderId: {
      type: String,
      default: "",
    },

    khaltiTransactionId: {
      type: String,
      default: "",
    },

    isRecurring: {
      type: Boolean,
      default: false,
    },

    frequency: {
      type: String,
      enum: ["monthly", null],
      default: null,
    },

    recurringStatus: {
      type: String,
      enum: ["active", "cancelled", null],
      default: null,
    },

    nextChargeDate: {
      type: Date,
      default: null,
    },

    lastChargedAt: {
      type: Date,
      default: null,
    },

    parentDonation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);