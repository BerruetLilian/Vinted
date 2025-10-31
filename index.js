require("dotenv").config();

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cors = require("cors");
const express = require("express");
const app = express();
app.use(express.json());
app.use(cors());

const userRouter = require("./routes/user");
app.use(userRouter);

const offerRouter = require("./routes/offer");
app.use(offerRouter);

app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(process.env.PORT, () => {
  console.log("server started !");
});
