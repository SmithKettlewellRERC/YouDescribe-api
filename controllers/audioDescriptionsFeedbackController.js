// Application modules.
const nowUtc = require('./../shared/dateTime').nowUtc;
const apiMessages = require('./../shared/apiMessages');
const AudioDescription = require('./../models/audioDescription');
const AudioDescriptionFeedback = require('./../models/audioDescriptionFeedback');

const audioDescriptionsFeedbackController = {
  addOne: (req, res) => {
    const userId = req.body.userId;
    const audioDescriptionId = req.params.audioDescriptionId;
    const feedbacks = req.body.feedbacks;

    const query = {
      audio_description_id: audioDescriptionId,
      user_id: userId,
    };
  
    const update = {
      updated_at: nowUtc(),
      feedbacks: feedbacks,
    };

    AudioDescriptionFeedback.findOneAndUpdate(query, update, { new: true }, (err, resUpdated) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }

      if (resUpdated) {
        const ret = apiMessages.getResponseByCode(1018);
        ret.result = resUpdated;
        res.status(ret.status).json(ret);
      } else {
        const audioDescriptionFeedback = new AudioDescriptionFeedback({
          audio_description_id: audioDescriptionId,
          user_id: userId,
          created_at: nowUtc(),
          updated_at: nowUtc(),
          feedbacks: feedbacks,
        });
        audioDescriptionFeedback.save((errNew, resNew) => {
          if (errNew) {
            console.log(errNew);
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);
          }
          if (resNew) {
            const ret = apiMessages.getResponseByCode(1018);
            ret.result = resNew;
            res.status(ret.status).json(ret);
          } else {
            const ret = apiMessages.getResponseByCode(67);
            res.status(ret.status).json(ret);
          }
        });
      }
    });
  }
}

module.exports = audioDescriptionsFeedbackController;
