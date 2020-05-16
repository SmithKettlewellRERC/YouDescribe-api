// Application modules.
const fse = require('fs-extra');
const apiMessages = require('./../shared/apiMessages');
const conf = require('../shared/config')();
const nowUtc = require('./../shared/dateTime').nowUtc;
const request = require("request");
const Video = require('./../models/video');
const AudioDescription = require('./../models/audioDescription');
const WishList = require('./../models/wishList');
const AudioClip = require('./../models/audioClip');
const AudioDescriptionRating = require('./../models/audioDescriptionRating');
const ObjectId = require("mongoose").Types.ObjectId;

const audioDesriptionsController = {

  updateAudioDescription: (req, res) => {
    const userId = req.body.userId;
    const adId = req.params.audioDescriptionId;

    let toUpdate = {};
    if (req.body.notes) {
      toUpdate["notes"] = req.body.notes;
    }
    if (req.query.action) {
      toUpdate["status"] = req.query.action === 'publish' ? 'published': 'draft';
    }

    toUpdate["language"] = req.body.audioDescriptionSelectedLanguage;

    AudioDescription.findOneAndUpdate(
      { _id: adId, user: userId },
      { $set: toUpdate }
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
        // Every time we have to go against all audio descriptions to update the wish list.
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

  createOne: (req, res) => {
    const userId = req.body.userId;
    const youtube_id = req.params.videoId;
    const notes = req.body.notes || null;
    const title = req.body.title;
    const description = req.body.description;
    const language = req.body.audioDescriptionSelectedLanguage;

    // We don't have any audio description. Let's create a new one.
    const newAudioDescription = new AudioDescription({
      audio_clips: [],
      video: null,
      user: userId,
      status: 'draft',
      likes: 0,
      language,
      created_at: nowUtc(),
      updated_at: nowUtc(),
      notes: req.body.notes,
    });

    // Saving the brand new audio description
    newAudioDescription.save((errNewAd, createdAd) => {
      if (errNewAd) {
        console.log(errNewAd);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }

      if (createdAd) {
        // The brand new ID of the AD.
        const createdAdId = createdAd._id;

        // Now it is video time! :)
        Video.findOne({ youtube_id }, (errFindVideo, video) => {
          if (errFindVideo) {
            console.log(errFindVideo);
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);
          }

          // If the video we've just searched exists.
          if (video) {

            // Now we need to update the audio description with the videoId.
            AudioDescription.findOneAndUpdate({ _id: createdAdId }, { $set: { video: video._id }}).exec((err, ad) => {});

            // Updating the list of audio descriptions references.
            Video.update({ _id: video._id }, { $set: { updated_at: nowUtc() }, $push: { audio_descriptions: createdAdId }}, (errUpdatingVideo, updatedVideo) => {
              if (errUpdatingVideo) {
                console.log(errUpdatingVideo);
                const ret = apiMessages.getResponseByCode(1);
                res.status(ret.status).json(ret);
              }

              Video.findOne({ _id: video._id })
              .populate({
                path: 'audio_descriptions',
                populate: {
                  path: 'user audio_clips',
                }
              })
              .exec((errPopulate, video) => {
                const ret = apiMessages.getResponseByCode(1005);
                ret.result = video;
                res.status(ret.status).json(ret);
              });

            });

          } else {

            // We don't have a video. Let's create it.
            const newVideo = new Video({
              title,
              description,
              youtube_id,
              created_at: nowUtc(),
              updated_at: nowUtc(),
              views: 0,
              audio_descriptions: [ createdAdId ],
            });

            // Saving the brand new video.
            newVideo.save((errSavingNewVideo, newVideoCreated) => {
              if (errSavingNewVideo) {
                console.log(errSavingNewVideo);
                const ret = apiMessages.getResponseByCode(1);
                res.status(ret.status).json(ret);
              }
              const newVideoIdCreated = newVideoCreated._id;

              // Let's update the audio description with the video id.
              AudioDescription.findOneAndUpdate({ _id: createdAdId }, { $set: { video: newVideoIdCreated }}).exec((err, updatedAD) => {

                if (updatedAD) {
                  // Hacky solution while I don't discover how to populate existant objs.
                  Video.findOne({ _id: newVideoIdCreated })
                  .populate({
                    path: 'audio_descriptions',
                    populate: {
                      path: 'user audio_clips',
                    }
                  })
                  .exec((errPopulate, video) => {
                    const ret = apiMessages.getResponseByCode(1005);
                    ret.result = video;
                    res.status(ret.status).json(ret);
                  });
                } else {
                  const ret = apiMessages.getResponseByCode(1);
                  res.status(ret.status).json(ret);
                }

              });
            });
          }
        });
      } else {
        console.log(errFindVideo);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
    });
  },

  deleteAudioDescription: (req, res) => {
    const userId = req.body.userId;
    const adId = req.params.audioDescriptionId;

    AudioDescription.findOne({ _id: adId }, (errAd, adReturned) => {

      const videoId = adReturned.video;

      // Looping through all audio clips.
      adReturned.audio_clips.forEach((audioClipId) => {
        AudioClip.findByIdAndRemove({ _id: audioClipId })
        .exec(function(errFindAndRemove, removedAudioClip) {
          // Let's delete the file.
          const absFilePath = `${conf.uploadsRootDirToDelete}/${removedAudioClip.file_path}/${removedAudioClip.file_name}`;
          fse.remove(absFilePath, errDeleting => {
            console.log('Removed audio clip', absFilePath, removedAudioClip);
          });
        });
      });

      // Let's update the video. Remove the audio description id reference from it.
      Video.findOneAndUpdate({ _id: videoId }, { $pull: { audio_descriptions: adId } }, { new: true })
      .exec((errUpdatingVideo, updatedVideo) => {
        if (errUpdatingVideo) {
          console.log(errUpdatingVideo);
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        }

        // Let's remove the video as it doesn't have any audio descriptions anymore.
        if (updatedVideo.audio_descriptions.length === 0) {
          Video.findByIdAndRemove({ _id: videoId }).exec((errRemovingVideo, removedVideo) => {
            if (errRemovingVideo) {
              console.log(errRemovingVideo);
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
            }
            console.log('Removed video', removedVideo);
          });
        } else {
          console.log('Updated video', updatedVideo);
        }
      });

      // Now let's delete the audio description itself.
      AudioDescription.findByIdAndRemove({ _id: adId }).exec((errRemovingAd, removedAd) => {
        if (errRemovingAd) {
          console.log(errRemovingAd);
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        }
        console.log('Removed audio description', removedAd);
        const ret = apiMessages.getResponseByCode(1020);
        res.status(ret.status).json(ret);
      });
    });
  },

  getAllByPage: (req, res) => {
    const keyword = req.query.keyword;
    const pageNumber = Number(req.query.page);
    var sortBy = req.query.sortby;
    if (sortBy == undefined || sortBy == "") {
      sortBy = "video._id";
    }
    var order = parseInt(req.query.order);
    if (order == undefined || order != 1) {
      order = -1;
    }
    const endNumber = (pageNumber === NaN) ? 50 : (pageNumber * 50);
    /* start of old method */
    // AudioDescription.countDocuments({}, (err, count) => {
    //   AudioDescription.aggregate([
    //     {$lookup: {from: "videos", localField: "video", foreignField: "_id", as: "video"}},
    //     {$lookup: {from: "users", localField: "user", foreignField: "_id", as: "user"}},
    //     {$unwind: "$video"},
    //     {$unwind: "$user"},
    //     {$sort: {[sortBy]: order, _id: order}},
    //   ]).collation({locale: "en"}).skip(endNumber - 50).limit(50).exec((err, audioDescriptions) => {
    //     const ret = {status: 200};
    //     ret.count = Math.ceil(count / 50);
    //     ret.result = audioDescriptions;
    //     res.status(ret.status).json(ret);
    //   });
    // });
    /* end of old method */
    /* start of new method */
    AudioDescription.aggregate([
      {$lookup: {from: "languages", localField: "language", foreignField: "code", as: "language"}},
      {$lookup: {from: "videos", localField: "video", foreignField: "_id", as: "video"}},
      {$lookup: {from: "users", localField: "user", foreignField: "_id", as: "user"}},
      {$unwind: "$language"},
      {$unwind: "$video"},
      {$unwind: "$user"},
      {
        $match: {
          $or: [
            {"language.name": {$regex: keyword, $options: "$i"}},
            {"video.category": {$regex: keyword, $options: "$i"}},
            {"video.title": {$regex: keyword, $options: "$i"}},
            {"video.tags": {$elemMatch: {$regex: keyword, $options: "$i"}}},
            {"video.custom_tags": {$elemMatch: {$regex: keyword, $options: "$i"}}},
            {"user.name": {$regex: keyword, $options: "$i"}}
          ]
        }
      },
      {$sort: {[sortBy]: order, _id: order}},
    ]).collation({locale: "en"}).exec((err, audioDescriptions) => {
      const audioDescriptionsPaginated = [];
      for (var i = endNumber - 50; i < audioDescriptions.length && i < endNumber; ++i) {
        audioDescriptionsPaginated.push(audioDescriptions[i]);
      }
      const ret = {status: 200};
      ret.count = audioDescriptions.length;
      ret.result = audioDescriptionsPaginated;
      res.status(ret.status).json(ret);
    });
    /* end of new method */
  },

  getById: (req, res) => {
    const id = req.query.id;
    const toUpdate = {admin_review: "reviewed"};
    AudioDescription.findOneAndUpdate(
      {_id: id},
      {$set: toUpdate},
      {new: true}
    ).populate({
      path: "video user audio_clips",
    }).exec((err, audioDescription) => {
      AudioDescriptionRating.find({
        audio_description_id: id
      }).populate({
        path: "user_id",
      }).exec((err, ratings) => {
        const ret = {status: 200};
        ret.result = {
          audioDescription: audioDescription,
          ratings: ratings,
        };
        res.status(ret.status).json(ret);
      });
    });
  },

  getNext: (req, res) => {
    const keyword = req.query.keyword;
    const isNext = parseInt(req.query.isnext);
    const id = req.query.id;
    var sortBy = req.query.sortby;
    if (sortBy == undefined || sortBy == "") {
      sortBy = "video._id";
    }
    var order = parseInt(req.query.order);
    if (order == undefined || order != 1) {
      order = -1;
    }
    const finalOrder = parseInt(isNext * order);
    const comparator = (finalOrder > 0) ? "$gt" : "$lt";
    AudioDescription.findOne({_id: id}).populate({
      path: "video user",
    }).exec((err, audioDescription) => {
      var separator = "";
      if (sortBy == "video._id") {
        separator = ObjectId(audioDescription.video._id);
      } else if (sortBy == "video.title") {
        separator = audioDescription.video.title;
      } else if (sortBy == "user.name") {
        separator = audioDescription.user.name;
      } else if (sortBy == "status") {
        separator = audioDescription.status;
      } else if (sortBy == "video.youtube_status") {
        separator = audioDescription.video.youtube_status;
      } else if (sortBy == "video.category") {
        separator = audioDescription.video.category;
      } else if (sortBy == "overall_rating_average") {
        separator = audioDescription.overall_rating_average;
      } else if (sortBy == "created_at") {
        separator = audioDescription.created_at;
      }
      AudioDescription.aggregate([
        /* start of old method */
        // {$lookup: {from: "videos", localField: "video", foreignField: "_id", as: "video"}},
        // {$lookup: {from: "users", localField: "user", foreignField: "_id", as: "user"}},
        // {$unwind: "$video"},
        // {$unwind: "$user"},
        // {$sort: {[sortBy]: finalOrder, _id: finalOrder}},
        // {$match:
        //   {$or:
        //     [
        //       {[sortBy]: separator, _id: {[comparator]: ObjectId(id)}},
        //       {[sortBy]: {[comparator]: separator}}
        //     ]
        //   }
        // },
        /* end of old method */
        /* start of new method*/
        {$lookup: {from: "languages", localField: "language", foreignField: "code", as: "language"}},
        {$lookup: {from: "videos", localField: "video", foreignField: "_id", as: "video"}},
        {$lookup: {from: "users", localField: "user", foreignField: "_id", as: "user"}},
        {$unwind: "$language"},
        {$unwind: "$video"},
        {$unwind: "$user"},
        {
          $match: {
            $or: [
              {"language.name": {$regex: keyword, $options: "$i"}},
              {"video.category": {$regex: keyword, $options: "$i"}},
              {"video.title": {$regex: keyword, $options: "$i"}},
              {"video.tags": {$elemMatch: {$regex: keyword, $options: "$i"}}},
              {"video.custom_tags": {$elemMatch: {$regex: keyword, $options: "$i"}}},
              {"user.name": {$regex: keyword, $options: "$i"}}
            ]
          }
        },
        {$sort: {[sortBy]: finalOrder, _id: finalOrder}},
        {$match:
          {$or:
            [
              {[sortBy]: separator, _id: {[comparator]: ObjectId(id)}},
              {[sortBy]: {[comparator]: separator}}
            ]
          }
        },
        /* end of new method */
      ]).collation({locale: "en"}).limit(1).exec((err, audioDescription) => {
        const ret = {status: 200};
        ret.result = audioDescription[0];
        if (ret.result) {
          console.log("============");
          console.log(ret.result.video.title);
          console.log("============");
        }
        res.status(ret.status).json(ret);
      });
    });
  },

  updateStatus: (req, res) => {
    const toUpdate = {status: req.body.status};
    AudioDescription.findOneAndUpdate(
      {_id: req.body.id},
      {$set: toUpdate},
      {new: true}
    ).exec((err, audioDescription) => {
      const ret = {status: 200};
      ret.result = audioDescription;
      res.status(ret.status).json(ret);
    });
  },

  searchByKeyword: (req, res) => {
    const keyword = req.query.keyword;
    var sortBy = req.query.sortby;
    if (sortBy == undefined || sortBy == "") {
      sortBy = "video._id";
    }
    var order = parseInt(req.query.order);
    if (order == undefined || order != 1) {
      order = -1;
    }
    AudioDescription.aggregate([
      {$lookup: {from: "languages", localField: "language", foreignField: "code", as: "language"}},
      {$lookup: {from: "videos", localField: "video", foreignField: "_id", as: "video"}},
      {$lookup: {from: "users", localField: "user", foreignField: "_id", as: "user"}},
      {$unwind: "$language"},
      {$unwind: "$video"},
      {$unwind: "$user"},
      {
        $match: {
          $or: [
            {"language.name": {$regex: keyword, $options: "$i"}},
            {"video.category": {$regex: keyword, $options: "$i"}},
            {"video.title": {$regex: keyword, $options: "$i"}},
            {"video.tags": {$elemMatch: {$regex: keyword, $options: "$i"}}},
            {"user.name": {$regex: keyword, $options: "$i"}}
          ]
        }
      },
      {$sort: {[sortBy]: order, _id: order}},
    ]).exec((err, audioDescriptions) => {
      const ret = {status: 200};
      ret.result = audioDescriptions;
      res.status(ret.status).json(ret);
    });
  },
}

module.exports = audioDesriptionsController;
