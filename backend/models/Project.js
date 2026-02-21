const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    goalAmount: {
      type: Number,
      required: true
    },

    raisedAmount: {
      type: Number,
      default: 0
    },

    endDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: [
        "draft",
        "under_review",
        "active",
        "paused",
        "completed",
        "rejected"
      ],
      default: "draft"
    },

    donorCount: {
      type: Number,
      default: 0
    },

    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);