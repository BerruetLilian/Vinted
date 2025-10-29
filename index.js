const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://Berruet:26092014@cluster0.akbdjcd.mongodb.net/Vinted"
);
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dhzintwet",
  api_key: "838434795284545",
  api_secret: "11PqMG_bClMfqWDXQKO-dGvDSs4",
});

const express = require("express");
const app = express();
app.use(express.json());

const userRouter = require("./routes/user");
app.use(userRouter);

const offerRouter = require("./routes/offer");
app.use(offerRouter);

app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(3000, () => {
  console.log("server started !");
});
