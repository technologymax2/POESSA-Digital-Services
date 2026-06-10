```javascript
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const router = express.Router();

/*
=========================================
USER MODEL
=========================================
*/

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "admin",
        "employee",
        "pensioner",
      ],
      required: true,
    },

    tinNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );

/*
=========================================
REGISTER
=========================================
*/

router.post(
  "/register",
  async (req, res) => {
    try {
      const {
        username,
        password,
        role,
        tinNumber,
      } = req.body;

      if (
        !username ||
        !password ||
        !role
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All fields are required",
        });
      }

      /*
      =========================================
      PASSWORD VALIDATION
      =========================================
      */

      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

      if (
        !passwordRegex.test(
          password
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 8 characters, uppercase, lowercase, number and symbol",
        });
      }

      /*
      =========================================
      CHECK EXISTING USER
      =========================================
      */

      const existingUser =
        await User.findOne({
          $or: [
            {
              username,
            },
            ...(tinNumber
              ? [
                  {
                    tinNumber,
                  },
                ]
              : []),
          ],
        });

      if (
        existingUser
      ) {
        return res.status(400).json({
          success: false,
          message:
            "User already exists",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user =
        new User({
          username,
          password:
            hashedPassword,
          role,
          tinNumber:
            tinNumber || null,
        });

      await user.save();

      res.status(201).json({
        success: true,
        message:
          "Registration successful",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });

    }
  }
);

/*
=========================================
LOGIN
=========================================
*/

router.post(
  "/login",
  async (req, res) => {
    try {

      const {
        username,
        password,
      } = req.body;

      if (
        !username ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Username and Password required",
        });
      }

      /*
      =========================================
      LOGIN USING
      EMAIL / USERNAME / TIN
      =========================================
      */

      const user =
        await User.findOne({
          $or: [
            {
              username,
            },
            {
              tinNumber:
                username,
            },
          ],
        });

      if (
        !user
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      /*
      =========================================
      BLOCKED ACCOUNT
      =========================================
      */

      if (
        user.isBlocked
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been blocked by administrator",
        });
      }

      /*
      =========================================
      PASSWORD CHECK
      =========================================
      */

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (
        !isMatch
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid Password",
        });
      }

      /*
      =========================================
      JWT TOKEN
      =========================================
      */

      const token =
        jwt.sign(
          {
            id: user._id,
            username:
              user.username,
            role:
              user.role,
          },
          process.env.JWT_SECRET,
          {
            expiresIn:
              "1d",
          }
        );

      /*
      =========================================
      RESPONSE
      =========================================
      */

      res.json({
        success: true,

        token,

        user: {
          id: user._id,
          username:
            user.username,
          role:
            user.role,
          tinNumber:
            user.tinNumber,
        },
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });

    }
  }
);

/*
=========================================
VERIFY TOKEN
=========================================
*/

router.get(
  "/verify",
  async (req, res) => {
    try {

      const authHeader =
        req.headers.authorization;

      if (
        !authHeader
      ) {
        return res.status(401).json({
          success: false,
        });
      }

      const token =
        authHeader.split(
          " "
        )[1];

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      res.json({
        success: true,
        user: decoded,
      });

    } catch (error) {

      res.status(401).json({
        success: false,
        message:
          "Invalid Token",
      });

    }
  }
);

module.exports = router;
```
