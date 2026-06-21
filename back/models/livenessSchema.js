const mongoose = require("mongoose");

const livenessSchema = new mongoose.Schema(
  {
    faydaNumber: { type: String, required: true, unique: true },
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
    comment: { type: String, default: "" }, // 👈 አዲስ የተጨመረ ማሳሰቢያ ማስቀመጫ
    lastVerificationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const LivenessVerification = mongoose.models.LivenessVerification || mongoose.model("LivenessVerification", livenessSchema);
module.exports = LivenessVerification;
