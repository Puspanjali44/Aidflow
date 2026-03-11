const mongoose = require("mongoose");

const updateSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    description: String,
    expenseUsed: Number,
    expenseCategory: String,
    photos: [String],
    videoProof: String,
    impactReport: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Update", updateSchema);