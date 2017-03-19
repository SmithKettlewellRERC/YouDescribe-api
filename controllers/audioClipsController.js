const fse = require('fs-extra');
const conf = require('../shared/config')();
const request = require('request');

// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');
const AudioDescription = require('./../models/audioDescription');
const AudioClip = require('./../models/audioClip');

const audioClipController = {
  addOne: (req, res) => {
    console.log('ADD ONE')

    // We only accept requests with files attached.
    if (req.file.mimetype !== 'audio/wav') {
      const ret = apiMessages.getResponseByCode(60);
      res.status(ret.status).json(ret);
    }

    // Getting the main ids.
    const youtube_id = req.params.videoId;
    const audioDescriptionId = req.body.audioDescriptionId;

    // Fixing paths to save audio clip files.
    const relativePath = `/${youtube_id}`;
    const absPathToSave = `${conf.uploadsRootDir}${relativePath}`;

    // console.log('@@@@@@', req.body.playbackType,req.body.startTime,req.body.endTime,req.body.duration);

    const newAudioClip = new AudioClip({
      video: null,
      audio_description: null,
      user: '58cdb6ac46e13db72761c6a0',
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

    newAudioClip.save((errSaveAudioClip, audioClip) => {
      if (errSaveAudioClip) {
        console.log(errSaveAudioClip)
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      const audioClipId = audioClip['_id'];

      const fileName = `${youtube_id}_${audioClipId}.wav`;
      const finalFilePath = `${absPathToSave}/${fileName}`;

      // Saving the file on FS.
      fse.ensureDir(absPathToSave, (errDir) => {
        if (errDir) {
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        }
        fse.move(req.file.path, finalFilePath, { overwrite: true }, (errCopy) => {
          if (errCopy) {
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);
          }

          console.log('File saved ->', finalFilePath);
          console.log('audioDescriptionId', audioDescriptionId)
          console.log('audioClipId', audioClipId)

          AudioDescription.findOneAndUpdate({ _id: null }, { $push: { audio_clips: audioClipId }}, (errUpdateAd, ad) => {
            if (errUpdateAd) {
              console.log('error to update', errUpdateAd);
              return;
            }
            if (ad) {
              console.log('AD was already in the db. Just increment', db);
            } else {
              const newAudioDescription = new AudioDescription({
                audio_clips: [audioClipId],
                video: null,
                user: '58cdb6ac46e13db72761c6a0',
                likes: 0,
                language: 1,
                created_at: nowUtc(),
                updated_at: nowUtc(),
                notes: '',
              });
            }
          })

    //   const audioDescription = {
    //     audio_clips: [ {type: Schema.Types.ObjectId, ref: 'AudioClip'} ],
    //     video: {type: Schema.Types.ObjectId, ref: 'Video'},
    //     user: '58cdb6ac46e13db72761c6a0',
    //     likes: 0,
    //     language: 1,
    //     created_at: nowUtc(),
    //     updated_at: nowUtc(),
    //     notes: '',
    //   };



        });
      });
    });
  }
};

module.exports = audioClipController;
