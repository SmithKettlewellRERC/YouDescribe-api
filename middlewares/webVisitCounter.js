const Visit = require("./../models/visit");
const nowUtc = require("./../shared/helperFunctions").nowUtc;

function webVisitCounter(req, res, next) {
  const ip = req.ip;
  //console.log(ip);
  new Visit({
    ip: ip,
    youtube_id: "",
    connection: ip + "-" + req.header("Visit"),
    url: req.header("Referer"),
    created_at: nowUtc()
  }).save();
  next();
}

module.exports = webVisitCounter;
