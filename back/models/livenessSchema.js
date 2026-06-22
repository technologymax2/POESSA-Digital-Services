const mongoose = require("mongoose");

const livenessSchema = new mongoose.Schema(
  {
    // የፋይዳ ቁጥር
    faydaNumber: {
      type: String,
      required: true,
      trim: true
    },

    // ስም
    name: {
      type: String,
      default: "ስም አልተጠቀሰም"
    },

    // ምስሎች
    dbPhotoUrl: {
      type: String,
      default: ""
    },

    selfiePhotoUrl: {
      type: String,
      default: ""
    },

    // Face Match
    faceMatched: {
      type: Boolean,
      default: false
    },

    matchPercentage: {
      type: Number,
      default: 0
    },

    // Liveness
    smilePassed: {
      type: Boolean,
      default: false
    },

    nodPassed: {
      type: Boolean,
      default: false
    },

    turnPassed: {
      type: Boolean,
      default: false
    },

    // Verification Status
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Failed"],
      default: "Pending"
    },

    // Employee comment
    comment: {
      type: String,
      default: ""
    },

    verifiedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "LivenessVerification",
  livenessSchema
);
