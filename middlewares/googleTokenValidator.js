const apiMessages = require('./../shared/apiMessages');
const getUserByToken = require('./../shared/getUserByToken');

function googleTokenValidator(req, res, next) {
  const userToken = req.query.token;
  if (!userToken) {
    const ret = apiMessages.getResponseByCode(2);
    res.status(ret.status).json(ret);      
  }
  getUserByToken(userToken)
  .then(userLogged => {
    if (userLogged._id) {
      next();
    } else {
      const ret = apiMessages.getResponseByCode(63);
      res.status(ret.status).json(ret);
    }
  })
  .catch((errGetUserByToken) => {
    console.log(errGetUserByToken)
    const ret = apiMessages.getResponseByCode(1);
    res.status(ret.status).json(ret);
  });
}

module.exports = googleTokenValidator;