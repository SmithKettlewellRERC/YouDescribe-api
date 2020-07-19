const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishListSchema = new Schema({
  youtube_id: String,
  votes: Number,
  status: String,
  created_at: Number,
  updated_at: Number,
  tags: [],
  category_id: String,
  category: String,
  youtube_status: String,
  duration: Number,
}, { collection: 'wish_list_old' });

const WishListOld = mongoose.model('WishListOld', wishListSchema);

module.exports = WishListOld;
