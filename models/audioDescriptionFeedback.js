const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const audioDescriptionFeedbackSchema = new Schema({
  user_id: {type: Schema.Types.ObjectId, ref: 'User'},
  audio_description_id: {type: Schema.Types.ObjectId, ref: 'AudioDescription'},
  feedbacks: [],
  created_at: Number,
  updated_at: Number,
}, { collection: 'audio_descriptions_feedback' });

const AudioDescriptionFeedback = mongoose.model('AudioDescriptionFeedback', audioDescriptionFeedbackSchema);

module.exports = AudioDescriptionFeedback;