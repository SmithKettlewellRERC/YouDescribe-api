const fse = require('fs-extra');
const conf = require('../shared/config')();


// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');

const audioClipController = {
  addOne: (req, res) => {
    // We only accept requests with files attached.
    if (!req.files.wavfile) {
      const ret = apiMessages.getResponseByCode(60);
      res.status(ret.status).json(ret);
      return;
    }

    const videoId = req.params.videoId;

    Video.findOne({ _id: videoId }, (err, video) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
        return;
      }
      if (video) {
        // Int he future we will have to fix this to allow multiple ADs.
        if (!video.audio_descriptions) {
          video.audio_descriptions = {};
          video.audio_descriptions[1] = {
            likes: 0,
            clips: {},
          };
        }

        // Getting the next ID of the audio clip.
        const clips = video.audio_descriptions['1'].clips;
        const clipsIds = Object.keys(clips).sort((a,b) => a - b);
        let newAudioClipId = 1;
        if (clipsIds.length > 0) {
          newAudioClipId = parseInt(clipsIds.pop()) + 1;
        }

        // Fixing paths to save audio clip files.
        const relativePath = `/${videoId}`;
        const absPathToSave = `${conf.uploadsRootDir}${relativePath}`;
        const fileName = `${videoId}_${newAudioClipId}.wav`;
        const finalFilePath = `${absPathToSave}/${fileName}`;

        // Let's assure the directory we are going to save the files exist.
        fse.ensureDir(absPathToSave, (errDir) => {
          if (errDir) {
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);
          }
          // Copying the file from tmp to uploads.
          fse.copy(req.files.wavfile.path, finalFilePath, (errCopy) => {
            if (errCopy) {
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
            }
            console.log('UPLOAAAAADDDDDDDDDD');

            const newAudioClip = {
              label: req.fields.label,
              playback_type: req.fields.playbackType,
              start_time: req.fields.startTime,
              end_time: req.fields.endTime,
              duration: req.fields.duration,
              file_name: fileName,
              file_size_bytes: req.files.wavfile.size,
              file_mime_type: req.files.wavfile.type,
              file_path: relativePath,
              created_at: nowUtc(),
              updated_at: nowUtc(),
            };

            console.log('newAudioClip', newAudioClip);

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
          });
        });
      } else {
        const ret = apiMessages.getResponseByCode(58);
        res.status(ret.status).json(ret)
      }
    });
  }
};

module.exports = audioClipController;
