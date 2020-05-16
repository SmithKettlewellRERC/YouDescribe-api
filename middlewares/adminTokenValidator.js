const jwt = require("jsonwebtoken");
const conf = require("../shared/config")();

function adminTokenValidator(req, res, next) {
  const token = req.header("Authorization");
  jwt.verify(token, conf.jsonWebTokenSecret, function(err, decoded) {
    if (err) {
      console.log(err.message);
      res.status(401).json({});
      return;
    } else {
      next();
    }
  });
}

module.exports = adminTokenValidator;
