// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/helperFunctions').nowUtc;
const Language = require('./../models/language');

// The controller itself.
const languagesController = {

  getAll: (req, res) => {
    Language.find({})
    .sort({ name: 1 })
    .then((items) => {
      if (items) {
        const ret = apiMessages.getResponseByCode(1021);
        ret.result = items;
        res.status(ret.status).json(ret);
      } else {
        const ret = apiMessages.getResponseByCode(66);
        res.status(ret.status).json(ret);
      }
    })
    .catch((err) => {
      console.log(err);
      const ret = apiMessages.getResponseByCode(1);
      res.status(ret.status).json(ret);
    });
  }

};

module.exports = languagesController;
