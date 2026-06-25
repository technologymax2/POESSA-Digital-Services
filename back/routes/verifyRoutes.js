// routes/verifyRoutes.js

const express =
 require("express");

const router =
 express.Router();

const {
 verifyFace,
} = require(
 "../controllers/verifyFace"
);

router.post(
 "/verify-face",
 verifyFace
);

module.exports =
 router;
