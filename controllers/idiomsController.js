// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Idiom = require('./../models/idiom');

// The controller itself.
const idiomsController = {

  getAll: (req, res) => {
    Idiom.find({})
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

module.exports = idiomsController;
