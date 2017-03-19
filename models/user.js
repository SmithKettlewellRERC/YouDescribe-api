const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  name: String,
  google_user_id_token: String,
  created_at: Number,
  updated_at: Number,
  last_login: Number,
  status: String,
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

module.exports = User;
