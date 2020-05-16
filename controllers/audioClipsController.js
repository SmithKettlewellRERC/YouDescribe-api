const fse = require("fs-extra");
const conf = require("../shared/config")();
const apiMessages = require("./../shared/apiMessages");
const nowUtc = require("./../shared/dateTime").nowUtc;
const msleep = require("../shared/helperFunctions").msleep;
const convertISO8601ToSeconds = require("../shared/helperFunctions").convertISO8601ToSeconds;
const Video = require("./../models/video");
const AudioDescription = require("./../models/audioDescription");
const AudioClip = require("./../models/audioClip");
const Transcription = require("./../models/transcription");
const User = require("./../models/user");

const mongoose = require("mongoose"); /* generate mongodb object id */
const fs = require("fs");             /* get audio file stream */
const request = require("request");   /* create http request */
const mm = require("music-metadata"); /* get mp3 metadata */

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
            AudioDescription.findOneAndUpdate({ _id: audioDescriptionId }, { $set: { notes: req.body.audioDescriptionNotes, language: req.body.audioDescriptionSelectedLanguage }, $push: { audio_clips: audioClipId }}, (errUpdateAd, returnedAudioDescription) => {
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
              language: req.body.audioDescriptionSelectedLanguage,
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
      if (audioClipDeleted) {
        // Let's delete the file.
        const absFilePath = `${conf.uploadsRootDirToDelete}/${audioClipDeleted.file_path}/${audioClipDeleted.file_name}`;
        fse.remove(absFilePath, errDeleting => {
          if (errDeleting) {
            return console.error(errDeleting);
          }
        });

        const audioDescriptionId = audioClipDeleted.audio_description;

        AudioDescription.findOneAndUpdate({ _id: audioDescriptionId }, {
          $pull: { audio_clips: audioClipId }
        }, { new: true }, (errAd, adUpdated) => {

          if (errAd) {
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);            
          }

          // if (adUpdated.audio_clips.length === 0) {
          //   AudioDescription.remove({ _id: audioDescriptionId }, (errR, adRemoved) => {});
          // }

          const videoId = adUpdated.video;
          Video.findOne({ _id: videoId })
          .populate({
            path: 'audio_descriptions',
            populate: {
              path: 'user audio_clips',
            }
          })
          .exec((errPopulate, video) => {

            // We can remove the video as it does not have more ADs.
            // if (video.audio_descriptions.length === 0) {
            //   Video.remove({ _id: videoId }, (errRemovingVideo, videoRemoved) => {});
            //   const ret = apiMessages.getResponseByCode(64);
            //   res.status(ret.status).json(ret);              
            // } else {
              const ret = apiMessages.getResponseByCode(1016);
              ret.result = video;
              res.status(ret.status).json(ret);
            // }
          });   
        });
      } else {
        console.log('Audio clip was not deleted', audioClipId);
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

  getAllByPage: (req, res) => {
    let pgNumber = Number(req.query.page);
    let searchPage = (pgNumber === NaN || pgNumber === 0) ? 50 : (pgNumber * 50);
    AudioClip.find({}).sort({description: -1, created_at: -1}).skip(searchPage - 50).limit(50)
    .exec((err, audioClips) => {
      const ret = { status: 200 };
      ret.result = audioClips;
      res.status(ret.status).json(ret);
    });
  },

  startSpeechToText: (req, res) => {
    const audiofile = req.file;
    const formData = {
      appkey: req.body.appkey,
      language: "en",
      file: fs.createReadStream(audiofile.path),
      callbackurl: req.body.callbackurl,
    };
    request.post({url:"https://www.listenbycode.com/api/v1/upload", formData: formData}, function optionalCallback(err, response, body) {
      // var jsonObj = JSON.parse(body);
      // var orderId = jsonObj.result.orderId;
      res.json(JSON.parse(body));
    });
  },

  getSpeechToTextResult: (req, res) => {
    const appkey = conf.listenByCodeAppKey;
    const orderId = req.query.orderid;
    request.get(`https://www.listenbycode.com/api/v1/gettranscript?appkey=${appkey}&resulttype=sentence&orderid=${orderId}`, function optionalCallback(err, response, body) {
      res.json(JSON.parse(body));
    });
  },

  speechToTextCallback: (req, res) => {
    const appkey = conf.listenByCodeAppKey;
    const orderId = req.query.orderId;
    const audioClipId = req.params.audioClipId;
    console.log("orderId:" + orderId);
    var failed = 0;
    var pending = 0;
    request.get(`https://www.listenbycode.com/api/v1/gettranscript?appkey=${appkey}&resulttype=sentence&orderid=${orderId}`, function optionalCallback(err, response, body) {
      const jsonObj = JSON.parse(body);
      if (jsonObj.status == "success") {
        var sentences = jsonObj.result.sentence;
        var transcript = [];
        for (var i = 0; i < sentences.length; ++i) {
          transcript.push({
            "sentence": sentences[i].sentence,
            "start_time": sentences[i].startTime,
            "end_time": sentences[i].endTime
          });
        }
        const toUpdate = {
          transcript: transcript
        };
        AudioClip.findOneAndUpdate(
          {_id: audioClipId},
          {$set: toUpdate},
          {new: true}
        ).exec((err, ac) => {
          Transcription.findOneAndUpdate(
            {audio_clip: audioClipId},
            {$set: {status: "pendingtosuccessful", updated_at: nowUtc()}},
            {new: true}
          ).exec();
          console.log(JSON.stringify(transcript));
        });
      } else if (jsonObj.status == "failed") {
        // 1031: Audio verification failure...
        // 1053: Request too often...
        if (jsonObj.code != 1031 && jsonObj.code != 1053) {
          Transcription.findOneAndUpdate(
            {audio_clip: audioClipId},
            {$set: {status: "failed", msg: jsonObj.msg, updated_at: nowUtc()}},
            {new: true}
          ).exec();
        }
        console.log((++failed) + "; " + JSON.stringify(jsonObj));
      } else {
        console.log((++pending) + "; " + JSON.stringify(jsonObj));
      }
    });
    res.end("done");
  },

  // if successful < 100, then there are empty audio files
  startTranscription: (req, res) => {
    var successful = 0;
    Transcription.find({status: ""}).sort({rating: -1}).skip(0).limit(100).exec((err, transcriptions) => {
      transcriptions.forEach(item => {
        var audioClipId = item.audio_clip;
        AudioClip.findOne({_id: audioClipId}, (err, audioClip) => {
          if (audioClip) {
            var directory = "./audio-descriptions-files";
            var path = directory + audioClip.file_path + "/" + audioClip.file_name;
            if (fs.existsSync(path)) {
              const formData = {
                appkey: conf.listenByCodeAppKey,
                language: item.language,
                file: fs.createReadStream(path),
                // callbackurl: `http://52.53.151.37:8080/v1/audioclips/callback/${audioClipId}`
              };
              
              request.post({url:"https://www.listenbycode.com/api/v1/upload", formData: formData}, function optionalCallback(err, response, body) {
                // console.log(body);
                var jsonObj = JSON.parse(body);
                if (jsonObj.status == "success") {
                  var orderId = jsonObj.result.orderId;
                  const toUpdate = {
                    order_id: orderId,
                    status: "pending",
                    updated_at: nowUtc(),
                  };
                  Transcription.findOneAndUpdate(
                    {audio_clip: audioClipId},
                    {$set: toUpdate},
                    {new: true}
                  ).exec((err, transcription) => {
                    console.log((++successful) + "; order_id:" + orderId + "; audio_clip:" + audioClipId);
                  });
                }
                msleep(100);
              });
            } else {
              const toUpdate = {
                msg: "audio clip not found",
                status: "failed",
              };
              Transcription.findOneAndUpdate(
                {audio_clip: audioClipId},
                {$set: toUpdate},
                {new: true}
              ).exec((err, transcription) => {
                console.log("not found:" + path + "; audio_clip:" + audioClipId);
              });
            }
          }
          msleep(100);
        });
      });
    });
    res.end("done");
  },

  // http://127.0.0.1:8080/v1/audioclips/gettranscriptionresult/591de3702805421bd3af594d?orderId=BFIXRA20191109111658
  getTranscriptionResult: (req, res) => {
    const appkey = conf.listenByCodeAppKey;
    var successful = 0;
    var failed = 0;
    var pending = 0;
    Transcription.find({status: "pending"}).sort({updated_at: -1, rating: -1}).skip(0).limit(100).exec((err, transcriptions) => {
      transcriptions.forEach(item => {
        var orderId = item.order_id;
        var audioClipId = item.audio_clip;
        request.get(`https://www.listenbycode.com/api/v1/gettranscript?appkey=${appkey}&resulttype=sentence&orderid=${orderId}`, function optionalCallback(err, response, body) {
          console.log("====================");
          const jsonObj = JSON.parse(body);
          // console.log(jsonObj);
          if (jsonObj.status == "success") {
            var sentences = jsonObj.result.sentence;
            var transcript = [];
            for (var i = 0; i < sentences.length; ++i) {
              transcript.push({
                "sentence": sentences[i].sentence,
                "start_time": sentences[i].startTime,
                "end_time": sentences[i].endTime
              });
            }
            const toUpdate = {
              transcript: transcript
            };
            AudioClip.findOneAndUpdate(
              {_id: audioClipId},
              {$set: toUpdate},
              {new: true}
            ).exec((err, ac) => {
              Transcription.findOneAndUpdate(
                {audio_clip: audioClipId},
                {$set: {status: "pendingtosuccessful", updated_at: nowUtc()}},
                {new: true}
              ).exec();
              console.log("successful:" + (++successful) + "; " + JSON.stringify(transcript));
            });
          } else if (jsonObj.status == "failed") {
            // 1031: Audio verification failure...
            // 1053: Request too often...
            if (jsonObj.code != 1031 && jsonObj.code != 1053) {
              Transcription.findOneAndUpdate(
                {audio_clip: audioClipId},
                {$set: {status: "failed", msg: jsonObj.msg, updated_at: nowUtc()}},
                {new: true}
              ).exec();
            }
            console.log("failed:" + (++failed) + "; " + JSON.stringify(jsonObj));
          } else {
            console.log("pending:" + (++pending) + "; " + JSON.stringify(jsonObj));
          }
        });
        msleep(500);
      });
    });
    res.end("done");
  },

  addOneByAI: (req, res) => {
    const youtubeId = req.params.youtubeId;
    const audioClipId = mongoose.Types.ObjectId();
    const relativePath = `/${youtubeId}`;
    const absPathToSave = `${conf.uploadsRootDirToSaveAI}${relativePath}`;
    const fileName = `${youtubeId}_${audioClipId}.${req.file.mimetype.split("/")[1]}`;
    const finalFilePath = `${absPathToSave}/${fileName}`;

    // upload audio clip
    fse.move(req.file.path, finalFilePath, {overwrite: true}, (err) => {
      if (err) {
        console.log(err);
      }
      mm.parseFile(finalFilePath, {duration: true}).then(metadata => {
        const fileMimeType = req.file.mimetype;
        const fileSizeBytes = req.file.size;
        const playbackType = req.body.playbacktype;
        const filePath = "/ai" + relativePath;
        const startTime = parseFloat(parseFloat(req.body.starttime).toFixed(2));
        const duration = parseFloat(parseFloat(metadata.format.duration).toFixed(2) || 0.00);
        const endTime = startTime + duration;
        const email = (req.body.email || "youdescribesfsuai@gmail.com");
        let userId = "";
        let videoId = "";
        let audioDescriptionId = "";

        // get user id
        User.findOne({email: email}).exec((err, user) => {
          userId = user._id;

          // get video id
          Video.findOne({youtube_id: youtubeId}).exec((err, video) => {
            if (video) {
              videoId = video._id;
            } else {
              videoId = mongoose.Types.ObjectId();
              new Video({
                _id: videoId,
                title: "",
                description: "",
                youtube_id: youtubeId,
                created_at: nowUtc(),
                updated_at: nowUtc(),
                views: 0,
                audio_descriptions: [],
                tags: [],
                category_id: "",
                category: "",
                youtube_status: "",
                duration: 0,
                custom_category: "",
                custom_tags: [],
              }).save();
            }

            // get audio description id
            AudioDescription.findOne({user: userId, video: videoId}).exec((err, audioDescription) => {
              if (audioDescription) {
                audioDescriptionId = audioDescription._id;
              } else {
                audioDescriptionId = mongoose.Types.ObjectId();
                new AudioDescription({
                  _id: audioDescriptionId,
                  video: videoId,
                  user: userId,
                  status: "published",
                  language: "en",
                  created_at: nowUtc(),
                  updated_at: nowUtc(),
                  notes: "generated by ai model",
                  audio_clips: [],
                  overall_rating_average: 0,
                  overall_rating_votes_counter: 0,
                  overall_rating_votes_sum: 0,
                  admin_review: "",
                }).save(() => {

                  // add this audio description to the corresponding video
                  Video.findOneAndUpdate(
                    {_id: videoId},
                    {$push: {audio_descriptions: audioDescriptionId}},
                    {new: true}
                  ).exec();
                });
              }

              // add audio clip
              new AudioClip({
                _id: audioClipId,
                video: videoId,
                audio_description: audioDescriptionId,
                user: userId,
                created_at: nowUtc(),
                updated_at: nowUtc(),
                label: "generated by ai model",
                playback_type: playbackType,
                file_name: fileName,
                file_size_bytes: fileSizeBytes,
                file_mime_type: fileMimeType,
                file_path: filePath,
                start_time: startTime,
                end_time: endTime,
                duration: duration,
                transcript: [],
              }).save(() => {
            
                // add this audio clip to the corresponding audio description
                AudioDescription.findOneAndUpdate(
                  {_id: audioDescriptionId},
                  {$push: {audio_clips: audioClipId}},
                  {new:true},
                ).exec();
              });
            
              // update youtube infocard
              request.get(`${conf.youTubeApiUrl}/videos?id=${youtubeId}&part=contentDetails,snippet,statistics&forUsername=iamOTHER&key=${conf.youTubeApiKey}`, function optionalCallback(err, response, body) {
                if (!err) {
                  const jsonObj = JSON.parse(body);
                  if (jsonObj.items.length > 0) {
                    const title = jsonObj.items[0].snippet.title;
                    const description = jsonObj.items[0].snippet.description;
                    const duration = convertISO8601ToSeconds(jsonObj.items[0].contentDetails.duration);
                    const tags = (jsonObj.items[0].snippet.tags || []);
                    const categoryId = jsonObj.items[0].snippet.categoryId;
                    request.get(`${conf.youTubeApiUrl}/videoCategories?id=${categoryId}&part=snippet&forUsername=iamOTHER&key=${conf.youTubeApiKey}`, function optionalCallback(err, response, body) {
                      const jsonObj = JSON.parse(body);
                      let category = "";
                      for (var i = 0; i < jsonObj.items.length; ++i) {
                        if (i > 0) {
                          category += ",";
                        }
                        category += jsonObj.items[i].snippet.title;
                      }
                      const toUpdate = {
                        title: title,
                        description: description,
                        tags: tags,
                        category_id: categoryId,
                        category: category,
                        duration: duration,
                        youtube_status: "available",
                      };
                      Video.findOneAndUpdate(
                        {youtube_id: youtubeId},
                        {$set: toUpdate},
                        {new: true}
                      ).exec();
                    });
                  } else {
                    const toUpdate = {
                      youtube_status: "unavailable",
                    };
                    Video.findOneAndUpdate(
                      {youtube_id: youtubeId},
                      {$set: toUpdate},
                      {new: true}
                    ).exec();
                  }
                }
              });

              // return
              const ret = {status: 200};
              ret.result = "success";
              res.status(ret.status).json(ret);
            });
          });
        });
      });
    });
  },
};

module.exports = audioClipController;
