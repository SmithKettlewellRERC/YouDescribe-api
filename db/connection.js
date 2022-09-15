const mongoose = require("mongoose");
// const config = require("./config");

var DB_HOST = "localhost";

if(process.env.DB_HOST != null && process.env.DB_HOST.length > 0) {
  DB_HOST = process.env.DB_HOST;
}

//deployment
//mongodb://${config.username}:${config.password}@${config.hostname}/${config.database}
//local
//mongodb://localhost:27017/youdescribe
const db = mongoose.connect(
  `mongodb://youdescribe:E2E32fgklsdfiefwefmm6gyT@${DB_HOST}:27020/youdescribe`,
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
