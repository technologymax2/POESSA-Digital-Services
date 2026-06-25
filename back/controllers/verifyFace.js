// controllers/verifyFace.js

const UserPensioner =
 require("../models/UserPensioner");

const {
 getDescriptor,
 compareDescriptors,
} = require(
 "../services/face.service"
);

exports.verifyFace =
async (req, res) => {

 try {

  const {
   faydaNumber,
   livePhotoUrl,
  } = req.body;

  const pensioner =
   await UserPensioner.findOne({
    faydaNumber,
   });

  if (!pensioner) {

   return res.status(404).json({
    success: false,
    message:
      "Pensioner not found",
   });
  }

  const liveDescriptor =
   await getDescriptor(
    livePhotoUrl
   );

  const result =
   compareDescriptors(
    pensioner.faceDescriptor,
    liveDescriptor
   );

  pensioner
   .verificationHistory
   .push({
    similarity:
      result.similarity,

    verified:
      result.verified,
   });

  await pensioner.save();

  return res.json({

   success: true,

   pensionerId:
     pensioner.pensionerId,

   fullName:
     pensioner.nameEng,

   similarity:
     result.similarity,

   verified:
     result.verified,
  });

 } catch (error) {

  return res.status(500).json({
   success: false,
   message:
     error.message,
  });
 }
};
