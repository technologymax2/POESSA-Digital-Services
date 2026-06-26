const mongoose = require("mongoose");

const UserPensionerSchema = new mongoose.Schema({
  pensionerId: { type: String, required: true, unique: true },
  nameAmh: { type: String, required: true },
  nameEng: { type: String, required: true },
  tin: { type: String, default: "" },
  phone: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ["Male", "Female"] },
  faydaNumber: { type: String, required: true, unique: true },
  photoUrl: { type: String, required: true },
  
  // 🌟 Face Recognition Field
  faceDescriptor: {
    type: [Number],
    required: true,
  },
  
  registeredBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserPensioner", UserPensionerSchema);
