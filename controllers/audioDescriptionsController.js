// Application modules.
const apiMessages = require('./../shared/apiMessages');
const Video = require('./../models/video');
const AudioDescription = require('./../models/audioDescription');
const WishList = require('./../models/wishList');

const audioDesriptionsController = {

  publishUnpublish: (req, res) => {
    const userId = req.body.userId;
    const adId = req.params.audioDescriptionId;
    const action = req.query.action === 'publish' ? 'published': 'draft';

    AudioDescription.findOneAndUpdate(
      { _id: adId, user: userId },
      { $set: { status: action }}
    )
    .exec((err, ad) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      const videoId = ad.video;
      Video.findOne({ _id: videoId })
      .populate({
        path: 'audio_descriptions',
        populate: {
          path: 'user audio_clips',
        }
      })
      .exec((err, videoToCheck) => {
        const ads = videoToCheck.audio_descriptions;
        const youTubeId = videoToCheck.youtube_id;
        let onePublished = false;
        ads.forEach((ad) => {
          if (ad.status === 'published') {
            onePublished = true;
          }
        });
        if (onePublished) {
          WishList.findOneAndUpdate(
            { youtube_id: youTubeId },
            { $set: { status: 'dequeued' }}
          ).exec();
        } else {
          WishList.findOneAndUpdate(
            { youtube_id: youTubeId },
            { $set: { status: 'queued' }}
          ).exec();
        }
        const ret = apiMessages.getResponseByCode(1015);
        ret.result = videoToCheck;
        res.status(ret.status).json(ret);
      });
    });
  },

  updateAudioDescription: (req, res) => {
    const userId = req.body.userId;
    const adId = req.params.audioDescriptionId;
    const notes = req.body.notes;

    AudioDescription.findOneAndUpdate(
      { _id: adId, user: userId },
      { $set: { notes }},
      { new: true }
    )
    .exec((err, ad) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      const ret = apiMessages.getResponseByCode(1018);
      ret.result = ad;
      res.status(ret.status).json(ret);
    });
  },
}

module.exports = audioDesriptionsController;
