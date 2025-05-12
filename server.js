const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
require("dotenv").config();
const bodyParser = require("body-parser");
const userRouter = require("./routes/user");
const projectRouter = require("./routes/project");
const adminRouter = require("./routes/admin");
const postRouter = require("./routes/post");
const app = express();
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.jfshk.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).any()
);

app.use("/users", userRouter);
app.use("/admin", projectRouter);
app.use("/admin", adminRouter);
app.use("/projects", projectRouter);
app.use("/projects", adminRouter);
app.use("/posts", postRouter);
mongoose
  .connect(uri)
  .then((reuslt) => {
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });
