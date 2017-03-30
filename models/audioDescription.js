const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const audioDescriptionSchema = new Schema({
  audio_clips: [ {type: Schema.Types.ObjectId, ref: 'AudioClip'} ],
  video: {type: Schema.Types.ObjectId, ref: 'Video'},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  likes: Number,
  language: Number,
  created_at: Number,
  updated_at: Number,
  notes: String,
  status: String,
}, { collection: 'audio_descriptions' });

const AudioDescription = mongoose.model('AudioDescription', audioDescriptionSchema);

module.exports = AudioDescription;