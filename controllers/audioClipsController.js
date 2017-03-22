const fse = require('fs-extra');
const conf = require('../shared/config')();
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');
const AudioDescription = require('./../models/audioDescription');
const AudioClip = require('./../models/audioClip');

const audioClipController = {
  addOne: (req, res) => {
    // TEMPORARY.
    const LOGGED_USER = '58cf556546e13d72f1c70490';

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
    const absPathToSave = `${conf.uploadsRootDir}${relativePath}`;

    // First step: create de audio clip object.
    const newAudioClip = new AudioClip({
      video: null,
      audio_description: null,
      user: LOGGED_USER,
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
            AudioDescription.findOneAndUpdate({ _id: audioDescriptionId }, { $push: { audio_clips: audioClipId }}, (errUpdateAd, returnedAudioDescription) => {
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

                  // Hacky solution while I don't discover how to populate existant objs.
                  Video.findOne({ youtube_id })
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
              user: LOGGED_USER,
              likes: 0,
              language: 1,
              created_at: nowUtc(),
              updated_at: nowUtc(),
              notes: '',
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

                  // Updating the list of audio descriptions references.
                  Video.update({ _id: video._id }, { $push: {
                    audio_descriptions: createdAdId,
                  }}, (errUpdatingVideo, updatedVideo) => {
                    if (errUpdatingVideo) {
                      console.log(errUpdatingVideo);
                      const ret = apiMessages.getResponseByCode(1);
                      res.status(ret.status).json(ret);
                    }
                    if (updatedVideo) {
                      
                      // Updating the audio clips references.
                      audioClip.update({ _id: audioClipId }, {
                        $set: {
                          audio_description: createdAdId,
                          video: video._id,
                        }
                      }, (errUpdatingAudioClip, audioClipUpdated) => {
                        if (errUpdatingAudioClip) {
                          console.log(errUpdatingAudioClip);
                          const ret = apiMessages.getResponseByCode(1);
                          res.status(ret.status).json(ret);
                        }
                        if (audioClipUpdated) {

                          // Hacky solution while I don't discover how to populate existant objs.
                          Video.findOne({ youtube_id })
                          .populate({
                            path: 'audio_descriptions',
                            populate: {
                              path: 'user audio_clips',
                            }
                          })
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
                    language: 1,
                    status: 'published',
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
  console.log('ALL SET 3 - Exec - Create audio clip - Create AD - Create Video');
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
  }
};

module.exports = audioClipController;
