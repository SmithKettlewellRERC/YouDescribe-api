const fse = require('fs-extra');
const conf = require('../shared/config')();

// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');

const audioClipController = {
  addOne: (req, res) => {

    // We only accept requests with files attached.
    if (req.file.mimetype !== 'audio/wav') {
      const ret = apiMessages.getResponseByCode(60);
      res.status(ret.status).json(ret);
    }

    const videoId = req.params.videoId;

    Video.findOne({ _id: videoId }, (err, video) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
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
        const clipsIds = Object.keys(clips).sort((a, b) => a - b);
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
          // Moving the file from tmp to uploads.
          fse.move(req.file.path, finalFilePath, { overwrite: true }, (errCopy) => {
            if (errCopy) {
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
            }

            const newAudioClip = {
              label: req.body.label,
              playback_type: req.body.playbackType,
              start_time: req.body.startTime,
              // end_time: req.body.endTime,
              // duration: req.body.duration,
              file_name: fileName,
              file_size_bytes: req.file.size,
              file_mime_type: req.file.mimetype,
              file_path: relativePath,
              created_at: nowUtc(),
              // updated_at: nowUtc(),
            };

            video.audio_descriptions[1].clips[newAudioClipId] = newAudioClip;
            video.markModified('audio_descriptions');
            video.save()
            .then((videoSaved) => {
              console.log('SAVED');
              console.log('REQ HEADERS', req.headers)
              console.log(videoSaved);
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
        res.status(ret.status).json(ret);
      }
    });
  }
};

module.exports = audioClipController;
