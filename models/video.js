const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const videoSchema = new Schema({
  title: String,
  description: String,
  youtube_id: String,
  created_at: Number,
  updated_at: Number,
  views: Number,
  audio_descriptions: [ {type: Schema.Types.ObjectId, ref: 'AudioDescription'} ],
}, { collection: 'videos' });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
