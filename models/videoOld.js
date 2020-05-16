const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const videoSchema = new Schema({
  title: String,
  description: String,
  youtube_id: String,
  created_at: Number,
  updated_at: Number,
  views: Number,
  audio_descriptions: [ {type: Schema.Types.ObjectId, ref: 'AudioDescriptionOld'} ],
  tags: [],
  category_id: String,
  category: String,
  youtube_status: String,
}, { collection: 'videos_old' });

const VideoOld = mongoose.model('VideoOld', videoSchema);

module.exports = VideoOld;
