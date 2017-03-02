// System modules.
const fs = require('fs');

// Application modules.
const apiMessages = require('./../shared/apiMessages');
const Video = require('./../models/video');

// The controller itself.
const videosController = {
  addOne: (req, res) => {},

  getOne: (req, res) => {
    const id = req.params.id;
    Video.findOne({ external_media_id: id })
    .then((video) => {
      if (video) {
        const ret = apiMessages.getResponseByCode(1000);
        ret.result = video;
        res.status(ret.status).json(ret);
      } else {
        const ret = apiMessages.getResponseByCode(53);
        res.status(ret.status).json(ret);
      }
    })
    .catch((err) => {
      console.log(err);
      const ret = apiMessages.getResponseByCode(1);
      res.status(ret.status).json(ret);
    });
  },
};

module.exports = videosController;
