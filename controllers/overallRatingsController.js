// Application modules.
const nowUtc = require('./../shared/dateTime').nowUtc;
const apiMessages = require('./../shared/apiMessages');
const OverallRating = require('./../models/overallRating');
const AudioDescription = require('./../models/audioDescription');


const overallVote = (audioDescriptionId, rating) => {
  rating = parseInt(rating);
  AudioDescription.findOneAndUpdate({ _id: audioDescriptionId }, { $inc: { overall_rating_votes_counter: 1 }}, { new: true }, (errVotes, resVotesAd) => {
    if (resVotesAd) {
      const newRatingVotesCounter = resVotesAd.overall_rating_votes_counter;
      const previousRatingAverage = resVotesAd.overall_rating_average;
      const previousRatingVotesSum = resVotesAd.overall_rating_votes_sum;

      let newRatingVotesSum;
      if (previousRatingVotesSum) {
        newRatingVotesSum = previousRatingVotesSum + rating;
      } else {
        newRatingVotesSum = rating;
      }

      AudioDescription.findOneAndUpdate({ _id: audioDescriptionId }, {
        $set: {
          overall_rating_votes_sum: newRatingVotesSum,
          overall_rating_average: Math.floor(newRatingVotesSum / newRatingVotesCounter),
        },
      }, { new: true }, (err, res) => {
        // TO DO
      });
    }
  });
}

const overallRatingsController = {
  addOne: (req, res) => {
    const userId = req.body.userId;
    const audioDescriptionId = req.params.audioDescriptionId;
    const rating = req.body.rating;

    const query = {
      audio_description_id: audioDescriptionId,
      user_id: userId,
    };
  
    const update = {
      updated_at: nowUtc(),
      rating: rating,
    };
        
    OverallRating.findOneAndUpdate(query, update, (err, resUpdated) => {
      if (err) {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }

      if (resUpdated) {
        overallVote(audioDescriptionId, rating);
        const ret = apiMessages.getResponseByCode(1017);
        ret.result = resUpdated;
        res.status(ret.status).json(ret);
      } else {
        const overallRating = new OverallRating({
          audio_description_id: audioDescriptionId,
          user_id: userId,
          created_at: nowUtc(),
          updated_at: nowUtc(),
          rating: rating,                
        });
        overallRating.save((errNew, resNew) => {
          if (errNew) {
            console.log(errNew);
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);
          }
          if (resNew) {
            overallVote(audioDescriptionId, rating);
            const ret = apiMessages.getResponseByCode(1017);
            ret.result = resNew;
            res.status(ret.status).json(ret);
          } else {
            const ret = apiMessages.getResponseByCode(66);
            res.status(ret.status).json(ret);
          }
        });
      }
    });
  }
}

module.exports = overallRatingsController;
