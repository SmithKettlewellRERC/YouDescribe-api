// General imports.
const express = require('express');
const path = require('path');
const bb = require('express-busboy');
const db = require('./db/connection');
const compression = require('compression');
const conf = require('./shared/config')();

// Logs library.
const morgan = require('morgan');

// Server HTTP port setup.
const port = process.env.PORT || 8080;

// Our web framework itself.
const app = express();

const bbOptions = {
  upload: true,
  path: path.join(__dirname, 'uploads'),
  // allowedPath: /^\/uploads$/,
  // allowedPath: /./,
  restrictMultiple: false,
};
bb.extend(app, bbOptions);

// Compression.
// app.use(compression());

// CORS.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  // res.header('Access-Control-Allow-Headers', 'Content-Type');
  // res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Apache format logs.
app.use(morgan('combined'));

// Our server routes.
const wishList = require('./routes/wishList');
const videos = require('./routes/videos');
const audioClips = require('./routes/audioClips');

// Middleware for routes.
app.use(`/${conf.apiVersion}/wishlist`, wishList);
app.use(`/${conf.apiVersion}/videos`, videos);
app.use(`/${conf.apiVersion}/audioclips`, audioClips);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// The Restful API drain.
app.get('*', (req, res) => {
  res.status(200).json('{"status":"not found"}');
});

// Starting the port listener.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
