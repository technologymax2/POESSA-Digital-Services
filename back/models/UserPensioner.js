const mongoose = require("mongoose");

const UserPensionerSchema = new mongoose.Schema({
  pensionerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tin: String,
  phone: String,
  age: Number,
  gender: String,
  faydaNumber: { type: String, required: true, unique: true },
  poessaBranch: String,
  bankName: String,
  bankBranch: String,
  pensionAmount: Number,
  address: String,
  issueDate: String,
  expiryDate: String,
  photoUrl: { type: String, required: true }, // ImgBB ሊንክ እዚህ ይቀመጣል
  registeredBy: String,
  updatedBy: String,
  lastUpdatedAt: Date,
  registeredBy: String,
  lastEditedBy: String,
  lastAction: String, // 'Created', 'Updated', 'Deleted'
  lastActionTime: { type: Date, default: Date.now }
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserPensioner", UserPensionerSchema);
