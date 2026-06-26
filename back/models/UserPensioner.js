const mongoose = require("mongoose");

const VerificationHistorySchema = new mongoose.Schema(
  {
    similarity: {
      type: Number,
      default: 0,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    verifiedBy: {
      type: String,
      default: "",
    },

    verifiedAt: {
      type: Date,
      default: Date.now,
    },

    ipAddress: {
      type: String,
      default: "",
    },

    device: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const EditHistorySchema = new mongoose.Schema(
  {
    editedBy: {
      type: String,
      default: "",
    },

    editedAt: {
      type: Date,
      default: Date.now,
    },

    details: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const UserPensionerSchema = new mongoose.Schema({
  pensionerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  nameAmh: {
    type: String,
    required: true,
    trim: true,
  },

  nameEng: {
    type: String,
    required: true,
    trim: true,
  },

  tin: {
    type: String,
    default: "",
    trim: true,
  },

  phone: {
    type: String,
    required: true,
    trim: true,
  },

  age: {
    type: Number,
    required: true,
  },

  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female"],
  },

  faydaNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  poessaBranch: {
    type: String,
    default: "",
    trim: true,
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

  issueDate: {
    type: String,
    default: "",
  },

  expiryDate: {
    type: String,
    default: "",
  },

  // ImgBB Image URL
  photoUrl: {
    type: String,
    required: true,
  },

  // Face Descriptor (128 values)
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

  lastEditedBy: {
    type: String,
    default: "",
  },

  lastEditedAt: {
    type: Date,
    default: Date.now,
  },

  editHistory: {
    type: [EditHistorySchema],
    default: [],
  },

  // Face Verification History
  verificationHistory: {
    type: [VerificationHistorySchema],
    default: [],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "UserPensioner",
  UserPensionerSchema
);
