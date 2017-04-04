const NODE_ENV = process.env.NODE_ENV;
const path = require('path');
const bodyParser = require('body-parser');
const conf = require('./shared/config')();
const express = require('express');
const app = express();

app.use(bodyParser.json());

// Database.
const db = require('./db/connection-dev');

// Logs library.
// const morgan = require('morgan');
// app.use(morgan('combined'));

// Server HTTP port setup.
const port = process.env.PORT || 8080;

// CORS.
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range, Content-Length');
  if (req.method === 'OPTIONS') {
    return next();
  } else {
    return next();
  }
});

// Our server routes.
const auth = require('./routes/auth');
const wishList = require('./routes/wishList');
const videos = require('./routes/videos');
const audioClips = require('./routes/audioClips');
const users = require('./routes/users');
const audioDescriptions = require('./routes/audioDescriptions');

// Middleware for routes.
app.use(`/${conf.apiVersion}/auth`, auth);
app.use(`/${conf.apiVersion}/wishlist`, wishList);
app.use(`/${conf.apiVersion}/videos`, videos);
app.use(`/${conf.apiVersion}/audioclips`, audioClips);
app.use(`/${conf.apiVersion}/users`, users);
app.use(`/${conf.apiVersion}/audiodescriptions`, audioDescriptions);

// Static route for wav files.
app.use('/audio-descriptions-files', express.static(path.join(__dirname, '/audio-descriptions-files')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
//   setHeaders: function(res) {
//     res.setHeader("Content-Type", "audio/wav");
//   }
// }));

// The Restful API drain.
app.get('*', (req, res) => {
  res.status(200).json('{"status":"not found"}');
});

// Starting the port listener.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
