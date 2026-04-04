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

    recurringDonation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringDonation",
      default: null,
    },

    amount: {
      type: Number,
      required: true,
    },

    baseAmount: {
      type: Number,
      default: 0,
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

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    providerReference: {
      type: String,
      default: null,
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

    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);