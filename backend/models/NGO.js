const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    registrationNumber: {
      type: String
    },

    verified: {
      type: Boolean,
      default: false
    },

    transparencyScore: {
      type: Number,
      default: 0
    },

    fraudScore: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("NGO", ngoSchema);