const apiMessages = require('./../shared/apiMessages');
const getUserByToken = require('./../shared/getUserByToken');

// Adds to request a property called userId that contains
// the _id of the user.
function googleTokenValidator(req, res, next) {
  const userToken = req.query.token;
  if (!userToken) {
    const ret = apiMessages.getResponseByCode(2);
    res.status(ret.status).json(ret);      
  }
  getUserByToken(userToken)
  .then(userLogged => {
    if (userLogged._id) {
      req.userId = userLogged._id;
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