const apiMessages = require("../shared/apiMessages");
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const conf = require("../shared/config")();
const Admin = require("../models/admin");

const adminsController = {
  signIn: (req, res) => {
    const username = req.body.username;
    const password = md5(req.body.password);
    Admin.findOne({ username: username, password: password }).exec(
      (err, admin) => {
        if (admin) {
          const ret = apiMessages.getResponseByCode(1022);
          ret.adminToken = jwt.sign(
            { username: username },
            conf.jsonWebTokenSecret,
            {
              expiresIn: 60 * 60 * 12,
            }
          );
          ret.adminLevel = admin.level;
          res.status(ret.status).json(ret);
        } else {
          const ret = apiMessages.getResponseByCode(1023);
          res.status(ret.status).json(ret);
        }
      }
    );
  },
};

module.exports = adminsController;
