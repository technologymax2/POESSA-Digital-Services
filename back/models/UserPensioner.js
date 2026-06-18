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
  
  // 🟢 የህይወት ሁኔታ እና የተቀየረበት ቀን
  status: { 
    type: String, 
    enum: ["Active", "Passive"], 
    default: "Active" 
  },
  statusChangedDate: { type: Date, default: Date.now },

  // 🟢 CRUD (የታሪክ መዝገብ)
  registeredBy: { type: String, required: true }, // መጀመሪያ የመዘገበው ባለሙያ
  lastEditedBy: { type: String, default: "" },    // ለመጨረሻ ጊዜ ያረመው ባለሙያ
  lastEditedAt: { type: Date, default: Date.now }, // ለመጨረሻ ጊዜ የታረመበት ሰዓት
  
  // 🔥 ፊክስ፦ የእርማት ዝርዝር መግለጫ (CRUD Log ጽሑፍ) በፍሮንትኤንድ እንዲታይ ይህ መስመር የግድ ያስፈልጋል!
  editHistory: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserPensioner", UserPensionerSchema);
