const apiMessages = require('./../shared/apiMessages');
const User = require('./../models/user');

const usersController = {
  getOne: (req, res) => {
    const userId = req.params.userId;
    User.findOne({ _id: userId })
    .exec((errGetOne, user) => {
      if (errGetOne) {
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      if (user) {
        const ret = apiMessages.getResponseByCode(1014);
        ret.result = user;
        res.status(ret.status).json(ret);  
      } else {
        const ret = apiMessages.getResponseByCode(65);
        res.status(ret.status).json(ret);
      }
    })
  },
};

module.exports = usersController;
