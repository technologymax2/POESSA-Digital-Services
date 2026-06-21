const mongoose = require("mongoose");

const livenessSchema = new mongoose.Schema({
  // የፋይዳ ቁጥር - መደጋገም እንዲችል unique: true ተወግዷል
  faydaNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  
  // የጡረተኛው ስም (አማራጭ)
  name: { 
    type: String, 
    default: "ስም አልተጠቀሰም" 
  },
  
  // የምስል ሊንኮች
  idPhotoUrl: { type: String },
  selfiePhotoUrl: { type: String },
  
  // የባዮሜትሪክስ ፈተና ውጤቶች
  faceMatched: { type: Boolean, default: false },
  matchPercentage: { type: Number, default: 0 },
  smilePassed: { type: Boolean, default: false },
  nodPassed: { type: Boolean, default: false },
  
  // የሂደት ሁኔታ
  verificationStatus: { 
    type: String, 
    enum: ["Pending", "Verified", "Failed"], 
    default: "Pending" 
  },
  
  // ባለሙያው የሚሰጠው አስተያየት
  comment: String
}, { 
  // በየጊዜው የሚደረጉትን ሙከራዎች ለመለየት ጊዜውን በራስ-ሰር ይይዛል
  timestamps: true 
});

// ለኤክስፖርት የሚዘጋጅ ሞዴል
module.exports = mongoose.model("LivenessVerification", livenessSchema);
