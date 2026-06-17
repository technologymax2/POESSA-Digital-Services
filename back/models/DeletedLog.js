const mongoose = require("mongoose");

const DeletedLogSchema = new mongoose.Schema({
  faydaNumber: { type: String, required: true }, 
  pensionerName: { type: String, required: true }, 
  deletedBy: { type: String, required: true },    // 🟢 3ኛ ጥያቄ፡ ያጠፋው ባለሙያ ስም
  deletedAt: { type: Date, default: Date.now }    // 🟢 3ኛ ጥያቄ፡ የጠፋበት ቀንና ሰዓት
});

module.exports = mongoose.model("DeletedLog", DeletedLogSchema);
