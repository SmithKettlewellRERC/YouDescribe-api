const mongoose = require('mongoose');
const config = require('config');
const conn = mongoose.connect(`mongodb://${config.hostname}/${config.database}`)
module.exports = conn;