const mongoose = require("mongoose");
const config = require("./config");

const db = mongoose.connect(
  `mongodb://localhost:27017/youdescribe`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  },
  err => {
    if (err) return console.error(err);
    console.log("connected to mongoDB");
  }
);

module.exports = db;
