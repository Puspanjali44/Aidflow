const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["SUCCESS_SIMULATED", "FAILED"],
      default: "SUCCESS_SIMULATED"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);