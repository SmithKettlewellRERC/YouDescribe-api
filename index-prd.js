const NODE_ENV = process.env.NODE_ENV;
const path = require('path');
const bodyParser = require('body-parser');
const conf = require('./shared/config')();
const express = require('express');
const app = express();

app.use(bodyParser.json());

// Database.
const db = require('./db/connection-prd');

// Compression.
const compression = require('compression');
app.use(compression());

// Logs library.
const morgan = require('morgan');
app.use(morgan('combined'));

// Server HTTP port setup.
const port = process.env.PORT || 3000;

// Our server routes.
const auth = require('./routes/auth');
const wishList = require('./routes/wishList');
const videos = require('./routes/videos');
const audioClips = require('./routes/audioClips');
const users = require('./routes/users');
const audioDescriptions = require('./routes/audioDescriptions');
const audioDescriptionsRating = require('./routes/audioDescriptionsRating');
const idioms = require('./routes/idioms');

// Middleware for routes.
app.use(`/${conf.apiVersion}/auth`, auth);
app.use(`/${conf.apiVersion}/wishlist`, wishList);
app.use(`/${conf.apiVersion}/videos`, videos);
app.use(`/${conf.apiVersion}/audioclips`, audioClips);
app.use(`/${conf.apiVersion}/users`, users);
app.use(`/${conf.apiVersion}/audiodescriptions`, audioDescriptions);
app.use(`/${conf.apiVersion}/audiodescriptionsrating`, audioDescriptionsRating);
app.use(`/${conf.apiVersion}/idioms`, idioms);

// Static route for wav files.
app.use('/audio-descriptions-files', express.static('/mnt/ebs/audio-descriptions-files'));

// The Restful API drain.
app.get('*', (req, res) => {
  res.status(200).json('{"status":"not found"}');
});

// Starting the port listener.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
