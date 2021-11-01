const mongoose = require("mongoose");

require("dotenv").config();

let url = `mongodb://${process.env.DB_username}:${process.env.DB_password}@${process.env.DB_hostname}/${process.env.DB_database}`;

console.log(url);

const db = mongoose.connect(
  url,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  (err) => {
    if (err) return console.error(err);
    console.log("connected to mongoDB");
  }
);

module.exports = db;
