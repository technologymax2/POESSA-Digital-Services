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

    // ➕ አድራሻ እና ቀናት (ባዶ እንዳይሆኑ ጥበቃ ተደርጓል)
    address: { type: String, default: "" },       
    issueDate: { type: String, default: "" },     
    expiryDate: { type: String, default: "" },    

    // 👤 የደህንነትና የተጠያቂነት መስኮች (Audit Logs)
    registeredBy: { type: String, default: "ያልታወቀ ባለሙያ" }, 
    updatedBy: { type: String },                            
    lastUpdatedAt: { type: Date }                            
  },
  { timestamps: true } // ይህ በራሱ createdAt እና updatedAt ቀናትን ይይዛል
);

// 🚨 ማስተካከያ፡ ለ Express.js ትክክለኛው እና ቀጥተኛው ኤክስፖርት ማድረጊያ መንገድ ይህ ነው፦
module.exports = mongoose.model("UserPensioner", UserPensionerSchema);
