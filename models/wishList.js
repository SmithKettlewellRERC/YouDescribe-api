const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishListSchema = new Schema({
  video_title: String,
  external_media_id: String,
  request_counter: Number,
  created_at: Number,
  updated_at: Number,
}, { collection: 'wishlist' });

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = WishList;
