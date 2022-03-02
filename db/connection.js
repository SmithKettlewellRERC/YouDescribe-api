const mongoose = require("mongoose");
const config = require("./config");

//deployment
//mongodb://${config.username}:${config.password}@${config.hostname}/${config.database}
//local
//mongodb://localhost:27017/youdescribe
const db = mongoose.connect(
  `mongodb://youdescribe:E2E32fgklsdfiefwefmm6gyT@localhost:27020/youdescribe`,
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
