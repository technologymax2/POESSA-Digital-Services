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

    // 👤 አዲስ የተጨመሩ የደህንነትና የተጠያቂነት መስኮች (Audit Logs)
    registeredBy: { type: String, default: "ያልታወቀ ባለሙያ" }, // መረጃውን የመዘገበው ባለሙያ ስም
    updatedBy: { type: String },                            // መረጃውን ለመጨረሻ ጊዜ ያረመው ባለሙያ ስም
    lastUpdatedAt: { type: Date }                            // መረጃው የመጨረሻው ማሻሻያ የተደረገበት ሰዓት
  },
  { timestamps: true } // ይህ በራሱ createdAt እና updatedAt ሰዓቶችን ይመዘግባል
);

// ለይቶ ለማወቅ በዳታቤዙ ላይ "UserPensioner" በሚል ስም እንዲቀመጥ አደረግነው
module.exports = mongoose.models.UserPensioner || mongoose.model("UserPensioner", UserPensionerSchema);
