const express = require("express");
const router = express.Router();
const User = require("../models/User");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const fileUpload = require("express-fileupload");
const convertToBase64 = require("../utils/convertToBase64");
const cloudinary = require("cloudinary").v2;

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    if (!req.body.username) {
      return res.status(400).json({ message: "No username given" });
    }
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ message: "Email already used" });
    }
    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(64);
    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: null,
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });
    if (req.files.picture) {
      const pictureToUpload = convertToBase64(req.files.picture);

      const result = await cloudinary.uploader.upload(pictureToUpload, {
        asset_folder: "/vinted/avatar/",
        display_name: newUser._id,
      });
      newUser.account.avatar = result;
    }
    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ messgae: "server error", error: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized authentification" });
    }
    const hash = SHA256(req.body.password + user.salt).toString(encBase64);
    if (user.hash === hash) {
      res.status(200).json({
        _id: user._id,
        token: user.token,
        account: { username: user.account.username },
      });
    } else {
      return res.status(401).json({ message: "Unauthorized authentification" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ messgae: "server error", error: error.message });
  }
});

module.exports = router;
