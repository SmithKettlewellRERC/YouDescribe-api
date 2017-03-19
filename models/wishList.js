const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishListSchema = new Schema({
  youtube_id: String,
  title: String,
  votes: Number,
  status: String,
  created_at: Number,
  updated_at: Number,
}, { collection: 'wishlist' });

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = WishList;
