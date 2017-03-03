// System modules.
const fs = require('fs');

// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');

const audioClipController = {
  addOne: (req, res) => {
    const videoId = req.params.videoId;
    let audioDescriptionId = req.params.audioDescriptionId;

    Video.findOne({ _id: videoId }, (err, video) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      if (video) {
        const newAudioClip = {
          title: 'opa',
          type: 'inline',
          start_time: 1,
          end_time: 2,
          duration: 105,
          filename: 'clip_filename.wav',
          created_at: nowUtc(),
          updated_at: nowUtc(),
        };

        if (video.audio_descriptions) {
          const ad = video.audio_descriptions[audioDescriptionId];
          const newAudioClipId = Object.keys(ad.clips).sort().slice(-1) + 1;
          ad.clips[newAudioClipId] = newAudioClipId;
        } else {
          video.audio_descriptions = {
            1: {
              clips: {
                1: newAudioClip,
              }
            }
          };
        }
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
