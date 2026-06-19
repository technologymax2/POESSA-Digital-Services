const mongoose = require("mongoose");

const livenessSchema = new mongoose.Schema(
  {
    faydaNumber: {
      type: String,
      required: true,
    },

    idPhoto: {
      type: String,
      default: "",
    },

    selfiePhoto: {
      type: String,
      default: "",
    },

    faceMatched: {
      type: Boolean,
      default: false,
    },

    smilePassed: {
      type: Boolean,
      default: false,
    },

    nodPassed: {
      type: Boolean,
      default: false,
    },

    turnPassed: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Failed"],
      default: "Pending",
    },

    lastVerificationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LivenessVerification",
  livenessSchema
);
