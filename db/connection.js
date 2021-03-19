const mongoose = require("mongoose");
const config = require("./config");

const db = mongoose.connect(
  `mongodb://${config.username}:${config.password}@${config.hostname}/${config.database}`,
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
