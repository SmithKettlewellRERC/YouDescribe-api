// Application modules.
const apiMessages = require('./../shared/apiMessages');
const Video = require('./../models/video');
const nowUtc = require('./../shared/dateTime').nowUtc;

// The controller itself.
const videosController = {

  addOne: (req, res) => {
    const id = req.body.id;
    Video.findOne({ _id: id })
    .then((video) => {
      if (video) {
        const ret = apiMessages.getResponseByCode(56);
        res.status(ret.status).json(ret);
      } else {
        const newVideoData = {
          _id: id,
          status: 'published',
          views: 0,
          created_at: nowUtc(),
          updated_at: nowUtc(),
          language: 1,
          title: req.body.title,
          notes: req.body.notes,
          audio_descriptions: {},
        };
        const newVideo = new Video(newVideoData);
        newVideo.save()
        .then((newVideoSaved) => {
          const ret = apiMessages.getResponseByCode(1003);
          ret.result = newVideoSaved;
          res.status(ret.status).json(ret);
        })
        .catch((err3) => {
          console.log(err3);
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        })
      }
    })
    .catch((err) => {
      console.log(err);
      const ret = apiMessages.getResponseByCode(1);
      res.status(ret.status).json(ret);
    });    
  },

  updateOne: (req, res) => {
    const id = req.params.id;
    const notes = req.body.notes;

    Video.findOneAndUpdate({ _id: id }, { $set: { notes } }, { new: true }, (err, video) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      if (video) {
        const ret = apiMessages.getResponseByCode(1004);
        ret.result = video;
        res.status(ret.status).json(ret);
      } else {
        const ret = apiMessages.getResponseByCode(57);
        res.status(ret.status).json(ret);
      }
    });
  },

  getOne: (req, res) => {
    const _id = req.params.id;
    Video.findOne({ _id })
    .then((video) => {
      if (video) {
        const ret = apiMessages.getResponseByCode(1000);
        ret.result = video;
        res.status(ret.status).json(ret);
      } else {
        const ret = apiMessages.getResponseByCode(55);
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
