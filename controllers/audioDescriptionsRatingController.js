// Application modules.
const nowUtc = require('./../shared/dateTime').nowUtc;
const apiMessages = require('./../shared/apiMessages');
const AudioDescription = require('./../models/audioDescription');
const AudioDescriptionRating = require('./../models/audioDescriptionRating');

// Function to update the overall rating.
const updateOverallRating = (audioDescriptionId, previousRating, newRating) => {
  const previousRatingInt = parseInt(previousRating);
  const newRatingInt = parseInt(newRating);

  AudioDescription.findOne({ _id: audioDescriptionId }, (errFindAd, audioDescriptionData) => {
    if (errFindAd) {
      console.log(errFindAd);
      const ret = apiMessages.getResponseByCode(1);
      res.status(ret.status).json(ret);
    }

    const newData = Object.assign(audioDescriptionData);
    newData.updated_at = nowUtc();

    if (newData.overall_rating_votes_sum) {
      newData.overall_rating_votes_sum = newData.overall_rating_votes_sum - previousRatingInt;
      newData.overall_rating_votes_sum = newData.overall_rating_votes_sum + newRatingInt;
    } else {
      newData.overall_rating_votes_sum = newRatingInt;
    }

    // It means it is a new vote.
    if (previousRating === 0) {
      if (!newData.overall_rating_votes_counter) {
        newData.overall_rating_votes_counter = 1;
      } else {
          newData.overall_rating_votes_counter = newData.overall_rating_votes_counter + 1;
      }
    }

    newData.overall_rating_average = Math.floor(newData.overall_rating_votes_sum / newData.overall_rating_votes_counter);

    AudioDescription.update({ _id: audioDescriptionId }, newData).exec();
  });
}

// The controller.
const audioDescriptionsRatingController = {
  addOne: (req, res) => {
    const userId = req.body.userId;
    const audioDescriptionId = req.params.audioDescriptionId;
    const rating = req.body.rating;
    const feedback = req.body.feedback || [];


    // Check if the user has already interacted with the rating.
    AudioDescriptionRating.findOne({ audio_description_id: audioDescriptionId, user_id: userId }, (err, ratingData) => {
      if (ratingData) {
          // User has interacted before.
          const previousRating = ratingData.rating;
          AudioDescriptionRating.findOneAndUpdate({ audio_description_id: audioDescriptionId, user_id: userId }, {
            rating: rating,
            feedback: feedback,
            updated_at: nowUtc(),
          }, { new: true }, (errToUpdate, updatedRatingData) => {
            if (errToUpdate) {
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
            }
            // Now we have to update the overall.
            updateOverallRating(audioDescriptionId, previousRating, rating);

            // Return.
            const ret = apiMessages.getResponseByCode(1017);
            ret.result = updatedRatingData;
            res.status(ret.status).json(ret);
          });
      } else {
        const newAudioDescriptionRating = new AudioDescriptionRating({
          audio_description_id: audioDescriptionId,
          user_id: userId,
          created_at: nowUtc(),
          updated_at: nowUtc(),
          rating: rating,
          feedback: feedback,               
        });
        AudioDescriptionRating.create(newAudioDescriptionRating, (errToCreate, newAudioDescriptionRatingCreated) => {
          if (errToCreate) {
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);
          }

          // Now we have to update the overall.
          updateOverallRating(audioDescriptionId, 0, rating);

          // Return.
          const ret = apiMessages.getResponseByCode(1017);
          ret.result = newAudioDescriptionRatingCreated;
          res.status(ret.status).json(ret);
        });
      }
    });
  }
}

module.exports = audioDescriptionsRatingController;
