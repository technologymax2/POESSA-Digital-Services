const mongoose = require("mongoose");

const UserPensionerSchema = new mongoose.Schema({
  pensionerId: { type: String, required: true, unique: true },
  nameAmh: { type: String, required: true }, // አማርኛ ስም
  nameEng: { type: String, required: true }, // እንግሊዝኛ ስም
  tin: { type: String, default: "" },
  phone: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  faydaNumber: { type: String, required: true, unique: true },
  poessaBranch: { type: String, default: "" },
  bankNameAmh: { type: String, default: "" }, // አማርኛ ባንክ
  bankNameEng: { type: String, default: "" }, // እንግሊዝኛ ባንክ
  bankBranch: { type: String, default: "" },
  pensionAmount: { type: Number, required: true },
  addressAmh: { type: String, required: true }, // አማርኛ አድራሻ
  addressEng: { type: String, required: true }, // እንግሊዝኛ አድራሻ
  issueDate: { type: String },
  expiryDate: { type: String },
  photoUrl: { type: String, required: true }, 
  status: { type: String, enum: ["Active", "Passive"], default: "Active" },
  statusChangedDate: { type: Date, default: Date.now },
  registeredBy: { type: String, required: true }, 
  lastEditedBy: { type: String, default: "" },    
  lastEditedAt: { type: Date, default: Date.now }, 
  // በ UserPensioner.js
faceDescriptor: { type: [Number], default: [] },

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
