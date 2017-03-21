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
    const LOGGED_USER = '58ce2350fe9c4194105fa35d';

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

          // Checking if we have the AD passed.
          AudioDescription.findOneAndUpdate({ _id: audioDescriptionId }, { $push: { audio_clips: audioClipId }}, (errUpdateAd, returnedAudioDescription) => {
            if (errUpdateAd) {
              console.log(errUpdateAd);
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
            }

console.log('returned audio description', returnedAudioDescription)

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
                console.log('Audio description updated');
                console.log(audioClipUpdated);
              });

console.log('ALLLL SETTTTTT WITH THE EXISTING DATA')
              // All set.
              return;

            } else {
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

console.log('newAudioDescription', newAudioDescription)

              // Saving the audio description
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

console.log('VIDEO', video);

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
                            // All set.
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

                    // We don't have a video. Let's create it.
                    const newVideo = new Video({
                      title: req.body.title,
                      description: req.body.description,
                      youtube_id: youtube_id,
                      created_at: nowUtc(),
                      updated_at: nowUtc(),
                      views: 0,
                      language: 1,
                      status: 'draft',
                      audio_descriptions: [ createdAdId ],
                    });

console.log('newVideo', newVideo)

                    // Saving the brand new video.
                    newVideo.save((errSavingNewVideo, newVideoCreated) => {
                      if (errSavingNewVideo) {
                        console.log(errSavingNewVideo);
                        const ret = apiMessages.getResponseByCode(1);
                        res.status(ret.status).json(ret);
                      }
                      const newVideoIdCreated = newVideoCreated._id;


console.log(newVideoIdCreated)


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
console.log(updatedAD);
console.log('ALL SET FINAL')
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
                })
              });
            }
          })
        });
      });
    });
  }
};

module.exports = audioClipController;
