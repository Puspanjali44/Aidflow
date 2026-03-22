const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null   // allow guest donations (not logged in)
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    amount: {
      type: Number,
      required: true  // total charged (baseAmount + platformFee)
    },

    // ── new fields for the donate modal ──
    baseAmount:   { type: Number },
    platformFee:  { type: Number, default: 0 },
    donationType: { type: String, enum: ["one-time", "monthly"], default: "one-time" },
    donorName:    { type: String },
    receiptName:  { type: String },
    email:        { type: String },
    message:      { type: String },
    anonymous:    { type: Boolean, default: false },
    address:      { type: String },
    city:         { type: String },
    country:      { type: String },

    paymentStatus: {
      type: String,
      enum: ["SUCCESS_SIMULATED", "FAILED"],
      default: "SUCCESS_SIMULATED"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);