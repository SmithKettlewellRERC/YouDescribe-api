const mongoose = require('mongoose');
const config = require('config');
const db = mongoose.connect(`mongodb://${config.hostname}/${config.database}`)
module.exports = db;