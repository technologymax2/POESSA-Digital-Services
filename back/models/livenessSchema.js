const mongoose = require("mongoose");

const livenessSchema = new mongoose.Schema(
  {
    faydaNumber: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    name: { 
      type: String, 
      default: "ስም አልተጠቀሰም" 
    }, 
    phone: { 
      type: String, 
      default: "የሌለ" 
    },
    // 🌟 በፍሮንትኤንድ ካሉት 'idPhotoUrl' እና 'selfiePhotoUrl' ጋር እንዲገጥም ስማቸው ተስተካክሏል
    idPhotoUrl: { 
      type: String, 
      default: "" 
    },
    selfiePhotoUrl: { 
      type: String, 
      default: "" 
    },
    faceMatched: { 
      type: Boolean, 
      default: false 
    },
    // 🌟 አዲስ የተጨመረ፦ የፊት መመሳሰል መጠን በቁጥር (AI Score) ለመያዝ
    matchPercentage: { 
      type: Number, 
      default: 0 
    },
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
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Failed"], // 🟢 'Failed' ከሪፖርት ገጹ ጋር ፍጹም ይገጥማል
      default: "Pending",
    },
    comment: { 
      type: String, 
      default: "" 
    }, 
    lastVerificationDate: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true } // ይህ በራሱ createdAt እና updatedAt ጊዜያትን ይመዘግባል
);

const LivenessVerification = mongoose.models.LivenessVerification || mongoose.model("LivenessVerification", livenessSchema);
module.exports = LivenessVerification;
