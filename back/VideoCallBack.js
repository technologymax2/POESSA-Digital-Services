const express = require("express");
const router = express.Router();

const Pensioner = require("./models/Pensioner");

/* ==================================================
   SEARCH PENSIONER
   GET /api/video/pensioner/:search
================================================== */

router.get("/pensioner/:search", async (req, res) => {

  try {

    const keyword = req.params.search.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search value is required.",
      });
    }

    const pensioner = await Pensioner.findOne({
      $or: [
        { pensionerId: keyword },
        { faydaNumber: keyword },
      ],
    });

    if (!pensioner) {
      return res.status(404).json({
        success: false,
        message: "Pensioner not found.",
      });
    }

    res.json({
      success: true,
      data: pensioner,
    });

  } catch (err) {

    console.error("SEARCH ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

});

/* ==================================================
   GET PENSIONER BY ID
================================================== */

router.get("/pensioner/id/:id", async (req, res) => {

  try {

    const pensioner = await Pensioner.findById(
      req.params.id
    );

    if (!pensioner) {

      return res.status(404).json({
        success: false,
        message: "Pensioner not found.",
      });

    }

    res.json({
      success: true,
      data: pensioner,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

});

/* ==================================================
   VIDEO SERVER STATUS
================================================== */

router.get("/status", (req, res) => {

  res.json({
    success: true,
    service: "POESSA Video Verification",
    status: "Running",
    timestamp: new Date(),
  });

});

/* ==================================================
   EXPORT
================================================== */

module.exports = router;
