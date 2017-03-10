const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishListSchema = new Schema({
  _id: String,
  title: String,
  request_counter: Number,
  created_at: Number,
  updated_at: Number,
}, { collection: 'wishlist' });

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = WishList;
