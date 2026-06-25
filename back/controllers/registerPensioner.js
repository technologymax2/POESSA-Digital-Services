// controllers/registerPensioner.js

const UserPensioner =
  require("../models/UserPensioner");

const {
  getDescriptor,
} = require("../services/face.service");

exports.registerPensioner =
async (req, res) => {

  try {

    const data = req.body;

    const descriptor =
      await getDescriptor(
        data.photoUrl
      );

    const pensioner =
      await UserPensioner.create({

        ...data,

        faceDescriptor:
          descriptor,
      });

    return res.status(201).json({
      success: true,
      pensioner,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};
