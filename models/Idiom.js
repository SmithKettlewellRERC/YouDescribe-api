const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const idiomSchema = new Schema({
  code: String,
  name: String,
}, { collection: 'idioms' });

const Idiom = mongoose.model('Idiom', idiomSchema);

module.exports = Idiom;
