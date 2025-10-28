const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://Berruet:26092014@cluster0.akbdjcd.mongodb.net/Vinted"
);
const express = require("express");
const app = express();
app.use(express.json());

const userRouter = require("./routes/user");
app.use(userRouter);

app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(3000, () => {
  console.log("server started !");
});
