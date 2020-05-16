const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const audioClipSchema = new Schema({
  video: {type: Schema.Types.ObjectId, ref: 'VideoOld'},
  audio_description: {type: Schema.Types.ObjectId, ref: 'AudioDescriptionOld'},
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
  transcript: [
    {
      sentence: String,
      start_time: Number,
      end_time: Number,
    }
  ],
}, { collection: 'audio_clips_old' });

const AudioClipOld = mongoose.model('AudioClipOld', audioClipSchema);

module.exports = AudioClipOld;