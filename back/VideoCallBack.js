const express = require("express");
const router = express.Router();

const Pensioner = require("./models/Pensioner");

/*
GET
/api/video/pensioner/:search
*/

router.get("/pensioner/:search", async (req, res) => {
  try {

    const keyword = req.params.search.trim();

    const pensioner = await Pensioner.findOne({
      $or: [
        { pensionerId: keyword },
        { faydaNumber: keyword }
      ]
    });

    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "Pensioner not found"
      });
    }

    res.json({
      success: true,
      data: pensioner
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

module.exports = router;
