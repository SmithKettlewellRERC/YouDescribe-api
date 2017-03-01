const constants = require('./../config/constants');
const Video = require('./../models/video');

const videosController = {
  addOne: () => {
  },

  findOne: (req, res) => {
    const id = req.params.id;

    Video.findOne({ external_media_id: id })

    .then((doc) => {
      if (doc) {
        const ret = constants.RESPONSE_SUCCESS_WITH_DATA;
        ret.data = doc;
        res.status(ret.status).json(ret);
      } else {
        const ret = constants.RESPONSE_ERROR_DATA_NOT_FOUND;
        ret.requested_id = id;
        res.status(ret.status).json(ret);
      }
    })

    .catch((err) => {
      console.log(err);
      const ret = constants.RESPONSE_ERROR_INTERNAL_SERVER_ERROR;
      res.status(ret.status).json(ret);
    });
  },
};

module.exports = videosController;
