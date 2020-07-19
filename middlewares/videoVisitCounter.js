const Visit = require("./../models/visit");
const nowUtc = require("./../shared/helperFunctions").nowUtc;

function videoVisitCounter(req, res, next) {
  const ip = req.ip;
  new Visit({
    ip: ip,
    youtube_id: req.params.id || req.params.youTubeId,
    connection: ip + "-" + req.header("Visit"),
    url: req.header("Referer"),
    created_at: nowUtc(),
  }).save();
  next();
}

module.exports = videoVisitCounter;
