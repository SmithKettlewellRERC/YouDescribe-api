const fse = require('fs-extra');
const conf = require('../shared/config')();
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');
const AudioDescription = require('./../models/audioDescription');
const AudioClip = require('./../models/audioClip');

const audioClipController = {
  addOne: (req, res) => {
    // According to the middleware, we cannot arrive here wo a userId.
    const userId = req.body.userId;

    // We only accept requests with files attached.
    if (req.file.mimetype !== 'audio/wav') {
      const ret = apiMessages.getResponseByCode(60);
      res.status(ret.status).json(ret);
    }

    // Getting the main IDs (audioDescriptionId can be null).
    const youtube_id = req.params.videoId;
    const audioDescriptionId = req.body.audioDescriptionId;

    // Fixing paths to save audio clip file.
    const relativePath = `/${youtube_id}`;
    const absPathToSave = `${conf.uploadsRootDirToSave}${relativePath}`;

    // First step: create de audio clip object.
    const newAudioClip = new AudioClip({
      video: null,
      audio_description: null,
      user: userId,
      label: req.body.label,
      playback_type: req.body.playbackType,
      start_time: req.body.startTime,
      end_time: req.body.endTime,
      duration: req.body.duration,
      file_name: null,
      file_size_bytes: req.file.size,
      file_mime_type: req.file.mimetype,
      file_path: '/current' + relativePath,
      created_at: nowUtc(),
    });

    // Saving the audio clip into the db.
    newAudioClip.save((errSaveAudioClip, audioClip) => {
      if (errSaveAudioClip) {
        console.log(errSaveAudioClip)
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }

      // The audioClip ID that was returned from the creation process.
      const audioClipId = audioClip['_id'];

      // As we now have the ID, we can build the filename to be saved.
      const fileName = `${youtube_id}_${audioClipId}.wav`;
      const finalFilePath = `${absPathToSave}/${fileName}`;

      // Assuring that the directory exists.
      fse.ensureDir(absPathToSave, (errDir) => {
        if (errDir) {
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        }

        // Moving the uploaded file to the final destination.
        fse.move(req.file.path, finalFilePath, { overwrite: true }, (errCopy) => {
          if (errCopy) {
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);
          }

          // DB Ids should always have 24 alphanumeric chars.
          if (audioDescriptionId.length === 24) {

            // Checking if we have the AD passed.
            AudioDescription.findOneAndUpdate({ _id: audioDescriptionId }, { $set: { notes: req.body.audioDescriptionNotes }, $push: { audio_clips: audioClipId }}, (errUpdateAd, returnedAudioDescription) => {
              if (errUpdateAd) {
                console.log(errUpdateAd);
                const ret = apiMessages.getResponseByCode(1);
                res.status(ret.status).json(ret);
              }

              // We already have one audio description.
              if (returnedAudioDescription) {

                // Updating the audio clip references.
                AudioClip.update({ _id: audioClipId }, {
                  $set: {
                    audio_description: returnedAudioDescription._id,
                    video: returnedAudioDescription.video,
                    file_name: fileName,
                  }
                }, (errToUpdateAd, audioClipUpdated) => {
                  if (errToUpdateAd) {
                    console.log(errToUpdateAd);
                    const ret = apiMessages.getResponseByCode(1);
                    res.status(ret.status).json(ret);
                  }

                  Video.findOneAndUpdate({ youtube_id }, { $set: { updated_at: nowUtc() }})
                  .populate({
                    path: 'audio_descriptions',
                    populate: {
                      path: 'user audio_clips',
                    }
                  })
                  .exec((errPopulate, video) => {
console.log('ALL SET 1 - Create audio clip - AD Already exists - Video already exists');
                    const ret = apiMessages.getResponseByCode(1005);
                    ret.result = video;
                    res.status(ret.status).json(ret);
                  });
                });
              } else {
                const ret = apiMessages.getResponseByCode(1);
                res.status(ret.status).json(ret);
              }
            });

//////////////////////////////////////////////////////////////////////////////

          } else {

//////////////////////////////////////////////////////////////////////////////

            // We don't have any audio description. Let's create a new one.
            const newAudioDescription = new AudioDescription({
              audio_clips: [audioClipId],
              video: null,
              user: userId,
              status: 'draft',
              likes: 0,
              language: 'en',
              created_at: nowUtc(),
              updated_at: nowUtc(),
              notes: req.body.audioDescriptionNotes,
            });

            // Saving the brand new audio description
            newAudioDescription.save((errNewAd, createdAd) => {
              if (errNewAd) {
                console.log(errNewAd);
                const ret = apiMessages.getResponseByCode(1);
                res.status(ret.status).json(ret);
              }

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

                    if (updatedVideo) {
                      
                      // Updating the audio clips references.
                      audioClip.update({ _id: audioClipId }, { $set: { audio_description: createdAdId, video: video._id } }, (errUpdatingAudioClip, audioClipUpdated) => {
                        if (errUpdatingAudioClip) {
                          console.log(errUpdatingAudioClip);
                          const ret = apiMessages.getResponseByCode(1);
                          res.status(ret.status).json(ret);
                        }
                        if (audioClipUpdated) {


                          // Hacky solution while I don't discover how to populate existant objs.
                          Video.findOne({ youtube_id })
                          .populate({ path: 'audio_descriptions', populate: { path: 'user audio_clips' }})
                          .exec((errPopulate, video) => {
console.log('ALL SET 2 - Create audio clip - Create AD - Video already exists');
                            const ret = apiMessages.getResponseByCode(1005);
                            ret.result = video;
                            res.status(ret.status).json(ret);
                          });

                        } else {
                          const ret = apiMessages.getResponseByCode(1);
                          res.status(ret.status).json(ret);         
                        }
                      });
                    } else {
                      // We cannot have one audio description without having a video.
                      const ret = apiMessages.getResponseByCode(1);
                      res.status(ret.status).json(ret);                        
                    }
                  });

                } else {

                  // We don't have a video. Let's create it.
                  const newVideo = new Video({
                    title: req.body.title,
                    description: req.body.description,
                    youtube_id: youtube_id,
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

                    if (newVideoCreated) {
                      AudioClip.update({ _id: audioClipId }, { $set: {
                        audio_description: createdAdId,
                        video: newVideoIdCreated,
                        file_name: fileName,
                      }}, (errUpdatingAudioClip, audioClipUpdated) => {
                        if (errUpdatingAudioClip) {
                          console.log(errUpdatingAudioClip);
                          const ret = apiMessages.getResponseByCode(1);
                          res.status(ret.status).json(ret);
                        }
                        if (audioClipUpdated) {
                          
                          AudioDescription.update({ _id: createdAdId }, { $set: {
                            video: newVideoIdCreated,
                          }}, (errUpdatedAD, updatedAD) => {

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
  console.log('ALL SET 3 - Create audio clip - Create AD - Create Video');
                                const ret = apiMessages.getResponseByCode(1005);
                                ret.result = video;
                                res.status(ret.status).json(ret);
                              });
                            } else {
                              const ret = apiMessages.getResponseByCode(1);
                              res.status(ret.status).json(ret);
                            }
                          });
                        } else {
                          const ret = apiMessages.getResponseByCode(1);
                          res.status(ret.status).json(ret);
                        }
                      });

                    } else {
                      const ret = apiMessages.getResponseByCode(1);
                      res.status(ret.status).json(ret);
                    }
                  });
                }
              });
            });
          }
        });
      });
    });
  },

  delOne: (req, res) => {
    const audioClipId = req.params.audioClipId;
    AudioClip.findByIdAndRemove({ _id: audioClipId })
    .exec(function(errFindAndRemove, audioClipDeleted) {
      if (errFindAndRemove) {
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
// console.log('audioClipDeleted', audioClipDeleted);
      if (audioClipDeleted) {
        // Let's delete the file.
        const absFilePath = `${conf.uploadsRootDirToDelete}/${audioClipDeleted.file_path}/${audioClipDeleted.file_name}`;
        fse.remove(absFilePath, errDeleting => {
          if (errDeleting) {
            return console.error(errDeleting);
          }
// console.log('File deleted', absFilePath);
        });

        const audioDescriptionId = audioClipDeleted.audio_description;

// console.log('audioDescriptionId', audioDescriptionId);

        AudioDescription.findOneAndUpdate({ _id: audioDescriptionId }, {
          $pull: { audio_clips: audioClipId }
        }, { new: true }, (errAd, adUpdated) => {

          if (errAd) {
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);            
          }

// console.log('audioDescriptionUpdated', adUpdated);

          if (adUpdated.audio_clips.length === 0) {
// console.log('removing the audio description because we dont have audio clips anymore');
            AudioDescription.remove({ _id: audioDescriptionId }, (errR, adRemoved) => {});
          }

          const videoId = adUpdated.video;
// console.log('returning the video', videoId);
          Video.findOne({ _id: videoId })
          .populate({
            path: 'audio_descriptions',
            populate: {
              path: 'user audio_clips',
            }
          })
          .exec((errPopulate, video) => {

            // We can remove the video as it does not have more ADs.
            if (video.audio_descriptions.length === 0) {
// console.log('Removing the video');
              Video.remove({ _id: videoId }, (errRemovingVideo, videoRemoved) => {});
              const ret = apiMessages.getResponseByCode(64);
              res.status(ret.status).json(ret);              
            } else {
// console.log('Video returned', JSON.stringify(video, null, '  '))
              const ret = apiMessages.getResponseByCode(1016);
              ret.result = video;
              res.status(ret.status).json(ret);
            }
          });   
        });
      } else {
// console.log('Audio clip was not deleted', audioClipId);
      }
    });
  },

  updateOne: (req, res) => {
    const acId = req.params.audioClipId;
    const userId = req.body.userId;
    let toUpdate = {};
    if (req.body.label) {
      toUpdate = { $set: { label: req.body.label }}
    }
    if (req.body.playback_type) {
      const playback_type = req.body.playback_type;
      const start_time = req.body.start_time;
      const duration = req.body.duration;
      let end_time = req.body.end_time;
      if (playback_type === 'extended') {
        end_time = start_time;
      } 
      if (playback_type === 'inline') {
        end_time = parseFloat(start_time) + parseFloat(duration);
      } 
      toUpdate = { $set: {
        start_time,
        playback_type,
        end_time,
      }}
    }
    AudioClip.findOneAndUpdate(
      { _id: acId, user: userId },
      toUpdate,
      { new: true }
    )
    .exec((err, ac) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      const ret = apiMessages.getResponseByCode(1019);
      ret.result = ac;
      res.status(ret.status).json(ret);
    });
  },

};

module.exports = audioClipController;
