const mongoose = require('mongoose');
const schema = mongoose.Schema;

const audioClipSchema = new schema({
  start_time: Number,
  duration: Number,
  download_counter: Number,
  type: String,
  filename: String,
  path: String,
  created_at: Number,
  updated_at: Number,
})

const audioClip = mongoose.model('audioClip', audioClipSchema);

module.exports = audioClip;
