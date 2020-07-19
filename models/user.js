const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  name: String,
  given_name: String,
  picture: String,
  locale: String,
  google_user_id: String,
  created_at: Number,
  updated_at: Number,
  last_login: Number,
  status: String,
  token: String,
  opt_in: [],
  policy_review: String,
  admin: Number,
}, { collection: "users" });

const User = mongoose.model("User", userSchema);

module.exports = User;
