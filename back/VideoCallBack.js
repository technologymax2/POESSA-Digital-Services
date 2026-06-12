const express = require("express");
const router = express.Router();
const User = require("./models/User");

router.get("/tin/:tin", async (req, res) => {
  try {
    const pensioner = await User.findOne({
      tinNumber: req.params.tin,
      role: "pensioner"
    });

    if (!pensioner) {
      return res.status(404).json({
        message: "Pensioner not found"
      });
    }

    res.json({
      _id: pensioner._id,
      username: pensioner.username,
      tinNumber: pensioner.tinNumber
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;