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
  
  // የህይወት ሁኔታ
  status: { 
    type: String, 
    enum: ["Active", "Passive"], 
    default: "Active" 
  },
  statusChangedDate: { type: Date, default: Date.now },

  // CRUD ኦዲት መከታተያ
  registeredBy: { type: String, required: true }, 
  lastEditedBy: { type: String, default: "" },    
  lastEditedAt: { type: Date, default: Date.now }, 
  
  // 🔥 ፊክስ፦ የሁሉንም የለውጥ ታሪክ ዝርዝር (Array) አድርገን የያዝንበት ክፍል
  editHistory: [
    {
      editedBy: { type: String },
      editedAt: { type: Date, default: Date.now },
      details: { type: String }
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserPensioner", UserPensionerSchema);
