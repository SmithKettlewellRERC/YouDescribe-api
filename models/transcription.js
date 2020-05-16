const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const transcriptionSchema = new Schema({
  audio_clip: {type: Schema.Types.ObjectId, ref: "AudioClip"},
  order_id: String,
  status: String,
  created_at: Number,
  updated_at: Number,
  msg: String,
  rating: Number,
  language: String,
  words: [
    {
      key: String,
      value: Number,
    }
  ],
  length: Number,
}, { collection: "transcriptions" });

const Transcription = mongoose.model("Transcription", transcriptionSchema);

module.exports = Transcription;