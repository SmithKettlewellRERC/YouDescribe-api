// System modules.
const fs = require('fs');

// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');

const audioClipController = {
  addOne: (req, res) => {
    console.log(req.fields);
    // console.log(req.files);




    console.log('DEBUGGGGG');

    res.status(200).json({debug:1});




    const videoId = req.params.videoId;

    Video.findOne({ _id: videoId }, (err, video) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      if (video) {
        const newAudioClip = {
          title: req.body.title,
          type: req.body.title,
          start_time: req.body.start_time,
          end_time: req.body.end_time,
          duration: req.body.duration,
          filename: 'clip_filename.wav',
          created_at: nowUtc(),
          updated_at: nowUtc(),
        };

        // Int he future we will have to fix this to allow multiple ADs.
        if (!video.audio_descriptions) {
          video.audio_descriptions = {};
          video.audio_descriptions[1] = {
            likes: 0,
            clips: {},
          };
        }

        let newAudioClipId = 1;
        const clipsKeys = Object.keys(video.audio_descriptions[1].clips);
        if (clipsKeys.length > 0) {
          newAudioClipId = parseInt(clipsKeys.sort().slice(-1)) + 1;
        }
        video.audio_descriptions[1].clips[newAudioClipId] = newAudioClip;
        video.markModified('audio_descriptions');
        video.save()
        .then((videoSaved) => {
          const ret = apiMessages.getResponseByCode(1002);
          ret.result = videoSaved;
          res.status(ret.status).json(ret);
        })
        .catch((errSave) => {
          console.log(errSave);
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        });
      } else {
        const ret = apiMessages.getResponseByCode(58);
        res.status(ret.status).json(ret);
      }
    });
  }

  // getOne: () => {
  //   console.log('findOne');
  // },
};

module.exports = audioClipController;
