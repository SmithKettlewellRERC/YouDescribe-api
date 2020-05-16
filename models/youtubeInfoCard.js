const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const youtubeInfoCardSchema = new Schema({
  youtube_id: String,
  title: String,
  tags: [],
  category_id: String,
  category: String,
  youtube_status: String,
  duration: Number,
  custom_category: String,
  custom_tags: [],
}, { collection: "youtube_infocards" });

const YoutubeInfoCard = mongoose.model("YoutubeInfoCard", youtubeInfoCardSchema);

module.exports = YoutubeInfoCard;
