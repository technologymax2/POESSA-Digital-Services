const express = require("express");

const router = express.Router();

const LivenessVerification = require("./models/livenessSchema");


// Save successful verification
router.post("/verify-success", async (req, res) => {
  try {

    const {
      faydaNumber,
      idPhoto,
      selfiePhoto,
      faceMatched,
      smilePassed,
      nodPassed,
      turnPassed
    } = req.body;

    let record =
      await LivenessVerification.findOne({
        faydaNumber
      });

    if (!record) {

      record = new LivenessVerification({
        faydaNumber
      });

    }

    record.idPhoto = idPhoto;

    record.selfiePhoto = selfiePhoto;

    record.faceMatched = faceMatched;

    record.smilePassed = smilePassed;

    record.nodPassed = nodPassed;

    record.turnPassed = turnPassed;

    record.verificationStatus = "Verified";

    record.lastVerificationDate = new Date();

    await record.save();

    res.status(200).json({
      success: true,
      message: "Verification completed successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});


// Get one pensioner verification
router.get("/:faydaNumber", async (req, res) => {

  try {

    const record =
      await LivenessVerification.findOne({
        faydaNumber: req.params.faydaNumber
      });

    if (!record) {

      return res.status(404).json({
        success: false,
        message: "Record not found"
      });

    }

    res.json(record);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


// Alive pensioners list
router.get("/", async (req, res) => {

  try {

    const alive =
      await LivenessVerification.find({
        verificationStatus: "Verified"
      }).sort({
        lastVerificationDate: -1
      });

    res.json(alive);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

module.exports = router;
