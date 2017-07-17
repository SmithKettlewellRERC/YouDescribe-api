// Application modules.
const apiMessages = require('./../shared/apiMessages');
const Video = require('./../models/video');
const AudioDescription = require('./../models/audioDescription');
const WishList = require('./../models/wishList');
const conf = require('../shared/config')();
const nowUtc = require('./../shared/dateTime').nowUtc;

const audioDesriptionsController = {

  updateAudioDescription: (req, res) => {
    const userId = req.body.userId;
    const adId = req.params.audioDescriptionId;

    let toUpdate = {};
    if (req.body.notes) {
      toUpdate['notes'] = req.body.notes;
    }
    if (req.query.action) {
      toUpdate['status'] = req.query.action === 'publish' ? 'published': 'draft';
    }

    AudioDescription.findOneAndUpdate(
      { _id: adId, user: userId },
      { $set: toUpdate}
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
        // Every time we have to go against all audio description to update the wish list.
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

    // We don't have any audio description. Let's create a new one.
    const newAudioDescription = new AudioDescription({
      audio_clips: [],
      video: null,
      user: userId,
      status: 'draft',
      likes: 0,
      language: 'en',
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
              language: 'en',
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
            console.log('Removed audio clip', rabsFilePath, emovedAudioClip);
          });
        });
      });

      // Let's update the video. Remove the audio description id reference from it.
      Video.findOneAndUpdate({ _id: videoId }, { $pull: { audio_descriptions: adId } }, { new: true })
      .exec((err, updatedVideo) => {

        // Let's remove the video as it doesn't have any audio descriptions anymore.
        if (updatedVideo.audio_descriptions.length === 0) {
          Video.findByIdAndRemove({ _id: videoId }).exec((errRemovingVideo, removedVideo) => {
            console.log('Removed video', removedVideo);
          });
        } else {
          console.log('Updated video', updatedVideo);
        }
      });

      // Now let's delete the audio description itself.
      Video.findByIdAndRemove({ _id: adId }.exec((errRemovingAd, removedAd) => {
        console.log('Removed audio description', removedAd);
      }));
    });
  },
}

module.exports = audioDesriptionsController;
