const mongoose = require("mongoose");
const livenessSchema = new mongoose.Schema({
  faydaNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, default: "ስም አልተጠቀሰም" },
  idPhotoUrl: String,
  selfiePhotoUrl: String,
  faceMatched: { type: Boolean, default: false },
  matchPercentage: { type: Number, default: 0 },
  smilePassed: { type: Boolean, default: false },
  nodPassed: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ["Pending", "Verified", "Failed"], default: "Pending" },
  comment: String
}, { timestamps: true });

module.exports = mongoose.model("LivenessVerification", livenessSchema);
