const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const overallRatingSchema = new Schema({
  audio_description_id: {type: Schema.Types.ObjectId, ref: 'AudioDescription'},
  user_id: {type: Schema.Types.ObjectId, ref: 'User'},
  created_at: Number,
  updated_at: Number,
  rating: Number,
}, { collection: 'overall_ratings' });

module.exports = mongoose.model('OverallRating', overallRatingSchema);
