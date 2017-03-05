// General imports.
const express = require('express');
const formidable = require('express-formidable');
const bodyParser = require('body-parser');
const db = require('./db/connection');
const compression = require('compression');


// Logs library.
const morgan = require('morgan');

// Server HTTP port setup.
const port = process.env.PORT || 8080;

// Our web framework itself.
const app = express();

// Compression.
app.use(compression());

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

// Body parser middleware setup.
// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());

// Body parser does not know how to handle multipart. :(
app.use(formidable());

// Our server routes.
const wishList = require('./routes/wishList');
const videos = require('./routes/videos');
const audioClips = require('./routes/audioClips');

// Middleware for routes.
app.use('/wishlist', wishList);
app.use('/videos', videos);
app.use('/audioclips', audioClips);

// The Restful API drain.
app.get('*', (req, res) => {
  res.status(200).json('{"status":"ok"}');
});

// Starting the port listener.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
