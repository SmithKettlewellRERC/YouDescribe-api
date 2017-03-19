const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const audioClip = new Schema({
  video: {type: Schema.Types.ObjectId, ref: 'Video'},
  audio_description: {type: Schema.Types.ObjectId, ref: 'AudioDescription'},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  created_at: Number,
  updated_at: Number,
  label: String,
  playback_type: String,
  start_time: Number,
  file_name: String,
  file_size_bytes: Number,
  file_mime_type: String,
  file_path: String,
  end_time: Number,
  duration: Number,
}, { collection: 'audio_clips' });

const AudioClip = mongoose.model('AudioClip', audioClip);

module.exports = AudioClip;