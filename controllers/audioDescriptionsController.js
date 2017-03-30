// Application modules.
const apiMessages = require('./../shared/apiMessages');
const Video = require('./../models/video');
const AudioDescription = require('./../models/audioDescription');
const WishList = require('./../models/wishList');

const audioDesriptionsController = {

  publishUnpublish: (req, res) => {
    const userId = req.userId;
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
      if (ad) {
        // Try to remove the video from the wishlist.
        // WishList.findOneAndUpdate(
        //   { youtube_id: id },
        //   { $set: { status: 'dequeued' }}
        // ).exec();

        Video.findOne({
          audio_descriptions: { $in: [ad._id] }
        })
        .populate({
          path: 'audio_descriptions',
          populate: {
            path: 'user audio_clips',
          }
        })
        .exec((errVideo, video) => {
          const ret = apiMessages.getResponseByCode(1015);
          ret.result = video;
          res.status(ret.status).json(ret);
        });
      } else {
        const ret = apiMessages.getResponseByCode(64);
        res.status(ret.status).json(ret);
      }
    });
  }
}

module.exports = audioDesriptionsController;
