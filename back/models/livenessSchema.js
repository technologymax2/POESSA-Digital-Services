const mongoose = require("mongoose");

const livenessSchema = new mongoose.Schema(
  {
    faydaNumber: { type: String, required: true, unique: true }, // unique: true መጨመር ይመከራል
    idPhoto: { type: String, default: "" },
    selfiePhoto: { type: String, default: "" },
    faceMatched: { type: Boolean, default: false },
    smilePassed: { type: Boolean, default: false },
    nodPassed: { type: Boolean, default: false },
    turnPassed: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Failed"],
      default: "Pending",
    },
    lastVerificationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ይህ አሰራር "OverWriteModelError" እንዳይፈጠር ይከላከላል
const LivenessVerification = mongoose.models.LivenessVerification || mongoose.model("LivenessVerification", livenessSchema);

module.exports = LivenessVerification;
