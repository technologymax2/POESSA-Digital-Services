// models/UserPensioner.js

const mongoose = require("mongoose");

const UserPensionerSchema = new mongoose.Schema({
  pensionerId: {
    type: String,
    required: true,
    unique: true,
  },

  nameAmh: {
    type: String,
    required: true,
  },

  nameEng: {
    type: String,
    required: true,
  },

  tin: {
    type: String,
    default: "",
  },

  phone: {
    type: String,
    required: true,
  },

  age: {
    type: Number,
    required: true,
  },

  gender: {
    type: String,
    required: true,
  },

  faydaNumber: {
    type: String,
    required: true,
    unique: true,
  },

  poessaBranch: {
    type: String,
    default: "",
  },

  bankNameAmh: {
    type: String,
    default: "",
  },

  bankNameEng: {
    type: String,
    default: "",
  },

  bankBranch: {
    type: String,
    default: "",
  },

  pensionAmount: {
    type: Number,
    required: true,
  },

  addressAmh: {
    type: String,
    required: true,
  },

  addressEng: {
    type: String,
    required: true,
  },

  issueDate: String,
  expiryDate: String,

  photoUrl: {
    type: String,
    required: true,
  },

  faceDescriptor: {
    type: [Number],
    default: [],
  },

  status: {
    type: String,
    enum: ["Active", "Passive"],
    default: "Active",
  },

  statusChangedDate: {
    type: Date,
    default: Date.now,
  },

  registeredBy: {
    type: String,
    required: true,
  },

  verificationHistory: [
    {
      similarity: Number,
      verified: Boolean,
      verifiedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "UserPensioner",
  UserPensionerSchema
);
