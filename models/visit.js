const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const visitSchema = new Schema({
  ip: String,
  video: {type: Schema.Types.ObjectId, ref: "Video"},
  youtube_id: String,
  connection: String,
  url: String,
  created_at: Number,
}, { collection: "visits" });

const Visit = mongoose.model("Visit", visitSchema);

module.exports = Visit;
