const apiMessages = require('./../shared/apiMessages');
const User = require('../models/user');

function userTokenValidator(req, res, next) {
  const userToken = req.body.userToken;
  const userId = req.body.userId;

  if (!userToken || !userId) {
    const ret = apiMessages.getResponseByCode(2);
    res.status(ret.status).json(ret);      
  }

  User.findOne({ _id: userId, token: userToken })
  .exec((err, user) => {
    if (err) {
      console.log(err);
      const ret = apiMessages.getResponseByCode(1);
      res.status(ret.status).json(ret);
    }
    if (user) {
      next();
    } else {
      const ret = apiMessages.getResponseByCode(63);
      res.status(ret.status).json(ret);
    }
  });
}

module.exports = userTokenValidator;
