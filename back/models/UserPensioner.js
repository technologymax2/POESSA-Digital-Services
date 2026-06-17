const mongoose = require("mongoose");

const UserPensionerSchema = new mongoose.Schema({
  pensionerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tin: { type: String, default: "" },
  phone: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  faydaNumber: { type: String, required: true, unique: true },
  poessaBranch: { type: String, default: "" },
  bankName: { type: String, default: "" },
  bankBranch: { type: String, default: "" },
  pensionAmount: { type: Number, required: true },
  address: { type: String, required: true },
  issueDate: { type: String },
  expiryDate: { type: String },
  photoUrl: { type: String, required: true }, 
  
  // 🟢 4ኛ ጥያቄ፡ ሰውየው ከሞተ passive ካልሞተ active እና ቀኑን መመዝገቢያ
  status: { 
    type: String, 
    enum: ["Active", "Passive"], 
    default: "Active" 
  },
  statusChangedDate: { type: Date, default: Date.now },

  // 🟢 2ኛ ጥያቄ፡ CRUD (የመጨረሻ ማሻሻያ) ያደረገውን ባለሙያ እና ሰዓት መመዝገቢያ
  registeredBy: { type: String, required: true }, // መጀመሪያ የመዘገበው ባለሙያ
  lastEditedBy: { type: String, default: "" },    // ለመጨረሻ ጊዜ ያረመው ባለሙያ
  lastEditedAt: { type: Date, default: Date.now }, // ለመጨረሻ ጊዜ የታረመበት ሰዓት
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserPensioner", UserPensionerSchema);
