// Application modules.
const apiMessages = require('./../shared/apiMessages');
const Video = require('./../models/video');
const AudioDescription = require('./../models/audioDescription');
const AudioDescriptionRating = require('./../models/audioDescriptionRating');
const User = require('./../models/user');
const AudioClip = require('./../models/audioClip');
const nowUtc = require('./../shared/dateTime').nowUtc;
const WishList = require('./../models/wishList');

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
        const newVideo = video.toJSON();
        const promisesQueue = [];
        const audioDescriptions = newVideo.audio_descriptions.slice();
        newVideo.audio_descriptions = [];
        audioDescriptions.forEach(ad => {
          const adId = ad._id;
          const query = AudioDescriptionRating.find({ audio_description_id: adId  });
          const promise = query.exec();
          ad.feedbacks = {};
          promise.then((audioDescriptionRating) => {
            if (audioDescriptionRating && audioDescriptionRating.length > 0) {
              audioDescriptionRating.map(adr => {
                if (adr.feedback.length > 0) {
                  adr.feedback.map(item => {
                    if (!ad.feedbacks.hasOwnProperty(item)) {
                      ad.feedbacks[item] = 0;
                    }
                    ad.feedbacks[item] += 1;
                  });
                }
              });
            }
            newVideo.audio_descriptions.push(ad);
          });
          promisesQueue.push(promise);
        });

        Promise.all(promisesQueue).then(() => {
          const ret = apiMessages.getResponseByCode(1000);
          ret.result = newVideo;
          res.status(ret.status).json(ret);
        });

      } else {
        const ret = apiMessages.getResponseByCode(55);
        res.status(ret.status).json(ret);
      }
    })
  },

  getVideosByUserId: (req, res) => {
    const userId = req.params.userId;
    AudioDescription.find(
      { user: userId }
    )
    .exec((err, ads) => {
      if (err) {
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }

      const ret = apiMessages.getResponseByCode(1013);

      const arrayOfAdsIds = [];
      if (ads) {
        ads.forEach(ad => {
          arrayOfAdsIds.push(ad._id);
        });
      } else {
        ret.result = [];
        res.status(ret.status).json(ret);
      }

      Video.find({
        audio_descriptions: { $in: arrayOfAdsIds }
      })
      .exec((errVideos, videos) => {
        if (errVideos) {
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        }
        if (videos) {
          ret.result = videos;
        } else {
          ret.result = [];
        }
        res.status(ret.status).json(ret);  
      });
      
    })
  },

  getAll: (req, res) => {
    let pgNumber = Number(req.query.page);
    let searchPage = (pgNumber === NaN || pgNumber === 0) ? 80 : (pgNumber * 80);
    Video.find({}).sort({ updated_at: -1 }).skip(searchPage - 80).limit(80)
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
      const videosFiltered = [];
      videos.forEach(video => {
        let audioDescriptionsFiltered = [];
        video.audio_descriptions.forEach(ad => {
          if (ad.status === 'published') {
            audioDescriptionsFiltered.push(ad);
          }
        });
        video.audio_descriptions = audioDescriptionsFiltered;
        if (audioDescriptionsFiltered.length > 0) {
          videosFiltered.push(video);
        }
      });
      const ret = apiMessages.getResponseByCode(1006);
      ret.result = videosFiltered;
      res.status(ret.status).json(ret);  
    })
  },

  search: (req, res) => {
    const searchTerm = req.query.q;
    const pgNumber = Number(req.query.page);
    const requestedVideoAmount = (pgNumber === NaN || pgNumber === 0) ? 30 : (pgNumber * 30);
    // Video.find({ title: new RegExp(searchTerm, 'i') }).sort({ updated_at: -1 }).skip(requestedVideoAmount - 30).limit(30)
    Video.find({ $text: { $search: searchTerm }}).sort({ updated_at: -1 }).skip(requestedVideoAmount - 30).limit(30)
    .populate({
      path: 'audio_descriptions',
      populate: {
        path: 'user audio_clips',
      }
    })    
    .then((videos) => {
      const videosFiltered = [];
      videos.forEach(video => {
        let audioDescriptionsFiltered = [];
        video.audio_descriptions.forEach(ad => {
          if (ad.status === 'published') {
            audioDescriptionsFiltered.push(ad);
          }
        });
        video.audio_descriptions = audioDescriptionsFiltered;
        if (audioDescriptionsFiltered.length > 0) {
          videosFiltered.push(video);
        }
      });
      const ret = apiMessages.getResponseByCode(1007);
      ret.result = videosFiltered;
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
