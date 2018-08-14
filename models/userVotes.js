const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  youtube_id: String,
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  updated_at: Number,
  created_at: Number,
}, { collection: 'users_votes' });

const UserVotes = mongoose.model('UserVotes', schema);

module.exports = UserVotes;
