const mongoose = require("mongoose");

const UserPensionerSchema = new mongoose.Schema(
  {
    pensionerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    faydaNumber: { type: String, required: true, unique: true },
    tin: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    poessaBranch: { type: String, required: true },
    bankName: { type: String, required: true },
    bankBranch: { type: String, required: true },
    pensionAmount: { type: Number, required: true },
    photoUrl: { type: String, required: true },

    // ➕ በምስሉ ላይ የጎደሉ እና ወደ ዳታቤዝ እንዲገቡ የተጨመሩ (አዲስ)
    address: { type: String, default: "" },       // አድራሻ ባዶ ሆኖ ቢመጣ እንዳይዘጋው default ተደርጓል
    issueDate: { type: String, default: "" },     // የተሰጠበት ቀን
    expiryDate: { type: String, default: "" },    // የማብቂያ ጊዜ

    // 👤 የደህንነትና የተጠያቂነት መስኮች (Audit Logs)
    registeredBy: { type: String, default: "ያልታወቀ ባለሙያ" }, 
    updatedBy: { type: String },                            
    lastUpdatedAt: { type: Date }                            
  },
  { timestamps: true } 
);

module.exports = mongoose.models.UserPensioner || mongoose.model("UserPensioner", UserPensionerSchema);
