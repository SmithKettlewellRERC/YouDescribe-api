// Application modules.
const apiMessages = require('./../shared/apiMessages');
const Video = require('./../models/video');
const AudioDescription = require('./../models/audioDescription');
const User = require('./../models/user');
const AudioClip = require('./../models/audioClip');
const nowUtc = require('./../shared/dateTime').nowUtc;

// The controller itself.
const videosController = {

  // addOne: (req, res) => {
  //   const id = req.body.id;
  //   Video.findOne({ _id: id })
  //   .then((video) => {
  //     if (video) {
  //       const ret = apiMessages.getResponseByCode(56);
  //       res.status(ret.status).json(ret);
  //     } else {
  //       const newVideoData = {
  //         _id: id,
  //         status: 'published',
  //         views: 0,
  //         created_at: nowUtc(),
  //         updated_at: nowUtc(),
  //         language: 1,
  //         title: req.body.title,
  //         description: req.body.description,
  //         notes: req.body.notes,
  //         audio_descriptions: {},
  //       };
  //       const newVideo = new Video(newVideoData);
  //       newVideo.save()
  //       .then((newVideoSaved) => {
  //         console.log('AAAAAAA');
  //         const ret = apiMessages.getResponseByCode(1003);
  //         ret.result = newVideoSaved;
  //         res.status(ret.status).json(ret);
  //         res.end();
  //       })
  //       .catch((err3) => {
  //         console.log('BBBBBBBBBB');
  //         console.log(err3);
  //         const ret = apiMessages.getResponseByCode(1);
  //         res.status(ret.status).json(ret);
  //       });
  //     }
  //   })
  //   .catch((err) => {
  //     console.log('CCCCCCC');
  //     console.log(err);
  //     const ret = apiMessages.getResponseByCode(1);
  //     res.status(ret.status).json(ret);
  //   });    
  // },

  // updateOne: (req, res) => {
  //   const id = req.params.id;
  //   const toUpdate = {};
  //   const notes = req.body.notes;
  //   const publish = req.body.publish;

  //   if (notes) toUpdate['notes'] = notes;
  //   if (publish) toUpdate['status'] = 'published';

  //   Video.findOneAndUpdate({ _id: id }, { $set: toUpdate }, { new: true }, (err, video) => {
  //     if (err) {
  //       console.log(err);
  //       const ret = apiMessages.getResponseByCode(1);
  //       res.status(ret.status).json(ret);
  //     }
  //     if (video) {
  //       const ret = apiMessages.getResponseByCode(1004);
  //       ret.result = video;
  //       res.status(ret.status).json(ret);
  //     } else {
  //       const ret = apiMessages.getResponseByCode(57);
  //       res.status(ret.status).json(ret);
  //     }
  //   });
  // },

  getOne: (req, res) => {
    const youtube_id = req.params.id;
    Video.findOne({ youtube_id })
    .populate({
      path: 'audio_descriptions',
      populate: {
        path: 'user audio_clips',
      }
    })
    .exec((errGetOne, video) => {
      if (errGetOne) {
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      if (video) {
        const ret = apiMessages.getResponseByCode(1000);
        ret.result = video;
        res.status(ret.status).json(ret);  
      } else {
        const ret = apiMessages.getResponseByCode(55);
        res.status(ret.status).json(ret);
      }
    })
  },

  // getAll: (req, res) => {
  //   Video.find({ status: 'published' }).limit(50)
  //   .populate({
  //     path: 'audio_descriptions',
  //     populate: {
  //       path: 'user audio_clips',
  //       // populate: {
  //       //   path: 'user'
  //       // }
  //     }
  //   })
  //   .exec((errGetAll, videos) => {
  //     if (errGetAll) {
  //       const ret = apiMessages.getResponseByCode(1);
  //       res.status(ret.status).json(ret);
  //     }
  //     const ret = apiMessages.getResponseByCode(1006);
  //     ret.result = videos;
  //     res.status(ret.status).json(ret);  
  //   })
  // },

  // added getPage
  getAll: (req, res) => {
    let pgNumber = Number(req.query.page);
    let searchPage = (pgNumber === NaN || pgNumber === 0) ? 30 : (pgNumber * 30);
    Video.find({ status: 'published' }).skip(searchPage - 30).limit(30)
    .populate({
      path: 'audio_descriptions',
      populate: {
        path: 'user audio_clips',
        // populate: {
        //   path: 'user'
        // }
      }
    })
    .exec((errGetAll, videos) => {
      if (errGetAll) {
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      const ret = apiMessages.getResponseByCode(1006);
      ret.result = videos;
      res.status(ret.status).json(ret);  
    })
  },

  // search: (req, res) => {
  //   const searchTerm = req.query.q;
  //   Video.find({ status: 'published', title: new RegExp(searchTerm, 'i') }).limit(30)
  //   .then((videos) => {
  //     const ret = apiMessages.getResponseByCode(1007);
  //     ret.result = videos;
  //     res.status(ret.status).json(ret);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     const ret = apiMessages.getResponseByCode(1);
  //     res.status(ret.status).json(ret);
  //   });
  // },

  searchAndPage: (req, res) => {
    const searchTerm = req.query.q;
    const pgNumber = Number(req.query.page);
    const searchPage = (pgNumber === NaN || pgNumber === 0) ? 30 : (pgNumber * 30);
    Video.find({ status: 'published', title: new RegExp(searchTerm, 'i') }).skip(searchPage - 30).limit(30)
    .then((videos) => {
      const ret = apiMessages.getResponseByCode(1007);
      ret.result = videos;
      res.status(ret.status).json(ret);
    })
    .catch((err) => {
      console.log(err);
      const ret = apiMessages.getResponseByCode(1);
      res.status(ret.status).json(ret);
    });
  },
};

module.exports = videosController;
